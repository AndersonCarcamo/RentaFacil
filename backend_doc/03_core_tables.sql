-- ===== Real Estate Marketplace MVP - Core Tables =====
-- Users, agencies, listings, and basic marketplace functionality

-- Users and authentication
CREATE TABLE IF NOT EXISTS core.users (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid            TEXT UNIQUE,
    email                   CITEXT UNIQUE NOT NULL,
    phone                   TEXT,
    first_name              TEXT,
    last_name               TEXT,
    profile_picture_url     TEXT,
    national_id             TEXT,
    national_id_type        TEXT DEFAULT 'DNI',
    is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    role                    core.user_role NOT NULL DEFAULT 'user',
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at           TIMESTAMPTZ,
    login_count             INTEGER NOT NULL DEFAULT 0,
    
    -- Search optimization
    CONSTRAINT users_email_domain_check CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$')
);
CREATE INDEX IF NOT EXISTS users_firebase_uid_idx ON core.users(firebase_uid);
CREATE INDEX IF NOT EXISTS users_email_idx ON core.users(email);
CREATE INDEX IF NOT EXISTS users_phone_idx ON core.users(phone);

-- Agencies
CREATE TABLE IF NOT EXISTS core.agencies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    email           CITEXT,
    phone           TEXT,
    website         TEXT,
    address         TEXT,
    description     TEXT,
    logo_url        TEXT,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User-Agency relationships (many-to-many)
CREATE TABLE IF NOT EXISTS core.user_agency (
    user_id     UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    agency_id   UUID NOT NULL REFERENCES core.agencies(id) ON DELETE CASCADE,
    role        TEXT DEFAULT 'agent',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, agency_id)
);

-- Main listings table with monthly partitioning
CREATE TABLE IF NOT EXISTS core.listings (
    id                              UUID DEFAULT gen_random_uuid(),
    owner_user_id                   UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    agency_id                       UUID REFERENCES core.agencies(id),
    
    -- Basic property info
    title                           TEXT NOT NULL,
    description                     TEXT,
    operation                       core.operation_type NOT NULL,
    property_type                   core.property_type NOT NULL,
    advertiser_type                 core.advertiser_type NOT NULL DEFAULT 'owner',
    
    -- Location (Peru-focused)
    country                         TEXT NOT NULL DEFAULT 'PE',
    department                      TEXT,
    province                        TEXT,
    district                        TEXT,
    address                         TEXT,
    latitude                        DECIMAL(10,8),
    longitude                       DECIMAL(11,8),
    
    -- Property details
    price                           NUMERIC(12,2) NOT NULL,
    currency                        CHAR(3) NOT NULL DEFAULT 'PEN',
    area_built                      NUMERIC(8,2),
    area_total                      NUMERIC(8,2),
    bedrooms                        INTEGER,
    bathrooms                       INTEGER,
    parking_spots                   INTEGER,
    floors                          INTEGER,
    floor_number                    INTEGER,
    age_years                       INTEGER,
    rental_term                     core.rental_term,
    
    -- Verification and status
    verification_status             core.verification_status NOT NULL DEFAULT 'pending',
    status                          core.listing_status NOT NULL DEFAULT 'draft',
    
    -- Contact information with WhatsApp integration
    contact_name                    TEXT,
    contact_phone_e164              TEXT,
    contact_whatsapp_phone_e164     TEXT,
    contact_whatsapp_link           TEXT,
    
    -- SEO and search
    slug                            TEXT,
    meta_title                      TEXT,
    meta_description                TEXT,
    search_doc                      TSVECTOR,
    has_media                       BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Publishing control
    published_at                    TIMESTAMPTZ,
    published_until                 TIMESTAMPTZ,
    views_count                     INTEGER NOT NULL DEFAULT 0,
    leads_count                     INTEGER NOT NULL DEFAULT 0,
    favorites_count                 INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Primary key must include partition column
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Partition helper function
CREATE OR REPLACE FUNCTION core.ensure_listings_partition(p_month_start date)
RETURNS void LANGUAGE plpgsql AS $partition_func$
DECLARE
    p_start date := date_trunc('month', p_month_start);
    p_end date := p_start + interval '1 month';
    part_name text := format('core.listings_%s', to_char(p_start, 'YYYY_MM'));
    part_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'core' AND c.relname = right(part_name, -5)  -- remove 'core.'
    ) INTO part_exists;
    
    IF NOT part_exists THEN
        EXECUTE format($create_table$
            CREATE TABLE %I PARTITION OF core.listings
            FOR VALUES FROM ('%s') TO ('%s')
        $create_table$, part_name, p_start, p_end);
        
        -- Create indexes on the partition
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_owner_created_idx ON %I(owner_user_id, created_at DESC)', 
                      replace(part_name, '.', '_'), part_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_location_idx ON %I(district, province, operation, property_type)', 
                      replace(part_name, '.', '_'), part_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_price_idx ON %I(operation, property_type, price)', 
                      replace(part_name, '.', '_'), part_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_search_idx ON %I USING gin(search_doc)', 
                      replace(part_name, '.', '_'), part_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_status_idx ON %I(status, verification_status, published_at)', 
                      replace(part_name, '.', '_'), part_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I_geo_idx ON %I(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL', 
                      replace(part_name, '.', '_'), part_name);
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS %I_slug_idx ON %I(slug, created_at) WHERE slug IS NOT NULL', 
                      replace(part_name, '.', '_'), part_name);
    END IF;
