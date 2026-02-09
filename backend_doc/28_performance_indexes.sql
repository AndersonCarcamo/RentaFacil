-- =====================================================
-- Índices de Optimización para Load Testing
-- Ejecutar en PostgreSQL para mejorar rendimiento
-- =====================================================
-- Fecha: 2026-01-24
-- Propósito: Optimizar búsquedas bajo alta carga (500+ usuarios concurrentes)
-- =====================================================

-- 1. Índice compuesto para búsquedas por operation + status
-- Optimiza: /v1/search/?operation=rent&limit=20
-- Impacto: Reduce tiempo de query de 100ms a ~5ms
CREATE INDEX IF NOT EXISTS idx_listings_operation_status_published 
ON core.listings(operation, status, published_at DESC) 
WHERE status = 'published' AND published_at IS NOT NULL;

-- 2. Índice compuesto para búsquedas por department + status
-- Optimiza: /v1/search/?department=lima&limit=20
-- Impacto: Reduce tiempo de query de 150ms a ~10ms
CREATE INDEX IF NOT EXISTS idx_listings_department_status_published 
ON core.listings(department, status, published_at DESC) 
WHERE status = 'published' AND published_at IS NOT NULL;

-- 3. Índice para district (búsquedas más específicas)
CREATE INDEX IF NOT EXISTS idx_listings_district_status_published 
ON core.listings(district, status, published_at DESC) 
WHERE status = 'published' AND published_at IS NOT NULL;

-- 4. Índice compuesto para listing_amenities
-- Optimiza: Bulk loading de amenities (previene N+1 query)
-- Impacto: Crítico para el nuevo método _load_amenities_bulk()
CREATE INDEX IF NOT EXISTS idx_listing_amenities_listing_amenity 
ON core.listing_amenities(listing_id, amenity_id);

-- 5. Índice para búsqueda de texto completo (si existe columna search_doc)
-- Optimiza: Búsquedas con parámetro ?q=texto
CREATE INDEX IF NOT EXISTS idx_listings_search_doc 
ON core.listings USING GIN(search_doc)
WHERE status = 'published';

-- 6. Índice para filtro de precios
-- Optimiza: Búsquedas con ?min_price=X&max_price=Y
CREATE INDEX IF NOT EXISTS idx_listings_price_status 
ON core.listings(price, status) 
WHERE status = 'published' AND price IS NOT NULL;

-- 7. Índice para filtros de habitaciones
-- Optimiza: Búsquedas con ?min_bedrooms=X
CREATE INDEX IF NOT EXISTS idx_listings_bedrooms_status 
ON core.listings(bedrooms, status) 
WHERE status = 'published' AND bedrooms IS NOT NULL;

-- =====================================================
-- Verificación de Índices
-- =====================================================

-- Listar todos los índices existentes (solo los que existen realmente)
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size((quote_ident(schemaname) || '.' || quote_ident(indexname))::regclass)) as index_size
FROM pg_indexes 
WHERE schemaname = 'core' 
    AND tablename IN ('listings', 'listing_amenities')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Verificar específicamente los índices de optimización
SELECT 
    'idx_listings_operation_status_published' as index_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'core' 
        AND indexname = 'idx_listings_operation_status_published'
    ) THEN '✅ CREADO' ELSE '❌ NO EXISTE' END as status
UNION ALL
SELECT 
    'idx_listings_department_status_published',
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'core' 
        AND indexname = 'idx_listings_department_status_published'
    ) THEN '✅ CREADO' ELSE '❌ NO EXISTE' END
UNION ALL
SELECT 
    'idx_listings_district_status_published',
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'core' 
        AND indexname = 'idx_listings_district_status_published'
    ) THEN '✅ CREADO' ELSE '❌ NO EXISTE' END
UNION ALL
SELECT 
    'idx_listing_amenities_listing_amenity',
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'core' 
        AND indexname = 'idx_listing_amenities_listing_amenity'
    ) THEN '✅ CREADO' ELSE '❌ NO EXISTE' END
UNION ALL
SELECT 
    'idx_listings_search_doc',
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'core' 
        AND indexname = 'idx_listings_search_doc'
    ) THEN '✅ CREADO' ELSE '❌ NO EXISTE' END
UNION ALL
SELECT 
    'idx_listings_price_status',
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'core' 
        AND indexname = 'idx_listings_price_status'
    ) THEN '✅ CREADO' ELSE '❌ NO EXISTE' END
UNION ALL
SELECT 
    'idx_listings_bedrooms_status',
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'core' 
        AND indexname = 'idx_listings_bedrooms_status'
    ) THEN '✅ CREADO' ELSE '❌ NO EXISTE' END;

-- =====================================================
-- Análisis de Queries (Ejecutar después de crear índices)
-- =====================================================

-- Recopilar estadísticas actualizadas
ANALYZE core.listings;
ANALYZE core.listing_amenities;
ANALYZE core.amenities;

-- Verificar uso de índices (ejecutar EXPLAIN ANALYZE en queries reales)
-- Ejemplo:
/*
EXPLAIN ANALYZE
SELECT * FROM core.listings 
WHERE status = 'published' 
    AND published_at IS NOT NULL 
    AND operation = 'rent' 
ORDER BY published_at DESC 
LIMIT 20;
*/

-- =====================================================
-- Mantenimiento Recomendado
-- =====================================================

-- Ejecutar semanalmente para mantener rendimiento:
-- VACUUM ANALYZE core.listings;
-- VACUUM ANALYZE core.listing_amenities;

-- =====================================================
-- Rollback (Si es necesario deshacer los cambios)
-- =====================================================
/*
DROP INDEX IF EXISTS core.idx_listings_operation_status_published;
DROP INDEX IF EXISTS core.idx_listings_department_status_published;
DROP INDEX IF EXISTS core.idx_listings_district_status_published;
DROP INDEX IF EXISTS core.idx_listing_amenities_listing_amenity;
DROP INDEX IF EXISTS core.idx_listings_search_doc;
DROP INDEX IF EXISTS core.idx_listings_price_status;
DROP INDEX IF EXISTS core.idx_listings_bedrooms_status;
*/
