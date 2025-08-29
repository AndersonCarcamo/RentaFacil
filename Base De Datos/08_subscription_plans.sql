-- ===== Real Estate Marketplace MVP - Subscription Plans System =====
-- Plans, subscriptions, and user plan management

-- Subscription plans
CREATE TABLE IF NOT EXISTS core.plans (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                        TEXT NOT NULL UNIQUE,
    name                        TEXT NOT NULL,
    description                 TEXT,
    tier                        core.plan_tier NOT NULL,
    period                      core.plan_period NOT NULL,
    period_months               INTEGER NOT NULL DEFAULT 1,
    price_amount                NUMERIC(10,2) NOT NULL DEFAULT 0,
    price_currency              CHAR(3) NOT NULL DEFAULT 'PEN',
    
    -- Plan limits and features
    max_active_listings         INTEGER NOT NULL DEFAULT 1,
    listing_active_days         INTEGER NOT NULL DEFAULT 30,
    max_images_per_listing      INTEGER NOT NULL DEFAULT 5,
    max_videos_per_listing      INTEGER NOT NULL DEFAULT 0,
    max_video_seconds           INTEGER NOT NULL DEFAULT 60,
    max_image_width             INTEGER NOT NULL DEFAULT 1920,
    max_image_height            INTEGER NOT NULL DEFAULT 1080,
    featured_listings           BOOLEAN NOT NULL DEFAULT FALSE,
    priority_support            BOOLEAN NOT NULL DEFAULT FALSE,
    analytics_access            BOOLEAN NOT NULL DEFAULT FALSE,
    api_access                  BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- System flags
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    is_default                  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS plans_tier_active_idx ON core.plans(tier, is_active);

-- User subscriptions
CREATE TABLE IF NOT EXISTS core.subscriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    plan_id                 UUID NOT NULL REFERENCES core.plans(id),
    status                  core.subscription_status NOT NULL DEFAULT 'active',
    
    -- Billing periods
    current_period_start    TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_end      TIMESTAMPTZ NOT NULL,
    trial_start             TIMESTAMPTZ,
    trial_end               TIMESTAMPTZ,
    
    -- External billing integration
    external_subscription_id TEXT,
    cancel_at_period_end    BOOLEAN NOT NULL DEFAULT FALSE,
    canceled_at             TIMESTAMPTZ,
    
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_user_status_idx ON core.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS subscriptions_period_idx ON core.subscriptions(current_period_start, current_period_end);

-- Tax rates for billing
CREATE TABLE IF NOT EXISTS core.tax_rates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country         CHAR(2) NOT NULL DEFAULT 'PE',
    region          TEXT,
    tax_type        TEXT NOT NULL DEFAULT 'IGV',
    rate            NUMERIC(5,4) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Discount coupons
CREATE TABLE IF NOT EXISTS core.coupons (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                TEXT NOT NULL UNIQUE,
    name                TEXT,
    discount_type       TEXT NOT NULL DEFAULT 'percentage', -- percentage, fixed_amount
    discount_value      NUMERIC(10,2) NOT NULL,
    currency            CHAR(3) DEFAULT 'PEN',
    max_uses            INTEGER,
    uses_count          INTEGER NOT NULL DEFAULT 0,
    valid_from          TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until         TIMESTAMPTZ,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plan association helper views
-- Drop existing view to recreate with new structure
DROP VIEW IF EXISTS core.v_user_current_plan CASCADE;

CREATE VIEW core.v_user_current_plan AS
SELECT s.user_id,
       s.id AS subscription_id,
       p.id AS plan_id,
       p.code AS plan_code,
       p.name AS plan_name,
       p.tier,
       p.period_months,
       p.max_active_listings,
       p.listing_active_days,
       p.max_images_per_listing,
       p.max_videos_per_listing,
       p.max_video_seconds,
       p.max_image_width,
       p.max_image_height,
       p.featured_listings,
       p.priority_support,
       p.analytics_access,
       p.api_access,
       s.current_period_start,
       s.current_period_end,
       s.status
FROM core.subscriptions s
JOIN core.plans p ON p.id = s.plan_id
WHERE s.status IN ('trialing','active')
    AND now() >= s.current_period_start AND now() < s.current_period_end;

-- Drop and recreate dependent view as well
DROP VIEW IF EXISTS core.v_listing_owner_current_plan CASCADE;

CREATE VIEW core.v_listing_owner_current_plan AS
SELECT l.id AS listing_id,
       l.created_at AS listing_created_at,
       l.owner_user_id,
       v.plan_id,
       v.plan_code,
       p.max_active_listings,
       p.listing_active_days,
       p.max_images_per_listing,
       p.max_videos_per_listing,
       p.max_video_seconds,
       p.max_image_width,
       p.max_image_height
FROM core.listings l
JOIN core.v_user_current_plan v ON v.user_id = l.owner_user_id
JOIN core.plans p ON p.id = v.plan_id;
