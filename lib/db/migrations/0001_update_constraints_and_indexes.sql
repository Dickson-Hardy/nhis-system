-- Update constraints and indexes for NHIS Healthcare Management System

-- Add role constraint to users table
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK (role IN ('tpa', 'facility', 'nhis_admin'));

-- Add decision constraint to claims table
ALTER TABLE "claims" ADD CONSTRAINT "claims_decision_check" CHECK (decision IN ('approved', 'rejected', 'pending'));

-- Update status constraint for claims table to support TPA workflow
ALTER TABLE "claims" ADD CONSTRAINT "claims_status_check" CHECK (status IN ('submitted', 'awaiting_verification', 'not_verified', 'verified', 'verified_awaiting_payment', 'verified_paid'));

-- Add status constraint to batches table
ALTER TABLE "batches" ADD CONSTRAINT "batches_status_check" CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_claims_tpa_id" ON "claims"("tpa_id");
CREATE INDEX IF NOT EXISTS "idx_claims_facility_id" ON "claims"("facility_id");
CREATE INDEX IF NOT EXISTS "idx_claims_batch_number" ON "claims"("batch_number");
CREATE INDEX IF NOT EXISTS "idx_claims_status" ON "claims"("status");
CREATE INDEX IF NOT EXISTS "idx_claims_created_at" ON "claims"("created_at");
CREATE INDEX IF NOT EXISTS "idx_facilities_tpa_id" ON "facilities"("tpa_id");
CREATE INDEX IF NOT EXISTS "idx_batches_tpa_id" ON "batches"("tpa_id");
CREATE INDEX IF NOT EXISTS "idx_batches_status" ON "batches"("status");

-- Add helpful comments
COMMENT ON COLUMN "claims"."status" IS 'Claim verification status: submitted, awaiting_verification, not_verified, verified, verified_awaiting_payment, verified_paid';
COMMENT ON COLUMN "claims"."decision" IS 'Final decision on claim: approved, rejected, pending';
COMMENT ON COLUMN "users"."role" IS 'User role: tpa, facility, nhis_admin';
COMMENT ON COLUMN "batches"."status" IS 'Batch processing status: draft, submitted, reviewed, approved';

-- Add foreign key constraint for users table (tpa_id and facility_id fields)
ALTER TABLE "users" ADD COLUMN "tpa_id" INTEGER REFERENCES "tpas"("id");
ALTER TABLE "users" ADD COLUMN "facility_id" INTEGER REFERENCES "facilities"("id");

-- Create index on new foreign keys
CREATE INDEX IF NOT EXISTS "idx_users_tpa_id" ON "users"("tpa_id");
CREATE INDEX IF NOT EXISTS "idx_users_facility_id" ON "users"("facility_id");

-- Add comment for new fields
COMMENT ON COLUMN "users"."tpa_id" IS 'TPA ID for TPA role users';
COMMENT ON COLUMN "users"."facility_id" IS 'Facility ID for facility role users';