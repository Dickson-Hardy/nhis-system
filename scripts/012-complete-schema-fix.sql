-- Complete schema fix migration
-- This migration fixes both batches and claims tables to match the TypeScript schema

-- ========================================
-- FIX BATCHES TABLE
-- ========================================

-- Add facility_id column (if not exists)
ALTER TABLE batches ADD COLUMN IF NOT EXISTS facility_id INTEGER REFERENCES facilities(id);

-- Add batch management columns
ALTER TABLE batches ADD COLUMN IF NOT EXISTS batch_type VARCHAR(50) DEFAULT 'weekly';
ALTER TABLE batches ADD COLUMN IF NOT EXISTS week_start_date DATE;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS week_end_date DATE;

-- Add claim summary columns
ALTER TABLE batches ADD COLUMN IF NOT EXISTS completed_claims INTEGER DEFAULT 0;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS approved_amount DECIMAL(15,2) DEFAULT 0;

-- Add admin fee calculation columns
ALTER TABLE batches ADD COLUMN IF NOT EXISTS admin_fee_percentage DECIMAL(5,2) DEFAULT 5.00;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS admin_fee_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS net_amount DECIMAL(15,2) DEFAULT 0;

-- Add document management columns
ALTER TABLE batches ADD COLUMN IF NOT EXISTS forwarding_letter_content TEXT;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS cover_letter_url VARCHAR(500);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS cover_letter_public_id VARCHAR(255);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS cover_letter_file_name VARCHAR(255);

-- Add submission details columns
ALTER TABLE batches ADD COLUMN IF NOT EXISTS submission_emails TEXT;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS submission_notes TEXT;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS forwarding_letter_generated BOOLEAN DEFAULT false;

-- Add additional timestamps
ALTER TABLE batches ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add user tracking columns
ALTER TABLE batches ADD COLUMN IF NOT EXISTS submitted_by INTEGER REFERENCES users(id);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id);

-- Update status constraint to include all possible values
ALTER TABLE batches DROP CONSTRAINT IF EXISTS batches_status_check;
ALTER TABLE batches ADD CONSTRAINT batches_status_check 
  CHECK (status IN ('draft', 'ready_for_submission', 'submitted', 'under_review', 'approved', 'rejected', 'verified_paid'));

-- ========================================
-- FIX CLAIMS TABLE
-- ========================================

-- Add batch_id column to claims table
ALTER TABLE claims ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES batches(id);

-- Update claims status constraint to include all possible values
ALTER TABLE claims DROP CONSTRAINT IF EXISTS claims_status_check;
ALTER TABLE claims ADD CONSTRAINT claims_status_check 
  CHECK (status IN ('submitted', 'awaiting_verification', 'not_verified', 'verified', 'verified_awaiting_payment', 'verified_paid', 'completed', 'draft'));

-- ========================================
-- CREATE INDEXES
-- ========================================

-- Batches indexes
CREATE INDEX IF NOT EXISTS idx_batches_facility_id ON batches(facility_id);
CREATE INDEX IF NOT EXISTS idx_batches_batch_type ON batches(batch_type);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_week_start_date ON batches(week_start_date);
CREATE INDEX IF NOT EXISTS idx_batches_week_end_date ON batches(week_end_date);

-- Claims indexes
CREATE INDEX IF NOT EXISTS idx_claims_batch_id ON claims(batch_id);

-- ========================================
-- UPDATE EXISTING DATA
-- ========================================

-- Update existing batches to have facility_id (if any exist)
UPDATE batches 
SET facility_id = (SELECT id FROM facilities LIMIT 1)
WHERE facility_id IS NULL;

-- Make facility_id NOT NULL after setting default values
ALTER TABLE batches ALTER COLUMN facility_id SET NOT NULL;
