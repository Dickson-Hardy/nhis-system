-- Add new fields to batches table for enhanced batch closure workflow
-- Migration: 007-add-batch-closure-fields.sql

-- Add closure-related fields to batches table
ALTER TABLE batches ADD COLUMN IF NOT EXISTS tpa_signature VARCHAR(255);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS tpa_signed_by VARCHAR(255);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS tpa_signed_at TIMESTAMP;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS admin_signature VARCHAR(255);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS admin_signed_by VARCHAR(255);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS admin_signed_at TIMESTAMP;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS beneficiaries_paid INTEGER DEFAULT 0;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS closure_remarks TEXT;

-- Create table for batch closure reports
CREATE TABLE IF NOT EXISTS batch_closure_reports (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES batches(id),
  
  -- Report Content
  review_summary TEXT NOT NULL,
  payment_justification TEXT NOT NULL,
  rejection_reasons JSONB, -- Array of {reason, count, amount}
  
  -- Payment Details
  paid_amount DECIMAL(15, 2) NOT NULL,
  paid_claims INTEGER NOT NULL,
  beneficiaries_paid INTEGER NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_reference VARCHAR(255) NOT NULL,
  
  -- Document Attachments
  forwarding_letter_url VARCHAR(500),
  forwarding_letter_public_id VARCHAR(255),
  forwarding_letter_file_name VARCHAR(255),
  additional_documents JSONB, -- Array of {url, fileName, type}
  
  -- Digital Signatures
  tpa_signature VARCHAR(255) NOT NULL,
  tpa_signed_by VARCHAR(255) NOT NULL,
  tpa_signed_at TIMESTAMP NOT NULL,
  admin_signature VARCHAR(255),
  admin_signed_by VARCHAR(255),
  admin_signed_at TIMESTAMP,
  
  -- Status and Timestamps
  status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'reviewed', 'approved', 'completed'
  submitted_by INTEGER NOT NULL REFERENCES users(id),
  reviewed_by INTEGER REFERENCES users(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create table for batch payment summaries (for admin dashboard)
CREATE TABLE IF NOT EXISTS batch_payment_summaries (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES batches(id),
  batch_closure_report_id INTEGER REFERENCES batch_closure_reports(id),
  
  -- Payment Summary
  total_paid_amount DECIMAL(15, 2) NOT NULL,
  number_of_beneficiaries INTEGER NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_reference VARCHAR(255) NOT NULL,
  
  -- TPA Information
  tpa_id INTEGER NOT NULL REFERENCES tpas(id),
  facility_id INTEGER NOT NULL REFERENCES facilities(id),
  
  -- Administrative
  remarks TEXT,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'reconciled', 'disputed'
  
  -- Audit Fields
  submitted_by INTEGER NOT NULL REFERENCES users(id),
  submitted_at TIMESTAMP NOT NULL,
  processed_by INTEGER REFERENCES users(id),
  processed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_batch_closure_reports_batch_id ON batch_closure_reports(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_closure_reports_status ON batch_closure_reports(status);
CREATE INDEX IF NOT EXISTS idx_batch_closure_reports_submitted_at ON batch_closure_reports(tpa_signed_at);

CREATE INDEX IF NOT EXISTS idx_batch_payment_summaries_batch_id ON batch_payment_summaries(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_payment_summaries_tpa_id ON batch_payment_summaries(tpa_id);
CREATE INDEX IF NOT EXISTS idx_batch_payment_summaries_payment_date ON batch_payment_summaries(payment_date);
CREATE INDEX IF NOT EXISTS idx_batch_payment_summaries_status ON batch_payment_summaries(status);

-- Update batch statuses to include new closure states
ALTER TABLE batches DROP CONSTRAINT IF EXISTS batches_status_check;
ALTER TABLE batches ADD CONSTRAINT batches_status_check 
CHECK (status IN (
  'draft', 
  'ready_for_submission', 
  'submitted', 
  'under_review', 
  'approved', 
  'rejected', 
  'verified_paid',
  'closed',
  'closure_pending',
  'closure_submitted',
  'closure_approved'
));

-- Add comments for documentation
COMMENT ON TABLE batch_closure_reports IS 'Comprehensive reports generated when TPAs close batches with payment summaries and justifications';
COMMENT ON TABLE batch_payment_summaries IS 'Payment summary records that appear on admin dashboard for tracking and audit';

COMMENT ON COLUMN batch_closure_reports.rejection_reasons IS 'JSON array of rejection reason analysis: [{reason: string, count: number, amount: number}]';
COMMENT ON COLUMN batch_closure_reports.additional_documents IS 'JSON array of additional document attachments: [{url: string, fileName: string, type: string}]';

COMMENT ON COLUMN batch_payment_summaries.status IS 'Payment status: active (normal), reconciled (matched with bank), disputed (under investigation)';