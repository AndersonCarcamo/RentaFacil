-- ===== Migration: Add Studio, Furnished, and Roommate features =====
-- Adds studio property type, furnished field, and roommate operation type

BEGIN;

\echo '=========================================='
\echo 'Adding Studio, Furnished, and Roommate Features'
\echo '=========================================='

-- 1. Add 'studio' to property_type enum if it doesn't exist
DO $add_studio$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'property_type' AND e.enumlabel = 'studio'
    ) THEN
        ALTER TYPE core.property_type ADD VALUE 'studio' BEFORE 'apartment';
        RAISE NOTICE 'Added studio to property_type enum';
    ELSE
        RAISE NOTICE 'studio already exists in property_type enum';
    END IF;
END $add_studio$;

-- 2. Add 'roommate' to operation_type enum if it doesn't exist
DO $add_roommate$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'operation_type' AND e.enumlabel = 'roommate'
    ) THEN
        ALTER TYPE core.operation_type ADD VALUE 'roommate';
        RAISE NOTICE 'Added roommate to operation_type enum';
    ELSE
        RAISE NOTICE 'roommate already exists in operation_type enum';
    END IF;
END $add_roommate$;

-- 3. Add 'furnished' column to listings table if it doesn't exist
DO $add_furnished$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'furnished'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN furnished BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added furnished column to listings table';
        
        -- Create index for better search performance
        CREATE INDEX listings_furnished_idx ON core.listings(furnished, operation, property_type) 
        WHERE status = 'published';
        RAISE NOTICE 'Created index on furnished column';
    ELSE
        RAISE NOTICE 'furnished column already exists in listings table';
    END IF;
END $add_furnished$;

-- 4. Create optimized indexes for new search patterns
CREATE INDEX IF NOT EXISTS listings_operation_property_idx 
ON core.listings(operation, property_type, furnished) 
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS listings_roommate_idx 
ON core.listings(operation, district, price) 
WHERE operation = 'roommate' AND status = 'published';

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

\echo ''
\echo '=========================================='
\echo 'Migration completed successfully!'
\echo '=========================================='

\echo ''
\echo 'Summary of changes:'
\echo '✓ Added "studio" to property_type enum (for monoambientes)'
\echo '✓ Added "roommate" to operation_type enum (for shared living)'
\echo '✓ Added "furnished" boolean column to listings table'
\echo '✓ Created optimized indexes for search performance'
\echo '✓ Created view for roommate listings with additional context'
\echo '✓ Created enhanced search function with new filters'
\echo ''

\echo 'New search capabilities:'
\echo '• Filter by furnished/unfurnished properties'
\echo '• Search specifically for roommate arrangements' 
\echo '• Find studio apartments (monoambientes)'
\echo '• Combined filters for precise results'
\echo ''

\echo 'Example usage:'
\echo '-- Find furnished studios in Miraflores:'
\echo 'SELECT * FROM core.search_listings_enhanced(''rent'', ''studio'', ''Miraflores'', NULL, NULL, NULL, true);'
\echo ''
\echo '-- Find roommate opportunities under $1000:'
\echo 'SELECT * FROM core.search_listings_enhanced(''roommate'', NULL, NULL, NULL, 1000);'
\echo ''
\echo '-- Find all furnished properties:'
\echo 'SELECT * FROM core.search_listings_enhanced(NULL, NULL, NULL, NULL, NULL, NULL, true);'

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