END $partition_func$;

-- Create current and next month partition
SELECT core.ensure_listings_partition(date_trunc('month', now())::date);
SELECT core.ensure_listings_partition(date_trunc('month', now() + interval '1 month')::date);

-- Indexes on the main table (inherited by partitions)
CREATE INDEX IF NOT EXISTS listings_published_idx ON core.listings(status, verification_status, published_at DESC)
WHERE status = 'published';

-- Unique constraints that include partition key
CREATE UNIQUE INDEX IF NOT EXISTS listings_slug_created_idx ON core.listings(slug, created_at) 
WHERE slug IS NOT NULL;

-- Published listings view for public access
CREATE OR REPLACE VIEW core.v_published_listings AS
SELECT *
FROM core.listings
WHERE status = 'published'
    AND (verification_status = 'verified')
    AND published_at IS NOT NULL
    AND (published_until IS NULL OR published_until > now());

-- Images
CREATE TABLE IF NOT EXISTS core.images (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id          UUID NOT NULL,
    listing_created_at  TIMESTAMPTZ NOT NULL, -- Needed for FK to partitioned table
    filename            TEXT NOT NULL,
    original_url        TEXT NOT NULL,
    thumbnail_url       TEXT,
    medium_url          TEXT,
    display_order       INTEGER NOT NULL DEFAULT 0,
    alt_text            TEXT,
    width               INTEGER,
    height              INTEGER,
    file_size           INTEGER,
    is_main             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Foreign key to partitioned table
    CONSTRAINT images_listing_fk FOREIGN KEY (listing_id, listing_created_at) 
        REFERENCES core.listings(id, created_at) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS images_listing_idx ON core.images(listing_id, display_order);

-- Videos
CREATE TABLE IF NOT EXISTS core.videos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id          UUID NOT NULL,
    listing_created_at  TIMESTAMPTZ NOT NULL, -- Needed for FK to partitioned table
    filename            TEXT NOT NULL,
    original_url        TEXT NOT NULL,
    thumbnail_url       TEXT,
    duration_seconds    INTEGER,
    file_size           INTEGER,
    width               INTEGER,
    height              INTEGER,
    display_order       INTEGER NOT NULL DEFAULT 0,
    is_main             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Foreign key to partitioned table
    CONSTRAINT videos_listing_fk FOREIGN KEY (listing_id, listing_created_at) 
        REFERENCES core.listings(id, created_at) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS videos_listing_idx ON core.videos(listing_id, display_order);
