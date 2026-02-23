-- ===== Real Estate Marketplace MVP - Business Rules & Triggers =====
-- Plan limits enforcement, publishing rules, and business logic

-- Business rule: Enforce plan limits for listings
CREATE OR REPLACE FUNCTION core.check_listing_plan_limits()
RETURNS TRIGGER LANGUAGE plpgsql AS $business_limits$
DECLARE
    user_plan RECORD;
    active_listings_count INTEGER;
BEGIN
    -- Get user's current plan
    SELECT * INTO user_plan 
    FROM core.v_user_current_plan 
    WHERE user_id = NEW.owner_user_id;
    
    -- If no plan found, use free tier defaults
    IF user_plan IS NULL THEN
        user_plan.max_active_listings := 1;
        user_plan.listing_active_days := 30;
    END IF;
    
    -- Check active listings limit when publishing
    IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN
        -- Count across all partitions efficiently
        SELECT COUNT(*) INTO active_listings_count
        FROM core.listings
        WHERE owner_user_id = NEW.owner_user_id
        AND status = 'published'
        AND (id, created_at) != (NEW.id, NEW.created_at);
        
        IF active_listings_count >= user_plan.max_active_listings THEN
            RAISE EXCEPTION 'Plan limit exceeded: maximum % active listings allowed', 
                user_plan.max_active_listings;
        END IF;
        
        -- Set automatic expiration based on plan
        IF NEW.published_until IS NULL THEN
            NEW.published_until := now() + make_interval(days => user_plan.listing_active_days);
        END IF;
    END IF;
    
    RETURN NEW;
END $business_limits$;

-- Enforce publishing rules (verification + active plan + publication window)
CREATE OR REPLACE FUNCTION core.enforce_publishing_rules()
RETURNS TRIGGER LANGUAGE plpgsql AS $publishing_rules$
DECLARE
    user_plan RECORD;
BEGIN
    -- Only apply rules when publishing
    IF NEW.status = 'published' THEN
        -- Rule 1: Must be verified
        IF NEW.verification_status <> 'verified' THEN
            RAISE EXCEPTION 'Cannot publish unverified listing';
        END IF;
        
        -- Rule 2: Must have active plan (or use free tier)
        SELECT * INTO user_plan 
        FROM core.v_user_current_plan 
        WHERE user_id = NEW.owner_user_id;
        
        -- Free tier fallback if no subscription
        IF user_plan IS NULL THEN
            -- Allow free tier with basic limits
            NEW.published_until := COALESCE(NEW.published_until, now() + interval '30 days');
        END IF;
        
        -- Rule 3: Set published_at if not set
        IF NEW.published_at IS NULL THEN
            NEW.published_at := now();
        END IF;
        
        -- Rule 4: Update search document
        NEW.search_doc := to_tsvector('spanish', 
            COALESCE(NEW.title, '') || ' ' || 
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.district, '') || ' ' ||
            COALESCE(NEW.province, '') || ' ' ||
            COALESCE(NEW.address, '')
        );
    END IF;
    
    RETURN NEW;
END $publishing_rules$;

-- Triggers for business rules
DROP TRIGGER IF EXISTS trg_listing_plan_limits ON core.listings;
CREATE TRIGGER trg_listing_plan_limits
BEFORE INSERT OR UPDATE OF status, published_at, published_until, verification_status ON core.listings
FOR EACH ROW EXECUTE FUNCTION core.check_listing_plan_limits();

DROP TRIGGER IF EXISTS trg_enforce_publishing_rules ON core.listings;
CREATE TRIGGER trg_enforce_publishing_rules
BEFORE INSERT OR UPDATE OF status ON core.listings
FOR EACH ROW EXECUTE FUNCTION core.enforce_publishing_rules();

-- Update search document on content changes
CREATE OR REPLACE FUNCTION core.update_listing_search_doc()
RETURNS TRIGGER LANGUAGE plpgsql AS $search_doc$
BEGIN
    NEW.search_doc := to_tsvector('spanish', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.district, '') || ' ' ||
        COALESCE(NEW.province, '') || ' ' ||
        COALESCE(NEW.address, '')
    );
    RETURN NEW;
END $search_doc$;

DROP TRIGGER IF EXISTS trg_update_search_doc ON core.listings;
CREATE TRIGGER trg_update_search_doc
BEFORE INSERT OR UPDATE OF title, description, district, province, address ON core.listings
FOR EACH ROW EXECUTE FUNCTION core.update_listing_search_doc();

-- Hybrid search function (FTS + Trigram similarity)
CREATE OR REPLACE FUNCTION core.search_listings(p JSONB, limit_rows INT DEFAULT 20, offset_rows INT DEFAULT 0)
RETURNS TABLE(id UUID, created_at TIMESTAMPTZ, relevance_score REAL) LANGUAGE plpgsql AS $search_func$
DECLARE
    qtext TEXT := COALESCE(p->>'q','');
    qdistrict TEXT := NULLIF(p->>'district','');
    qop core.operation_type := NULLIF(p->>'operation','')::core.operation_type;
    qptype core.property_type := NULLIF(p->>'property_type','')::core.property_type;
    qmin_price NUMERIC := NULLIF(p->>'min_price','')::NUMERIC;
    qmax_price NUMERIC := NULLIF(p->>'max_price','')::NUMERIC;
    qbeds INT := NULLIF(p->>'bedrooms','')::INT;
    qbaths INT := NULLIF(p->>'bathrooms','')::INT;
    qhas_media BOOLEAN := CASE WHEN p ? 'has_media' THEN (p->>'has_media')::BOOLEAN ELSE NULL END;
    qterm core.rental_term := NULLIF(p->>'rental_term','')::core.rental_term;
    qpet_friendly BOOLEAN := CASE WHEN p ? 'pet_friendly' THEN (p->>'pet_friendly')::BOOLEAN ELSE NULL END;
    qfurnished BOOLEAN := CASE WHEN p ? 'furnished' THEN (p->>'furnished')::BOOLEAN ELSE NULL END;
BEGIN
    RETURN QUERY
    WITH base AS (
        SELECT l.id, l.created_at,
            (ts_rank(l.search_doc, plainto_tsquery('spanish', qtext)) + COALESCE(similarity(l.title, qtext),0)::REAL) AS r
        FROM core.listings l
        WHERE l.status = 'published'
            AND l.verification_status = 'verified'
            AND l.published_at IS NOT NULL
            AND (l.published_until IS NULL OR l.published_until > now())
            AND (qtext = '' OR l.search_doc @@ plainto_tsquery('spanish', qtext) OR l.title % qtext)
            AND (qdistrict IS NULL OR l.district ILIKE (qdistrict||'%'))
            AND (qop IS NULL OR l.operation = qop)
            AND (qptype IS NULL OR l.property_type = qptype)
            AND (qmin_price IS NULL OR l.price >= qmin_price)
            AND (qmax_price IS NULL OR l.price <= qmax_price)
            AND (qbeds IS NULL OR l.bedrooms >= qbeds)
            AND (qbaths IS NULL OR l.bathrooms >= qbaths)
            AND (qhas_media IS NULL OR l.has_media = qhas_media)
            AND (qterm IS NULL OR l.rental_term = qterm)
            AND (qpet_friendly IS NULL OR l.pet_friendly = qpet_friendly)
            AND (qfurnished IS NULL OR l.furnished = qfurnished)
    )
    SELECT base.id, base.created_at, base.r
    FROM base
    ORDER BY base.r DESC NULLS LAST, base.created_at DESC
    LIMIT limit_rows OFFSET offset_rows;
END $search_func$;
