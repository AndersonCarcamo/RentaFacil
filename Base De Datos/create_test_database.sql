-- ===== CREAR BASE DE DATOS DE TESTING =====
-- Script para crear una copia completa para pruebas

-- 1. Crear base de datos de testing
CREATE DATABASE easy_rent_test 
WITH 
    OWNER = benites_admin
    ENCODING = 'UTF8'
    LC_COLLATE = 'es-ES'
    LC_CTYPE = 'es-ES'
    TEMPLATE = template0;

-- 2. Conectarse a la base de testing y ejecutar:
-- \c easy_rent_test

-- 3. Crear usuario de testing
CREATE USER esrent_test_app WITH PASSWORD 'test_password_2024';

-- 4. Otorgar permisos
GRANT CONNECT ON DATABASE easy_rent_test TO esrent_test_app;
GRANT CREATE ON DATABASE easy_rent_test TO esrent_test_app;

-- 5. Después ejecutar todos los módulos 01-12 en easy_rent_test
