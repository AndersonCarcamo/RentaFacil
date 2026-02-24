-- =====================================================
-- HOTFIX: Insert individual_free plan
-- =====================================================
-- Description: Creates the mandatory individual_free plan 
-- required by the auto-subscription trigger
-- =====================================================

-- Insert individual_free plan (required by trigger)
INSERT INTO core.plans (
    code, 
    name, 
    description, 
    tier, 
    period, 
    period_months, 
    price_amount, 
    price_currency,
    target_user_type,
    max_active_listings, 
    listing_active_days, 
    max_images_per_listing, 
    max_videos_per_listing,
    max_video_seconds, 
    max_image_width,
    max_image_height,
    featured_listings, 
    priority_support, 
    analytics_access, 
    api_access, 
    is_active,
    is_default
)
VALUES 
(
    'individual-free', 
    'Plan Gratuito Individual', 
    'Plan básico gratuito para usuarios individuales', 
    'individual_free', 
    'permanent', 
    0, 
    0.00, 
    'PEN',
    'individual',
    1,          -- max_active_listings
    30,         -- listing_active_days
    3,          -- max_images_per_listing
    0,          -- max_videos_per_listing
    0,          -- max_video_seconds
    1920,       -- max_image_width
    1080,       -- max_image_height
    false,      -- featured_listings
    false,      -- priority_support
    false,      -- analytics_access
    false,      -- api_access
    true,       -- is_active
    true        -- is_default (this is the default plan for new users)
)
ON CONFLICT (code) DO UPDATE SET
    tier = EXCLUDED.tier,
    target_user_type = EXCLUDED.target_user_type,
    is_active = EXCLUDED.is_active,
    is_default = EXCLUDED.is_default,
    updated_at = NOW();

-- Verify the plan was created
SELECT 
    id,
    code,
    name,
    tier,
    target_user_type,
    is_active,
    is_default,
    created_at
FROM core.plans 
WHERE tier = 'individual_free';

-- Count users without active subscriptions
SELECT COUNT(*) as users_without_subscription
FROM core.users u
LEFT JOIN core.subscriptions s ON s.user_id = u.id AND s.status = 'active'
WHERE s.id IS NULL;
