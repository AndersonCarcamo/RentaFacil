-- ===== Agent Invitations System =====
-- Table for managing agent invitations from agencies

-- Agent invitations table
CREATE TABLE IF NOT EXISTS core.agent_invitations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id               UUID NOT NULL REFERENCES core.agencies(id) ON DELETE CASCADE,
    invited_by_user_id      UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    email                   CITEXT NOT NULL,
    first_name              TEXT,
    last_name               TEXT,
    phone                   TEXT,
    token                   TEXT UNIQUE NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'pending',
    expires_at              TIMESTAMPTZ NOT NULL,
    accepted_at             TIMESTAMPTZ,
    accepted_by_user_id     UUID REFERENCES core.users(id),
    revoked_at              TIMESTAMPTZ,
    revoked_by_user_id      UUID REFERENCES core.users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT agent_invitations_status_check 
        CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_invitations_agency 
    ON core.agent_invitations(agency_id);
    
CREATE INDEX IF NOT EXISTS idx_agent_invitations_email 
    ON core.agent_invitations(email);
    
CREATE INDEX IF NOT EXISTS idx_agent_invitations_token 
    ON core.agent_invitations(token);
    
CREATE INDEX IF NOT EXISTS idx_agent_invitations_status 
    ON core.agent_invitations(status);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_agent_invitations_agency_status 
    ON core.agent_invitations(agency_id, status);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_agent_invitation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_agent_invitation_timestamp ON core.agent_invitations;
CREATE TRIGGER trigger_update_agent_invitation_timestamp
    BEFORE UPDATE ON core.agent_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_invitation_timestamp();

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_agent_invitations()
RETURNS void AS $$
BEGIN
    UPDATE core.agent_invitations
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- View for active invitations with agency info
CREATE OR REPLACE VIEW core.v_active_agent_invitations AS
SELECT 
    i.id,
    i.agency_id,
    a.name as agency_name,
    i.email,
    i.first_name,
    i.last_name,
    i.phone,
    i.token,
    i.status,
    i.expires_at,
    i.created_at,
    u.first_name || ' ' || u.last_name as invited_by_name,
    u.email as invited_by_email
FROM core.agent_invitations i
JOIN core.agencies a ON i.agency_id = a.id
JOIN core.users u ON i.invited_by_user_id = u.id
WHERE i.status = 'pending'
AND i.expires_at > now();

COMMENT ON TABLE core.agent_invitations IS 'Stores invitations sent by agencies to invite new agents';
COMMENT ON VIEW core.v_active_agent_invitations IS 'Active agent invitations with agency and inviter information';
