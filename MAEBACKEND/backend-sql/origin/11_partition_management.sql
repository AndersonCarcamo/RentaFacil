-- ===== Real Estate Marketplace MVP - Partition Management =====
-- Automated partition management and data lifecycle

-- Create partition helper for listings
DROP FUNCTION IF EXISTS core.ensure_listings_partition(date);

CREATE OR REPLACE FUNCTION core.ensure_listings_partition(p_month_start date)
RETURNS void LANGUAGE plpgsql AS $partition$
DECLARE
    p_start date := date_trunc('month', p_month_start);
    partition_name text := 'listings_' || to_char(p_start, 'YYYY_MM');
    start_ts text := to_char(p_start, 'YYYY-MM-DD') || ' 05:00:00+00';
    end_ts text := to_char(p_start + interval '1 month', 'YYYY-MM-DD') || ' 05:00:00+00';
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'core' AND c.relname = partition_name
    ) THEN
        -- Create partition
        EXECUTE format(
            'CREATE TABLE core.%I PARTITION OF core.listings 
             FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_ts, end_ts
        );
        
        -- Core search indexes
        EXECUTE format(
            'CREATE INDEX %I ON core.%I (status, verification_status, published_at DESC)',
            partition_name || '_status_idx', partition_name
        );
        
        EXECUTE format(
            'CREATE INDEX %I ON core.%I (owner_user_id, created_at DESC)',
            partition_name || '_owner_idx', partition_name
        );
        
        -- Location & filters
        EXECUTE format(
            'CREATE INDEX %I ON core.%I (district, province, operation, property_type)',
            partition_name || '_location_idx', partition_name
        );
        
        -- Price range queries
        EXECUTE format(
            'CREATE INDEX %I ON core.%I (operation, property_type, price)',
            partition_name || '_price_idx', partition_name
        );
        
        -- Full-text search
        EXECUTE format(
            'CREATE INDEX %I ON core.%I USING gin(search_doc)',
            partition_name || '_search_idx', partition_name
        );
        
        -- Geolocation
        EXECUTE format(
            'CREATE INDEX %I ON core.%I (latitude, longitude) WHERE latitude IS NOT NULL',
            partition_name || '_geo_idx', partition_name
        );
        
        -- Slug uniqueness
        EXECUTE format(
            'CREATE UNIQUE INDEX %I ON core.%I (slug, created_at) WHERE slug IS NOT NULL',
            partition_name || '_slug_idx', partition_name
        );
        
        RAISE NOTICE 'Created partition: core.%', partition_name;
    END IF;
END $partition$;

-- Create partition helper for leads
CREATE OR REPLACE FUNCTION core.ensure_leads_partition(p_month_start date)
RETURNS void LANGUAGE plpgsql AS $partition$
DECLARE
    p_start date := date_trunc('month', p_month_start);
    partition_name text := 'leads_' || to_char(p_start, 'YYYY_MM');
    start_ts text := to_char(p_start, 'YYYY-MM-DD') || ' 05:00:00+00';
    end_ts text := to_char(p_start + interval '1 month', 'YYYY-MM-DD') || ' 05:00:00+00';
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'core' AND c.relname = partition_name
    ) THEN
        -- Create partition
        EXECUTE format(
            'CREATE TABLE core.%I PARTITION OF core.leads 
             FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_ts, end_ts
        );
        
        -- Listing reference index
        EXECUTE format(
            'CREATE INDEX %I ON core.%I (listing_id, listing_created_at, created_at DESC)',
            partition_name || '_listing_idx', partition_name
        );
        
        -- User activity index
        EXECUTE format(
            'CREATE INDEX %I ON core.%I (user_id, created_at DESC)',
            partition_name || '_user_idx', partition_name
        );
        
        -- Source tracking index
        EXECUTE format(
            'CREATE INDEX %I ON core.%I (source, created_at DESC)',
            partition_name || '_source_idx', partition_name
        );
        
        RAISE NOTICE 'Created partition: core.%', partition_name;
    END IF;
END $partition$;

