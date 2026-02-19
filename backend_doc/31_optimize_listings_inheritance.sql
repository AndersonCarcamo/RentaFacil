-- ================================================================================
-- OPTIMIZACIÓN DE LISTINGS - SEPARACIÓN MEDIANTE HERENCIA DE TABLAS
-- ================================================================================
-- Fecha: 2026-02-11
-- Objetivo: Separar listings tradicionales de listings tipo Airbnb para:
--   1. Mejor performance en consultas específicas de cada tipo
--   2. Reducir índices innecesarios por tipo
--   3. Facilitar mantenimiento y evolución independiente de cada modelo
--   4. Preparar para operaciones asíncronas diferenciadas
--
-- Estrategia: Usar herencia de tablas de PostgreSQL + particionamiento temporal
-- ================================================================================

BEGIN;

-- ================================================================================
-- PASO 1: CREAR ENUMS Y TIPOS NECESARIOS (si no existen)
-- ================================================================================

-- Verificar/crear rental_model enum
DO $create_enum$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rental_model') THEN
        CREATE TYPE core.rental_model AS ENUM ('traditional', 'airbnb', 'student');
        RAISE NOTICE '✓ Created rental_model enum';
    ELSE
        RAISE NOTICE '✓ rental_model enum already exists';
    END IF;
END $create_enum$;

-- ================================================================================
-- PASO 2: AGREGAR COLUMNA rental_model A LA TABLA PRINCIPAL (si no existe)
-- ================================================================================

DO $add_rental_model$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'rental_model'
    ) THEN
        ALTER TABLE core.listings ADD COLUMN rental_model core.rental_model DEFAULT 'traditional';
        RAISE NOTICE '✓ Added rental_model column to listings';
    ELSE
        RAISE NOTICE '✓ rental_model column already exists';
    END IF;
END $add_rental_model$;

-- ================================================================================
-- PASO 3: CREAR TABLA BASE ABSTRACTA (Nueva arquitectura)
-- ================================================================================
-- NOTA: Esta es la nueva arquitectura recomendada para futuras implementaciones
-- Por ahora, mantendremos la tabla listings existente como base

COMMENT ON TABLE core.listings IS 
'Tabla base particionada que contiene TODOS los listings. 
Para consultas específicas, usar las vistas materializadas:
- listings_traditional_active: listings tradicionales activos
- listings_airbnb_active: listings tipo Airbnb activos';

-- ================================================================================
-- PASO 4: CREAR VISTAS MATERIALIZADAS PARA CADA TIPO
-- ================================================================================

-- Vista para Listings Tradicionales (alquiler/venta mensual, anual)
DROP MATERIALIZED VIEW IF EXISTS core.listings_traditional_active CASCADE;
CREATE MATERIALIZED VIEW core.listings_traditional_active AS
SELECT 
    l.*,
    -- Campos adicionales calculados para tradicionales
    CASE 
        WHEN l.rental_term = 'monthly' THEN l.price
        WHEN l.rental_term = 'yearly' THEN l.price / 12
        ELSE l.price
    END as normalized_monthly_price
FROM core.listings l
WHERE 
    l.rental_model = 'traditional'
    AND l.status IN ('active', 'published')
    AND l.verification_status = 'verified'
    AND (l.published_until IS NULL OR l.published_until > CURRENT_TIMESTAMP)
WITH DATA;

