-- Add claim items and summaries tables for itemized cost tracking
-- This migration introduces a more granular approach to cost management

BEGIN;

-- Create claim_items table for individual procedures, medications, investigations, etc.
CREATE TABLE IF NOT EXISTS claim_items (
  id SERIAL PRIMARY KEY,
  claim_id INTEGER NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  
  -- Item Classification
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('investigation', 'procedure', 'medication', 'other_service')),
  item_category VARCHAR(100), -- 'laboratory', 'radiology', 'surgery', 'consultation', etc.
  
  -- Item Details
  item_name VARCHAR(255) NOT NULL,
  item_description TEXT,
  item_code VARCHAR(50), -- Medical coding if available
  
  -- Quantity and Dosage (for medications)
  quantity INTEGER DEFAULT 1,
  unit VARCHAR(50), -- 'tablets', 'ml', 'sessions', 'days', etc.
  dosage VARCHAR(100), -- For medications: '500mg', '2 tablets daily', etc.
  duration VARCHAR(50), -- '7 days', '2 weeks', etc.
  
  -- Cost Information
  unit_cost DECIMAL(12, 2) NOT NULL,
  total_cost DECIMAL(12, 2) NOT NULL,
  
  -- Dates
  service_date DATE, -- When the service was provided
  prescribed_date DATE, -- For medications
  
  -- Medical Information
  prescribed_by VARCHAR(255), -- Doctor's name
  indication TEXT, -- Why was this prescribed/performed
  urgency VARCHAR(20) CHECK (urgency IN ('routine', 'urgent', 'emergency')),
  
  -- TPA Review Fields
  is_reviewed BOOLEAN DEFAULT false,
  review_status VARCHAR(50) DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_clarification')),
  review_notes TEXT,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  
  -- Approved amounts (after TPA review)
  approved_quantity INTEGER,
  approved_unit_cost DECIMAL(12, 2),
  approved_total_cost DECIMAL(12, 2),
  rejection_reason TEXT,
  
  -- NHIA Standards Compliance
  nhia_standard_cost DECIMAL(12, 2), -- Reference cost from NHIA
  cost_variance_percentage DECIMAL(5, 2), -- Calculated variance
  compliance_flag VARCHAR(20) CHECK (compliance_flag IN ('compliant', 'needs_review', 'excessive')),
  
  -- Supporting Documentation
  supporting_documents TEXT, -- JSON array of document URLs
  prescription_url VARCHAR(500),
  lab_result_url VARCHAR(500),
  
  -- Audit Fields
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create claim_item_summaries table for TPA review summaries
CREATE TABLE IF NOT EXISTS claim_item_summaries (
  id SERIAL PRIMARY KEY,
  claim_id INTEGER NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  
  -- Summary by Category
  total_investigation_cost DECIMAL(12, 2) DEFAULT 0,
  total_procedure_cost DECIMAL(12, 2) DEFAULT 0,
  total_medication_cost DECIMAL(12, 2) DEFAULT 0,
  total_other_services_cost DECIMAL(12, 2) DEFAULT 0,
  
  -- Approved Totals (after TPA review)
  approved_investigation_cost DECIMAL(12, 2) DEFAULT 0,
  approved_procedure_cost DECIMAL(12, 2) DEFAULT 0,
  approved_medication_cost DECIMAL(12, 2) DEFAULT 0,
  approved_other_services_cost DECIMAL(12, 2) DEFAULT 0,
  
  -- Grand Totals
  total_claimed_amount DECIMAL(12, 2) NOT NULL,
  total_approved_amount DECIMAL(12, 2) NOT NULL,
  total_rejected_amount DECIMAL(12, 2) DEFAULT 0,
  
  -- Item Counts
  total_items_count INTEGER NOT NULL,
  approved_items_count INTEGER DEFAULT 0,
  rejected_items_count INTEGER DEFAULT 0,
  pending_items_count INTEGER DEFAULT 0,
  
  -- TPA Review Summary
  overall_review_status VARCHAR(50) DEFAULT 'pending' CHECK (overall_review_status IN ('pending', 'completed', 'needs_clarification')),
  tpa_remarks TEXT,
  clinical_justification TEXT,
  cost_justification TEXT,
  
  -- Compliance Metrics
  nhia_compliance_score DECIMAL(5, 2), -- 0-100%
  average_cost_variance DECIMAL(5, 2), -- Average variance from NHIA standards
  high_cost_items_count INTEGER DEFAULT 0, -- Items exceeding NHIA by >25%
  
  -- Workflow
  summary_generated_at TIMESTAMP,
  summary_generated_by INTEGER REFERENCES users(id),
  is_finalized BOOLEAN DEFAULT false,
  finalized_at TIMESTAMP,
  finalized_by INTEGER REFERENCES users(id),
  
  -- Audit Fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_claim_items_claim_id ON claim_items(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_items_type ON claim_items(item_type);
CREATE INDEX IF NOT EXISTS idx_claim_items_review_status ON claim_items(review_status);
CREATE INDEX IF NOT EXISTS idx_claim_items_service_date ON claim_items(service_date);
CREATE INDEX IF NOT EXISTS idx_claim_items_created_by ON claim_items(created_by);
CREATE INDEX IF NOT EXISTS idx_claim_items_reviewed_by ON claim_items(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_claim_item_summaries_claim_id ON claim_item_summaries(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_item_summaries_review_status ON claim_item_summaries(overall_review_status);
CREATE INDEX IF NOT EXISTS idx_claim_item_summaries_generated_by ON claim_item_summaries(summary_generated_by);

-- Add unique constraint to ensure one summary per claim
ALTER TABLE claim_item_summaries ADD CONSTRAINT unique_claim_summary UNIQUE (claim_id);

-- Add triggers to automatically update timestamps
CREATE OR REPLACE FUNCTION update_claim_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_claim_items_updated_at
  BEFORE UPDATE ON claim_items
  FOR EACH ROW
  EXECUTE FUNCTION update_claim_items_updated_at();

CREATE OR REPLACE FUNCTION update_claim_item_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_claim_item_summaries_updated_at
  BEFORE UPDATE ON claim_item_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_claim_item_summaries_updated_at();

-- Function to automatically generate/update claim item summary when items change
CREATE OR REPLACE FUNCTION refresh_claim_item_summary(p_claim_id INTEGER)
RETURNS VOID AS $$
DECLARE
  summary_data RECORD;
BEGIN
  -- Calculate summary data
  SELECT 
    COALESCE(SUM(CASE WHEN item_type = 'investigation' THEN total_cost ELSE 0 END), 0) as total_investigation,
    COALESCE(SUM(CASE WHEN item_type = 'procedure' THEN total_cost ELSE 0 END), 0) as total_procedure,
    COALESCE(SUM(CASE WHEN item_type = 'medication' THEN total_cost ELSE 0 END), 0) as total_medication,
    COALESCE(SUM(CASE WHEN item_type = 'other_service' THEN total_cost ELSE 0 END), 0) as total_other,
    
    COALESCE(SUM(CASE WHEN item_type = 'investigation' AND review_status = 'approved' THEN COALESCE(approved_total_cost, total_cost) ELSE 0 END), 0) as approved_investigation,
    COALESCE(SUM(CASE WHEN item_type = 'procedure' AND review_status = 'approved' THEN COALESCE(approved_total_cost, total_cost) ELSE 0 END), 0) as approved_procedure,
    COALESCE(SUM(CASE WHEN item_type = 'medication' AND review_status = 'approved' THEN COALESCE(approved_total_cost, total_cost) ELSE 0 END), 0) as approved_medication,
    COALESCE(SUM(CASE WHEN item_type = 'other_service' AND review_status = 'approved' THEN COALESCE(approved_total_cost, total_cost) ELSE 0 END), 0) as approved_other,
    
    COALESCE(SUM(total_cost), 0) as total_claimed,
    COALESCE(SUM(CASE WHEN review_status = 'approved' THEN COALESCE(approved_total_cost, total_cost) ELSE 0 END), 0) as total_approved,
    COALESCE(SUM(CASE WHEN review_status = 'rejected' THEN total_cost ELSE 0 END), 0) as total_rejected,
    
    COUNT(*) as total_items,
    COUNT(CASE WHEN review_status = 'approved' THEN 1 END) as approved_items,
    COUNT(CASE WHEN review_status = 'rejected' THEN 1 END) as rejected_items,
    COUNT(CASE WHEN review_status = 'pending' THEN 1 END) as pending_items,
    
    COUNT(CASE WHEN cost_variance_percentage > 25 THEN 1 END) as high_cost_items,
    AVG(cost_variance_percentage) as avg_variance
  INTO summary_data
  FROM claim_items 
  WHERE claim_id = p_claim_id;

  -- Insert or update summary
  INSERT INTO claim_item_summaries (
    claim_id,
    total_investigation_cost,
    total_procedure_cost,
    total_medication_cost,
    total_other_services_cost,
    approved_investigation_cost,
    approved_procedure_cost,
    approved_medication_cost,
    approved_other_services_cost,
    total_claimed_amount,
    total_approved_amount,
    total_rejected_amount,
    total_items_count,
    approved_items_count,
    rejected_items_count,
    pending_items_count,
    high_cost_items_count,
    average_cost_variance,
    summary_generated_at
  ) VALUES (
    p_claim_id,
    summary_data.total_investigation,
    summary_data.total_procedure,
    summary_data.total_medication,
    summary_data.total_other,
    summary_data.approved_investigation,
    summary_data.approved_procedure,
    summary_data.approved_medication,
    summary_data.approved_other,
    summary_data.total_claimed,
    summary_data.total_approved,
    summary_data.total_rejected,
    summary_data.total_items,
    summary_data.approved_items,
    summary_data.rejected_items,
    summary_data.pending_items,
    summary_data.high_cost_items,
    summary_data.avg_variance,
    NOW()
  )
  ON CONFLICT (claim_id) DO UPDATE SET
    total_investigation_cost = EXCLUDED.total_investigation_cost,
    total_procedure_cost = EXCLUDED.total_procedure_cost,
    total_medication_cost = EXCLUDED.total_medication_cost,
    total_other_services_cost = EXCLUDED.total_other_services_cost,
    approved_investigation_cost = EXCLUDED.approved_investigation_cost,
    approved_procedure_cost = EXCLUDED.approved_procedure_cost,
    approved_medication_cost = EXCLUDED.approved_medication_cost,
    approved_other_services_cost = EXCLUDED.approved_other_services_cost,
    total_claimed_amount = EXCLUDED.total_claimed_amount,
    total_approved_amount = EXCLUDED.total_approved_amount,
    total_rejected_amount = EXCLUDED.total_rejected_amount,
    total_items_count = EXCLUDED.total_items_count,
    approved_items_count = EXCLUDED.approved_items_count,
    rejected_items_count = EXCLUDED.rejected_items_count,
    pending_items_count = EXCLUDED.pending_items_count,
    high_cost_items_count = EXCLUDED.high_cost_items_count,
    average_cost_variance = EXCLUDED.average_cost_variance,
    summary_generated_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh summary when claim items are modified
CREATE OR REPLACE FUNCTION trigger_refresh_claim_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle both INSERT/UPDATE and DELETE
  IF TG_OP = 'DELETE' THEN
    PERFORM refresh_claim_item_summary(OLD.claim_id);
    RETURN OLD;
  ELSE
    PERFORM refresh_claim_item_summary(NEW.claim_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_claim_items_summary_refresh
  AFTER INSERT OR UPDATE OR DELETE ON claim_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_claim_summary();

COMMIT;