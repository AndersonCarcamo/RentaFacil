-- ===== Agregar Campos Complementarios para Propiedades Airbnb y Tradicionales =====
-- Este script agrega campos FALTANTES necesarios para propiedades tipo Airbnb y alquiler tradicional
-- NOTA: pet_friendly, rental_model, furnished, airbnb_*, rental_mode, rating YA EXISTEN
-- Solo agregamos: smoking_allowed, deposit, minimum_stay, check_in/out, utilities, etc.

BEGIN;

-- 1. Agregar columnas nuevas a la tabla listings
DO $$
BEGIN
    -- Smoking allowed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'smoking_allowed'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN smoking_allowed BOOLEAN DEFAULT NULL;
        RAISE NOTICE 'Columna smoking_allowed agregada a core.listings';
    ELSE
        RAISE NOTICE 'Columna smoking_allowed ya existe en core.listings';
    END IF;

    -- Smoking allowed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'smoking_allowed'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN smoking_allowed BOOLEAN DEFAULT NULL;
        RAISE NOTICE 'Columna smoking_allowed agregada a core.listings';
    ELSE
        RAISE NOTICE 'Columna smoking_allowed ya existe en core.listings';
    END IF;

    -- Depósito requerido
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'deposit_required'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN deposit_required BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Columna deposit_required agregada a core.listings';
    ELSE
        RAISE NOTICE 'Columna deposit_required ya existe en core.listings';
    END IF;

    -- Monto del depósito
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'deposit_amount'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN deposit_amount NUMERIC(12,2);
        RAISE NOTICE 'Columna deposit_amount agregada a core.listings';
    ELSE
        RAISE NOTICE 'Columna deposit_amount ya existe en core.listings';
    END IF;

    -- Estancia mínima (para Airbnb)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'minimum_stay_nights'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN minimum_stay_nights INTEGER DEFAULT 1;
        RAISE NOTICE 'Columna minimum_stay_nights agregada a core.listings';
    ELSE
        RAISE NOTICE 'Columna minimum_stay_nights ya existe en core.listings';
    END IF;

    -- Estancia máxima
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'maximum_stay_nights'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN maximum_stay_nights INTEGER;
        RAISE NOTICE 'Columna maximum_stay_nights agregada a core.listings';
    ELSE
        RAISE NOTICE 'Columna maximum_stay_nights ya existe en core.listings';
    END IF;

    -- Check-in time
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'check_in_time'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN check_in_time TIME;
        RAISE NOTICE 'Columna check_in_time agregada a core.listings';
    ELSE
        RAISE NOTICE 'Columna check_in_time ya existe en core.listings';
    END IF;

    -- Check-out time
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'check_out_time'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN check_out_time TIME;
        RAISE NOTICE 'Columna check_out_time agregada a core.listings';
    ELSE
        RAISE NOTICE 'Columna check_out_time ya existe en core.listings';
    END IF;

    -- Número máximo de huéspedes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'max_guests'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN max_guests INTEGER;
        RAISE NOTICE 'Columna max_guests agregada a core.listings';
    ELSE
        RAISE NOTICE 'Columna max_guests ya existe en core.listings';
    END IF;

    -- Limpieza incluida
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'cleaning_included'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN cleaning_included BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Columna cleaning_included agregada a core.listings';
    ELSE
        RAISE NOTICE 'Columna cleaning_included ya existe en core.listings';
    END IF;

    -- Tarifa de limpieza
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'cleaning_fee'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN cleaning_fee NUMERIC(12,2);
        RAISE NOTICE 'Columna cleaning_fee agregada a core.listings';
    ELSE
        RAISE NOTICE 'Columna cleaning_fee ya existe en core.listings';
    END IF;

    -- Servicios incluidos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'utilities_included'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN utilities_included BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Columna utilities_included agregada a core.listings';
    ELSE
        RAISE NOTICE 'Columna utilities_included ya existe en core.listings';
    END IF;

    -- Internet incluido
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'internet_included'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN internet_included BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Columna internet_included agregada a core.listings';
    ELSE
        RAISE NOTICE 'Columna internet_included ya existe en core.listings';
    END IF;

    -- Reglas de la casa (texto libre)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'house_rules'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN house_rules TEXT;
        RAISE NOTICE 'Columna house_rules agregada a core.listings';
    ELSE
        RAISE NOTICE 'Columna house_rules ya existe en core.listings';
    END IF;

    -- Política de cancelación
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'cancellation_policy'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN cancellation_policy TEXT DEFAULT 'flexible';
        RAISE NOTICE 'Columna cancellation_policy agregada a core.listings';
    ELSE
        RAISE NOTICE 'Columna cancellation_policy ya existe en core.listings';
    END IF;

    -- Disponibilidad inmediata
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'available_from'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN available_from DATE;
        RAISE NOTICE 'Columna available_from agregada a core.listings';
    ELSE
        RAISE NOTICE 'Columna available_from ya existe en core.listings';
    END IF;
