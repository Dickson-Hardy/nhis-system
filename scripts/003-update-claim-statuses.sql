-- Update claim status enum to match TPA verification workflow
ALTER TABLE claims ALTER COLUMN status SET DEFAULT 'submitted';

-- Update existing claims to use new status values
UPDATE claims SET status = 'submitted' WHERE status = 'pending';
UPDATE claims SET status = 'not_verified' WHERE status = 'rejected';
UPDATE claims SET status = 'verified' WHERE status = 'approved';

-- Add comments for clarity
COMMENT ON COLUMN claims.status IS 'Claim verification status: submitted, awaiting_verification, not_verified, verified, verified_awaiting_payment, verified_paid';
