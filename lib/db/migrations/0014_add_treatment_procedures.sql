-- Add treatment_procedures field to claims table
ALTER TABLE claims ADD COLUMN treatment_procedures TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN claims.treatment_procedures IS 'JSON string containing detailed treatment procedures with name, cost, and description';
