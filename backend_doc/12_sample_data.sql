-- ===== Real Estate Marketplace MVP - Sample Data & Initial Setup =====
-- Default plans, amenities, and sample data for development

-- Insert default subscription plans
INSERT INTO core.plans (code, name, description, tier, period, period_months, price_amount, price_currency,
                       max_active_listings, listing_active_days, max_images_per_listing, max_videos_per_listing,
                       max_video_seconds, featured_listings, priority_support, analytics_access, api_access, is_default)
VALUES 
-- Free tier (permanent plan)
('free', 'Plan Gratuito', 'Plan básico gratuito para usuarios individuales', 'free', 'permanent', 0, 0.00, 'PEN',
 1, 30, 3, 0, 0, false, false, false, false, true),

-- Basic monthly plan
('basic-monthly', 'Plan Básico Mensual', 'Plan básico con límites ampliados', 'basic', 'monthly', 1, 29.90, 'PEN',
 5, 60, 8, 1, 120, false, false, true, false, false),

-- Premium monthly plan
('premium-monthly', 'Plan Premium Mensual', 'Plan completo para profesionales', 'premium', 'monthly', 1, 99.90, 'PEN',
 25, 90, 15, 3, 300, true, true, true, true, false),

-- Enterprise yearly plan
('enterprise-yearly', 'Plan Empresarial Anual', 'Plan para agencias y desarrolladores', 'enterprise', 'yearly', 12, 999.00, 'PEN',
 100, 365, 25, 5, 600, true, true, true, true, false)
ON CONFLICT (code) DO NOTHING;

-- Insert common amenities
INSERT INTO core.amenities (name, icon) VALUES
('Piscina', 'pool'),
('Gimnasio', 'fitness_center'),
('Ascensor', 'elevator'),
('Balcón', 'balcony'),
('Terraza', 'deck'),
('Jardín', 'local_florist'),
('Garaje', 'garage'),
('Seguridad 24h', 'security'),
('Aire Acondicionado', 'ac_unit'),
('Calefacción', 'thermostat'),
('Amoblado', 'chair'),
('Lavandería', 'local_laundry_service'),
('Internet/WiFi', 'wifi'),
('Mascotas Permitidas', 'pets'),
('Cerca al Metro', 'train'),
('Cerca a Centros Comerciales', 'shopping_mall'),
('Vista al Mar', 'waves'),
('Vista a la Ciudad', 'location_city'),
('Sala de Juegos', 'sports_esports'),
('Barbacoa/Parrilla', 'outdoor_grill')
ON CONFLICT (name) DO NOTHING;

-- Insert Peru tax rates
INSERT INTO core.tax_rates (country, region, tax_type, rate, is_active) VALUES
('PE', NULL, 'IGV', 0.18, true)
ON CONFLICT DO NOTHING;

-- =========================
-- DATOS DE PRUEBA COMPLETOS
-- =========================

-- Usuarios de prueba
DO $sample_data$
DECLARE
    user_juan UUID;
    user_maria UUID;
    user_carlos UUID;
    user_ana UUID;
    agency_inmobiliaria UUID;
    agency_propiedades UUID;
    listing_1 UUID;
    listing_2 UUID;
    listing_3 UUID;
    listing_4 UUID;
    amenity_piscina INTEGER;
    amenity_gimnasio INTEGER;
    amenity_ascensor INTEGER;
    amenity_balcon INTEGER;
    current_timestamp TIMESTAMPTZ := now();
