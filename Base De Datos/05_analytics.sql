-- ===== Real Estate Marketplace MVP - Analytics System =====
-- Event tracking, analytics, and materialized views for reporting

-- Events table with monthly partitioning
CREATE TABLE IF NOT EXISTS analytics.events (
    id              UUID DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES core.users(id) ON DELETE SET NULL,
    session_id      TEXT,
    event_type      TEXT NOT NULL, -- 'view', 'favorite', 'contact', 'search', 'click', etc.
    listing_id      UUID,
    listing_created_at TIMESTAMPTZ, -- For future FK to partitioned listings if needed
    properties      JSONB DEFAULT '{}',
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Primary key must include partition column
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Partition helper for analytics events
CREATE OR REPLACE FUNCTION analytics.ensure_events_partition(p_month_start date)
RETURNS void LANGUAGE plpgsql AS $events_func$
DECLARE
    p_start date := date_trunc('month', p_month_start);
    p_end date := p_start + interval '1 month';
    part_name text := format('analytics.events_%s', to_char(p_start, 'YYYY_MM'));
    part_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'analytics' AND c.relname = right(part_name, -10)
    ) INTO part_exists;
    
    IF NOT part_exists THEN
        EXECUTE format($create_events_partition$
            CREATE TABLE %I PARTITION OF analytics.events
            FOR VALUES FROM ('%s') TO ('%s')
        $create_events_partition$, part_name, p_start, p_end);
        
        -- Create indexes on the partition
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_user_created_idx ON %I(user_id, created_at DESC)', 
                      replace(part_name, '.', '_'), part_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_event_type_idx ON %I(event_type, created_at DESC)', 
                      replace(part_name, '.', '_'), part_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_listing_idx ON %I(listing_id, event_type, created_at DESC)', 
                      replace(part_name, '.', '_'), part_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_session_idx ON %I(session_id, created_at DESC)', 
                      replace(part_name, '.', '_'), part_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_properties_gin_idx ON %I USING gin(properties)', 
                      replace(part_name, '.', '_'), part_name);
    END IF;
END $events_func$;

-- Create current month partition
SELECT analytics.ensure_events_partition(date_trunc('month', now())::date);
SELECT analytics.ensure_events_partition(date_trunc('month', now() + interval '1 month')::date);

-- Materialized views for analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.mv_price_m2_90d AS
SELECT
    district,
    province,
    operation,
    property_type,
    date_trunc('day', created_at) AS day,
    COUNT(*) AS listings_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price/NULLIF(area_built,0)) AS median_price_m2,
    AVG(price/NULLIF(area_built,0)) AS avg_price_m2,
    MIN(price/NULLIF(area_built,0)) AS min_price_m2,
    MAX(price/NULLIF(area_built,0)) AS max_price_m2
FROM core.listings
WHERE status = 'published'
    AND created_at >= now() - interval '90 days'
    AND area_built > 0
    AND price > 0
GROUP BY 1,2,3,4,5;

CREATE UNIQUE INDEX IF NOT EXISTS mv_price_m2_90d_unique_idx 
ON analytics.mv_price_m2_90d (district, province, operation, property_type, day);

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.mv_leads_daily AS
SELECT
    COALESCE(lst.district, 'Sin distrito') as district,
    date_trunc('day', l.created_at) AS day,
    COUNT(*) AS leads_count
FROM core.leads l
JOIN core.listings lst ON lst.id = l.listing_id AND lst.created_at = l.listing_created_at
WHERE l.created_at >= now() - interval '90 days'
GROUP BY 1,2;

CREATE UNIQUE INDEX IF NOT EXISTS mv_leads_daily_unique_idx 
ON analytics.mv_leads_daily (district, day);

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION analytics.refresh_all_mvs()
RETURNS void LANGUAGE plpgsql AS $refresh_mvs$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.mv_price_m2_90d;
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.mv_leads_daily;
    
    -- Log refresh timestamp
    INSERT INTO analytics.events (event_type, properties, created_at)
    VALUES ('mv_refresh', jsonb_build_object('timestamp', now(), 'views', ARRAY['mv_price_m2_90d', 'mv_leads_daily']), now());
END $refresh_mvs$;

-- View for listing performance metrics
CREATE OR REPLACE VIEW analytics.v_listing_performance AS
SELECT 
    l.id,
    l.created_at,
    l.title,
    l.district,
    l.operation,
    l.property_type,
    l.price,
    l.views_count,
    l.leads_count,
    l.favorites_count,
    -- Performance metrics
    CASE 
        WHEN l.views_count > 0 THEN (l.leads_count::float / l.views_count * 100)
        ELSE 0 
    END as lead_conversion_rate,
    CASE 
        WHEN l.views_count > 0 THEN (l.favorites_count::float / l.views_count * 100)
        ELSE 0 
    END as favorite_rate,
    EXTRACT(days FROM now() - l.published_at) as days_on_market
FROM core.listings l
WHERE l.status = 'published';

-- Function to track events easily
CREATE OR REPLACE FUNCTION analytics.track_event(
    p_event_type TEXT,
    p_user_id UUID DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_listing_id UUID DEFAULT NULL,
    p_listing_created_at TIMESTAMPTZ DEFAULT NULL,
    p_properties JSONB DEFAULT '{}'
)
RETURNS UUID LANGUAGE plpgsql AS $track_event$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO analytics.events (
        event_type, user_id, session_id, listing_id, listing_created_at, properties, created_at
    ) VALUES (
        p_event_type, p_user_id, p_session_id, p_listing_id, p_listing_created_at, p_properties, now()
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END $track_event$;
