-- Fix and normalize claims.status constraint to match application workflow
-- Safely drop existing constraint (if it differs) and re-add with canonical values

BEGIN;

-- 1. Drop existing constraint if present
ALTER TABLE "claims" DROP CONSTRAINT IF EXISTS "claims_status_check";

-- 2. Normalize any legacy / human-readable / capitalized statuses to lowercase snake_case
-- Map common variants to canonical values
UPDATE claims SET status = 'submitted' WHERE status ILIKE 'submitted';
UPDATE claims SET status = 'awaiting_verification' WHERE status IN ('awaiting verification', 'Awaiting Verification', 'AWAITING_VERIFICATION');
UPDATE claims SET status = 'not_verified' WHERE status IN ('not verified', 'Not Verified', 'NOT_VERIFIED');
UPDATE claims SET status = 'verified' WHERE status ILIKE 'verified';
UPDATE claims SET status = 'verified_awaiting_payment' WHERE status IN ('verified awaiting payment', 'Verified Awaiting Payment', 'VERIFIED_AWAITING_PAYMENT');
UPDATE claims SET status = 'verified_paid' WHERE status IN ('verified paid', 'Verified Paid', 'VERIFIED_PAID');

-- Legacy mappings from older decision-based workflow
UPDATE claims SET status = 'submitted'        WHERE status = 'pending';
UPDATE claims SET status = 'not_verified'     WHERE status = 'rejected';
UPDATE claims SET status = 'verified'         WHERE status = 'approved';

-- 3. For any remaining values not in the new set, default them to 'submitted'
UPDATE claims SET status = 'submitted'
WHERE status NOT IN (
  'submitted', 'awaiting_verification', 'not_verified', 'verified', 'verified_awaiting_payment', 'verified_paid'
);

-- 4. Re-create the check constraint with the canonical allowed values
ALTER TABLE "claims" ADD CONSTRAINT "claims_status_check"
  CHECK (status IN (
    'submitted',
    'awaiting_verification',
    'not_verified',
    'verified',
    'verified_awaiting_payment',
    'verified_paid'
  ));

-- 5. Ensure default is correct
ALTER TABLE "claims" ALTER COLUMN status SET DEFAULT 'submitted';

-- 6. Add / update comment for clarity
COMMENT ON COLUMN "claims"."status" IS 'Claim verification status: submitted, awaiting_verification, not_verified, verified, verified_awaiting_payment, verified_paid';

COMMIT;