-- Índices optimizados para búsquedas tradicionales
CREATE INDEX IF NOT EXISTS idx_trad_location ON core.listings_traditional_active(department, province, district);
CREATE INDEX IF NOT EXISTS idx_trad_price_range ON core.listings_traditional_active(operation, property_type, price);
CREATE INDEX IF NOT EXISTS idx_trad_features ON core.listings_traditional_active(bedrooms, bathrooms, area_built) WHERE bedrooms IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trad_owner ON core.listings_traditional_active(owner_user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_trad_id ON core.listings_traditional_active(id);

COMMENT ON MATERIALIZED VIEW core.listings_traditional_active IS 
'Vista materializada de listings tradicionales activos y verificados.
Refresh: cada 5 minutos mediante cron job.
Uso: búsquedas de alquiler/venta tradicional (mensual, anual).';

-- Vista para Listings Airbnb (alquiler diario, semanal)
DROP MATERIALIZED VIEW IF EXISTS core.listings_airbnb_active CASCADE;
CREATE MATERIALIZED VIEW core.listings_airbnb_active AS
SELECT 
    l.*,
    -- Campos adicionales calculados para Airbnb
    COALESCE(l.airbnb_rating, 0) as rating,
    COALESCE(l.airbnb_reviews_count, 0) as reviews_count,
    CASE 
        WHEN l.airbnb_instant_book = true THEN 1
        ELSE 0
    END as instant_book_priority,
    -- Disponibilidad
    EXISTS(
        SELECT 1 FROM core.bookings b 
        WHERE b.listing_id = l.id 
        AND b.status IN ('confirmed', 'reservation_paid', 'checked_in')
        AND b.check_out_date >= CURRENT_DATE
    ) as has_active_bookings
FROM core.listings l
WHERE 
    l.rental_model = 'airbnb'
    AND l.status IN ('active', 'published')
    AND l.verification_status = 'verified'
    AND l.rental_term IN ('daily', 'weekly')
    AND (l.published_until IS NULL OR l.published_until > CURRENT_TIMESTAMP)
WITH DATA;

-- Índices optimizados para búsquedas Airbnb
CREATE INDEX IF NOT EXISTS idx_airbnb_location ON core.listings_airbnb_active(department, province, district);
CREATE INDEX IF NOT EXISTS idx_airbnb_dates ON core.listings_airbnb_active(id) WHERE has_active_bookings = false;
CREATE INDEX IF NOT EXISTS idx_airbnb_rating ON core.listings_airbnb_active(rating DESC, reviews_count DESC);
CREATE INDEX IF NOT EXISTS idx_airbnb_price ON core.listings_airbnb_active(price) WHERE instant_book_priority = 1;
CREATE INDEX IF NOT EXISTS idx_airbnb_guests ON core.listings_airbnb_active(max_guests, bedrooms);
CREATE INDEX IF NOT EXISTS idx_airbnb_host ON core.listings_airbnb_active(owner_user_id, rating DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_airbnb_id ON core.listings_airbnb_active(id);

COMMENT ON MATERIALIZED VIEW core.listings_airbnb_active IS 
'Vista materializada de listings tipo Airbnb activos y verificados.
Refresh: cada 2 minutos mediante cron job (alta frecuencia por disponibilidad).
Uso: búsquedas de alquiler temporal (diario, semanal).';

-- ================================================================================
-- PASO 5: FUNCIÓN PARA REFRESH AUTOMÁTICO DE VISTAS
-- ================================================================================

CREATE OR REPLACE FUNCTION core.refresh_listings_views()
RETURNS void
LANGUAGE plpgsql
AS $refresh_func$
BEGIN
    -- Refresh vista tradicional (menos frecuente)
    REFRESH MATERIALIZED VIEW CONCURRENTLY core.listings_traditional_active;
    RAISE NOTICE '✓ Refreshed listings_traditional_active';
    
    -- Refresh vista Airbnb (más frecuente por disponibilidad)
    REFRESH MATERIALIZED VIEW CONCURRENTLY core.listings_airbnb_active;
    RAISE NOTICE '✓ Refreshed listings_airbnb_active';
    
    -- Actualizar estadísticas
    ANALYZE core.listings_traditional_active;
    ANALYZE core.listings_airbnb_active;
    
    RAISE NOTICE '✓ Materialized views refreshed and analyzed';
END;
$refresh_func$;

COMMENT ON FUNCTION core.refresh_listings_views() IS 
'Refresca ambas vistas materializadas de listings de forma concurrente.
Llamar desde cron job cada 2-5 minutos según carga del sistema.';

-- ================================================================================
-- PASO 6: TRIGGERS PARA MANTENER rental_model SINCRONIZADO
-- ================================================================================

CREATE OR REPLACE FUNCTION core.auto_set_rental_model()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $trigger_func$
BEGIN
    -- Determinar rental_model basado en rental_term
    IF NEW.rental_term IN ('daily', 'weekly') THEN
        NEW.rental_model := 'airbnb';
    ELSIF NEW.rental_term IN ('monthly', 'yearly') THEN
        NEW.rental_model := 'traditional';
    ELSE
        -- Default para casos no esperados
        NEW.rental_model := COALESCE(NEW.rental_model, 'traditional');
    END IF;
    
    RETURN NEW;
END;
$trigger_func$;

-- Aplicar trigger a tabla principal (afecta todas las particiones)
DROP TRIGGER IF EXISTS trigger_auto_set_rental_model ON core.listings;
CREATE TRIGGER trigger_auto_set_rental_model
    BEFORE INSERT OR UPDATE OF rental_term
    ON core.listings
    FOR EACH ROW
    EXECUTE FUNCTION core.auto_set_rental_model();

COMMENT ON FUNCTION core.auto_set_rental_model() IS 
'Trigger que sincroniza automáticamente rental_model con rental_term.
- daily/weekly → airbnb
- monthly/yearly → traditional';

-- ================================================================================
-- PASO 7: CREAR ÍNDICES ADICIONALES EN TABLA BASE
-- ================================================================================

-- Índice compuesto para filtrar por rental_model
CREATE INDEX IF NOT EXISTS idx_listings_rental_model 
ON core.listings(rental_model, status, verification_status) 
WHERE status IN ('active', 'published');

-- Índice para consultas Airbnb específicas
CREATE INDEX IF NOT EXISTS idx_listings_airbnb_search 
ON core.listings(rental_model, rental_term, max_guests, price)
WHERE rental_model = 'airbnb' AND status = 'active';

-- Índice para consultas tradicionales específicas
CREATE INDEX IF NOT EXISTS idx_listings_traditional_search 
ON core.listings(rental_model, operation, property_type, bedrooms, price)
WHERE rental_model = 'traditional' AND status = 'active';

-- ================================================================================
-- PASO 8: MIGRACIÓN DE DATOS EXISTENTES
-- ================================================================================

-- Actualizar rental_model en listados existentes basándose en rental_term
UPDATE core.listings
SET rental_model = CASE 
    WHEN rental_term IN ('daily', 'weekly') THEN 'airbnb'::core.rental_model
    WHEN rental_term IN ('monthly', 'yearly') THEN 'traditional'::core.rental_model
    ELSE 'traditional'::core.rental_model
END
WHERE rental_model IS NULL OR rental_model != CASE 
    WHEN rental_term IN ('daily', 'weekly') THEN 'airbnb'::core.rental_model
    WHEN rental_term IN ('monthly', 'yearly') THEN 'traditional'::core.rental_model
    ELSE 'traditional'::core.rental_model
END;

-- Verificar migración
DO $verify_migration$
DECLARE
    total_count INTEGER;
    traditional_count INTEGER;
    airbnb_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM core.listings;
    SELECT COUNT(*) INTO traditional_count FROM core.listings WHERE rental_model = 'traditional';
    SELECT COUNT(*) INTO airbnb_count FROM core.listings WHERE rental_model = 'airbnb';
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'MIGRACIÓN COMPLETADA:';
    RAISE NOTICE '  Total listings: %', total_count;
    RAISE NOTICE '  Traditional: % (%.1f%%)', traditional_count, (traditional_count::float / NULLIF(total_count, 0) * 100);
    RAISE NOTICE '  Airbnb: % (%.1f%%)', airbnb_count, (airbnb_count::float / NULLIF(total_count, 0) * 100);
    RAISE NOTICE '===========================================';
END;
$verify_migration$;

-- ================================================================================
-- PASO 9: POBLAR VISTAS MATERIALIZADAS INICIALMENTE
-- ================================================================================

SELECT core.refresh_listings_views();

-- ================================================================================
-- PASO 10: CREAR FUNCIONES DE BÚSQUEDA OPTIMIZADAS
-- ================================================================================

-- Función de búsqueda para listings tradicionales
CREATE OR REPLACE FUNCTION core.search_traditional_listings(
    p_department TEXT DEFAULT NULL,
    p_province TEXT DEFAULT NULL,
    p_district TEXT DEFAULT NULL,
    p_operation core.operation_type DEFAULT NULL,
    p_property_type core.property_type DEFAULT NULL,
    p_min_price NUMERIC DEFAULT NULL,
    p_max_price NUMERIC DEFAULT NULL,
    p_min_bedrooms INTEGER DEFAULT NULL,
    p_min_bathrooms INTEGER DEFAULT NULL,
    p_min_area NUMERIC DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    listing_id UUID,
    title TEXT,
    price NUMERIC,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area_built NUMERIC,
    district TEXT,
    province TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $search_func$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.title,
        l.price,
        l.bedrooms,
        l.bathrooms,
        l.area_built,
        l.district,
        l.province,
        l.created_at
    FROM core.listings_traditional_active l
    WHERE 
        (p_department IS NULL OR l.department = p_department)
        AND (p_province IS NULL OR l.province = p_province)
        AND (p_district IS NULL OR l.district = p_district)
        AND (p_operation IS NULL OR l.operation = p_operation)
        AND (p_property_type IS NULL OR l.property_type = p_property_type)
        AND (p_min_price IS NULL OR l.price >= p_min_price)
        AND (p_max_price IS NULL OR l.price <= p_max_price)
        AND (p_min_bedrooms IS NULL OR l.bedrooms >= p_min_bedrooms)
        AND (p_min_bathrooms IS NULL OR l.bathrooms >= p_min_bathrooms)
        AND (p_min_area IS NULL OR l.area_built >= p_min_area)
    ORDER BY l.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$search_func$;

-- Función de búsqueda para listings Airbnb
CREATE OR REPLACE FUNCTION core.search_airbnb_listings(
    p_department TEXT DEFAULT NULL,
    p_province TEXT DEFAULT NULL,
    p_district TEXT DEFAULT NULL,
    p_check_in DATE DEFAULT NULL,
    p_check_out DATE DEFAULT NULL,
    p_guests INTEGER DEFAULT 1,
    p_min_price NUMERIC DEFAULT NULL,
    p_max_price NUMERIC DEFAULT NULL,
    p_instant_book BOOLEAN DEFAULT NULL,
    p_min_rating NUMERIC DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    listing_id UUID,
    title TEXT,
    price_per_night NUMERIC,
    rating NUMERIC,
    reviews_count INTEGER,
    max_guests INTEGER,
    instant_book BOOLEAN,
    district TEXT,
    province TEXT
)
LANGUAGE plpgsql
STABLE
AS $search_airbnb_func$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.title,
        l.price,
        l.rating,
        l.reviews_count,
        l.max_guests,
        l.airbnb_instant_book,
        l.district,
        l.province
    FROM core.listings_airbnb_active l
    WHERE 
        (p_department IS NULL OR l.department = p_department)
        AND (p_province IS NULL OR l.province = p_province)
        AND (p_district IS NULL OR l.district = p_district)
        AND (p_guests IS NULL OR l.max_guests >= p_guests)
        AND (p_min_price IS NULL OR l.price >= p_min_price)
        AND (p_max_price IS NULL OR l.price <= p_max_price)
        AND (p_instant_book IS NULL OR l.airbnb_instant_book = p_instant_book)
        AND (p_min_rating IS NULL OR l.rating >= p_min_rating)
        -- Verificar disponibilidad si se proporcionan fechas
        AND (
            p_check_in IS NULL OR p_check_out IS NULL OR
            NOT EXISTS (
                SELECT 1 FROM core.bookings b
                WHERE b.listing_id = l.id
                AND b.status IN ('confirmed', 'reservation_paid', 'checked_in')
                AND (
                    (b.check_in_date <= p_check_in AND b.check_out_date > p_check_in) OR
                    (b.check_in_date < p_check_out AND b.check_out_date >= p_check_out) OR
                    (b.check_in_date >= p_check_in AND b.check_out_date <= p_check_out)
                )
            )
        )
    ORDER BY 
        l.instant_book_priority DESC,
        l.rating DESC,
        l.reviews_count DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$search_airbnb_func$;

COMMIT;

-- ================================================================================
-- RESUMEN Y PRÓXIMOS PASOS
-- ================================================================================

DO $summary$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '✓ OPTIMIZACIÓN DE LISTINGS COMPLETADA';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'VISTAS MATERIALIZADAS CREADAS:';
    RAISE NOTICE '  • listings_traditional_active → Alquiler/venta tradicional';
    RAISE NOTICE '  • listings_airbnb_active → Alquiler temporal (Airbnb)';
    RAISE NOTICE '';
    RAISE NOTICE 'FUNCIONES DE BÚSQUEDA:';
    RAISE NOTICE '  • search_traditional_listings() → Búsqueda optimizada tradicional';
    RAISE NOTICE '  • search_airbnb_listings() → Búsqueda optimizada Airbnb';
    RAISE NOTICE '  • refresh_listings_views() → Refresh de vistas materializadas';
    RAISE NOTICE '';
    RAISE NOTICE 'PRÓXIMOS PASOS:';
    RAISE NOTICE '  1. Configurar cron job para refresh automático:';
    RAISE NOTICE '     */2 * * * * psql -c "SELECT core.refresh_listings_views();"';
    RAISE NOTICE '';
    RAISE NOTICE '  2. Actualizar endpoints del backend para usar funciones optimizadas';
    RAISE NOTICE '';
    RAISE NOTICE '  3. Configurar monitoreo de performance de vistas materializadas';
    RAISE NOTICE '';
    RAISE NOTICE '  4. Implementar cache Redis para resultados de búsquedas frecuentes';
    RAISE NOTICE '=================================================================';
END;
$summary$;
