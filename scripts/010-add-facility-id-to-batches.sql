-- Add facility_id column to batches table
-- This migration adds the missing facility_id column that's referenced in the API

-- Add facility_id column to batches table
ALTER TABLE batches ADD COLUMN IF NOT EXISTS facility_id INTEGER REFERENCES facilities(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_batches_facility_id ON batches(facility_id);

-- Update existing batches to have a facility_id (if any exist)
-- This assumes the first facility as default - adjust as needed
UPDATE batches 
SET facility_id = (SELECT id FROM facilities LIMIT 1)
WHERE facility_id IS NULL;

-- Make facility_id NOT NULL after setting default values
ALTER TABLE batches ALTER COLUMN facility_id SET NOT NULL;
