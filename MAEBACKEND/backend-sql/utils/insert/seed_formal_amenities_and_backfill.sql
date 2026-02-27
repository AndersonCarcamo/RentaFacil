-- =====================================================
-- Seed formal de amenidades + backfill desde core.listings
-- =====================================================
-- Objetivo:
-- 1) Crear catálogo formal de amenidades para búsqueda/filtros.
-- 2) Mapear campos no mapeados de listings hacia listing_amenities.

BEGIN;

-- 1) Catálogo final recomendado (sin tildes para mejorar matching por texto)
INSERT INTO core.amenities (name, icon) VALUES
    ('Piscina', 'pool'),
    ('Gimnasio', 'fitness_center'),
    ('Ascensor', 'elevator'),
    ('Balcon', 'balcony'),
    ('Terraza', 'deck'),
    ('Jardin', 'local_florist'),
    ('Garaje', 'garage'),
    ('Seguridad 24h', 'security'),
    ('Aire acondicionado', 'ac_unit'),
    ('Calefaccion', 'thermostat'),
    ('Lavanderia', 'local_laundry_service'),
    ('Internet/WiFi', 'wifi'),
    ('Amoblado', 'chair'),
    ('Mascotas permitidas', 'pets'),
    ('Servicios incluidos', 'dry_cleaning'),
    ('Limpieza incluida', 'cleaning_services'),
    ('No fumadores', 'smoke_free'),
    ('Deposito requerido', 'vpn_key'),
    ('Cocina equipada', 'kitchen'),
    ('TV cable/streaming', 'tv'),
    ('Ropa de cama incluida', 'bed')
ON CONFLICT (name) DO NOTHING;

-- 2) Backfill desde campos de core.listings hacia core.listing_amenities
--    (evita duplicados por PK compuesta con ON CONFLICT DO NOTHING)

-- Amoblado
INSERT INTO core.listing_amenities (listing_id, listing_created_at, amenity_id)
SELECT l.id, l.created_at, a.id
FROM core.listings l
JOIN core.amenities a ON a.name = 'Amoblado'
WHERE l.furnished = TRUE
ON CONFLICT DO NOTHING;

-- Mascotas permitidas
INSERT INTO core.listing_amenities (listing_id, listing_created_at, amenity_id)
SELECT l.id, l.created_at, a.id
FROM core.listings l
JOIN core.amenities a ON a.name = 'Mascotas permitidas'
WHERE l.pet_friendly = TRUE
ON CONFLICT DO NOTHING;

-- Servicios incluidos
INSERT INTO core.listing_amenities (listing_id, listing_created_at, amenity_id)
SELECT l.id, l.created_at, a.id
FROM core.listings l
JOIN core.amenities a ON a.name = 'Servicios incluidos'
WHERE l.utilities_included = TRUE
ON CONFLICT DO NOTHING;

-- Internet incluido como amenidad formal existente en filtros
INSERT INTO core.listing_amenities (listing_id, listing_created_at, amenity_id)
SELECT l.id, l.created_at, a.id
FROM core.listings l
JOIN core.amenities a ON a.name = 'Internet/WiFi'
WHERE l.internet_included = TRUE
ON CONFLICT DO NOTHING;

-- Limpieza incluida
INSERT INTO core.listing_amenities (listing_id, listing_created_at, amenity_id)
SELECT l.id, l.created_at, a.id
FROM core.listings l
JOIN core.amenities a ON a.name = 'Limpieza incluida'
WHERE l.cleaning_included = TRUE
ON CONFLICT DO NOTHING;

-- No fumadores (solo cuando está definido y es FALSE)
INSERT INTO core.listing_amenities (listing_id, listing_created_at, amenity_id)
SELECT l.id, l.created_at, a.id
FROM core.listings l
JOIN core.amenities a ON a.name = 'No fumadores'
WHERE l.smoking_allowed IS FALSE
ON CONFLICT DO NOTHING;

-- Deposito requerido
INSERT INTO core.listing_amenities (listing_id, listing_created_at, amenity_id)
SELECT l.id, l.created_at, a.id
FROM core.listings l
JOIN core.amenities a ON a.name = 'Deposito requerido'
WHERE l.deposit_required = TRUE
ON CONFLICT DO NOTHING;

-- Garaje desde cantidad de estacionamientos
INSERT INTO core.listing_amenities (listing_id, listing_created_at, amenity_id)
SELECT l.id, l.created_at, a.id
FROM core.listings l
JOIN core.amenities a ON a.name = 'Garaje'
WHERE COALESCE(l.parking_spots, 0) > 0
ON CONFLICT DO NOTHING;

COMMIT;

-- Verificación rápida
-- SELECT id, name, icon FROM core.amenities ORDER BY name;
-- SELECT a.name, COUNT(*) FROM core.listing_amenities la
-- JOIN core.amenities a ON a.id = la.amenity_id
-- GROUP BY a.name ORDER BY COUNT(*) DESC;
