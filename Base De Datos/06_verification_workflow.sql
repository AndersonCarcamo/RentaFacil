-- ===== Real Estate Marketplace MVP - Verification Workflow =====
-- Listing verification system with reviewer assignment

CREATE TABLE IF NOT EXISTS core.listing_verifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id          UUID NOT NULL,
    listing_created_at  TIMESTAMPTZ NOT NULL, -- For FK to partitioned table
    status              core.verification_status NOT NULL DEFAULT 'pending',
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at         TIMESTAMPTZ,
    reviewer_user_id    UUID REFERENCES core.users(id) ON DELETE SET NULL,
    review_notes        TEXT,
    rejection_reason    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Foreign key to partitioned table
    CONSTRAINT listing_verifications_listing_fk FOREIGN KEY (listing_id, listing_created_at) 
        REFERENCES core.listings(id, created_at) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS listing_verif_idx ON core.listing_verifications(listing_id, listing_created_at, status);
CREATE INDEX IF NOT EXISTS listing_verif_reviewer_idx ON core.listing_verifications(reviewer_user_id, status);

-- Trigger to update listing verification status
CREATE OR REPLACE FUNCTION core.sync_listing_verification_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $sync_verification$
BEGIN
    -- Update the listing verification status using composite key
    UPDATE core.listings 
    SET verification_status = NEW.status,
        updated_at = now()
    WHERE id = NEW.listing_id AND created_at = NEW.listing_created_at;
    
    -- Log verification event in analytics
    INSERT INTO analytics.events (event_type, listing_id, listing_created_at, properties)
    VALUES (
        'verification_status_change',
        NEW.listing_id,
        NEW.listing_created_at,
        jsonb_build_object(
            'old_status', COALESCE(OLD.status::text, 'none'),
            'new_status', NEW.status::text,
            'reviewer_id', NEW.reviewer_user_id,
            'review_notes', NEW.review_notes
        )
    );
    
    RETURN NEW;
END $sync_verification$;

DROP TRIGGER IF EXISTS trg_sync_listing_verification ON core.listing_verifications;
CREATE TRIGGER trg_sync_listing_verification
AFTER INSERT OR UPDATE OF status ON core.listing_verifications
FOR EACH ROW EXECUTE FUNCTION core.sync_listing_verification_status();

-- Function to submit listing for verification
CREATE OR REPLACE FUNCTION core.submit_listing_for_verification(
    p_listing_id UUID,
    p_listing_created_at TIMESTAMPTZ
)
RETURNS UUID LANGUAGE plpgsql AS $submit_verification$
DECLARE
    verification_id UUID;
    listing_exists boolean;
BEGIN
    -- Check if listing exists and is in draft status
    SELECT EXISTS(
        SELECT 1 FROM core.listings 
        WHERE id = p_listing_id 
        AND created_at = p_listing_created_at 
        AND status = 'draft'
    ) INTO listing_exists;
    
    IF NOT listing_exists THEN
        RAISE EXCEPTION 'Listing not found or not in draft status';
    END IF;
    
    -- Check if verification already exists
    IF EXISTS(
        SELECT 1 FROM core.listing_verifications 
        WHERE listing_id = p_listing_id 
        AND listing_created_at = p_listing_created_at
        AND status = 'pending'
    ) THEN
        RAISE EXCEPTION 'Verification already pending for this listing';
    END IF;
    
    -- Create verification record
    INSERT INTO core.listing_verifications (
        listing_id, listing_created_at, status, submitted_at
    ) VALUES (
        p_listing_id, p_listing_created_at, 'pending', now()
    ) RETURNING id INTO verification_id;
    
    -- Update listing status
    UPDATE core.listings 
    SET status = 'pending_verification',
        updated_at = now()
    WHERE id = p_listing_id AND created_at = p_listing_created_at;
    
    RETURN verification_id;
END $submit_verification$;

-- Function to approve/reject verification
CREATE OR REPLACE FUNCTION core.review_listing_verification(
    p_verification_id UUID,
    p_reviewer_user_id UUID,
    p_status core.verification_status,
    p_review_notes TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql AS $review_verification$
DECLARE
    verification_record RECORD;
BEGIN
    -- Get verification record
    SELECT * FROM core.listing_verifications 
    WHERE id = p_verification_id AND status = 'pending'
    INTO verification_record;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Verification not found or not pending';
    END IF;
    
    -- Validate status
    IF p_status NOT IN ('verified', 'rejected') THEN
        RAISE EXCEPTION 'Status must be verified or rejected';
    END IF;
    
    -- Update verification record
    UPDATE core.listing_verifications 
    SET status = p_status,
        reviewed_at = now(),
        reviewer_user_id = p_reviewer_user_id,
        review_notes = p_review_notes,
        rejection_reason = CASE WHEN p_status = 'rejected' THEN p_rejection_reason ELSE NULL END
    WHERE id = p_verification_id;
    
    -- Update listing status
    UPDATE core.listings 
    SET status = CASE 
            WHEN p_status = 'verified' THEN 'published'
            WHEN p_status = 'rejected' THEN 'draft'
        END,
        updated_at = now()
    WHERE id = verification_record.listing_id 
    AND created_at = verification_record.listing_created_at;
    
    RETURN true;
END $review_verification$;

-- View for pending verifications
CREATE OR REPLACE VIEW core.v_pending_verifications AS
SELECT 
    v.id as verification_id,
    v.listing_id,
    v.listing_created_at,
    v.submitted_at,
    l.title,
    l.operation,
    l.property_type,
    l.district,
    l.price,
    u.first_name || ' ' || u.last_name as owner_name,
    u.email as owner_email,
    EXTRACT(days FROM now() - v.submitted_at) as days_pending
FROM core.listing_verifications v
JOIN core.listings l ON l.id = v.listing_id AND l.created_at = v.listing_created_at
JOIN core.users u ON u.id = l.owner_user_id
WHERE v.status = 'pending'
ORDER BY v.submitted_at ASC;
