-- Migration SQL: Add fields for user role upgrade functionality
-- Date: 2025-10-13
-- Description: Add bio, agency_name, and agency_ruc fields to users table

-- Connect to your database and run this migration

-- Add bio field for user descriptions
ALTER TABLE core.users 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add agency information fields for agent users
ALTER TABLE core.users 
ADD COLUMN IF NOT EXISTS agency_name TEXT;

ALTER TABLE core.users 
ADD COLUMN IF NOT EXISTS agency_ruc TEXT;

-- Add comments for documentation
COMMENT ON COLUMN core.users.bio IS 'User biography/description';
COMMENT ON COLUMN core.users.agency_name IS 'Agency name for agent users';
COMMENT ON COLUMN core.users.agency_ruc IS 'Agency RUC number for agent users';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'core' 
AND table_name = 'users' 
AND column_name IN ('bio', 'agency_name', 'agency_ruc')
ORDER BY column_name;