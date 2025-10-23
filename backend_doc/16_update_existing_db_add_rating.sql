-- ===== Actualización de Base de Datos Existente: Sistema de Rating =====
-- Este script actualiza una base de datos ya existente para agregar el sistema de rating
-- Ejecutar este script en el servidor de producción/desarrollo ya configurado

BEGIN;

-- 1. Agregar columnas de rating a la tabla listings existente
DO $$
BEGIN
    -- Agregar columna rating si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'rating'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN rating NUMERIC(3,2) CHECK (rating >= 0 AND rating <= 5);
        RAISE NOTICE 'Columna rating agregada a core.listings';
    ELSE
        RAISE NOTICE 'Columna rating ya existe en core.listings';
    END IF;

    -- Agregar columna total_reviews si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'total_reviews'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN total_reviews INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Columna total_reviews agregada a core.listings';
    ELSE
        RAISE NOTICE 'Columna total_reviews ya existe en core.listings';
    END IF;
END $$;

-- Agregar comentarios
COMMENT ON COLUMN core.listings.rating IS 'Calificación promedio de la propiedad (0.00 - 5.00), calculado automáticamente desde las reseñas';
COMMENT ON COLUMN core.listings.total_reviews IS 'Número total de reseñas/comentarios de la propiedad';

-- 2. Crear tabla de reseñas si no existe
CREATE TABLE IF NOT EXISTS core.reviews (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id              UUID NOT NULL,
    listing_created_at      TIMESTAMPTZ NOT NULL,
    
    -- Información del revisor
    reviewer_user_id        UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    reviewer_name           TEXT,
    reviewer_avatar_url     TEXT,
    
    -- Rating y contenido
    rating                  NUMERIC(3,2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    title                   TEXT,
    comment                 TEXT NOT NULL,
    
    -- Ratings por categoría (opcional, útil para Airbnb)
    rating_cleanliness      NUMERIC(3,2) CHECK (rating_cleanliness >= 0 AND rating_cleanliness <= 5),
    rating_communication    NUMERIC(3,2) CHECK (rating_communication >= 0 AND rating_communication <= 5),
    rating_location         NUMERIC(3,2) CHECK (rating_location >= 0 AND rating_location <= 5),
    rating_value            NUMERIC(3,2) CHECK (rating_value >= 0 AND rating_value <= 5),
    
    -- Verificación y estado
    is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    is_public               BOOLEAN NOT NULL DEFAULT TRUE,
    is_reported             BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Respuesta del propietario
    owner_response          TEXT,
    owner_response_at       TIMESTAMPTZ,
    
    -- Timestamps
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Foreign key a la tabla particionada
    CONSTRAINT reviews_listing_fk FOREIGN KEY (listing_id, listing_created_at) 
        REFERENCES core.listings(id, created_at) ON DELETE CASCADE,
    
    -- Un usuario solo puede hacer una reseña por propiedad
    CONSTRAINT reviews_user_listing_unique UNIQUE (reviewer_user_id, listing_id)
);

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS reviews_listing_idx ON core.reviews(listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_reviewer_idx ON core.reviews(reviewer_user_id);
CREATE INDEX IF NOT EXISTS reviews_rating_idx ON core.reviews(rating, is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS reviews_verified_idx ON core.reviews(listing_id, is_verified) WHERE is_verified = true;

-- 3. Crear o reemplazar función para actualizar rating
CREATE OR REPLACE FUNCTION core.update_listing_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $update_rating$
DECLARE
    avg_rating NUMERIC(3,2);
    review_count INTEGER;
BEGIN
    -- Calcular el promedio de ratings públicos
    SELECT 
        ROUND(AVG(rating)::numeric, 2),
        COUNT(*)
    INTO avg_rating, review_count
    FROM core.reviews
    WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id)
      AND is_public = true;
    
    -- Actualizar el listing
    UPDATE core.listings
    SET rating = avg_rating,
        total_reviews = review_count,
        updated_at = now()
    WHERE id = COALESCE(NEW.listing_id, OLD.listing_id);
    
    RETURN COALESCE(NEW, OLD);
END $update_rating$;

-- Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS trigger_update_listing_rating_insert ON core.reviews;
DROP TRIGGER IF EXISTS trigger_update_listing_rating_update ON core.reviews;
DROP TRIGGER IF EXISTS trigger_update_listing_rating_delete ON core.reviews;

-- Crear triggers
CREATE TRIGGER trigger_update_listing_rating_insert
AFTER INSERT ON core.reviews
FOR EACH ROW
EXECUTE FUNCTION core.update_listing_rating();

CREATE TRIGGER trigger_update_listing_rating_update
AFTER UPDATE OF rating, is_public ON core.reviews
FOR EACH ROW
EXECUTE FUNCTION core.update_listing_rating();

CREATE TRIGGER trigger_update_listing_rating_delete
AFTER DELETE ON core.reviews
FOR EACH ROW
EXECUTE FUNCTION core.update_listing_rating();

-- 4. Crear o reemplazar vista de reviews públicos
CREATE OR REPLACE VIEW core.v_public_reviews AS
SELECT 
    r.id,
    r.listing_id,
    r.rating,
    r.title,
    r.comment,
    r.rating_cleanliness,
    r.rating_communication,
    r.rating_location,
    r.rating_value,
    r.is_verified,
    r.reviewer_name,
    r.reviewer_avatar_url,
    r.owner_response,
    r.owner_response_at,
    r.created_at,
    l.title as listing_title,
    l.property_type,
    l.district,
    u.first_name || ' ' || u.last_name as reviewer_full_name
FROM core.reviews r
JOIN core.listings l ON l.id = r.listing_id AND l.created_at = r.listing_created_at
LEFT JOIN core.users u ON u.id = r.reviewer_user_id
WHERE r.is_public = true
  AND r.is_reported = false;

-- 5. Crear o reemplazar función para estadísticas
CREATE OR REPLACE FUNCTION core.get_listing_review_stats(p_listing_id UUID)
RETURNS JSON LANGUAGE plpgsql AS $review_stats$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_reviews', COUNT(*),
        'average_rating', ROUND(AVG(rating)::numeric, 2),
        'verified_reviews', COUNT(*) FILTER (WHERE is_verified = true),
        'rating_distribution', json_build_object(
            '5_stars', COUNT(*) FILTER (WHERE rating >= 4.5),
            '4_stars', COUNT(*) FILTER (WHERE rating >= 3.5 AND rating < 4.5),
            '3_stars', COUNT(*) FILTER (WHERE rating >= 2.5 AND rating < 3.5),
            '2_stars', COUNT(*) FILTER (WHERE rating >= 1.5 AND rating < 2.5),
            '1_star', COUNT(*) FILTER (WHERE rating < 1.5)
        ),
        'category_ratings', json_build_object(
            'cleanliness', ROUND(AVG(rating_cleanliness)::numeric, 2),
            'communication', ROUND(AVG(rating_communication)::numeric, 2),
            'location', ROUND(AVG(rating_location)::numeric, 2),
            'value', ROUND(AVG(rating_value)::numeric, 2)
        )
    ) INTO result
    FROM core.reviews
    WHERE listing_id = p_listing_id
      AND is_public = true;
    
    RETURN result;
END $review_stats$;

-- 6. Recrear vista v_listings_airbnb_analysis con rating
DROP VIEW IF EXISTS core.v_listings_airbnb_analysis CASCADE;
CREATE VIEW core.v_listings_airbnb_analysis AS
SELECT l.*,
       core.get_rental_style_optimized(l.id, l.created_at) as rental_style,
       CASE 
           WHEN l.furnished = true AND 
                l.rental_term IN ('daily', 'weekly') AND 
                EXISTS(SELECT 1 FROM core.listing_amenities la 
                       JOIN core.amenities a ON la.amenity_id = a.id 
                       WHERE la.listing_id = l.id 
                       AND la.listing_created_at = l.created_at
                       AND a.name IN ('Amoblado', 'Internet/WiFi', 'Limpieza incluida')
                       HAVING COUNT(*) >= 2)
           THEN true 
           ELSE false 
       END as can_be_airbnb_quick
FROM core.listings l;

COMMIT;

-- Verificar que todo se creó correctamente
DO $$
DECLARE
    rating_exists BOOLEAN;
    reviews_exists BOOLEAN;
    view_exists BOOLEAN;
BEGIN
    -- Verificar columna rating
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'rating'
    ) INTO rating_exists;
    
    -- Verificar tabla reviews
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'core' 
        AND table_name = 'reviews'
    ) INTO reviews_exists;
    
    -- Verificar vista
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'core' 
        AND table_name = 'v_public_reviews'
    ) INTO view_exists;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verificación de actualización:';
    RAISE NOTICE '- Columna rating en listings: %', CASE WHEN rating_exists THEN '✓ OK' ELSE '✗ FALTA' END;
    RAISE NOTICE '- Tabla reviews: %', CASE WHEN reviews_exists THEN '✓ OK' ELSE '✗ FALTA' END;
    RAISE NOTICE '- Vista v_public_reviews: %', CASE WHEN view_exists THEN '✓ OK' ELSE '✗ FALTA' END;
    RAISE NOTICE '========================================';
END $$;

-- Comentarios finales
COMMENT ON TABLE core.reviews IS 'Reseñas y calificaciones de propiedades, especialmente útil para propiedades tipo Airbnb';
COMMENT ON FUNCTION core.update_listing_rating() IS 'Función trigger que actualiza automáticamente el rating promedio y total de reviews de un listing';
COMMENT ON FUNCTION core.get_listing_review_stats(UUID) IS 'Obtiene estadísticas detalladas de reviews de un listing específico';
COMMENT ON VIEW core.v_public_reviews IS 'Vista de reviews públicos con información adicional del listing y revisor';
