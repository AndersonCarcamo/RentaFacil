-- Script para establecer un usuario como administrador
-- Reemplaza 'tu_email@example.com' con tu email de usuario

-- Opción 1: Si sabes tu email
UPDATE core.users 
SET role = 'admin' 
WHERE email = 'rentafacildirectoriohomesperu@gmail.com';

-- Opción 2: Ver todos los usuarios y sus roles
SELECT 
    user_id,
    email,
    full_name,
    role,
    is_active,
    created_at
FROM core.users
ORDER BY created_at DESC
LIMIT 10;

-- Opción 3: Ver quién tiene rol admin actualmente
SELECT 
    user_id,
    email,
    full_name,
    role
FROM core.users
WHERE role = 'admin';

-- Verificar el cambio
SELECT user_id, email, role 
FROM core.users 
WHERE email = 'rentafacildirectoriohomesperu@gmail.com';
