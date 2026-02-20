-- ===== Real Estate Marketplace MVP - User Interaction Tables =====
-- Leads, favorites, alerts, and user behavior tracking

-- Leads (contact inquiries) with monthly partitioning
CREATE TABLE IF NOT EXISTS core.leads (
    id                  UUID DEFAULT gen_random_uuid(),
    listing_id          UUID NOT NULL,
    listing_created_at  TIMESTAMPTZ NOT NULL, -- For FK to partitioned table
    user_id             UUID REFERENCES core.users(id) ON DELETE SET NULL,
    contact_name        TEXT NOT NULL,
    contact_email       CITEXT NOT NULL,
    contact_phone       TEXT,
    message             TEXT,
    source              TEXT DEFAULT 'web',
    utm_source          TEXT,
    utm_medium          TEXT,
    utm_campaign        TEXT,
    ip_address          INET,
    user_agent          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Primary key must include partition column
    PRIMARY KEY (id, created_at),
    
    -- Foreign key to partitioned table
    CONSTRAINT leads_listing_fk FOREIGN KEY (listing_id, listing_created_at) 
        REFERENCES core.listings(id, created_at) ON DELETE CASCADE
) PARTITION BY RANGE (created_at);

-- Partition helper for leads
CREATE OR REPLACE FUNCTION core.ensure_leads_partition(p_month_start date)
RETURNS void LANGUAGE plpgsql AS $leads_func$
DECLARE
    p_start date := date_trunc('month', p_month_start);
    p_end date := p_start + interval '1 month';
    part_name text := format('core.leads_%s', to_char(p_start, 'YYYY_MM'));
    part_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'core' AND c.relname = right(part_name, -5)
    ) INTO part_exists;
    
    IF NOT part_exists THEN
        EXECUTE format($create_partition$
            CREATE TABLE %I PARTITION OF core.leads
            FOR VALUES FROM ('%s') TO ('%s')
        $create_partition$, part_name, p_start, p_end);
        
        -- Create indexes on the partition
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_listing_created_idx ON %I(listing_id, listing_created_at, created_at DESC)', 
                      replace(part_name, '.', '_'), part_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_user_created_idx ON %I(user_id, created_at DESC)', 
                      replace(part_name, '.', '_'), part_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_source_idx ON %I(source, created_at DESC)', 
                      replace(part_name, '.', '_'), part_name);
    END IF;
END $leads_func$;

-- Create partitions
SELECT core.ensure_leads_partition(date_trunc('month', now())::date);
SELECT core.ensure_leads_partition(date_trunc('month', now() + interval '1 month')::date);

-- Favorites
CREATE TABLE IF NOT EXISTS core.favorites (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    listing_id          UUID NOT NULL,
    listing_created_at  TIMESTAMPTZ NOT NULL, -- For FK to partitioned table
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Foreign key to partitioned table
    CONSTRAINT favorites_listing_fk FOREIGN KEY (listing_id, listing_created_at) 
        REFERENCES core.listings(id, created_at) ON DELETE CASCADE,
        
    -- Unique constraint
    UNIQUE(user_id, listing_id, listing_created_at)
);
CREATE INDEX IF NOT EXISTS favorites_user_idx ON core.favorites(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS favorites_listing_idx ON core.favorites(listing_id, listing_created_at);

-- Search alerts
CREATE TABLE IF NOT EXISTS core.alerts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    search_params       JSONB NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    frequency           TEXT NOT NULL DEFAULT 'daily',
    last_notified_at    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS alerts_user_active_idx ON core.alerts(user_id, is_active);
CREATE INDEX IF NOT EXISTS alerts_search_gin_idx ON core.alerts USING gin(search_params);

-- Amenities system
CREATE TABLE IF NOT EXISTS core.amenities (
    id      SERIAL PRIMARY KEY,
    name    TEXT NOT NULL UNIQUE,
    icon    TEXT
);

CREATE TABLE IF NOT EXISTS core.listing_amenities (
    listing_id          UUID NOT NULL,
    listing_created_at  TIMESTAMPTZ NOT NULL, -- For FK to partitioned table
    amenity_id          INTEGER NOT NULL REFERENCES core.amenities(id) ON DELETE CASCADE,
    
    -- Foreign key to partitioned table
    CONSTRAINT listing_amenities_listing_fk FOREIGN KEY (listing_id, listing_created_at) 
        REFERENCES core.listings(id, created_at) ON DELETE CASCADE,
        
    PRIMARY KEY (listing_id, listing_created_at, amenity_id)
);
CREATE INDEX IF NOT EXISTS listing_amenities_listing_idx ON core.listing_amenities(listing_id, listing_created_at);
CREATE INDEX IF NOT EXISTS listing_amenities_amenity_idx ON core.listing_amenities(amenity_id);
