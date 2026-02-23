-- ===== Real Estate Marketplace MVP - Security & Audit =====
-- Audit logging, user consents, and security policies

-- Audit log for all critical operations
CREATE TABLE IF NOT EXISTS sec.audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES core.users(id) ON DELETE SET NULL,
    action          TEXT NOT NULL,
    table_name      TEXT NOT NULL,
    record_id       UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_user_idx ON sec.audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_table_idx ON sec.audit_log(table_name, record_id, created_at DESC);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION sec.audit_trigger()
RETURNS TRIGGER LANGUAGE plpgsql AS $audit_trigger$
DECLARE
    audit_row sec.audit_log%ROWTYPE;
    include_values BOOLEAN := FALSE;
    user_id_val UUID := NULL;
    record_id_val UUID := NULL;
BEGIN
    audit_row.table_name := TG_TABLE_SCHEMA||'.'||TG_TABLE_NAME;
    audit_row.created_at := now();
    
    -- Try to get user_id from the record
    BEGIN
        IF TG_OP IN ('INSERT','UPDATE') THEN
            EXECUTE format('SELECT ($1).%I', 'user_id') INTO user_id_val USING NEW;
        ELSIF TG_OP = 'DELETE' THEN
            EXECUTE format('SELECT ($1).%I', 'user_id') INTO user_id_val USING OLD;
        END IF;
    EXCEPTION WHEN undefined_column OR undefined_function THEN
        -- No user_id column, that's fine
        user_id_val := NULL;
    END;
    
    -- Try to get record id (handle both id and composite keys)
    BEGIN
        IF TG_OP IN ('INSERT','UPDATE') THEN
            EXECUTE format('SELECT ($1).%I', 'id') INTO record_id_val USING NEW;
        ELSIF TG_OP = 'DELETE' THEN
            EXECUTE format('SELECT ($1).%I', 'id') INTO record_id_val USING OLD;
        END IF;
    EXCEPTION WHEN undefined_column OR undefined_function THEN
        -- No simple id column, use a generated one
        record_id_val := gen_random_uuid();
    END;
    
    audit_row.user_id := user_id_val;
    audit_row.record_id := record_id_val;
    
    IF TG_OP = 'INSERT' THEN
        audit_row.action := 'INSERT';
        audit_row.new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        audit_row.action := 'UPDATE';
        audit_row.old_values := to_jsonb(OLD);
        audit_row.new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        audit_row.action := 'DELETE';
        audit_row.old_values := to_jsonb(OLD);
    END IF;
    
    INSERT INTO sec.audit_log VALUES (audit_row.*);
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END $audit_trigger$;

-- Privacy: user consent (Perú Ley 29733)
CREATE TABLE IF NOT EXISTS sec.user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    withdrawn_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    
    -- Ensure no duplicate active consents for same purpose
    CONSTRAINT unique_active_consent UNIQUE(user_id, purpose) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX IF NOT EXISTS user_consents_user_idx ON sec.user_consents(user_id, purpose);
CREATE INDEX IF NOT EXISTS user_consents_granted_idx ON sec.user_consents(granted, granted_at);

-- Session management for security
CREATE TABLE IF NOT EXISTS sec.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS user_sessions_user_idx ON sec.user_sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS user_sessions_token_idx ON sec.user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS user_sessions_activity_idx ON sec.user_sessions(last_activity);

-- Failed login attempts tracking
CREATE TABLE IF NOT EXISTS sec.failed_logins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT,
    ip_address INET NOT NULL,
    user_agent TEXT,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS failed_logins_email_idx ON sec.failed_logins(email, created_at DESC);
CREATE INDEX IF NOT EXISTS failed_logins_ip_idx ON sec.failed_logins(ip_address, created_at DESC);

