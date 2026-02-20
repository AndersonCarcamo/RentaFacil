-- ===== Add Airbnb Columns to Listings Table =====
-- Adds the missing columns for the Airbnb opt-out system implementation

BEGIN;

-- Add airbnb_score column (0-100 rating)
ALTER TABLE core.listings 
ADD COLUMN IF NOT EXISTS airbnb_score INTEGER 
CHECK (airbnb_score >= 0 AND airbnb_score <= 100);

-- Add airbnb_eligible column (boolean flag for eligibility)
ALTER TABLE core.listings 
ADD COLUMN IF NOT EXISTS airbnb_eligible BOOLEAN DEFAULT NULL;

-- Add airbnb_opted_out column (user preference to opt-out)
ALTER TABLE core.listings 
ADD COLUMN IF NOT EXISTS airbnb_opted_out BOOLEAN NOT NULL DEFAULT FALSE;

-- Add rental_mode column (missing from previous implementations)
ALTER TABLE core.listings 
ADD COLUMN IF NOT EXISTS rental_mode core.rental_mode DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN core.listings.airbnb_score IS 'Score de elegibilidad Airbnb (0-100) calculado automáticamente';
COMMENT ON COLUMN core.listings.airbnb_eligible IS 'Si la propiedad es elegible para funcionar como Airbnb';
COMMENT ON COLUMN core.listings.airbnb_opted_out IS 'Si el propietario optó por NO permitir uso como Airbnb';
COMMENT ON COLUMN core.listings.rental_mode IS 'Modalidad de alquiler: full_property, private_room, shared_room';

-- Create optimized composite indexes for Airbnb searches
-- Index for general Airbnb availability searches
CREATE INDEX IF NOT EXISTS idx_listings_airbnb_availability 
ON core.listings (operation, airbnb_eligible, airbnb_opted_out, status)
WHERE status = 'published';

-- Index for Airbnb score filtering (only for available Airbnb properties)
CREATE INDEX IF NOT EXISTS idx_listings_airbnb_score 
ON core.listings (airbnb_score, operation)
WHERE airbnb_eligible = true AND airbnb_opted_out = false AND status = 'published';

-- Index for hybrid searches (traditional + available Airbnb)
CREATE INDEX IF NOT EXISTS idx_listings_hybrid_search 
ON core.listings (rental_model, operation, airbnb_eligible, status)
WHERE status = 'published';

-- Update statistics for query planner optimization
ANALYZE core.listings;

COMMIT;