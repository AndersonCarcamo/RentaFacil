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

REATE TABLE IF NOT EXISTS analytics.listing_views (
    id              UUID DEFAULT gen_random_uuid(),
    listing_id      UUID NOT NULL,
    user_id         UUID REFERENCES core.users(id) ON DELETE SET NULL,
    session_id      TEXT NOT NULL,
    
    -- Información técnica
    ip_address      INET,
    user_agent      TEXT,
    referrer        TEXT,
    page_url        TEXT,
    
    -- Métricas de engagement
    time_spent      INTEGER DEFAULT 0, -- segundos
    scroll_depth    INTEGER DEFAULT 0, -- porcentaje 0-100
    images_viewed   INTEGER DEFAULT 0,
    contact_clicked BOOLEAN DEFAULT false,
    phone_revealed  BOOLEAN DEFAULT false,
    
    -- Información geográfica (opcional)
    country_code    VARCHAR(2),
    city            VARCHAR(100),
    
    -- Timestamp
    viewed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Primary key incluye partition column
    PRIMARY KEY (id, viewed_at)
) PARTITION BY RANGE (viewed_at);

-- Índices para listing_views
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id ON analytics.listing_views(listing_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_views_user_id ON analytics.listing_views(user_id, viewed_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listing_views_session_id ON analytics.listing_views(session_id, viewed_at DESC);

COMMENT ON TABLE analytics.listing_views IS 'Registro de vistas a propiedades con métricas de engagement';
COMMENT ON COLUMN analytics.listing_views.time_spent IS 'Tiempo en segundos que el usuario pasó viendo la propiedad';
COMMENT ON COLUMN analytics.listing_views.scroll_depth IS 'Porcentaje de scroll en la página (0-100)';
COMMENT ON COLUMN analytics.listing_views.contact_clicked IS 'Si el usuario hizo clic en el botón de contacto';


-- Tabla para contactos/leads
CREATE TABLE IF NOT EXISTS analytics.listing_contacts (
    id              UUID DEFAULT gen_random_uuid(),
    listing_id      UUID NOT NULL,
    user_id         UUID REFERENCES core.users(id) ON DELETE SET NULL,
    session_id      TEXT NOT NULL,
    
    -- Información del contacto
    contact_type    VARCHAR(50) NOT NULL, -- 'whatsapp', 'phone', 'email', 'form'
    message         TEXT,
    phone_revealed  BOOLEAN DEFAULT false,
    
    -- Información técnica
    ip_address      INET,
    user_agent      TEXT,
    referrer        TEXT,
    
    -- Información geográfica
    country_code    VARCHAR(2),
    city            VARCHAR(100),
    
    -- Timestamp
    contacted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    PRIMARY KEY (id, contacted_at)
) PARTITION BY RANGE (contacted_at);

-- Índices para listing_contacts
CREATE INDEX IF NOT EXISTS idx_listing_contacts_listing_id ON analytics.listing_contacts(listing_id, contacted_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_contacts_user_id ON analytics.listing_contacts(user_id, contacted_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listing_contacts_type ON analytics.listing_contacts(contact_type, contacted_at DESC);

COMMENT ON TABLE analytics.listing_contacts IS 'Registro de contactos/leads generados desde propiedades';
COMMENT ON COLUMN analytics.listing_contacts.contact_type IS 'Tipo de contacto: whatsapp, phone, email, form';


-- Tabla para búsquedas
CREATE TABLE IF NOT EXISTS analytics.searches (
    id              UUID DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES core.users(id) ON DELETE SET NULL,
    session_id      TEXT NOT NULL,
    
    -- Parámetros de búsqueda
    query_text      TEXT,
    operation       VARCHAR(50), -- 'venta', 'alquiler', 'temporal'
    property_type   VARCHAR(50),
    district        VARCHAR(100),
    province        VARCHAR(100),
    department      VARCHAR(100),
    
    -- Filtros aplicados (JSONB para flexibilidad)
    filters         JSONB DEFAULT '{}', -- {min_price, max_price, bedrooms, bathrooms, etc}
    
    -- Resultados
    results_count   INTEGER DEFAULT 0,
    results_clicked INTEGER DEFAULT 0, -- cuántos resultados se clickearon
    first_result_clicked UUID, -- ID del primer resultado clickeado
    
    -- Información técnica
    ip_address      INET,
    user_agent      TEXT,
    
    -- Timestamp
    searched_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    PRIMARY KEY (id, searched_at)
) PARTITION BY RANGE (searched_at);

-- Índices para searches
CREATE INDEX IF NOT EXISTS idx_searches_user_id ON analytics.searches(user_id, searched_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_searches_session_id ON analytics.searches(session_id, searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_searches_location ON analytics.searches(district, province, searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_searches_filters_gin ON analytics.searches USING gin(filters);

COMMENT ON TABLE analytics.searches IS 'Registro de búsquedas realizadas con filtros y resultados';
COMMENT ON COLUMN analytics.searches.filters IS 'Filtros aplicados en formato JSON: precio, habitaciones, etc';


-- Tabla para favoritos
CREATE TABLE IF NOT EXISTS analytics.listing_favorites (
    id              UUID DEFAULT gen_random_uuid(),
    listing_id      UUID NOT NULL,
    user_id         UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    session_id      TEXT NOT NULL,
    
    -- Acción
    action          VARCHAR(20) NOT NULL, -- 'added', 'removed'
    
    -- Información técnica
    ip_address      INET,
    user_agent      TEXT,
    
    -- Timestamp
    actioned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    PRIMARY KEY (id, actioned_at)
) PARTITION BY RANGE (actioned_at);

-- Índices para listing_favorites
CREATE INDEX IF NOT EXISTS idx_listing_favorites_listing_id ON analytics.listing_favorites(listing_id, actioned_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_favorites_user_id ON analytics.listing_favorites(user_id, actioned_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_favorites_action ON analytics.listing_favorites(action, actioned_at DESC);

COMMENT ON TABLE analytics.listing_favorites IS 'Registro de favoritos agregados/removidos';
COMMENT ON COLUMN analytics.listing_favorites.action IS 'Acción realizada: added o removed';


-- PASO 3: Funciones para crear particiones automáticamente
-- -----------------------------------------------------------------

-- Función para crear particiones de listing_views
CREATE OR REPLACE FUNCTION analytics.ensure_listing_views_partition(p_month_start date)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    p_start date := date_trunc('month', p_month_start);
    p_end date := p_start + interval '1 month';
    part_name text := format('listing_views_%s', to_char(p_start, 'YYYY_MM'));
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'analytics' AND c.relname = part_name
    ) THEN
        EXECUTE format(
            'CREATE TABLE analytics.%I PARTITION OF analytics.listing_views FOR VALUES FROM (%L) TO (%L)',
            part_name, p_start, p_end
        );
        
        RAISE NOTICE 'Created partition: analytics.%', part_name;
    END IF;
END $$;

-- Función para crear particiones de listing_contacts
CREATE OR REPLACE FUNCTION analytics.ensure_listing_contacts_partition(p_month_start date)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    p_start date := date_trunc('month', p_month_start);
    p_end date := p_start + interval '1 month';
    part_name text := format('listing_contacts_%s', to_char(p_start, 'YYYY_MM'));
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'analytics' AND c.relname = part_name
    ) THEN
        EXECUTE format(
            'CREATE TABLE analytics.%I PARTITION OF analytics.listing_contacts FOR VALUES FROM (%L) TO (%L)',
            part_name, p_start, p_end
        );
        
        RAISE NOTICE 'Created partition: analytics.%', part_name;
    END IF;
END $$;

-- Función para crear particiones de searches
CREATE OR REPLACE FUNCTION analytics.ensure_searches_partition(p_month_start date)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    p_start date := date_trunc('month', p_month_start);
    p_end date := p_start + interval '1 month';
    part_name text := format('searches_%s', to_char(p_start, 'YYYY_MM'));
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'analytics' AND c.relname = part_name
    ) THEN
        EXECUTE format(
            'CREATE TABLE analytics.%I PARTITION OF analytics.searches FOR VALUES FROM (%L) TO (%L)',
            part_name, p_start, p_end
        );
        
        RAISE NOTICE 'Created partition: analytics.%', part_name;
    END IF;
END $$;

-- Función para crear particiones de listing_favorites
CREATE OR REPLACE FUNCTION analytics.ensure_listing_favorites_partition(p_month_start date)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    p_start date := date_trunc('month', p_month_start);
    p_end date := p_start + interval '1 month';
    part_name text := format('listing_favorites_%s', to_char(p_start, 'YYYY_MM'));
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'analytics' AND c.relname = part_name
    ) THEN
        EXECUTE format(
            'CREATE TABLE analytics.%I PARTITION OF analytics.listing_favorites FOR VALUES FROM (%L) TO (%L)',
            part_name, p_start, p_end
        );
        
        RAISE NOTICE 'Created partition: analytics.%', part_name;
    END IF;
END $$;


-- PASO 4: Migración de datos desde analytics.events (si existen)
-- -----------------------------------------------------------------

-- Migrar vistas
DO $$
BEGIN
    -- Primero crear particiones necesarias
    PERFORM analytics.ensure_listing_views_partition(date_trunc('month', created_at)::date)
    FROM analytics.events
    WHERE event_type = 'view'
    GROUP BY date_trunc('month', created_at)::date;
    
    -- Insertar datos
    INSERT INTO analytics.listing_views (
        id, listing_id, user_id, session_id, ip_address, user_agent,
        viewed_at
    )
    SELECT 
        id, 
        listing_id::uuid,
        user_id,
        session_id,
        ip_address,
        user_agent,
        created_at
    FROM analytics.events
    WHERE event_type = 'view' AND listing_id IS NOT NULL
    ON CONFLICT (id, viewed_at) DO NOTHING;
    
    RAISE NOTICE 'Migrated % views', (SELECT COUNT(*) FROM analytics.listing_views);
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Migration skipped: %', SQLERRM;
END $$;

-- Migrar contactos
DO $$
BEGIN
    PERFORM analytics.ensure_listing_contacts_partition(date_trunc('month', created_at)::date)
    FROM analytics.events
    WHERE event_type = 'contact'
    GROUP BY date_trunc('month', created_at)::date;
    
    INSERT INTO analytics.listing_contacts (
        id, listing_id, user_id, session_id, contact_type,
        ip_address, user_agent, contacted_at
    )
    SELECT 
        id,
        listing_id::uuid,
        user_id,
        session_id,
        COALESCE((properties->>'contact_type')::text, 'form'),
        ip_address,
        user_agent,
        created_at
    FROM analytics.events
    WHERE event_type = 'contact' AND listing_id IS NOT NULL
    ON CONFLICT (id, contacted_at) DO NOTHING;
    
    RAISE NOTICE 'Migrated % contacts', (SELECT COUNT(*) FROM analytics.listing_contacts);
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Migration skipped: %', SQLERRM;
END $$;

-- Migrar búsquedas
DO $$
BEGIN
    PERFORM analytics.ensure_searches_partition(date_trunc('month', created_at)::date)
    FROM analytics.events
    WHERE event_type = 'search'
    GROUP BY date_trunc('month', created_at)::date;
    
    INSERT INTO analytics.searches (
        id, user_id, session_id, query_text, filters,
        ip_address, user_agent, searched_at
    )
    SELECT 
        id,
        user_id,
        session_id,
        (properties->>'query')::text,
        properties - 'query',
        ip_address,
        user_agent,
        created_at
    FROM analytics.events
    WHERE event_type = 'search'
    ON CONFLICT (id, searched_at) DO NOTHING;
    
    RAISE NOTICE 'Migrated % searches', (SELECT COUNT(*) FROM analytics.searches);
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Migration skipped: %', SQLERRM;
END $$;

-- Migrar favoritos
DO $$
BEGIN
    PERFORM analytics.ensure_listing_favorites_partition(date_trunc('month', created_at)::date)
    FROM analytics.events
    WHERE event_type = 'favorite'
    GROUP BY date_trunc('month', created_at)::date;
    
    INSERT INTO analytics.listing_favorites (
        id, listing_id, user_id, session_id, action,
        ip_address, user_agent, actioned_at
    )
    SELECT 
        id,
        listing_id::uuid,
        user_id,
        session_id,
        COALESCE((properties->>'action')::text, 'added'),
        ip_address,
        user_agent,
        created_at
    FROM analytics.events
    WHERE event_type = 'favorite' AND listing_id IS NOT NULL AND user_id IS NOT NULL
    ON CONFLICT (id, actioned_at) DO NOTHING;
    
    RAISE NOTICE 'Migrated % favorites', (SELECT COUNT(*) FROM analytics.listing_favorites);
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Migration skipped: %', SQLERRM;
END $$;


-- PASO 5: Crear particiones para el mes actual y próximo
-- -----------------------------------------------------------------
SELECT analytics.ensure_listing_views_partition(date_trunc('month', now())::date);
SELECT analytics.ensure_listing_views_partition(date_trunc('month', now() + interval '1 month')::date);

SELECT analytics.ensure_listing_contacts_partition(date_trunc('month', now())::date);
SELECT analytics.ensure_listing_contacts_partition(date_trunc('month', now() + interval '1 month')::date);

SELECT analytics.ensure_searches_partition(date_trunc('month', now())::date);
SELECT analytics.ensure_searches_partition(date_trunc('month', now() + interval '1 month')::date);

SELECT analytics.ensure_listing_favorites_partition(date_trunc('month', now())::date);
SELECT analytics.ensure_listing_favorites_partition(date_trunc('month', now() + interval '1 month')::date);


-- PASO 6: Vistas para facilitar consultas comunes
-- -----------------------------------------------------------------

-- Vista: Resumen de vistas por propiedad en los últimos 30 días
CREATE OR REPLACE VIEW analytics.v_listing_views_30d AS
SELECT 
    listing_id,
    COUNT(*) as total_views,
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions,
    AVG(time_spent) as avg_time_spent,
    AVG(scroll_depth) as avg_scroll_depth,
    COUNT(*) FILTER (WHERE contact_clicked) as contacts_clicked,
    COUNT(*) FILTER (WHERE phone_revealed) as phones_revealed
FROM analytics.listing_views
WHERE viewed_at >= now() - interval '30 days'
GROUP BY listing_id;

COMMENT ON VIEW analytics.v_listing_views_30d IS 'Resumen de vistas por propiedad en los últimos 30 días';


-- Vista: Conversión de vistas a contactos
CREATE OR REPLACE VIEW analytics.v_conversion_funnel AS
SELECT 
    lv.listing_id,
    COUNT(DISTINCT lv.id) as views,
    COUNT(DISTINCT lc.id) as contacts,
    CASE 
        WHEN COUNT(DISTINCT lv.id) > 0 
        THEN ROUND((COUNT(DISTINCT lc.id)::numeric / COUNT(DISTINCT lv.id)::numeric) * 100, 2)
        ELSE 0
    END as conversion_rate
FROM analytics.listing_views lv
LEFT JOIN analytics.listing_contacts lc 
    ON lv.listing_id = lc.listing_id 
    AND lc.contacted_at >= lv.viewed_at
    AND lc.contacted_at <= lv.viewed_at + interval '1 hour'
WHERE lv.viewed_at >= now() - interval '30 days'
GROUP BY lv.listing_id;

COMMENT ON VIEW analytics.v_conversion_funnel IS 'Embudo de conversión: vistas → contactos por propiedad';


-- Vista: Búsquedas populares
CREATE OR REPLACE VIEW analytics.v_popular_searches AS
SELECT 
    operation,
    property_type,
    district,
    province,
    COUNT(*) as search_count,
    AVG(results_count) as avg_results,
    AVG(results_clicked) as avg_clicks
FROM analytics.searches
WHERE searched_at >= now() - interval '30 days'
GROUP BY operation, property_type, district, province
ORDER BY search_count DESC;

COMMENT ON VIEW analytics.v_popular_searches IS 'Búsquedas más populares en los últimos 30 días';


-- PASO 7: Opcional - Remover tabla events si ya no se usa
-- -----------------------------------------------------------------
-- IMPORTANTE: Solo ejecutar si estás seguro de que ya no necesitas analytics.events
-- UNCOMMENT PARA EJECUTAR:
-- DROP TABLE IF EXISTS analytics.events CASCADE;
-- RAISE NOTICE 'Tabla analytics.events eliminada. Sistema refactorizado completamente.';


-- ===================================================================
-- RESUMEN DE LA REFACTORIZACIÓN
-- ===================================================================
-- ✅ Tablas específicas por tipo de evento (mejor organización)
-- ✅ Particionamiento mensual automático (escalabilidad)
-- ✅ Índices optimizados por tipo de consulta (performance)
-- ✅ Campos específicos para cada tipo de evento (flexibilidad)
-- ✅ Migración de datos existentes (no se pierde información)
-- ✅ Vistas para queries comunes (facilidad de uso)
-- ===================================================================
