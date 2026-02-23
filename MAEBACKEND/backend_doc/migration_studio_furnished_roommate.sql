-- ===== Migration: Add Studio, Furnished, and Roommate features =====
-- Adds studio property type, furnished field, and roommate operation type

BEGIN;

\echo '=========================================='
\echo 'Adding Studio, Furnished, and Roommate Features'
\echo '=========================================='

-- 5. Create view for roommate listings with additional context
CREATE OR REPLACE VIEW core.v_roommate_listings AS
SELECT l.*,
       CASE 
           WHEN l.bedrooms = 1 THEN 'private_room'
           WHEN l.bedrooms > 1 THEN 'shared_space'
           ELSE 'room_in_property'
       END as roommate_type,
       CASE 
           WHEN l.furnished = true THEN 'furnished_room'
           ELSE 'unfurnished_room'
       END as room_condition
FROM core.listings l
WHERE l.operation = 'roommate'
  AND l.status = 'published'
  AND l.verification_status = 'verified';

-- 6. Enhanced search function for the new features
CREATE OR REPLACE FUNCTION core.search_listings_enhanced(
    p_operation core.operation_type DEFAULT NULL,
    p_property_type core.property_type DEFAULT NULL,
    p_district TEXT DEFAULT NULL,
    p_min_price NUMERIC DEFAULT NULL,
    p_max_price NUMERIC DEFAULT NULL,
    p_bedrooms INTEGER DEFAULT NULL,
    p_furnished BOOLEAN DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
    id UUID,
    created_at TIMESTAMPTZ,
    title TEXT,
    price NUMERIC,
    operation core.operation_type,
    property_type core.property_type,
    district TEXT,
    bedrooms INTEGER,
    furnished BOOLEAN,
    roommate_type TEXT
) LANGUAGE plpgsql AS $enhanced_search$
BEGIN
    RETURN QUERY
    SELECT l.id, l.created_at, l.title, l.price, l.operation, 
           l.property_type, l.district, l.bedrooms, l.furnished,
           CASE 
               WHEN l.operation = 'roommate' AND l.bedrooms = 1 THEN 'private_room'
               WHEN l.operation = 'roommate' AND l.bedrooms > 1 THEN 'shared_space'  
               WHEN l.operation = 'roommate' THEN 'room_in_property'
               ELSE NULL
           END as roommate_type
    FROM core.listings l
    WHERE l.status = 'published'
      AND l.verification_status = 'verified'
      AND (p_operation IS NULL OR l.operation = p_operation)
      AND (p_property_type IS NULL OR l.property_type = p_property_type)
      AND (p_district IS NULL OR l.district ILIKE (p_district || '%'))
      AND (p_min_price IS NULL OR l.price >= p_min_price)
      AND (p_max_price IS NULL OR l.price <= p_max_price)
      AND (p_bedrooms IS NULL OR l.bedrooms >= p_bedrooms)
      AND (p_furnished IS NULL OR l.furnished = p_furnished)
    ORDER BY l.created_at DESC
    LIMIT p_limit;
END $enhanced_search$;

COMMIT;

-- Show updated enum values
\echo ''
\echo 'Updated enums:'
\echo 'Property Types:'
SELECT enumlabel as property_types 
FROM pg_enum e 
JOIN pg_type t ON e.enumtypid = t.oid 
WHERE t.typname = 'property_type' 
ORDER BY e.enumsortorder;

\echo ''
\echo 'Operation Types:'
SELECT enumlabel as operation_types 
FROM pg_enum e 
JOIN pg_type t ON e.enumtypid = t.oid 
WHERE t.typname = 'operation_type' 
ORDER BY e.enumsortorder;
