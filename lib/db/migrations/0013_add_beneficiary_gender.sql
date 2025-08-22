-- Add beneficiary_gender field to claims table
-- This field is needed for impact metrics calculation

BEGIN;

-- Add the beneficiary_gender column
ALTER TABLE "claims" ADD COLUMN "beneficiary_gender" varchar(10);

-- Add a comment to document the field
COMMENT ON COLUMN "claims"."beneficiary_gender" IS 'Gender of the beneficiary: Male, Female, or null';

-- Create an index for better performance on gender-based queries
CREATE INDEX IF NOT EXISTS "claims_beneficiary_gender_idx" ON "claims" ("beneficiary_gender");

COMMIT;
