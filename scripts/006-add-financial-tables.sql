-- Add financial tables for reimbursements and advance payments

-- Advance Payments table (from NHIS to TPAs)
CREATE TABLE IF NOT EXISTS advance_payments (
  id SERIAL PRIMARY KEY,
  tpa_id INTEGER REFERENCES tpas(id) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_reference VARCHAR(255) NOT NULL UNIQUE,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(100) DEFAULT 'bank_transfer',
  description TEXT,
  purpose VARCHAR(255),
  receipt_url VARCHAR(500),
  receipt_public_id VARCHAR(255),
  receipt_file_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disbursed', 'cancelled')),
  approved_at TIMESTAMP,
  approved_by INTEGER REFERENCES users(id),
  disbursed_at TIMESTAMP,
  disbursed_by INTEGER REFERENCES users(id),
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMP,
  reconciled_by INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reimbursements table (from NHIS to TPAs - Batch-based)
CREATE TABLE IF NOT EXISTS reimbursements (
  id SERIAL PRIMARY KEY,
  tpa_id INTEGER REFERENCES tpas(id) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  reimbursement_reference VARCHAR(255) NOT NULL UNIQUE,
  reimbursement_date DATE NOT NULL,
  reimbursement_method VARCHAR(100) DEFAULT 'bank_transfer',
  batch_ids TEXT, -- JSON array of batch IDs
  reimbursement_type VARCHAR(50) DEFAULT 'regular' CHECK (reimbursement_type IN ('regular', 'advance_offset', 'adjustment')),
  
  -- Period Coverage
  period_start DATE,
  period_end DATE,
  
  -- Financial Breakdown
  total_claims_amount DECIMAL(15, 2) NOT NULL,
  admin_fee_percentage DECIMAL(5, 2) DEFAULT 5.00,
  admin_fee_amount DECIMAL(15, 2) DEFAULT 0,
  net_reimbursement_amount DECIMAL(15, 2) NOT NULL,
  
  -- Documentation
  receipt_url VARCHAR(500),
  receipt_public_id VARCHAR(255),
  receipt_file_name VARCHAR(255),
  
  -- Status and Processing
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processed', 'completed', 'cancelled')),
  processed_at TIMESTAMP,
  processed_by INTEGER REFERENCES users(id),
  
  -- Additional Information
  description TEXT,
  processing_notes TEXT,
  
  -- Audit Fields
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Error Logs table (already exists in schema but might be missing from DB)
CREATE TABLE IF NOT EXISTS error_logs (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES batches(id),
  claim_id INTEGER REFERENCES claims(id),
  tpa_id INTEGER REFERENCES tpas(id),
  facility_id INTEGER REFERENCES facilities(id),
  
  -- Error Classification
  error_type VARCHAR(100) NOT NULL,
  error_category VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Error Details
  error_code VARCHAR(50) NOT NULL,
  error_title VARCHAR(255) NOT NULL,
  error_description TEXT NOT NULL,
  
  -- Data Validation
  field_name VARCHAR(100),
  expected_value TEXT,
  actual_value TEXT,
  
  -- Financial Validation
  expected_amount DECIMAL(15, 2),
  actual_amount DECIMAL(15, 2),
  amount_deviation DECIMAL(15, 2),
  deviation_percentage DECIMAL(5, 2),
  
  -- Status and Resolution
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'ignored')),
  resolution TEXT,
  resolved_by INTEGER REFERENCES users(id),
  resolved_at TIMESTAMP,
  
  -- Audit Fields
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS tpa_id INTEGER REFERENCES tpas(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS facility_id INTEGER REFERENCES facilities(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_temporary_password BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_advance_payments_tpa ON advance_payments(tpa_id);
CREATE INDEX IF NOT EXISTS idx_advance_payments_status ON advance_payments(status);
CREATE INDEX IF NOT EXISTS idx_advance_payments_date ON advance_payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_reimbursements_tpa ON reimbursements(tpa_id);
CREATE INDEX IF NOT EXISTS idx_reimbursements_status ON reimbursements(status);
CREATE INDEX IF NOT EXISTS idx_reimbursements_date ON reimbursements(reimbursement_date);

CREATE INDEX IF NOT EXISTS idx_error_logs_batch ON error_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_claim ON error_logs(claim_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_status ON error_logs(status);

-- Add some sample data for testing
INSERT INTO advance_payments (tpa_id, amount, payment_reference, payment_date, description, status, created_at)
SELECT 
  t.id,
  1000000.00,
  'ADV-' || t.code || '-' || EXTRACT(YEAR FROM NOW()) || '-001',
  CURRENT_DATE - INTERVAL '30 days',
  'Initial advance payment for Q4 operations',
  'disbursed',
  NOW()
FROM tpas t
WHERE t.is_active = true
ON CONFLICT (payment_reference) DO NOTHING;

INSERT INTO reimbursements (tpa_id, amount, reimbursement_reference, reimbursement_date, total_claims_amount, admin_fee_amount, net_reimbursement_amount, description, status, created_at)
SELECT 
  t.id,
  2500000.00,
  'REIMB-' || t.code || '-' || EXTRACT(YEAR FROM NOW()) || '-001',
  CURRENT_DATE - INTERVAL '15 days',
  2631578.95, -- Gross amount
  131578.95,   -- 5% admin fee
  2500000.00,  -- Net amount
  'Monthly reimbursement for verified claims',
  'completed',
  NOW()
FROM tpas t
WHERE t.is_active = true
ON CONFLICT (reimbursement_reference) DO NOTHING;

-- Insert some sample error logs
INSERT INTO error_logs (error_type, error_category, severity, error_code, error_title, error_description, status, created_at)
VALUES 
  ('validation', 'missing_data', 'medium', 'VAL001', 'Missing NIN', 'Beneficiary NIN is required but not provided', 'open', NOW()),
  ('discrepancy', 'cost_anomaly', 'high', 'DISC001', 'High Cost Claim', 'Claim amount exceeds typical range for procedure', 'under_review', NOW()),
  ('duplicate', 'duplicate_claim', 'critical', 'DUP001', 'Duplicate Claim ID', 'Multiple claims with same unique claim ID detected', 'open', NOW()),
  ('quality', 'data_quality', 'low', 'QUA001', 'Date Format Issue', 'Date format inconsistency in submission', 'resolved', NOW());

COMMIT;