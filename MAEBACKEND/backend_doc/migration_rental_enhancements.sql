-- ===== Master migration script for rental_model and studio property type =====
-- Run this script to safely add both enhancements to your database

\echo '=========================================='
\echo 'Adding studio to property_type and rental_model enum'
\echo '=========================================='

\echo ''
\echo '1. Adding studio to property_type enum...'
\i add_studio_property_type.sql

\echo ''
\echo '2. Adding rental_model enum and column...'
\i add_rental_model_column.sql

\echo ''
\echo '=========================================='
\echo 'Migration completed successfully!'
\echo '=========================================='

\echo ''
\echo 'Summary of changes:'
\echo '- Added "studio" to property_type enum (for monoambientes)'
\echo '- Created rental_model enum with values: traditional, airbnb, corporate, student'
\echo '- Added rental_model column to listings table with default value "traditional"'
\echo '- Created index on rental_model column for better search performance'
\echo ''

-- Show final enum states
\echo 'Property Types available:'
SELECT enumlabel as property_types 
FROM pg_enum e 
JOIN pg_type t ON e.enumtypid = t.oid 
WHERE t.typname = 'property_type' 
ORDER BY e.enumsortorder;

\echo ''
\echo 'Rental Models available:'
SELECT enumlabel as rental_models
FROM pg_enum e 
JOIN pg_type t ON e.enumtypid = t.oid 
WHERE t.typname = 'rental_model' 
ORDER BY e.enumsortorder;
