-- ===== Add room option to property_type enum =====
-- Migration script to add 'room' to existing property_type enum

BEGIN;

-- Add 'room' to property_type enum if it doesn't exist
DO $add_room$
BEGIN
    -- Check if 'room' value already exists in property_type enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'property_type' AND e.enumlabel = 'room'
    ) THEN
        -- Add 'room' before 'other' in the enum
        ALTER TYPE core.property_type ADD VALUE 'room' BEFORE 'other';
        RAISE NOTICE 'Added room to property_type enum';
    ELSE
        RAISE NOTICE 'room already exists in property_type enum';
    END IF;
    
    EXCEPTION 
        WHEN duplicate_object THEN 
            RAISE NOTICE 'room already exists in property_type enum (duplicate object)';
        WHEN OTHERS THEN 
            RAISE EXCEPTION 'Error adding room to property_type: %', SQLERRM;
END $add_room$;

COMMIT;

-- Show all property type options after the addition
SELECT enumlabel as property_type_options 
FROM pg_enum e 
JOIN pg_type t ON e.enumtypid = t.oid 
WHERE t.typname = 'property_type' 
ORDER BY e.enumsortorder;
