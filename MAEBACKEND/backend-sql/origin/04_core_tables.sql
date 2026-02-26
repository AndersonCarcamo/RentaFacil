-- ===== Real Estate Marketplace MVP - Core Tables =====
-- Users, agencies, listings, and basic marketplace functionality

BEGIN;

-- Users and authentication
CREATE TABLE IF NOT EXISTS core.users (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid            TEXT UNIQUE,
    bio                     TEXT,
    email                   CITEXT UNIQUE NOT NULL,
    phone                   TEXT,
    first_name              TEXT,
    last_name               TEXT,
    profile_picture_url     TEXT,
    national_id             TEXT,
    national_id_type        TEXT DEFAULT 'DNI',
    email_verified          BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    role                    core.user_role NOT NULL DEFAULT 'user',
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at           TIMESTAMPTZ,
    login_count             INTEGER NOT NULL DEFAULT 0,
    search_doc              TSVECTOR,

    -- Search optimization
    CONSTRAINT users_email_domain_check CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$')
);
CREATE INDEX IF NOT EXISTS users_firebase_uid_idx ON core.users(firebase_uid);
CREATE INDEX IF NOT EXISTS users_email_idx ON core.users(email);
CREATE INDEX IF NOT EXISTS users_phone_idx ON core.users(phone);

-- Keep search_doc updated
CREATE OR REPLACE FUNCTION core.users_search_doc_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.search_doc :=
        setweight(to_tsvector('spanish', coalesce(NEW.first_name, '')), 'A') ||
        setweight(to_tsvector('spanish', coalesce(NEW.last_name, '')),  'A') ||
        setweight(to_tsvector('simple',  coalesce(NEW.email::text, '')), 'B') ||
        setweight(to_tsvector('simple',  coalesce(NEW.phone, '')),       'B') ||
        setweight(to_tsvector('spanish', coalesce(NEW.bio, '')),         'C') ||
        setweight(to_tsvector('simple',  coalesce(NEW.national_id, '')), 'C');
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_search_doc_update ON core.users;
CREATE TRIGGER trg_users_search_doc_update
BEFORE INSERT OR UPDATE OF first_name, last_name, email, phone, bio, national_id
ON core.users
FOR EACH ROW
EXECUTE FUNCTION core.users_search_doc_update();

-- Full-text index
CREATE INDEX IF NOT EXISTS users_search_doc_idx
ON core.users USING gin(search_doc);

-- Fuzzy similarity index (for typo-tolerant search)
CREATE INDEX IF NOT EXISTS users_similarity_trgm_idx
ON core.users
USING gin (
    lower(
        coalesce(first_name, '') || ' ' ||
        coalesce(last_name, '')  || ' ' ||
        coalesce(email::text, '')|| ' ' ||
        coalesce(phone, '')      || ' ' ||
        coalesce(national_id, '')
    ) gin_trgm_ops
);

-- Agencies
CREATE TABLE IF NOT EXISTS core.agencies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    ruc             TEXT UNIQUE,
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

-- Un usuario solo puede ser dueño de una agencia
CREATE UNIQUE INDEX IF NOT EXISTS user_agency_owner_unique_idx 
ON core.user_agency(user_id) 
WHERE role = 'owner';

-- Solo un owner por agencia
CREATE UNIQUE INDEX IF NOT EXISTS user_agency_single_owner_idx 
ON core.user_agency(agency_id) 
WHERE role = 'owner';

