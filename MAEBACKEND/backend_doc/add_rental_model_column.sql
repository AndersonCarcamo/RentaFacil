-- ===== Add rental_model column to listings table =====
-- Migration script to add the new rental_model enum and column

BEGIN;

-- First, create the rental_model enum if it doesn't exist
DO $enum_creation$
BEGIN
    -- Create rental_model enum if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rental_model') THEN
        CREATE TYPE core.rental_model AS ENUM ('traditional','airbnb','student');
        RAISE NOTICE 'Created rental_model enum type';
    ELSE
        RAISE NOTICE 'rental_model enum type already exists';
    END IF;
END $enum_creation$;

-- Add the rental_model column to listings table
-- Note: For partitioned tables, we need to add the column to the main table
DO $column_addition$
BEGIN
    -- Check if rental_model column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'core' 
                   AND table_name = 'listings' 
                   AND column_name = 'rental_model') THEN
        
        -- Add the column with default value
        ALTER TABLE core.listings ADD COLUMN rental_model core.rental_model DEFAULT 'traditional';
        
        -- Create index for better performance
        CREATE INDEX listings_rental_model_idx ON core.listings(rental_model, operation, property_type);
        
        RAISE NOTICE 'Added rental_model column to listings table';
        RAISE NOTICE 'Created index on rental_model column';
    ELSE
        RAISE NOTICE 'rental_model column already exists in listings table';
    END IF;
END $column_addition$;

-- Update existing records if needed (optional - all will default to 'traditional')
-- UPDATE core.listings 
-- SET rental_model = 'airbnb' 
-- WHERE rental_term = 'daily' OR rental_term = 'weekly';

COMMIT;

-- Show the enum values
SELECT enumlabel as rental_model_options 
FROM pg_enum e 
JOIN pg_type t ON e.enumtypid = t.oid 
WHERE t.typname = 'rental_model' 
ORDER BY e.enumsortorder;
