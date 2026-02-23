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
