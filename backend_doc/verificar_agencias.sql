-- Script para verificar el estado de agencias y user_agency
-- Ejecutar esto en la base de datos para ver qué pasó

-- 1. Ver usuarios con role='agent'
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    created_at
FROM core.users
WHERE role = 'agent'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Ver agencias creadas
SELECT 
    id,
    name,
    email,
    is_verified,
    created_at
FROM core.agencies
ORDER BY created_at DESC
LIMIT 5;

-- 3. Ver relaciones user_agency
SELECT 
    ua.user_id,
    ua.agency_id,
    ua.role,
    u.email as user_email,
    u.first_name || ' ' || u.last_name as user_name,
    a.name as agency_name,
    ua.created_at
FROM core.user_agency ua
JOIN core.users u ON ua.user_id = u.id
JOIN core.agencies a ON ua.agency_id = a.id
ORDER BY ua.created_at DESC
LIMIT 10;

-- 4. Ver usuarios 'agent' que NO tienen agencia asignada
SELECT 
    u.id,
    u.email,
    u.first_name || ' ' || u.last_name as full_name,
    u.role,
    u.created_at
FROM core.users u
WHERE u.role = 'agent'
AND NOT EXISTS (
    SELECT 1 FROM core.user_agency ua WHERE ua.user_id = u.id
)
ORDER BY u.created_at DESC;