END $$;

-- 2. Agregar comentarios a las columnas NUEVAS
COMMENT ON COLUMN core.listings.smoking_allowed IS 'Indica si se permite fumar en la propiedad';
COMMENT ON COLUMN core.listings.deposit_required IS 'Indica si se requiere depósito de garantía';
COMMENT ON COLUMN core.listings.deposit_amount IS 'Monto del depósito de garantía requerido';
COMMENT ON COLUMN core.listings.minimum_stay_nights IS 'Número mínimo de noches para estadía (útil para Airbnb)';
COMMENT ON COLUMN core.listings.maximum_stay_nights IS 'Número máximo de noches para estadía';
COMMENT ON COLUMN core.listings.check_in_time IS 'Hora de check-in (para Airbnb/short-term rentals)';
COMMENT ON COLUMN core.listings.check_out_time IS 'Hora de check-out (para Airbnb/short-term rentals)';
COMMENT ON COLUMN core.listings.max_guests IS 'Número máximo de huéspedes permitidos';
COMMENT ON COLUMN core.listings.cleaning_included IS 'Indica si el servicio de limpieza está incluido';
COMMENT ON COLUMN core.listings.cleaning_fee IS 'Tarifa adicional por servicio de limpieza';
COMMENT ON COLUMN core.listings.utilities_included IS 'Indica si los servicios (luz, agua, gas) están incluidos en el precio';
COMMENT ON COLUMN core.listings.internet_included IS 'Indica si el servicio de internet está incluido';
COMMENT ON COLUMN core.listings.house_rules IS 'Reglas de la casa en texto libre';
COMMENT ON COLUMN core.listings.cancellation_policy IS 'Política de cancelación (flexible, moderate, strict)';
COMMENT ON COLUMN core.listings.available_from IS 'Fecha desde la cual la propiedad está disponible';

COMMIT;

-- 3. Verificar que todo se creó correctamente
DO $$
DECLARE
    added_columns TEXT[] := ARRAY[
        'smoking_allowed',
        'deposit_required',
        'deposit_amount',
        'minimum_stay_nights',
        'maximum_stay_nights',
        'check_in_time',
        'check_out_time',
        'max_guests',
        'cleaning_included',
        'cleaning_fee',
        'utilities_included',
        'internet_included',
        'house_rules',
        'cancellation_policy',
        'available_from'
    ];
    col TEXT;
    exists_count INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verificación de columnas agregadas:';
    
    FOREACH col IN ARRAY added_columns
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'core' 
            AND table_name = 'listings' 
            AND column_name = col
        ) THEN
            RAISE NOTICE '✓ Columna %: OK', col;
            exists_count := exists_count + 1;
        ELSE
            RAISE NOTICE '✗ Columna %: FALTA', col;
        END IF;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total: % de % columnas agregadas', exists_count, array_length(added_columns, 1);
    RAISE NOTICE '========================================';
    
    -- Mostrar campos existentes relacionados
    RAISE NOTICE '';
    RAISE NOTICE 'Campos ya existentes (no se modifican):';
    RAISE NOTICE '- pet_friendly: %', CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='core' AND table_name='listings' AND column_name='pet_friendly') THEN '✓' ELSE '✗' END;
    RAISE NOTICE '- rental_model: %', CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='core' AND table_name='listings' AND column_name='rental_model') THEN '✓' ELSE '✗' END;
    RAISE NOTICE '- furnished: %', CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='core' AND table_name='listings' AND column_name='furnished') THEN '✓' ELSE '✗' END;
    RAISE NOTICE '- rental_mode: %', CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='core' AND table_name='listings' AND column_name='rental_mode') THEN '✓' ELSE '✗' END;
    RAISE NOTICE '- airbnb_score: %', CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='core' AND table_name='listings' AND column_name='airbnb_score') THEN '✓' ELSE '✗' END;
    RAISE NOTICE '- airbnb_eligible: %', CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='core' AND table_name='listings' AND column_name='airbnb_eligible') THEN '✓' ELSE '✗' END;
    RAISE NOTICE '- rating: %', CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='core' AND table_name='listings' AND column_name='rating') THEN '✓' ELSE '✗' END;
    RAISE NOTICE '========================================';
END $$;
