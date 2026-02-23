-- Script para actualizar el plan del usuario de test a Enterprise con límites altos
-- Esto permite hacer testing sin restricciones de límites de plan
-- La estructura real usa el esquema 'core' y la tabla se llama 'subscriptions'

-- Paso 1: Encontrar el usuario de test que usa firebase_token "mock_token_testuser456"
-- Primero vamos a ver qué usuarios tenemos
SELECT id, email, firebase_uid, created_at 
FROM core.users 
WHERE firebase_uid LIKE '%testuser%' OR email LIKE '%test%' OR firebase_uid = 'mock_token_testuser456'
ORDER BY created_at DESC;

-- Paso 2: Ver qué planes están disponibles
SELECT id, code, name, max_active_listings, tier, is_active 
FROM core.plans 
WHERE is_active = true
ORDER BY max_active_listings DESC;

-- Paso 3: Actualizar la suscripción del usuario de test al plan Enterprise
-- Esto actualizará cualquier usuario que tenga "testuser" en su firebase_uid o el token específico
UPDATE core.subscriptions 
SET plan_id = '66dff6b4-eb4e-4c5a-ba93-ef67e54a5fff',  -- enterprise-yearly plan
    updated_at = NOW()
WHERE user_id IN (
    SELECT id 
    FROM core.users 
    WHERE firebase_uid LIKE '%testuser%' OR firebase_uid = 'mock_token_testuser456'
);

-- Paso 4: Si no existe una suscripción para el usuario de test, crear una nueva
INSERT INTO core.subscriptions (user_id, plan_id, status, current_period_start, current_period_end, created_at, updated_at)
SELECT 
    u.id,
    '66dff6b4-eb4e-4c5a-ba93-ef67e54a5fff',  -- enterprise-yearly plan
    'active',
    NOW(),
    NOW() + interval '1 year',  -- Enterprise plan es anual
    NOW(),
    NOW()
FROM core.users u
WHERE (u.firebase_uid LIKE '%testuser%' OR u.firebase_uid = 'mock_token_testuser456')
AND NOT EXISTS (
    SELECT 1 FROM core.subscriptions s WHERE s.user_id = u.id
);

-- Paso 5: Verificar que la actualización se hizo correctamente
SELECT 
    u.email,
    u.firebase_uid,
    u.id as user_id,
    p.code as plan_code,
    p.name as plan_name,
    p.max_active_listings,
    p.tier,
    s.status as subscription_status,
    s.current_period_start,
    s.current_period_end,
    s.created_at as subscription_date
FROM core.users u
JOIN core.subscriptions s ON u.id = s.user_id
JOIN core.plans p ON s.plan_id = p.id
WHERE u.firebase_uid LIKE '%testuser%' OR u.firebase_uid = 'mock_token_testuser456';

-- Paso 6: Verificar los límites del plan Enterprise específico
SELECT 
    id,
    code,
    name,
    description,
    tier,
    max_active_listings,
    listing_active_days,
    max_images_per_listing,
    max_videos_per_listing,
    featured_listings,
    analytics_access,
    api_access
FROM core.plans 
WHERE id = '66dff6b4-eb4e-4c5a-ba93-ef67e54a5fff';

-- Script alternativo si quieres crear el usuario de test específicamente:
-- INSERT INTO core.users (firebase_uid, email, first_name, last_name, role, is_verified, is_active)
-- VALUES ('mock_token_testuser456', 'testuser@example.com', 'Test', 'User', 'landlord', true, true)
-- ON CONFLICT (firebase_uid) DO NOTHING;
