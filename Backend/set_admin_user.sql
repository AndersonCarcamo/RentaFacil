-- Script para establecer usuarios como administradores usando el campo 'role'
-- Ejecutar este script en PostgreSQL para actualizar el rol del usuario

-- Actualizar usuario adcv159@gmail.com a rol admin
UPDATE core.users 
SET role = 'admin', 
    updated_at = NOW()
WHERE email = 'adcv159@gmail.com';

-- Verificar el cambio
SELECT id, email, role, is_verified, is_active, created_at, updated_at
FROM core.users 
WHERE email = 'adcv159@gmail.com';

-- Mostrar todos los administradores actuales
SELECT id, email, role, is_verified, is_active 
FROM core.users 
WHERE role = 'admin';
