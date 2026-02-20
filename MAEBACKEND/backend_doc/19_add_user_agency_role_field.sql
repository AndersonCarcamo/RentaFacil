-- ===== Update user_agency table to add role field =====
-- This migration ensures the role field exists and is properly configured

-- Check if role column exists, if not, add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'user_agency' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE core.user_agency 
        ADD COLUMN role TEXT DEFAULT 'agent';
        
        COMMENT ON COLUMN core.user_agency.role IS 'Role of the user in the agency: owner, admin, or agent';
    END IF;
END $$;

-- Add constraint to ensure valid roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'user_agency_role_check'
    ) THEN
        ALTER TABLE core.user_agency
        ADD CONSTRAINT user_agency_role_check 
        CHECK (role IN ('owner', 'admin', 'agent'));
    END IF;
END $$;

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_user_agency_role 
ON core.user_agency(role);

-- Update existing records without role to 'agent'
UPDATE core.user_agency
SET role = 'agent'
WHERE role IS NULL;

-- Make role NOT NULL after setting defaults
ALTER TABLE core.user_agency 
ALTER COLUMN role SET NOT NULL;

-- Comments
COMMENT ON TABLE core.user_agency IS 'Junction table linking users to agencies with their roles';
COMMENT ON COLUMN core.user_agency.role IS 'Role types: owner (created agency), admin (full permissions), agent (normal permissions)';

-- Create view for agency members with roles
CREATE OR REPLACE VIEW core.v_agency_members AS
SELECT 
    ua.agency_id,
    a.name as agency_name,
    ua.user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.phone,
    u.profile_picture_url,
    u.role as system_role,
    ua.role as agency_role,
    u.is_active,
    u.is_verified,
    ua.created_at as joined_at,
    u.last_login_at,
    u.created_at as user_created_at
FROM core.user_agency ua
JOIN core.users u ON ua.user_id = u.id
JOIN core.agencies a ON ua.agency_id = a.id
ORDER BY 
    CASE ua.role
        WHEN 'owner' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'agent' THEN 3
        ELSE 4
    END,
    ua.created_at;

COMMENT ON VIEW core.v_agency_members IS 'View showing all agency members with their roles and details, ordered by role hierarchy';

-- Function to get user role in agency
CREATE OR REPLACE FUNCTION core.get_user_agency_role(
    p_user_id UUID,
    p_agency_id UUID
) RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM core.user_agency
    WHERE user_id = p_user_id AND agency_id = p_agency_id;
    
    RETURN v_role;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION core.get_user_agency_role IS 'Get the role of a user in a specific agency';

-- Function to check if user is agency owner
CREATE OR REPLACE FUNCTION core.is_agency_owner(
    p_user_id UUID,
    p_agency_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM core.user_agency
        WHERE user_id = p_user_id 
        AND agency_id = p_agency_id 
        AND role = 'owner'
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION core.is_agency_owner IS 'Check if a user is the owner of an agency';

-- Sample queries for testing
-- SELECT * FROM core.v_agency_members WHERE agency_id = 'YOUR_AGENCY_ID';
-- SELECT core.get_user_agency_role('USER_ID', 'AGENCY_ID');
-- SELECT core.is_agency_owner('USER_ID', 'AGENCY_ID');