-----------------------------------------------------------

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
    rental_mode                     core.rental_mode DEFAULT 'full_property',
    rental_model                    core.rental_model DEFAULT 'traditional', -- "typeairbnb" for short-term rentals, "traditional" for long-term
    furnished                       BOOLEAN DEFAULT FALSE, -- Indicates if property comes furnished
    pets_allowed                    BOOLEAN,
    pet_friendly                    BOOLEAN DEFAULT NULL, -- Indicates if the property is pet-friendly (true), not pet-friendly (false), or unknown (null)

    -- Verification and status
    verification_status             core.verification_status NOT NULL DEFAULT 'pending',
    status                          core.listing_status NOT NULL DEFAULT 'draft',
    
    -- Contact information with WhatsApp integration
    contact_name                    TEXT,
    contact_phone_e164              TEXT,
    contact_whatsapp_phone_e164     TEXT,
    contact_whatsapp_link           TEXT,
    contact_email                   CITEXT,
    
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

    -- Temporal listings Info
    airbnb_score                    INTEGER CHECK (airbnb_score >= 0 AND airbnb_score <= 100),
    airbnb_eligible                 BOOLEAN DEFAULT NULL,
    airbnb_opted_out                BOOLEAN NOT NULL DEFAULT FALSE,
    max_guests                      INTEGER CHECK (max_guests >= 1 AND max_guests <= 50),
    smoking_allowed                 BOOLEAN DEFAULT NULL,
    deposit_required                BOOLEAN DEFAULT FALSE,
    deposit_amount                  NUMERIC(12,2) CHECK (deposit_amount >= 0),
    minimum_stay_nights             INTEGER CHECK (minimum_stay_nights >= 1 AND minimum_stay_nights <= 365),
    maximum_stay_nights             INTEGER CHECK (maximum_stay_nights >= 1 AND maximum_stay_nights <= 365),
    check_in_time                   TIME,
    check_out_time                  TIME,
    cleaning_included               BOOLEAN DEFAULT FALSE,
    cleaning_fee                    NUMERIC(12,2) CHECK (cleaning_fee >= 0),
    utilities_included              BOOLEAN DEFAULT FALSE,
    internet_included               BOOLEAN DEFAULT FALSE,
    house_rules                     TEXT,
    cancellation_policy             TEXT,
    available_from                  DATE,

    -- Temporal listing analytics (for trending calculations)
    rating                          NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5),
    total_reviews                   INTEGER NOT NULL DEFAULT 0,

    -- Primary key must include partition column
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Agregar comentarios
COMMENT ON COLUMN core.listings.rating IS 'Calificación promedio de la propiedad (0.00 - 5.00), calculado automáticamente desde las reseñas';
COMMENT ON COLUMN core.listings.total_reviews IS 'Número total de reseñas/comentarios de la propiedad';
COMMENT ON COLUMN core.listings.max_guests IS 'Número máximo de huéspedes permitidos (para propiedades tipo Airbnb con rental_term=daily)';
COMMENT ON COLUMN core.listings.smoking_allowed IS 'Indica si se permite fumar en la propiedad';
COMMENT ON COLUMN core.listings.deposit_required IS 'Indica si se requiere depósito para la propiedad';
COMMENT ON COLUMN core.listings.deposit_amount IS 'Monto del depósito requerido (si aplica)';
COMMENT ON COLUMN core.listings.smoking_allowed IS 'Indica si se permite fumar en la propiedad';
COMMENT ON COLUMN core.listings.deposit_required IS 'Indica si se requiere depósito de garantía';
COMMENT ON COLUMN core.listings.deposit_amount IS 'Monto del depósito de garantía requerido';
COMMENT ON COLUMN core.listings.minimum_stay_nights IS 'Número mínimo de noches para estadía (útil para Airbnb)';
COMMENT ON COLUMN core.listings.maximum_stay_nights IS 'Número máximo de noches para estadía';
COMMENT ON COLUMN core.listings.check_in_time IS 'Hora de check-in (para Airbnb/short-term rentals)';
COMMENT ON COLUMN core.listings.check_out_time IS 'Hora de check-out (para Airbnb/short-term rentals)';
COMMENT ON COLUMN core.listings.max_guests IS 'Número máximo de huéspedes permitidos';
COMMENT ON COLUMN core.listings.cleaning_included IS 'Indica si el servicio de limpieza está incluido';
COMMENT ON COLUMN core.listings.cleaning_fee IS 'Tarifa adicional por servicio de limpieza';
COMMENT ON COLUMN core.listings.utilities_included IS 'Indica si los servicios (luz, agua, gas) están incluidos en el precio';
COMMENT ON COLUMN core.listings.internet_included IS 'Indica si el servicio de internet está incluido';
COMMENT ON COLUMN core.listings.house_rules IS 'Reglas de la casa en texto libre';
COMMENT ON COLUMN core.listings.cancellation_policy IS 'Política de cancelación (flexible, moderate, strict)';
COMMENT ON COLUMN core.listings.available_from IS 'Fecha desde la cual la propiedad está disponible';
COMMENT ON COLUMN core.listings.airbnb_score IS 'Score de elegibilidad Airbnb (0-100) calculado automáticamente';
COMMENT ON COLUMN core.listings.airbnb_eligible IS 'Si la propiedad es elegible para funcionar como Airbnb';
COMMENT ON COLUMN core.listings.airbnb_opted_out IS 'Si el propietario optó por NO permitir uso como Airbnb';
COMMENT ON COLUMN core.listings.rental_mode IS 'Modalidad de alquiler: full_property, private_room, shared_room';
COMMENT ON COLUMN core.listings.contact_email IS 
'Email de contacto para la propiedad. Puede ser diferente al email del propietario. '
'Este campo permite que el propietario especifique un email de contacto alternativo '
'para consultas sobre esta propiedad específica.';