BEGIN
    -- Insertar usuarios de prueba (usando estructura correcta con firebase_uid y roles enum)
    INSERT INTO core.users (firebase_uid, email, first_name, last_name, phone, role, is_verified, is_active)
    VALUES 
        ('firebase_juan_123', 'juan.perez@email.com', 'Juan', 'Pérez', '+51987654321', 'landlord', true, true),
        ('firebase_maria_456', 'maria.rodriguez@email.com', 'María', 'Rodríguez', '+51987654322', 'agent', true, true),
        ('firebase_carlos_789', 'carlos.lopez@email.com', 'Carlos', 'López', '+51987654323', 'landlord', true, true),
        ('firebase_ana_012', 'ana.garcia@email.com', 'Ana', 'García', '+51987654324', 'tenant', true, true)
    ON CONFLICT (email) DO NOTHING;

    -- Obtener IDs de usuarios (tanto recién insertados como existentes)
    SELECT id INTO user_juan FROM core.users WHERE email = 'juan.perez@email.com';
    SELECT id INTO user_maria FROM core.users WHERE email = 'maria.rodriguez@email.com';
    SELECT id INTO user_carlos FROM core.users WHERE email = 'carlos.lopez@email.com';
    SELECT id INTO user_ana FROM core.users WHERE email = 'ana.garcia@email.com';

    -- Insertar agencias inmobiliarias (usando estructura real sin license_number)
    -- Verificar si ya existen antes de insertar
    SELECT id INTO agency_inmobiliaria FROM core.agencies WHERE name = 'Inmobiliaria Lima Centro';
    SELECT id INTO agency_propiedades FROM core.agencies WHERE name = 'Propiedades Premium SAC';
    
    -- Insertar solo si no existen
    IF agency_inmobiliaria IS NULL THEN
        INSERT INTO core.agencies (name, description, website, email, phone, is_verified)
        VALUES ('Inmobiliaria Lima Centro', 'Especialistas en propiedades en Lima Centro', 'www.limacentro.pe', 'contacto@limacentro.pe', '+5114567890', true)
        RETURNING id INTO agency_inmobiliaria;
    END IF;
    
    IF agency_propiedades IS NULL THEN
        INSERT INTO core.agencies (name, description, website, email, phone, is_verified)
        VALUES ('Propiedades Premium SAC', 'Propiedades de alto valor en distritos exclusivos', 'www.premium.pe', 'ventas@premium.pe', '+5114567891', true)
        RETURNING id INTO agency_propiedades;
    END IF;

    -- Verificar que se obtuvieron los IDs
    IF agency_inmobiliaria IS NULL THEN
        SELECT id INTO agency_inmobiliaria FROM core.agencies WHERE name = 'Inmobiliaria Lima Centro';
    END IF;
    IF agency_propiedades IS NULL THEN
        SELECT id INTO agency_propiedades FROM core.agencies WHERE name = 'Propiedades Premium SAC';
    END IF;

    -- Asociar usuarios con agencias
    INSERT INTO core.user_agency (user_id, agency_id) VALUES
        (user_maria, agency_inmobiliaria),
        (user_carlos, agency_propiedades)
    ON CONFLICT DO NOTHING;

    -- Obtener IDs de amenidades
    SELECT id INTO amenity_piscina FROM core.amenities WHERE name = 'Piscina';
    SELECT id INTO amenity_gimnasio FROM core.amenities WHERE name = 'Gimnasio';
    SELECT id INTO amenity_ascensor FROM core.amenities WHERE name = 'Ascensor';
    SELECT id INTO amenity_balcon FROM core.amenities WHERE name = 'Balcón';

    -- Insertar propiedades de prueba (con created_at específico para particionado)
    INSERT INTO core.listings (
        id, created_at, owner_user_id, agency_id, status, operation, property_type,
        title, description, price, currency, bedrooms, bathrooms, parking_spots,
        area_built, age_years, address, district, province, country,
        latitude, longitude, verification_status, published_at, published_until, rental_term, furnished
    ) VALUES 
        (gen_random_uuid(), current_timestamp, user_juan, agency_inmobiliaria, 'published', 'sale', 'apartment',
         'Moderno Departamento en San Isidro', 
         'Hermoso departamento de 3 dormitorios en el corazón de San Isidro. Cuenta con acabados de primera, balcón con vista panorámica y todas las comodidades modernas.',
         450000.00, 'PEN', 3, 2, 2, 120.5, 7,
         'Av. Javier Prado Este 1234, San Isidro', 'San Isidro', 'Lima', 'Perú',
         -12.0951, -77.0364, 'verified', current_timestamp, current_timestamp + interval '90 days', NULL, false),
         
        (gen_random_uuid(), current_timestamp, user_maria, agency_inmobiliaria, 'published', 'rent', 'house',
         'Casa Familiar en La Molina - Amoblada',
         'Amplia casa de 4 dormitorios en condominio privado. Ideal para familias. Incluye jardín, garaje para 2 autos y área de parrilla. Completamente amoblada.',
         2800.00, 'PEN', 4, 3, 2, 180.0, 10,
         'Calle Los Rosales 567, La Molina', 'La Molina', 'Lima', 'Perú',
         -12.0746, -76.9574, 'verified', current_timestamp, current_timestamp + interval '60 days', 'monthly', true),
         
        (gen_random_uuid(), current_timestamp, user_carlos, agency_propiedades, 'published', 'rent', 'studio',
         'Monoambiente Moderno en Barranco - Totalmente Amoblado',
         'Exclusivo monoambiente totalmente amoblado en el bohemio distrito de Barranco. Perfecto para profesionales jóvenes. Incluye todos los muebles y electrodomésticos.',
         1200.00, 'PEN', 0, 1, 0, 35.0, 3,
         'Malecón Grau 890, Barranco', 'Barranco', 'Lima', 'Perú',
         -12.1467, -77.0208, 'verified', current_timestamp, current_timestamp + interval '90 days', 'monthly', true),
         
        (gen_random_uuid(), current_timestamp, user_juan, NULL, 'published', 'sale', 'apartment',
         'Loft Moderno en Miraflores',
         'Departamento de 2 dormitorios ubicado en zona privilegiada de Miraflores. Ideal para inversión o residencia. Se vende sin muebles.',
         380000.00, 'PEN', 2, 2, 1, 85.0, 9,
         'Av. Larco 1567, Miraflores', 'Miraflores', 'Lima', 'Perú',
         -12.1267, -77.0297, 'verified', current_timestamp, current_timestamp + interval '90 days', NULL, false),
         
        (gen_random_uuid(), current_timestamp, user_maria, agency_inmobiliaria, 'published', 'roommate', 'apartment',
         'Cuarto en Departamento Compartido - San Isidro',
         'Habitación individual en departamento compartido con 2 profesionales. Incluye baño privado, cocina y sala común. Ambiente tranquilo y seguro.',
         800.00, 'PEN', 1, 1, 0, 20.0, 5,
         'Av. República de Panamá 3456, San Isidro', 'San Isidro', 'Lima', 'Perú',
         -12.0951, -77.0364, 'verified', current_timestamp, current_timestamp + interval '90 days', 'monthly', true),
         
        (gen_random_uuid(), current_timestamp, user_carlos, NULL, 'published', 'roommate', 'house',
         'Cuarto en Casa Compartida - Surco',
         'Habitación amplia en casa de 3 pisos. Comparte con 2 roommates más. Incluye servicios, internet y limpieza común. Zona residencial muy tranquila.',
         650.00, 'PEN', 1, 1, 0, 18.0, 8,
         'Calle Las Begonias 789, Surco', 'Surco', 'Lima', 'Perú',
         -12.1358, -76.9947, 'verified', current_timestamp, current_timestamp + interval '60 days', 'monthly', false);

    -- Obtener IDs de listings recién insertados
    SELECT id INTO listing_1 FROM core.listings WHERE title = 'Moderno Departamento en San Isidro' AND created_at >= current_timestamp - interval '1 minute' LIMIT 1;
    SELECT id INTO listing_2 FROM core.listings WHERE title = 'Casa Familiar en La Molina' AND created_at >= current_timestamp - interval '1 minute' LIMIT 1;
    SELECT id INTO listing_3 FROM core.listings WHERE title = 'Loft Moderno en Barranco' AND created_at >= current_timestamp - interval '1 minute' LIMIT 1;
    SELECT id INTO listing_4 FROM core.listings WHERE title = 'Departamento en Miraflores - En Proceso' AND created_at >= current_timestamp - interval '1 minute' LIMIT 1;

    -- Insertar imágenes de ejemplo (usando FK compuesta)
    INSERT INTO core.images (listing_id, listing_created_at, filename, original_url, alt_text, display_order, is_main)
    SELECT l.id, l.created_at,
           'image_' || l.id || '_' || gs.i || '.jpg',
           'https://example.com/images/' || l.id || '_' || gs.i || '.jpg',
           'Vista ' || gs.i || ' de ' || l.title,
           gs.i,
           gs.i = 1
    FROM core.listings l, generate_series(1, 3) gs(i)
    WHERE l.status = 'published'
    ON CONFLICT DO NOTHING;

    -- Insertar videos de ejemplo (usando FK compuesta)
    INSERT INTO core.videos (listing_id, listing_created_at, filename, original_url, duration_seconds, display_order)
    SELECT l.id, l.created_at,
           'video_' || l.id || '_tour.mp4',
           'https://example.com/videos/' || l.id || '_tour.mp4',
           180,
           1
    FROM core.listings l
    WHERE l.status = 'published' AND l.title LIKE '%Departamento%'
    ON CONFLICT DO NOTHING;

    -- Asociar amenidades con propiedades (usando FK compuesta)
    INSERT INTO core.listing_amenities (listing_id, listing_created_at, amenity_id)
    SELECT l.id, l.created_at, a.id
    FROM core.listings l, core.amenities a
    WHERE l.status = 'published' 
    AND a.name IN ('Ascensor', 'Seguridad 24h', 'Internet/WiFi')
    ON CONFLICT DO NOTHING;

    -- Agregar amenidades específicas por propiedad
    IF listing_1 IS NOT NULL THEN
        INSERT INTO core.listing_amenities (listing_id, listing_created_at, amenity_id)
        SELECT listing_1, current_timestamp, id FROM core.amenities 
        WHERE name IN ('Piscina', 'Gimnasio', 'Balcón')
        ON CONFLICT DO NOTHING;
    END IF;

    IF listing_2 IS NOT NULL THEN
        INSERT INTO core.listing_amenities (listing_id, listing_created_at, amenity_id)
        SELECT listing_2, current_timestamp, id FROM core.amenities 
        WHERE name IN ('Jardín', 'Garaje', 'Barbacoa/Parrilla')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Insertar algunas consultas/leads de ejemplo (usando FK compuesta)
    INSERT INTO core.leads (listing_id, listing_created_at, user_id, contact_name, contact_phone, contact_email, message, utm_source)
    SELECT l.id, l.created_at, user_ana, 'Ana García', '+51987654324', 'ana.garcia@email.com', 
           'Me interesa mucho esta propiedad. ¿Podríamos coordinar una visita?', 'google'
    FROM core.listings l
    WHERE l.status = 'published'
    LIMIT 2
    ON CONFLICT DO NOTHING;

    -- Insertar favoritos (usando FK compuesta)
    INSERT INTO core.favorites (user_id, listing_id, listing_created_at)
    SELECT user_ana, l.id, l.created_at
    FROM core.listings l
    WHERE l.status = 'published'
    ON CONFLICT DO NOTHING;

    -- Insertar eventos de analytics (usando FK compuesta)
    INSERT INTO analytics.events (user_id, session_id, event_type, listing_id, listing_created_at, properties, ip_address)
    SELECT user_ana, 'session_' || gen_random_uuid()::text, 'listing_view', 
           l.id, l.created_at, '{"source": "search", "device": "mobile"}'::jsonb, '192.168.1.100'::inet
    FROM core.listings l
    WHERE l.status = 'published'
    ON CONFLICT DO NOTHING;

    -- Insertar subscripciones de ejemplo
    INSERT INTO core.subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
    SELECT user_juan, p.id, 'active', current_timestamp, current_timestamp + interval '1 month'
    FROM core.plans p WHERE p.code = 'basic-monthly'
    ON CONFLICT DO NOTHING;

    INSERT INTO core.subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
    SELECT user_carlos, p.id, 'active', current_timestamp, current_timestamp + interval '1 month'
    FROM core.plans p WHERE p.code = 'premium-monthly'
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Datos de prueba insertados exitosamente';
    RAISE NOTICE 'Usuarios: Juan (%), María (%), Carlos (%), Ana (%)', user_juan, user_maria, user_carlos, user_ana;
    RAISE NOTICE 'Agencias: Inmobiliaria (%), Premium (%)', agency_inmobiliaria, agency_propiedades;
    RAISE NOTICE 'Propiedades publicadas: %, %, %', listing_1, listing_2, listing_3;

END $sample_data$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS listings_title_trgm_idx ON core.listings USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS listings_district_trgm_idx ON core.listings USING gin(district gin_trgm_ops);

-- Refresh analytics views
SELECT analytics.refresh_all_mvs();

-- Initial maintenance
SELECT core.create_monthly_partitions();
