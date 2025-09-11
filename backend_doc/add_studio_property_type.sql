-- ===== Add studio option to property_type enum =====
-- Migration script to add 'studio' (monoambiente) to existing property_type enum

BEGIN;

-- Add 'studio' to property_type enum if it doesn't exist
DO $add_studio$
BEGIN
    -- Check if 'studio' value already exists in property_type enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'property_type' AND e.enumlabel = 'studio'
    ) THEN
        -- Add 'studio' before 'apartment' in the enum
        ALTER TYPE core.property_type ADD VALUE 'studio' BEFORE 'apartment';
        RAISE NOTICE 'Added studio to property_type enum';
    ELSE
        RAISE NOTICE 'studio already exists in property_type enum';
    END IF;
    
    EXCEPTION 
        WHEN duplicate_object THEN 
            RAISE NOTICE 'studio already exists in property_type enum (duplicate object)';
        WHEN OTHERS THEN 
            RAISE EXCEPTION 'Error adding studio to property_type: %', SQLERRM;
END $add_studio$;

COMMIT;

-- Show all property type options
SELECT enumlabel as property_type_options 
FROM pg_enum e 
JOIN pg_type t ON e.enumtypid = t.oid 
WHERE t.typname = 'property_type' 
ORDER BY e.enumsortorder;