CREATE INDEX listings_furnished_idx 
ON core.listings(furnished, operation, property_type) 
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS listings_operation_property_idx 
ON core.listings(operation, property_type, furnished) 
WHERE status = 'published';

-- Indexes on the main table (inherited by partitions)
CREATE INDEX IF NOT EXISTS listings_published_idx 
ON core.listings(status, verification_status, published_at DESC)
WHERE status = 'published';

CREATE INDEX idx_listings_contact_email 
ON core.listings (contact_email) 
WHERE contact_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS listings_pet_friendly_idx 
ON core.listings(pet_friendly) 
WHERE pet_friendly IS NOT NULL;

CREATE INDEX listings_room_furnished_idx 
ON core.listings(property_type, furnished, district, price)
WHERE property_type = 'room' AND status = 'published';

CREATE INDEX listings_rental_model_idx 
ON core.listings(rental_model, operation, property_type);

CREATE INDEX IF NOT EXISTS idx_listings_airbnb_availability 
ON core.listings (operation, airbnb_eligible, airbnb_opted_out, status)
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_listings_airbnb_score 
ON core.listings (airbnb_score, operation)
WHERE airbnb_eligible = true AND airbnb_opted_out = false AND status = 'published';

CREATE INDEX IF NOT EXISTS idx_listings_hybrid_search 
ON core.listings (rental_model, operation, airbnb_eligible, status)
WHERE status = 'published';

ANALYZE core.listings;

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

-- Reviews
CREATE TABLE IF NOT EXISTS core.reviews (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id              UUID NOT NULL,
    listing_created_at      TIMESTAMPTZ NOT NULL,
    
    -- Información del revisor
    reviewer_user_id        UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    reviewer_name           TEXT,
    reviewer_avatar_url     TEXT,
    
    -- Rating y contenido
    rating                  NUMERIC(3,2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    title                   TEXT,
    comment                 TEXT NOT NULL,
    
    -- Ratings por categoría (opcional, útil para Airbnb)
    rating_cleanliness      NUMERIC(3,2) CHECK (rating_cleanliness >= 0 AND rating_cleanliness <= 5),
    rating_communication    NUMERIC(3,2) CHECK (rating_communication >= 0 AND rating_communication <= 5),
    rating_location         NUMERIC(3,2) CHECK (rating_location >= 0 AND rating_location <= 5),
    rating_value            NUMERIC(3,2) CHECK (rating_value >= 0 AND rating_value <= 5),
    
    -- Verificación y estado
    is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    is_public               BOOLEAN NOT NULL DEFAULT TRUE,
    is_reported             BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Respuesta del propietario
    owner_response          TEXT,
    owner_response_at       TIMESTAMPTZ,
    
    -- Timestamps
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Foreign key a la tabla particionada
    CONSTRAINT reviews_listing_fk FOREIGN KEY (listing_id, listing_created_at) 
        REFERENCES core.listings(id, created_at) ON DELETE CASCADE,
    
    -- Un usuario solo puede hacer una reseña por propiedad
    CONSTRAINT reviews_user_listing_unique UNIQUE (reviewer_user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS reviews_listing_idx ON core.reviews(listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_reviewer_idx ON core.reviews(reviewer_user_id);
CREATE INDEX IF NOT EXISTS reviews_rating_idx ON core.reviews(rating, is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS reviews_verified_idx ON core.reviews(listing_id, is_verified) WHERE is_verified = true;

CREATE OR REPLACE FUNCTION core.update_listing_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $update_rating$
DECLARE
    avg_rating NUMERIC(3,2);
    review_count INTEGER;
BEGIN
    -- Calcular el promedio de ratings públicos
    SELECT 
        ROUND(AVG(rating)::numeric, 2),
        COUNT(*)
    INTO avg_rating, review_count
    FROM core.reviews
    WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id)
      AND is_public = true;
    
    -- Actualizar el listing
    UPDATE core.listings
    SET rating = avg_rating,
        total_reviews = review_count,
        updated_at = now()
    WHERE id = COALESCE(NEW.listing_id, OLD.listing_id);
    
    RETURN COALESCE(NEW, OLD);
END $update_rating$;

CREATE TRIGGER trigger_update_listing_rating_insert
AFTER INSERT ON core.reviews
FOR EACH ROW
EXECUTE FUNCTION core.update_listing_rating();

CREATE TRIGGER trigger_update_listing_rating_update
AFTER UPDATE OF rating, is_public ON core.reviews
FOR EACH ROW
EXECUTE FUNCTION core.update_listing_rating();

CREATE TRIGGER trigger_update_listing_rating_delete
AFTER DELETE ON core.reviews
FOR EACH ROW
EXECUTE FUNCTION core.update_listing_rating();

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
