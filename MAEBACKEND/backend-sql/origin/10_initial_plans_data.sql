-- =====================================================
-- INITIAL SUBSCRIPTION PLANS DATA
-- =====================================================
-- Description: Insert all subscription plans with updated tier enum values
-- Tiers: individual_free, individual_basic, individual_premium, 
--        enterprise_premium, enterprise_unlimited
-- =====================================================

-- Delete existing plans (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE core.plans CASCADE;

-- ========== INDIVIDUAL PLANS ==========

-- 1. Individual Free (Default for new users)
INSERT INTO core.plans (
    code, name, description, tier, period, period_months, 
    price_amount, price_currency, target_user_type,
    max_active_listings, listing_active_days, max_images_per_listing, 
    max_videos_per_listing, max_video_seconds, max_image_width, max_image_height,
    featured_listings, priority_support, analytics_access, api_access, 
    is_active, is_default
)
VALUES 
(
    'individual-free', 
    'Plan Gratuito Individual', 
    'Plan básico gratuito para usuarios individuales. Ideal para publicar tu primera propiedad.', 
    'individual_free', 
    'permanent', 
    0, 
    0.00, 
    'PEN',
    'individual',
    1,          -- 1 propiedad activa
    30,         -- 30 días de vigencia
    3,          -- 3 imágenes por propiedad
    0,          -- Sin videos
    0,          -- Sin duración de video
    1920,       -- Ancho máximo de imagen
    1080,       -- Alto máximo de imagen
    false,      -- Sin destacados
    false,      -- Sin soporte prioritario
    false,      -- Sin analytics
    false,      -- Sin API
    true,       -- Activo
    true        -- Plan por defecto
),

-- 2. Individual Basic (Monthly)
(
    'individual-basic-monthly', 
    'Plan Básico Individual (Mensual)', 
    'Plan básico con límites ampliados para propietarios activos.', 
    'individual_basic', 
    'monthly', 
    1, 
    29.90, 
    'PEN',
    'individual',
    5,          -- 5 propiedades activas
    60,         -- 60 días de vigencia
    8,          -- 8 imágenes por propiedad
    1,          -- 1 video por propiedad
    120,        -- 2 minutos de video
    1920,
    1080,
    false,      -- Sin destacados
    false,      -- Sin soporte prioritario
    true,       -- Con analytics básico
    false,      -- Sin API
    true,
    false
),

-- 3. Individual Premium (Monthly)
(
    'individual-premium-monthly', 
    'Plan Premium Individual (Mensual)', 
    'Plan completo para profesionales independientes del sector inmobiliario.', 
    'individual_premium', 
    'monthly', 
    1, 
    99.90, 
    'PEN',
    'individual',
    25,         -- 25 propiedades activas
    90,         -- 90 días de vigencia
    15,         -- 15 imágenes por propiedad
    3,          -- 3 videos por propiedad
    300,        -- 5 minutos de video
    2560,       -- Mayor resolución
    1440,
    true,       -- Publicaciones destacadas
    true,       -- Soporte prioritario
    true,       -- Analytics completo
    false,      -- Sin API (reservado para enterprise)
    true,
    false
),

-- 4. Individual Premium (Yearly - 20% discount)
(
    'individual-premium-yearly', 
    'Plan Premium Individual (Anual)', 
    'Plan anual con 20% de descuento. Ideal para profesionales del sector.', 
    'individual_premium', 
    'yearly', 
    12, 
    959.04,     -- 99.90 * 12 * 0.8 = 959.04
    'PEN',
    'individual',
    25,
    90,
    15,
    3,
    300,
    2560,
    1440,
    true,
    true,
    true,
    false,
    true,
    false
),

-- ========== ENTERPRISE PLANS (for agencies) ==========

-- 5. Enterprise Premium (Monthly)
(
    'enterprise-premium-monthly', 
    'Plan Empresarial Premium (Mensual)', 
    'Plan completo para agencias inmobiliarias y desarrolladores.', 
    'enterprise_premium', 
    'monthly', 
    1, 
    299.90, 
    'PEN',
    'agency',
    100,        -- 100 propiedades activas
    365,        -- 365 días de vigencia
    25,         -- 25 imágenes por propiedad
    5,          -- 5 videos por propiedad
    600,        -- 10 minutos de video
    3840,       -- 4K
    2160,
    true,       -- Destacados incluidos
    true,       -- Soporte prioritario
    true,       -- Analytics avanzado
    true,       -- API access incluido
    true,
    false
),

-- 6. Enterprise Premium (Yearly - 20% discount)
(
    'enterprise-premium-yearly', 
    'Plan Empresarial Premium (Anual)', 
    'Plan anual para agencias con 20% de descuento.', 
    'enterprise_premium', 
    'yearly', 
    12, 
    2879.04,    -- 299.90 * 12 * 0.8 = 2879.04
    'PEN',
    'agency',
    100,
    365,
    25,
    5,
    600,
    3840,
    2160,
    true,
    true,
    true,
    true,
    true,
    false
),

-- 7. Enterprise Unlimited (Yearly)
(
    'enterprise-unlimited-yearly', 
    'Plan Empresarial Ilimitado (Anual)', 
    'Plan sin límites para grandes inmobiliarias y desarrolladores. Contrato anual.', 
    'enterprise_unlimited', 
    'yearly', 
    12, 
    9999.00, 
    'PEN',
    'agency',
    999999,     -- Sin límite práctico
    365,
    50,         -- 50 imágenes por propiedad
    10,         -- 10 videos por propiedad
    1200,       -- 20 minutos de video
    3840,       -- 4K
    2160,
    true,
    true,
    true,
    true,
    true,
    false
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    tier = EXCLUDED.tier,
    period = EXCLUDED.period,
    period_months = EXCLUDED.period_months,
    price_amount = EXCLUDED.price_amount,
    price_currency = EXCLUDED.price_currency,
    target_user_type = EXCLUDED.target_user_type,
    max_active_listings = EXCLUDED.max_active_listings,
    listing_active_days = EXCLUDED.listing_active_days,
    max_images_per_listing = EXCLUDED.max_images_per_listing,
    max_videos_per_listing = EXCLUDED.max_videos_per_listing,
    max_video_seconds = EXCLUDED.max_video_seconds,
    max_image_width = EXCLUDED.max_image_width,
    max_image_height = EXCLUDED.max_image_height,
    featured_listings = EXCLUDED.featured_listings,
    priority_support = EXCLUDED.priority_support,
    analytics_access = EXCLUDED.analytics_access,
    api_access = EXCLUDED.api_access,
    is_active = EXCLUDED.is_active,
    is_default = EXCLUDED.is_default,
    updated_at = NOW();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show all created plans
SELECT 
    code,
    name,
    tier,
    period,
    price_amount,
    target_user_type,
    max_active_listings,
    is_active,
    is_default
FROM core.plans
ORDER BY 
    CASE tier
        WHEN 'individual_free' THEN 1
        WHEN 'individual_basic' THEN 2
        WHEN 'individual_premium' THEN 3
        WHEN 'enterprise_premium' THEN 4
        WHEN 'enterprise_unlimited' THEN 5
    END,
    period_months;

-- Verify default plan exists
SELECT 
    'individual_free plan exists' as verification,
    COUNT(*) as count,
    BOOL_OR(is_default) as has_default
FROM core.plans 
WHERE tier = 'individual_free' 
  AND target_user_type = 'individual'
  AND is_active = true;
