-- ===== Optimized Airbnb Detection System =====
-- Smart system to detect and validate Airbnb-style properties

BEGIN;

-- 1. Enhanced amenities for Airbnb detection
INSERT INTO core.amenities (name, icon) VALUES
('Limpieza incluida', 'cleaning_services'),
('Check-in automático', 'vpn_key'), 
('Cocina equipada', 'kitchen'),
('Ropa de cama incluida', 'bed'),
('Toallas incluidas', 'dry_cleaning'),
('Recepción 24h', 'schedule'),
('WiFi de alta velocidad', 'wifi'),
('Aire acondicionado', 'ac_unit'),
('Calefacción', 'thermostat'),
('TV con cable/streaming', 'tv'),
('Desayuno incluido', 'restaurant'),
('Servicio de conserje', 'concierge_services'),
('Estacionamiento incluido', 'local_parking'),
('Piscina', 'pool'),
('Gimnasio', 'fitness_center')
ON CONFLICT (name) DO NOTHING;

-- 2. Optimized function to check Airbnb eligibility
CREATE OR REPLACE FUNCTION core.check_airbnb_eligibility(
    p_listing_id UUID,
    p_listing_created_at TIMESTAMPTZ,
    p_rental_term core.rental_term DEFAULT NULL,
    p_furnished BOOLEAN DEFAULT NULL,
    p_property_type core.property_type DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql AS $airbnb_check$
DECLARE
    amenity_count INTEGER := 0;
    required_amenities TEXT[] := ARRAY['Amoblado', 'Internet/WiFi', 'Limpieza incluida'];
    recommended_amenities TEXT[] := ARRAY['Cocina equipada', 'Ropa de cama incluida', 'Toallas incluidas', 'Check-in automático'];
    luxury_amenities TEXT[] := ARRAY['Aire acondicionado', 'TV con cable/streaming', 'Desayuno incluido', 'Recepción 24h'];
    
    required_count INTEGER := 0;
    recommended_count INTEGER := 0;
    luxury_count INTEGER := 0;
    
    can_be_airbnb BOOLEAN := false;
    airbnb_score INTEGER := 0;
    missing_requirements TEXT[];
    suggestions TEXT[];
    current_style TEXT;
    
    -- Get actual values if not provided
    actual_rental_term core.rental_term;
    actual_furnished BOOLEAN;
    actual_property_type core.property_type;
BEGIN
    -- Get listing details if not provided
    IF p_rental_term IS NULL OR p_furnished IS NULL OR p_property_type IS NULL THEN
        SELECT rental_term, furnished, property_type 
        INTO actual_rental_term, actual_furnished, actual_property_type
        FROM core.listings 
        WHERE id = p_listing_id AND created_at = p_listing_created_at;
    ELSE
        actual_rental_term := p_rental_term;
        actual_furnished := p_furnished;
        actual_property_type := p_property_type;
    END IF;
    
    -- Count amenities by category
    SELECT 
        COUNT(*) FILTER (WHERE a.name = ANY(required_amenities)),
        COUNT(*) FILTER (WHERE a.name = ANY(recommended_amenities)),
        COUNT(*) FILTER (WHERE a.name = ANY(luxury_amenities))
    INTO required_count, recommended_count, luxury_count
    FROM core.listing_amenities la
    JOIN core.amenities a ON la.amenity_id = a.id
    WHERE la.listing_id = p_listing_id 
      AND la.listing_created_at = p_listing_created_at;
    
    -- Calculate Airbnb score (0-100)
    airbnb_score := (required_count * 30) + (recommended_count * 15) + (luxury_count * 10);
    IF actual_furnished THEN airbnb_score := airbnb_score + 20; END IF;
    IF actual_rental_term IN ('daily', 'weekly') THEN airbnb_score := airbnb_score + 10; END IF;
    
    -- Determine if can be Airbnb
    can_be_airbnb := (
        actual_furnished = true AND 
        required_count >= 2 AND 
        actual_property_type IN ('studio', 'apartment', 'house', 'room')
    );
    
    -- Generate missing requirements
    IF NOT actual_furnished THEN
        missing_requirements := array_append(missing_requirements, 'Property must be furnished');
    END IF;
    
    IF required_count < 2 THEN
        missing_requirements := array_append(missing_requirements, 
            format('Need at least 2 required amenities (have %s): %s', 
                   required_count, array_to_string(required_amenities, ', ')));
    END IF;
    
    -- Generate suggestions
    IF actual_rental_term NOT IN ('daily', 'weekly') THEN
        suggestions := array_append(suggestions, 'Consider offering daily/weekly rentals for better Airbnb appeal');
    END IF;
    
    IF recommended_count < 2 THEN
        suggestions := array_append(suggestions, 
            format('Add recommended amenities for better score: %s', array_to_string(recommended_amenities, ', ')));
    END IF;
    
    -- Determine current style
    current_style := CASE 
        WHEN can_be_airbnb AND actual_rental_term IN ('daily', 'weekly') THEN 'airbnb'
        WHEN actual_rental_term IN ('daily', 'weekly') THEN 'short_term'
        WHEN actual_rental_term = 'monthly' AND airbnb_score >= 50 THEN 'furnished_monthly'
        WHEN actual_rental_term = 'yearly' OR actual_rental_term IS NULL THEN 'traditional'
        ELSE 'standard'
    END;
    
    RETURN json_build_object(
        'can_be_airbnb', can_be_airbnb,
        'airbnb_score', LEAST(airbnb_score, 100),
        'current_style', current_style,
        'required_amenities_count', required_count,
        'recommended_amenities_count', recommended_count,
        'luxury_amenities_count', luxury_count,
        'is_furnished', actual_furnished,
        'rental_term', actual_rental_term,
        'missing_requirements', COALESCE(missing_requirements, ARRAY[]::TEXT[]),
        'suggestions', COALESCE(suggestions, ARRAY[]::TEXT[]),
        'rating', CASE 
            WHEN airbnb_score >= 80 THEN 'Excellent for Airbnb'
            WHEN airbnb_score >= 60 THEN 'Good for Airbnb'
            WHEN airbnb_score >= 40 THEN 'Fair for Airbnb'
            WHEN can_be_airbnb THEN 'Basic Airbnb ready'
            ELSE 'Not suitable for Airbnb'
        END
    );
END $airbnb_check$;

-- 3. Optimized rental style function
CREATE OR REPLACE FUNCTION core.get_rental_style_optimized(
    p_listing_id UUID,
    p_listing_created_at TIMESTAMPTZ
)
RETURNS TEXT LANGUAGE plpgsql STABLE AS $style_func$
DECLARE
    eligibility_result JSON;
BEGIN
    -- Use the eligibility check to determine style
    SELECT core.check_airbnb_eligibility(p_listing_id, p_listing_created_at) INTO eligibility_result;
    RETURN eligibility_result->>'current_style';
END $style_func$;

-- 4. Create optimized view with caching consideration
-- First drop existing view if it has conflicts
DROP VIEW IF EXISTS core.v_listings_airbnb_analysis;

CREATE VIEW core.v_listings_airbnb_analysis AS
SELECT l.*,
       core.get_rental_style_optimized(l.id, l.created_at) as rental_style,
       CASE 
           WHEN l.furnished = true AND 
                l.rental_term IN ('daily', 'weekly') AND 
                EXISTS(SELECT 1 FROM core.listing_amenities la 
                       JOIN core.amenities a ON la.amenity_id = a.id 
                       WHERE la.listing_id = l.id 
                       AND la.listing_created_at = l.created_at
                       AND a.name IN ('Amoblado', 'Internet/WiFi', 'Limpieza incluida')
                       HAVING COUNT(*) >= 2)
           THEN true 
           ELSE false 
       END as can_be_airbnb_quick
FROM core.listings l;

-- 5. Create endpoint-ready function for validation
CREATE OR REPLACE FUNCTION core.validate_airbnb_listing(p_listing_id UUID)
RETURNS JSON LANGUAGE plpgsql AS $validate_endpoint$
DECLARE
    listing_record RECORD;
    validation_result JSON;
BEGIN
    -- Get listing with created_at
    SELECT id, created_at INTO listing_record
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
    
    -- Get full validation
    SELECT core.check_airbnb_eligibility(listing_record.id, listing_record.created_at) 
    INTO validation_result;
    
    RETURN json_build_object(
        'success', true,
        'listing_id', p_listing_id,
        'validation', validation_result,
        'timestamp', now()
    );
END $validate_endpoint$;

-- 6. Performance indexes
CREATE INDEX IF NOT EXISTS listings_furnished_rental_term_idx 
ON core.listings(furnished, rental_term, status) 
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS listings_airbnb_candidates_idx 
ON core.listings(property_type, furnished, rental_term) 
WHERE furnished = true AND rental_term IN ('daily', 'weekly') AND status = 'published';

-- 7. Enhanced search function
CREATE OR REPLACE FUNCTION core.search_airbnb_properties(
    p_style TEXT DEFAULT NULL,              -- 'airbnb', 'traditional', etc.
    p_can_be_airbnb BOOLEAN DEFAULT NULL,   -- Filter by Airbnb eligibility
    p_min_score INTEGER DEFAULT NULL,       -- Minimum Airbnb score
    p_district TEXT DEFAULT NULL,
    p_min_price NUMERIC DEFAULT NULL,
    p_max_price NUMERIC DEFAULT NULL,
    p_property_type core.property_type DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
    id UUID,
    created_at TIMESTAMPTZ,
    title TEXT,
    price NUMERIC,
    property_type core.property_type,
    district TEXT,
    rental_style TEXT,
    can_be_airbnb BOOLEAN,
    airbnb_score INTEGER
) LANGUAGE plpgsql AS $search_airbnb$
BEGIN
    RETURN QUERY
    WITH airbnb_data AS (
        SELECT l.id, l.created_at, l.title, l.price, l.property_type, l.district,
               core.get_rental_style_optimized(l.id, l.created_at) as style,
               (core.check_airbnb_eligibility(l.id, l.created_at)->>'can_be_airbnb')::boolean as eligible,
               (core.check_airbnb_eligibility(l.id, l.created_at)->>'airbnb_score')::integer as score
        FROM core.listings l
        WHERE l.status = 'published'
          AND l.verification_status = 'verified'
          AND (p_district IS NULL OR l.district ILIKE (p_district || '%'))
          AND (p_min_price IS NULL OR l.price >= p_min_price)
          AND (p_max_price IS NULL OR l.price <= p_max_price)
          AND (p_property_type IS NULL OR l.property_type = p_property_type)
    )
    SELECT a.id, a.created_at, a.title, a.price, a.property_type, a.district,
           a.style, a.eligible, a.score
    FROM airbnb_data a
    WHERE (p_style IS NULL OR a.style = p_style)
      AND (p_can_be_airbnb IS NULL OR a.eligible = p_can_be_airbnb)
      AND (p_min_score IS NULL OR a.score >= p_min_score)
    ORDER BY a.score DESC, a.created_at DESC
    LIMIT p_limit;
END $search_airbnb$;

COMMIT;