-- Function to grant user consent
CREATE OR REPLACE FUNCTION sec.grant_user_consent(
    p_user_id UUID,
    p_purpose TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql AS $grant_consent$
DECLARE
    consent_id UUID;
BEGIN
    -- Withdraw any existing consent for this purpose first
    UPDATE sec.user_consents 
    SET withdrawn_at = now()
    WHERE user_id = p_user_id 
    AND purpose = p_purpose 
    AND withdrawn_at IS NULL;
    
    -- Grant new consent
    INSERT INTO sec.user_consents (
        user_id, purpose, granted, granted_at, ip_address, user_agent
    ) VALUES (
        p_user_id, p_purpose, true, now(), p_ip_address, p_user_agent
    ) RETURNING id INTO consent_id;
    
    -- Log the consent grant in audit
    INSERT INTO sec.audit_log (action, table_name, record_id, new_values, user_id, ip_address, user_agent)
    VALUES (
        'CONSENT_GRANTED',
        'sec.user_consents',
        consent_id,
        jsonb_build_object('purpose', p_purpose, 'granted', true),
        p_user_id,
        p_ip_address,
        p_user_agent
    );
    
    RETURN consent_id;
END $grant_consent$;

-- Function to withdraw user consent
CREATE OR REPLACE FUNCTION sec.withdraw_user_consent(
    p_user_id UUID,
    p_purpose TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql AS $withdraw_consent$
DECLARE
    consent_record RECORD;
BEGIN
    -- Find and withdraw active consent
    UPDATE sec.user_consents 
    SET withdrawn_at = now()
    WHERE user_id = p_user_id 
    AND purpose = p_purpose 
    AND withdrawn_at IS NULL
    RETURNING * INTO consent_record;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Log the consent withdrawal in audit
    INSERT INTO sec.audit_log (action, table_name, record_id, old_values, new_values, user_id, ip_address, user_agent)
    VALUES (
        'CONSENT_WITHDRAWN',
        'sec.user_consents',
        consent_record.id,
        jsonb_build_object('granted', true, 'withdrawn_at', null),
        jsonb_build_object('granted', true, 'withdrawn_at', now()),
        p_user_id,
        p_ip_address,
        p_user_agent
    );
    
    RETURN true;
END $withdraw_consent$;

-- Function to check user consent
CREATE OR REPLACE FUNCTION sec.has_user_consent(
    p_user_id UUID,
    p_purpose TEXT
)
RETURNS boolean LANGUAGE plpgsql AS $has_consent$
DECLARE
    has_consent boolean := false;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM sec.user_consents 
        WHERE user_id = p_user_id 
        AND purpose = p_purpose 
        AND granted = true 
        AND withdrawn_at IS NULL
    ) INTO has_consent;
    
    RETURN has_consent;
END $has_consent$;

-- Function to create user session
CREATE OR REPLACE FUNCTION sec.create_user_session(
    p_user_id UUID,
    p_token_hash TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_expires_hours INTEGER DEFAULT 24
)
RETURNS UUID LANGUAGE plpgsql AS $create_session$
DECLARE
    session_id UUID;
BEGIN
    -- Revoke any existing sessions for this user with same token hash
    UPDATE sec.user_sessions 
    SET revoked_at = now()
    WHERE user_id = p_user_id AND token_hash = p_token_hash;
    
    -- Create new session
    INSERT INTO sec.user_sessions (
        user_id, token_hash, ip_address, user_agent, 
        expires_at, last_activity
    ) VALUES (
        p_user_id, p_token_hash, p_ip_address, p_user_agent,
        now() + (p_expires_hours || ' hours')::interval, now()
    ) RETURNING id INTO session_id;
    
    RETURN session_id;
END $create_session$;

-- Function to validate and update session
CREATE OR REPLACE FUNCTION sec.validate_session(
    p_token_hash TEXT,
    p_ip_address INET DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql AS $validate_session$
DECLARE
    session_user_id UUID;
BEGIN
    -- Check if session exists and is valid
    SELECT user_id INTO session_user_id
    FROM sec.user_sessions 
    WHERE token_hash = p_token_hash
    AND expires_at > now()
    AND revoked_at IS NULL;
    
    IF FOUND THEN
        -- Update last activity
        UPDATE sec.user_sessions 
        SET last_activity = now(),
            ip_address = COALESCE(p_ip_address, ip_address)
        WHERE token_hash = p_token_hash;
        
        RETURN session_user_id;
    END IF;
    
    RETURN NULL;
END $validate_session$;

-- Function to log failed login attempt
CREATE OR REPLACE FUNCTION sec.log_failed_login(
    p_email CITEXT,
    p_ip_address INET,
    p_user_agent TEXT DEFAULT NULL,
    p_failure_reason TEXT DEFAULT 'invalid_credentials'
)
RETURNS UUID LANGUAGE plpgsql AS $log_failed_login$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO sec.failed_logins (
        email, ip_address, user_agent, failure_reason
    ) VALUES (
        p_email, p_ip_address, p_user_agent, p_failure_reason
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END $log_failed_login$;

-- View for user consent status
CREATE OR REPLACE VIEW sec.v_user_consent_status AS
SELECT 
    u.id as user_id,
    u.email,
    uc.purpose,
    uc.granted,
    uc.granted_at,
    uc.withdrawn_at,
    CASE 
        WHEN uc.withdrawn_at IS NULL AND uc.granted = true THEN 'active'
        WHEN uc.withdrawn_at IS NOT NULL THEN 'withdrawn'
        ELSE 'denied'
    END as status
FROM core.users u
LEFT JOIN sec.user_consents uc ON u.id = uc.user_id
ORDER BY u.email, uc.purpose, uc.granted_at DESC;
