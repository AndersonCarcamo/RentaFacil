-- ===== Update user_agency table to add role field =====
-- This migration ensures the role field exists and is properly configured

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
        WHEN 'agency' THEN 4
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
