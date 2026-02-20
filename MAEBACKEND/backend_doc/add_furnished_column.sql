-- ===== Add furnished column to existing listings table =====
-- Migration script to add furnished boolean field to existing database

BEGIN;

-- Add furnished column to listings table if it doesn't exist
DO $add_furnished_column$
BEGIN
    -- Check if furnished column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'core' 
                   AND table_name = 'listings' 
                   AND column_name = 'furnished') THEN
        
        -- Add the column with default value
        ALTER TABLE core.listings ADD COLUMN furnished BOOLEAN DEFAULT FALSE;
        
        -- Create index for better performance on furnished searches
        CREATE INDEX listings_furnished_operation_idx ON core.listings(furnished, operation, property_type)
        WHERE status = 'published';
        
        -- Create additional index for room + furnished combinations (using new rental_mode approach)
        CREATE INDEX listings_room_furnished_idx ON core.listings(property_type, furnished, district, price)
        WHERE property_type = 'room' AND status = 'published';
        
        RAISE NOTICE 'Added furnished column to listings table';
        RAISE NOTICE 'Created indexes on furnished column';
    ELSE
        RAISE NOTICE 'furnished column already exists in listings table';
    END IF;
END $add_furnished_column$;

-- Optional: Update existing records based on amenities (if you have "Amoblado" amenity)
-- This is commented out - uncomment and adjust if you want to auto-populate based on existing data
/*
UPDATE core.listings 
SET furnished = true 
WHERE EXISTS (
    SELECT 1 FROM core.listing_amenities la 
    JOIN core.amenities a ON la.amenity_id = a.id 
    WHERE la.listing_id = core.listings.id 
    AND la.listing_created_at = core.listings.created_at
    AND a.name = 'Amoblado'
);
*/

COMMIT;

-- Show some statistics
SELECT 
    operation,
    property_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE furnished = true) as furnished_count,
    COUNT(*) FILTER (WHERE furnished = false) as unfurnished_count
FROM core.listings 
WHERE status = 'published'
GROUP BY operation, property_type
ORDER BY operation, property_type;
