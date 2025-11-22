-- Fix: Convertir vista normal a vista materializada
-- Este script convierte la vista v_user_current_plan en una vista materializada

-- Paso 1: Guardar la definición de la vista actual
DO $$
DECLARE
    view_definition TEXT;
BEGIN
    -- Obtener la definición de la vista
    SELECT pg_get_viewdef('core.v_user_current_plan', true) INTO view_definition;
    
    -- Mostrar la definición (para debug)
    RAISE NOTICE 'Vista actual: %', view_definition;
END $$;

-- Paso 2: Eliminar la vista normal
DROP VIEW IF EXISTS core.v_user_current_plan CASCADE;

-- Paso 3: Crear como vista materializada
-- Nota: Ajusta esta definición según la vista original si es necesario
CREATE MATERIALIZED VIEW IF NOT EXISTS core.v_user_current_plan AS
SELECT 
    s.user_id,
    s.id as subscription_id,
    p.id as plan_id,
    p.code as plan_code,
    p.name as plan_name,
    p.tier as plan_tier,
    s.status,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    -- Plan limits
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
    p.api_access
FROM core.subscriptions s
INNER JOIN core.plans p ON s.plan_id = p.id
WHERE s.status = 'active'
AND s.current_period_end > NOW();

-- Paso 4: Crear índice único para permitir REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS v_user_current_plan_user_id_idx 
ON core.v_user_current_plan (user_id);

-- Paso 5: Refrescar la vista
REFRESH MATERIALIZED VIEW core.v_user_current_plan;

-- Mensaje de éxito
DO $$
BEGIN
    RAISE NOTICE '✅ Vista materializada creada exitosamente';
END $$;