-- Create partition helper for events
CREATE OR REPLACE FUNCTION analytics.ensure_events_partition(p_month_start date)
RETURNS void LANGUAGE plpgsql AS $partition$
DECLARE
    p_start date := date_trunc('month', p_month_start);
    partition_name text := 'events_' || to_char(p_start, 'YYYY_MM');
    start_ts text := to_char(p_start, 'YYYY-MM-DD') || ' 05:00:00+00';
    end_ts text := to_char(p_start + interval '1 month', 'YYYY-MM-DD') || ' 05:00:00+00';
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'analytics' AND c.relname = partition_name
    ) THEN
        -- Create partition
        EXECUTE format(
            'CREATE TABLE analytics.%I PARTITION OF analytics.events 
             FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_ts, end_ts
        );
        
        -- User activity index
        EXECUTE format(
            'CREATE INDEX %I ON analytics.%I (user_id, created_at DESC)',
            partition_name || '_user_idx', partition_name
        );
        
        -- Event type queries
        EXECUTE format(
            'CREATE INDEX %I ON analytics.%I (event_type, created_at DESC)',
            partition_name || '_event_idx', partition_name
        );
        
        -- Listing analytics
        EXECUTE format(
            'CREATE INDEX %I ON analytics.%I (listing_id, event_type, created_at DESC)',
            partition_name || '_listing_idx', partition_name
        );
        
        -- Session tracking
        EXECUTE format(
            'CREATE INDEX %I ON analytics.%I (session_id, created_at DESC)',
            partition_name || '_session_idx', partition_name
        );
        
        -- JSONB properties search
        EXECUTE format(
            'CREATE INDEX %I ON analytics.%I USING gin(properties)',
            partition_name || '_properties_idx', partition_name
        );
        
        RAISE NOTICE 'Created partition: analytics.%', partition_name;
    END IF;
END $partition$;

-- Monthly partition maintenance function
CREATE OR REPLACE FUNCTION core.create_monthly_partitions()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    current_month date := date_trunc('month', now());
    next_month date := current_month + interval '1 month';
    future_month date := current_month + interval '2 months';
BEGIN
    -- Ensure current, next, and future month partitions exist
    PERFORM core.ensure_listings_partition(current_month);
    PERFORM core.ensure_listings_partition(next_month);
    PERFORM core.ensure_listings_partition(future_month);
    
    PERFORM core.ensure_leads_partition(current_month);
    PERFORM core.ensure_leads_partition(next_month);
    PERFORM core.ensure_leads_partition(future_month);
    
    PERFORM analytics.ensure_events_partition(current_month);
    PERFORM analytics.ensure_events_partition(next_month);
    PERFORM analytics.ensure_events_partition(future_month);
END $$;

-- Archive old partitions
CREATE OR REPLACE FUNCTION analytics.detach_old_events_partitions(retain_months int DEFAULT 24, archive_schema text DEFAULT 'archive')
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    cutoff_date date := date_trunc('month', now() - make_interval(months => retain_months));
    r record;
BEGIN
    -- Create archive schema if not exists
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', archive_schema);
    
    FOR r IN 
        SELECT schemaname, tablename AS relname
        FROM pg_tables 
        WHERE schemaname = 'analytics'
        AND tablename LIKE 'events_%'
        AND tablename ~ '^\w+_\d{4}_\d{2}$'
        AND to_date(right(tablename, 7), 'YYYY_MM') < cutoff_date
    LOOP
        BEGIN
            -- Detach partition
            EXECUTE format('ALTER TABLE ONLY analytics.events DETACH PARTITION %I.%I;', r.schemaname, r.relname);
            
            -- Move to archive schema
            EXECUTE format('ALTER TABLE %I.%I SET SCHEMA %I;', r.schemaname, r.relname, archive_schema);
            
            RAISE NOTICE 'Archived partition: %.% -> %.%', r.schemaname, r.relname, archive_schema, r.relname;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to archive partition %.%: %', r.schemaname, r.relname, SQLERRM;
        END;
    END LOOP;
END $$;
