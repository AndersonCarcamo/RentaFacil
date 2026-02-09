-- ========================================
-- Actualizar funciones de particionamiento con timezone correcto
-- ========================================

\echo '========================================'
\echo 'Actualizando funciones de particionamiento...'
\echo '========================================'

-- Actualizar función para listings
CREATE OR REPLACE FUNCTION core.ensure_listings_partition(partition_month date)
RETURNS void LANGUAGE plpgsql AS $partition$
DECLARE
    partition_name text := 'listings_' || to_char(partition_month, 'YYYY_MM');
    start_date text := to_char(partition_month, 'YYYY-MM-DD') || ' 05:00:00+00';
    end_date text := to_char(partition_month + interval '1 month', 'YYYY-MM-DD') || ' 05:00:00+00';
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'core' AND c.relname = partition_name
    ) THEN
        EXECUTE format(
            'CREATE TABLE core.%I PARTITION OF core.listings 
             FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
        
        -- Create indexes for the partition
        EXECUTE format(
            'CREATE INDEX %I ON core.%I (status, verification_status, published_at DESC)',
            partition_name || '_status_idx', partition_name
        );
        
        EXECUTE format(
            'CREATE INDEX %I ON core.%I (owner_user_id, created_at)',
            partition_name || '_owner_idx', partition_name
        );
        
        RAISE NOTICE 'Created partition: core.%', partition_name;
    END IF;
END $partition$;

-- Actualizar función para leads
CREATE OR REPLACE FUNCTION core.ensure_leads_partition(partition_month date)
RETURNS void LANGUAGE plpgsql AS $partition$
DECLARE
    partition_name text := 'leads_' || to_char(partition_month, 'YYYY_MM');
    start_date text := to_char(partition_month, 'YYYY-MM-DD') || ' 05:00:00+00';
    end_date text := to_char(partition_month + interval '1 month', 'YYYY-MM-DD') || ' 05:00:00+00';
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'core' AND c.relname = partition_name
    ) THEN
        EXECUTE format(
            'CREATE TABLE core.%I PARTITION OF core.leads 
             FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
        
        -- Create indexes for the partition
        EXECUTE format(
            'CREATE INDEX %I ON core.%I (listing_id, listing_created_at)',
            partition_name || '_listing_idx', partition_name
        );
        
        EXECUTE format(
            'CREATE INDEX %I ON core.%I (user_id, created_at)',
            partition_name || '_user_idx', partition_name
        );
        
        RAISE NOTICE 'Created partition: core.%', partition_name;
    END IF;
END $partition$;

-- Actualizar función para analytics events
CREATE OR REPLACE FUNCTION analytics.ensure_events_partition(partition_month date)
RETURNS void LANGUAGE plpgsql AS $partition$
DECLARE
    partition_name text := 'events_' || to_char(partition_month, 'YYYY_MM');
    start_date text := to_char(partition_month, 'YYYY-MM-DD') || ' 05:00:00+00';
    end_date text := to_char(partition_month + interval '1 month', 'YYYY-MM-DD') || ' 05:00:00+00';
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'analytics' AND c.relname = partition_name
    ) THEN
        EXECUTE format(
            'CREATE TABLE analytics.%I PARTITION OF analytics.events 
             FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
        
        -- Create indexes for the partition
        EXECUTE format(
            'CREATE INDEX %I ON analytics.%I (user_id, created_at)',
            partition_name || '_user_idx', partition_name
        );
        
        EXECUTE format(
            'CREATE INDEX %I ON analytics.%I (event_type, created_at)',
            partition_name || '_event_idx', partition_name
        );
        
        RAISE NOTICE 'Created partition: analytics.%', partition_name;
    END IF;
END $partition$;

\echo '✓ Funciones actualizadas correctamente'
\echo ''

-- Ahora ejecutar la creación automática de particiones
\echo '========================================'
\echo 'Ejecutando creación automática de particiones...'
\echo '========================================'

SELECT core.create_monthly_partitions();

\echo ''
\echo '========================================'
\echo 'Verificando particiones creadas...'
\echo '========================================'

SELECT 
    c.relname AS partition_name,
    pg_get_expr(c.relpartbound, c.oid, true) AS partition_range
FROM pg_class c
JOIN pg_inherits i ON i.inhrelid = c.oid
JOIN pg_class p ON p.oid = i.inhparent
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE p.relname = 'listings'
  AND n.nspname = 'core'
  AND c.relname LIKE 'listings_2026%'
ORDER BY c.relname;

\echo ''
\echo '✓ Sistema de particionamiento automático corregido'
\echo 'Las particiones ahora se crearán automáticamente con timezone correcto'
