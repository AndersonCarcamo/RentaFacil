-- ===== Actualización de Base de Datos Existente: Sistema de Rating =====
-- Este script actualiza una base de datos ya existente para agregar el sistema de rating
-- Ejecutar este script en el servidor de producción/desarrollo ya configurado

BEGIN;

-- Vista de reviews públicos
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

-- Función para estadísticas
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
COMMENT ON FUNCTION core.get_listing_review_stats(UUID) IS 'Obtiene estadísticas detalladas de reviews de un listing específico';
COMMENT ON VIEW core.v_public_reviews IS 'Vista de reviews públicos con información adicional del listing y revisor';
