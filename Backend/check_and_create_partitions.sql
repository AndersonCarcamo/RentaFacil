-- Verificar si las funciones de particiones automáticas están instaladas
-- y ejecutar la función para crear particiones faltantes

\echo '========================================'
\echo 'Verificando sistema de particiones...'
\echo '========================================'
\echo ''

-- Verificar si existe la función de creación de particiones
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Función core.create_monthly_partitions() existe'
        ELSE '❌ Función core.create_monthly_partitions() NO existe'
    END AS status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'core' AND p.proname = 'create_monthly_partitions';

\echo ''

-- Verificar si existe la función ensure_listings_partition
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Función core.ensure_listings_partition() existe'
        ELSE '❌ Función core.ensure_listings_partition() NO existe'
    END AS status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'core' AND p.proname = 'ensure_listings_partition';

\echo ''
\echo '========================================'
\echo 'Particiones actuales de listings:'
\echo '========================================'

-- Ver particiones existentes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'core' 
  AND tablename LIKE 'listings_%'
ORDER BY tablename DESC
LIMIT 10;

\echo ''
\echo '========================================'
\echo 'Ejecutando creación automática...'
\echo '========================================'

-- Si la función existe, ejecutarla
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'core' AND p.proname = 'create_monthly_partitions'
    ) THEN
        RAISE NOTICE 'Ejecutando core.create_monthly_partitions()...';
        PERFORM core.create_monthly_partitions();
        RAISE NOTICE '✅ Particiones creadas/verificadas exitosamente';
    ELSE
        RAISE EXCEPTION '❌ La función core.create_monthly_partitions() no existe. Necesitas ejecutar 10_partition_management.sql primero';
    END IF;
END $$;

\echo ''
\echo '========================================'
\echo 'Particiones después de la ejecución:'
\echo '========================================'

SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size('core.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'core' 
  AND tablename LIKE 'listings_2026%'
ORDER BY tablename;

\echo ''
\echo '✅ Proceso completado'
