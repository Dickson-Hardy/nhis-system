-- Add treatment cost category fields to claims table
ALTER TABLE claims ADD COLUMN procedure_cost DECIMAL(10,2);
ALTER TABLE claims ADD COLUMN treatment_cost DECIMAL(10,2);
ALTER TABLE claims ADD COLUMN medication_cost DECIMAL(10,2);
ALTER TABLE claims ADD COLUMN other_cost DECIMAL(10,2);

-- Add comments to explain the fields
COMMENT ON COLUMN claims.procedure_cost IS 'Cost of medical procedures and surgeries';
COMMENT ON COLUMN claims.treatment_cost IS 'Cost of treatment plans and therapies';
COMMENT ON COLUMN claims.medication_cost IS 'Cost of drugs and prescriptions';
COMMENT ON COLUMN claims.other_cost IS 'Cost of additional services and miscellaneous items';

-- Update existing records to have default values
UPDATE claims SET 
  procedure_cost = 0.00,
  treatment_cost = 0.00,
  medication_cost = 0.00,
  other_cost = 0.00
WHERE procedure_cost IS NULL;
