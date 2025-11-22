-- ============================================
-- TABLA DE PLANES DE SUSCRIPCIÓN
-- ============================================

-- Eliminar tabla si existe (CUIDADO: solo para desarrollo)
-- DROP TABLE IF EXISTS subscription_plans CASCADE;

CREATE TABLE IF NOT EXISTS subscription_plans (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- Información básica
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Precios
    price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0,
    price_yearly NUMERIC(10, 2) NOT NULL DEFAULT 0,
    
    -- Límites y características (JSON para flexibilidad)
    limits JSONB NOT NULL DEFAULT '{
        "max_listings": 3,
        "max_images": 5,
        "max_videos": 0,
        "featured_listings": 0,
        "analytics_access": false,
        "priority_support": false
    }'::jsonb,
    
    -- Características visibles (array de strings)
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Estado y orden
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(255),
    
    -- Constraints
    CONSTRAINT check_prices CHECK (price_monthly >= 0 AND price_yearly >= 0),
    CONSTRAINT check_yearly_price CHECK (price_yearly <= price_monthly * 12)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_subscription_plans_code ON subscription_plans(plan_code);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort ON subscription_plans(sort_order);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER trigger_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_plans_updated_at();

-- Comentarios de documentación
COMMENT ON TABLE subscription_plans IS 'Planes de suscripción disponibles en la plataforma';
COMMENT ON COLUMN subscription_plans.plan_code IS 'Código único del plan (ej: basico, premium, profesional)';
COMMENT ON COLUMN subscription_plans.limits IS 'Límites y características del plan en formato JSON';
COMMENT ON COLUMN subscription_plans.features IS 'Array de características visibles al usuario';
COMMENT ON COLUMN subscription_plans.sort_order IS 'Orden de visualización en el frontend (menor = primero)';

-- ============================================
-- DATOS INICIALES - PLANES POR DEFECTO
-- ============================================

-- Insertar planes solo si no existen
INSERT INTO subscription_plans (plan_code, name, description, price_monthly, price_yearly, limits, features, sort_order)
VALUES 
    -- PLAN BÁSICO (GRATUITO)
    (
        'basico',
        'Básico',
        'Perfecto para empezar a publicar tus propiedades',
        0.00,
        0.00,
        '{
            "max_listings": 3,
            "max_images": 5,
            "max_videos": 0,
            "featured_listings": 0,
            "analytics_access": false,
            "priority_support": false
        }'::jsonb,
        '["Hasta 3 propiedades activas", "Hasta 5 imágenes por propiedad", "Publicación en búsqueda estándar", "Soporte por email"]'::jsonb,
        1
    ),
    
    -- PLAN PREMIUM
    (
        'premium',
        'Premium',
        'Para arrendadores que quieren destacar',
        29.90,
        287.52,  -- 20% descuento anual (29.90 * 12 * 0.8)
        '{
            "max_listings": 20,
            "max_images": 15,
            "max_videos": 2,
            "featured_listings": 2,
            "analytics_access": true,
            "priority_support": false
        }'::jsonb,
        '["Hasta 20 propiedades activas", "Hasta 15 imágenes por propiedad", "2 videos por propiedad", "2 propiedades destacadas simultáneas", "Aparece en búsquedas destacadas", "Analíticas básicas", "Soporte prioritario"]'::jsonb,
        2
    ),
    
    -- PLAN PROFESIONAL
    (
        'profesional',
        'Profesional',
        'Para inmobiliarias y agentes profesionales',
        99.90,
        959.04,  -- 20% descuento anual (99.90 * 12 * 0.8)
        '{
            "max_listings": 999999,
            "max_images": 999999,
            "max_videos": 999999,
            "featured_listings": 10,
            "analytics_access": true,
            "priority_support": true
        }'::jsonb,
        '["Propiedades ilimitadas", "Imágenes ilimitadas por propiedad", "Videos ilimitados por propiedad", "Hasta 10 propiedades destacadas simultáneas", "Máxima prioridad en búsquedas", "Analíticas avanzadas", "Panel de estadísticas", "Soporte prioritario 24/7", "Asesor dedicado"]'::jsonb,
        3
    )
ON CONFLICT (plan_code) DO NOTHING;

-- Verificar la inserción
SELECT 
    plan_code,
    name,
    price_monthly,
    price_yearly,
    (limits->>'max_listings')::int as max_listings,
    jsonb_array_length(features) as num_features,
    is_active
FROM subscription_plans
ORDER BY sort_order;

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para obtener el plan de un usuario
CREATE OR REPLACE FUNCTION get_user_current_plan(user_id_param UUID)
RETURNS TABLE (
    plan_code VARCHAR,
    plan_name VARCHAR,
    price_monthly NUMERIC,
    max_listings INTEGER
) AS $$
BEGIN
    -- TODO: Implementar cuando exista la tabla de suscripciones
    -- Por ahora retorna el plan básico
    RETURN QUERY
    SELECT 
        sp.plan_code,
        sp.name::VARCHAR as plan_name,
        sp.price_monthly,
        (sp.limits->>'max_listings')::INTEGER as max_listings
    FROM subscription_plans sp
    WHERE sp.plan_code = 'basico'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un usuario puede crear más propiedades
CREATE OR REPLACE FUNCTION can_create_listing(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_plan RECORD;
    current_listings INTEGER;
BEGIN
    -- Obtener plan actual del usuario
    SELECT * INTO user_plan FROM get_user_current_plan(user_id_param);
    
    -- TODO: Contar propiedades actuales del usuario
    -- current_listings := (SELECT COUNT(*) FROM listings WHERE user_id = user_id_param);
    current_listings := 0;
    
    -- Verificar límite
    IF user_plan.max_listings = 999999 THEN
        RETURN TRUE;
    END IF;
    
    RETURN current_listings < user_plan.max_listings;
END;
$$ LANGUAGE plpgsql;
