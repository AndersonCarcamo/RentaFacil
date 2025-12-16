-- ===== Fix Airbnb Score Calculation =====
-- Corrige el cálculo del score de Airbnb

CREATE OR REPLACE FUNCTION core.validate_airbnb_listing(p_listing_id UUID)
RETURNS JSON LANGUAGE plpgsql AS $validate_endpoint$
DECLARE
    listing_record RECORD;
    can_be_airbnb BOOLEAN := false;
    airbnb_score INTEGER := 0;
BEGIN
    -- Get listing details
    SELECT 
        id, created_at, operation, property_type, furnished, 
        rental_term, status, rental_mode, max_guests,
        cleaning_included, internet_included
    INTO listing_record
    FROM core.listings 
    WHERE id = p_listing_id 
    AND status IN ('published', 'draft')
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Listing not found',
            'listing_id', p_listing_id
        );
    END IF;
    
    -- Calculate Airbnb score (más preciso y completo)
    airbnb_score := 0;
    
    -- Criterios básicos (obligatorios para Airbnb)
    IF listing_record.furnished = true THEN 
        airbnb_score := airbnb_score + 25; 
    END IF;
    
    IF listing_record.rental_term IN ('daily', 'weekly') THEN 
        airbnb_score := airbnb_score + 30; 
    END IF;
    
    IF listing_record.property_type IN ('studio', 'apartment', 'house', 'room') THEN 
        airbnb_score := airbnb_score + 20; 
    END IF;
    
    IF listing_record.operation IN ('rent', 'temp_rent') THEN 
        airbnb_score := airbnb_score + 15; 
    END IF;
    
    -- Criterios adicionales (mejoran la puntuación)
    IF listing_record.rental_mode IN ('full_property', 'private_room') THEN
        airbnb_score := airbnb_score + 5;
    END IF;
    
    IF listing_record.max_guests IS NOT NULL AND listing_record.max_guests > 0 THEN
        airbnb_score := airbnb_score + 5;
    END IF;
    
    -- Servicios incluidos
    IF listing_record.cleaning_included = true THEN
        airbnb_score := airbnb_score + 3;
    END IF;
    
    IF listing_record.internet_included = true THEN
        airbnb_score := airbnb_score + 2;
    END IF;
    
    -- Eligibility check (requisitos mínimos)
    can_be_airbnb := (
        listing_record.furnished = true AND 
        listing_record.property_type IN ('studio', 'apartment', 'house', 'room') AND
        listing_record.operation IN ('rent', 'temp_rent') AND
        listing_record.rental_term IN ('daily', 'weekly', 'monthly')
    );
    
    -- Return validation result
    RETURN json_build_object(
        'success', true,
        'listing_id', p_listing_id,
        'validation', json_build_object(
            'can_be_airbnb', can_be_airbnb,
            'airbnb_score', LEAST(airbnb_score, 100),
            'is_furnished', listing_record.furnished,
            'rental_term', listing_record.rental_term,
            'property_type', listing_record.property_type,
            'operation', listing_record.operation,
            'rental_mode', listing_record.rental_mode,
            'max_guests', listing_record.max_guests,
            'rating', CASE 
                WHEN airbnb_score >= 90 THEN 'Excelente para Airbnb'
                WHEN airbnb_score >= 70 THEN 'Muy bueno para Airbnb'
                WHEN airbnb_score >= 50 THEN 'Bueno para Airbnb'
                WHEN airbnb_score >= 30 THEN 'Aceptable para Airbnb'
                WHEN can_be_airbnb THEN 'Cumple requisitos básicos'
                ELSE 'No apto para Airbnb'
            END,
            'score_breakdown', json_build_object(
                'furnished', CASE WHEN listing_record.furnished THEN 25 ELSE 0 END,
                'rental_term', CASE WHEN listing_record.rental_term IN ('daily', 'weekly') THEN 30 ELSE 0 END,
                'property_type', CASE WHEN listing_record.property_type IN ('studio', 'apartment', 'house', 'room') THEN 20 ELSE 0 END,
                'operation', CASE WHEN listing_record.operation IN ('rent', 'temp_rent') THEN 15 ELSE 0 END,
                'rental_mode', CASE WHEN listing_record.rental_mode IN ('full_property', 'private_room') THEN 5 ELSE 0 END,
                'max_guests', CASE WHEN listing_record.max_guests IS NOT NULL AND listing_record.max_guests > 0 THEN 5 ELSE 0 END,
                'cleaning', CASE WHEN listing_record.cleaning_included THEN 3 ELSE 0 END,
                'internet', CASE WHEN listing_record.internet_included THEN 2 ELSE 0 END
            )
        ),
        'timestamp', now()
    );
END $validate_endpoint$;

COMMENT ON FUNCTION core.validate_airbnb_listing IS 'Valida la elegibilidad de una propiedad para Airbnb y calcula su puntuación. Score máximo: 100 puntos';

-- Test con una propiedad existente (opcional)
-- SELECT core.validate_airbnb_listing('da8d2bdf-2d8b-4453-a0e4-356a95a6a429'::UUID);

\echo '=========================================='
\echo 'Airbnb Score Function Updated!'
\echo '=========================================='
\echo 'Breakdown de puntos:'
\echo '  - Amoblado: 25 puntos'
\echo '  - Alquiler diario/semanal: 30 puntos'
\echo '  - Tipo de propiedad adecuado: 20 puntos'
\echo '  - Operación de alquiler: 15 puntos'
\echo '  - Modo de alquiler: 5 puntos'
\echo '  - Capacidad de huéspedes: 5 puntos'
\echo '  - Limpieza incluida: 3 puntos'
\echo '  - Internet incluido: 2 puntos'
\echo '  TOTAL MÁXIMO: 105 puntos (limitado a 100)'
\echo '=========================================='
