-- Migration: Add password management fields to users table
-- This script adds temporary password and password reset functionality

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_temporary_password BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP;

-- Update existing users to have last_password_change set to their creation date
UPDATE users 
SET last_password_change = created_at 
WHERE last_password_change IS NULL AND is_temporary_password = false;

-- Create index for password reset tokens for better performance
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_expires ON users(password_reset_expires);

-- Add comments for documentation
COMMENT ON COLUMN users.is_temporary_password IS 'Indicates if user has a temporary password that must be changed on first login';
COMMENT ON COLUMN users.password_reset_token IS 'Token used for password reset functionality';
COMMENT ON COLUMN users.password_reset_expires IS 'Expiration time for password reset token';
COMMENT ON COLUMN users.last_password_change IS 'Timestamp of last password change';

COMMIT;