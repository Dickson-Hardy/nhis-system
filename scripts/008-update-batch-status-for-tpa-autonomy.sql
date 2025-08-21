-- Migration: Update batch status system for TPA autonomous workflow
-- Date: 2025-08-21
-- Description: Update batch status to support TPA-autonomous closure workflow

-- 1. First, add 'closed' status to any existing constraints
-- Note: We need to handle this carefully as the constraint might not exist or be named differently

-- 2. Update any existing 'approved' or 'verified_paid' batches to 'closed' status
-- since in the new workflow, TPAs close batches autonomously
UPDATE batches 
SET status = 'closed', updatedAt = NOW()
WHERE status IN ('approved', 'verified_paid');

-- 3. Update the comment to reflect the new workflow
COMMENT ON COLUMN batches.status IS 'TPA-autonomous workflow: draft -> submitted -> closed. NHIS provides oversight only.';

-- 4. For claims, we maintain the verification statuses since individual claims still go through verification
-- but batch-level approval is removed in favor of TPA autonomous closure

-- Log the changes
DO $$
BEGIN
    RAISE NOTICE 'Migration 008: Updated batch status system for TPA autonomous workflow';
    RAISE NOTICE 'Converted % existing approved/verified_paid batches to closed status', 
        (SELECT COUNT(*) FROM batches WHERE status = 'closed');
END$$;