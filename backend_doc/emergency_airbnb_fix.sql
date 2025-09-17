-- ===== Minimal Airbnb Function - Emergency Fix =====
-- Only creates the essential validate_airbnb_listing function

BEGIN;

-- Create the minimal function that the system is calling
CREATE OR REPLACE FUNCTION core.validate_airbnb_listing(p_listing_id UUID)
RETURNS JSON LANGUAGE plpgsql AS $validate_endpoint$
DECLARE
    listing_record RECORD;
    can_be_airbnb BOOLEAN := false;
    airbnb_score INTEGER := 0;
BEGIN
    -- Get listing details
    SELECT id, created_at, operation, property_type, furnished, rental_term, status
    INTO listing_record
    FROM core.listings 
    WHERE id = p_listing_id 
    AND status IN ('published', 'draft')
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Listing not found',
            'listing_id', p_listing_id
        );
    END IF;
    
    -- Calculate basic Airbnb score
    airbnb_score := 0;
    
    IF listing_record.furnished = true THEN 
        airbnb_score := airbnb_score + 40; 
    END IF;
    
    IF listing_record.rental_term IN ('daily', 'weekly') THEN 
        airbnb_score := airbnb_score + 30; 
    END IF;
    
    IF listing_record.property_type IN ('studio', 'apartment', 'house', 'room') THEN 
        airbnb_score := airbnb_score + 20; 
    END IF;
    
    IF listing_record.operation IN ('rent', 'temp_rent') THEN 
        airbnb_score := airbnb_score + 10; 
    END IF;
    
    -- Basic eligibility check
    can_be_airbnb := (
        listing_record.furnished = true AND 
        listing_record.property_type IN ('studio', 'apartment', 'house', 'room') AND
        listing_record.operation IN ('rent', 'temp_rent')
    );
    
    -- Return validation result
    RETURN json_build_object(
        'success', true,
        'listing_id', p_listing_id,
        'validation', json_build_object(
            'can_be_airbnb', can_be_airbnb,
            'airbnb_score', LEAST(airbnb_score, 100),
            'is_furnished', listing_record.furnished,
            'rental_term', listing_record.rental_term,
            'property_type', listing_record.property_type,
            'operation', listing_record.operation,
            'rating', CASE 
                WHEN airbnb_score >= 80 THEN 'Excellent for Airbnb'
                WHEN airbnb_score >= 60 THEN 'Good for Airbnb'
                WHEN airbnb_score >= 40 THEN 'Fair for Airbnb'
                WHEN can_be_airbnb THEN 'Basic Airbnb ready'
                ELSE 'Not suitable for Airbnb'
            END
        ),
        'timestamp', now()
    );
END $validate_endpoint$;

COMMIT;

\echo '=========================================='
\echo 'Emergency Airbnb Function Created!'
\echo '=========================================='
\echo 'Function: core.validate_airbnb_listing(uuid)'
\echo 'Status: Ready for testing'
