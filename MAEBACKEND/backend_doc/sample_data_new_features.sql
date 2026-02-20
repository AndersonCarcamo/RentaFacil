-- ===== Additional sample data for Studio, Furnished, and Roommate features =====
-- Examples showcasing the new functionality

-- Insert sample data demonstrating new features
DO $sample_new_features$
DECLARE
    user_sample UUID;
    current_timestamp TIMESTAMPTZ := now();
BEGIN
    -- Get a sample user (or create one if needed)
    SELECT id INTO user_sample FROM core.users LIMIT 1;
    
    IF user_sample IS NULL THEN
        INSERT INTO core.users (firebase_uid, email, first_name, last_name, phone, role, is_verified, is_active)
        VALUES ('firebase_demo_123', 'demo@example.com', 'Demo', 'User', '+51999999999', 'landlord', true, true)
        RETURNING id INTO user_sample;
    END IF;

    -- Insert sample listings showcasing new features
    INSERT INTO core.listings (
        id, created_at, owner_user_id, status, operation, property_type,
        title, description, price, currency, bedrooms, bathrooms,
        area_built, address, district, province, country,
        verification_status, published_at, published_until, rental_term, furnished
    ) VALUES 
    
    -- Studio apartments (monoambientes)
    (gen_random_uuid(), current_timestamp, user_sample, 'published', 'rent', 'studio',
     'Monoambiente Amoblado en Miraflores', 
     'Cómodo monoambiente totalmente amoblado. Incluye cama, escritorio, cocina equipada y todo lo necesario para mudarse inmediatamente.',
     1400.00, 'PEN', 0, 1, 32.0, 
     'Av. Pardo 456, Miraflores', 'Miraflores', 'Lima', 'Perú',
     'verified', current_timestamp, current_timestamp + interval '60 days', 'monthly', true),
     
    (gen_random_uuid(), current_timestamp, user_sample, 'published', 'sale', 'studio',
     'Monoambiente para Inversión - Sin Muebles', 
     'Excelente monoambiente para inversión. Se vende sin muebles. Ideal para alquiler o uso personal.',
     180000.00, 'PEN', 0, 1, 28.0,
     'Calle Schell 789, Miraflores', 'Miraflores', 'Lima', 'Perú',
     'verified', current_timestamp, current_timestamp + interval '90 days', NULL, false),
    
    -- Roommate opportunities 
    (gen_random_uuid(), current_timestamp, user_sample, 'published', 'roommate', 'apartment',
     'Habitación en Depa de 3 Cuartos - Profesionales', 
     'Se busca roommate profesional para compartir departamento amplio. Habitación privada con baño compartido. Ambiente tranquilo y limpio.',
     950.00, 'PEN', 1, 1, 25.0,
     'Av. Arequipa 1234, Lince', 'Lince', 'Lima', 'Perú',
     'verified', current_timestamp, current_timestamp + interval '30 days', 'monthly', true),
     
    (gen_random_uuid(), current_timestamp, user_sample, 'published', 'roommate', 'house',
     'Cuarto en Casa Compartida - Estudiantes Bienvenidos', 
     'Habitación disponible en casa de 2 pisos. Perfecto para estudiantes o jóvenes profesionales. Incluye internet y servicios básicos.',
     600.00, 'PEN', 1, 1, 20.0,
     'Calle Los Olivos 567, Pueblo Libre', 'Pueblo Libre', 'Lima', 'Perú',
     'verified', current_timestamp, current_timestamp + interval '45 days', 'monthly', false),
     
    -- Furnished vs unfurnished examples
    (gen_random_uuid(), current_timestamp, user_sample, 'published', 'rent', 'apartment',
     'Departamento Completamente Amoblado - Executive', 
     'Departamento de lujo completamente amoblado. Incluye todos los muebles, electrodomésticos y menaje. Listo para mudarse.',
     3500.00, 'PEN', 2, 2, 90.0,
     'Av. El Golf 890, San Isidro', 'San Isidro', 'Lima', 'Perú',
     'verified', current_timestamp, current_timestamp + interval '60 days', 'monthly', true),
     
    (gen_random_uuid(), current_timestamp, user_sample, 'published', 'rent', 'apartment',
     'Departamento Sin Muebles - Trae tu Estilo', 
     'Hermoso departamento de 2 dormitorios completamente vacío. Perfecto para personalizar con tu propio estilo y muebles.',
     2200.00, 'PEN', 2, 2, 85.0,
     'Calle Coronel Portillo 345, San Isidro', 'San Isidro', 'Lima', 'Perú',
     'verified', current_timestamp, current_timestamp + interval '75 days', 'monthly', false)
     
    ON CONFLICT (id, created_at) DO NOTHING;

    RAISE NOTICE 'Sample data inserted successfully for new features';

END $sample_new_features$;

-- Show examples of different search combinations
\echo ''
\echo 'Example search queries for new features:'
\echo ''

-- Find all studios
\echo '-- All studio apartments:'
SELECT id, title, operation, price, furnished 
FROM core.listings 
WHERE property_type = 'studio' AND status = 'published'
LIMIT 5;

\echo ''
\echo '-- Roommate opportunities:'
SELECT id, title, price, district, furnished 
FROM core.listings 
WHERE operation = 'roommate' AND status = 'published'
LIMIT 5;

\echo ''
\echo '-- Furnished properties under $2000:'
SELECT id, title, operation, property_type, price 
FROM core.listings 
WHERE furnished = true AND price < 2000 AND status = 'published'
ORDER BY price
LIMIT 5;

\echo ''
\echo '-- Unfurnished properties (blank canvas):'
SELECT id, title, operation, property_type, price 
FROM core.listings 
WHERE furnished = false AND operation IN ('rent', 'sale') AND status = 'published'
ORDER BY price
LIMIT 5;
