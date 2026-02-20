-- ===================================================================
-- SCRIPT: CREACIÓN DE USUARIOS POSTGRESQL PARA EASYRENT
-- ===================================================================
-- Descripción: Crea los 2 usuarios necesarios para EasyRent:
--              1. rf_admin (administrador)
--              2. rf_app (aplicación)
--
-- Ejecutar como: superusuario postgres
-- Comando: psql -U postgres -f 01_crear_usuarios.sql
-- 
-- Fecha: 2026-02-19
-- Versión: 1.0.0
-- ===================================================================

-- Configuración de salida
\set ON_ERROR_STOP on
\timing on

-- ===================================================================
-- PASO 1: VERIFICAR SI YA EXISTEN
-- ===================================================================

DO $$
DECLARE
    v_admin_exists BOOLEAN;
    v_app_exists BOOLEAN;
BEGIN
    -- Verificar si rf_admin existe
    SELECT EXISTS (
        SELECT 1 FROM pg_roles WHERE rolname = 'rf_admin'
    ) INTO v_admin_exists;
    
    -- Verificar si rf_app existe
    SELECT EXISTS (
        SELECT 1 FROM pg_roles WHERE rolname = 'rf_app'
    ) INTO v_app_exists;
    
    IF v_admin_exists THEN
        RAISE NOTICE 'Usuario rf_admin ya existe';
    END IF;
    
    IF v_app_exists THEN
        RAISE NOTICE 'Usuario rf_app ya existe';
    END IF;
    
    IF v_admin_exists OR v_app_exists THEN
        RAISE NOTICE '';
        RAISE NOTICE 'Si deseas recrearlos, ejecuta primero:';
        RAISE NOTICE '   DROP ROLE IF EXISTS rf_admin;';
        RAISE NOTICE '   DROP ROLE IF EXISTS rf_app;';
        RAISE NOTICE '';
    END IF;
END $$;

-- ===================================================================
-- PASO 2: CREAR USUARIO ADMINISTRADOR (rf_admin)
-- ===================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rf_admin') THEN
        CREATE ROLE rf_admin WITH
            LOGIN                        -- Puede hacer login
            PASSWORD 'clave0' -- ⚠️ CAMBIAR en producción
            CREATEDB                     -- Puede crear bases de datos
            CREATEROLE                   -- Puede crear otros roles
            INHERIT                      -- Hereda permisos de roles asignados
            CONNECTION LIMIT 10;         -- Máximo 10 conexiones simultáneas
        
        COMMENT ON ROLE rf_admin IS 
            'Usuario administrador para migraciones y gestión de base de datos EasyRent';
        
        RAISE NOTICE '✅ Usuario rf_admin creado exitosamente';
    ELSE
        RAISE NOTICE '⏭️  Usuario rf_admin ya existe, omitiendo...';
    END IF;
END $$;

-- ===================================================================
-- PASO 3: CREAR USUARIO DE APLICACIÓN (rf_app)
-- ===================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rf_app') THEN
        CREATE ROLE rf_app WITH
            LOGIN                       -- Puede hacer login
            PASSWORD 'clave1'  -- ⚠️ CAMBIAR en producción
            INHERIT                     -- Hereda permisos de roles asignados
            CONNECTION LIMIT 200;        -- Máximo 200 conexiones (para connection pool)
        
        COMMENT ON ROLE rf_app IS 
            'Usuario de aplicación para operaciones normales de EasyRent';
        
        RAISE NOTICE '✅ Usuario rf_app creado exitosamente';
    ELSE
        RAISE NOTICE '⏭️  Usuario rf_app ya existe, omitiendo...';
    END IF;
END $$;

-- ===================================================================
-- PASO 4: VERIFICAR CREACIÓN
-- ===================================================================

SELECT 
    rolname as "👤 Usuario",
    CASE WHEN rolcanlogin THEN '✅' ELSE '❌' END as "Login",
    CASE WHEN rolcreatedb THEN '✅' ELSE '❌' END as "Crear DB",
    CASE WHEN rolcreaterole THEN '✅' ELSE '❌' END as "Crear Roles",
    rolconnlimit as "Límite Conex.",
    CASE 
        WHEN rolname = 'rf_admin' THEN 'Administrador (migraciones, DDL)'
        WHEN rolname = 'rf_app' THEN 'Aplicación (operaciones normales)'
        ELSE '-'
    END as "Propósito"
FROM pg_roles 
WHERE rolname IN ('rf_admin', 'rf_app')
ORDER BY rolname;

\echo ''
\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║                   INFORMACIÓN DE CONEXIÓN                      ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''
\echo '🔑 Credenciales creadas:'
\echo ''
\echo '   📌 Usuario administrador (para migraciones):'
\echo '      Usuario:     rf_admin'
\echo '      Password:    clave0'
\echo '      Connection:  psql -U rf_admin -d renta_facil'
\echo ''
\echo '   📌 Usuario aplicación (para backend):'
\echo '      Usuario:     rf_app'
\echo '      Password:    clave1'
\echo '      Connection:  psql -U rf_app -d renta_facil'
\echo ''
\echo '⚠️  IMPORTANTE: Cambiar contraseñas en producción'
\echo ''

-- ===================================================================
-- PASO 5: MOSTRAR PRÓXIMOS PASOS
-- ===================================================================

\echo '╔════════════════════════════════════════════════════════════════╗'
\echo '║                     PRÓXIMOS PASOS                             ║'
\echo '╚════════════════════════════════════════════════════════════════╝'
\echo ''
\echo '✅ 1. Crear base de datos y esquemas:'
\echo '     psql -U postgres -f 00_database_setup.sql'
\echo ''
\echo '✅ 2. Instalar todas las tablas y estructuras:'
\echo '     cd backend_doc'
\echo '     bash install_database.sh'
\echo '     (o ejecutar manualmente cada archivo SQL en orden)'
\echo ''
\echo '✅ 3. Aplicar optimizaciones de índices parciales:'
\echo '     psql -U rf_admin -d renta_facil -f 32_optimize_listings_partial_indices.sql'
\echo ''
\echo '✅ 4. Configurar Backend/.env con las credenciales:'
\echo '     DATABASE_URL=postgresql://rf_app:BeniteS2025!App@localhost:5432/renta_facil'
\echo ''
\echo '📚 Ver documentación completa en: 01_CREAR_USUARIOS.md'
\echo ''
\echo '════════════════════════════════════════════════════════════════'
\echo ''

-- ===================================================================
-- COMANDOS ÚTILES PARA GESTIÓN
-- ===================================================================

\echo '💡 Comandos útiles:'
\echo ''
\echo '   # Ver todos los usuarios:'
\echo '   SELECT rolname FROM pg_roles WHERE rolname LIKE ''rf%'';'
\echo ''
\echo '   # Cambiar contraseña:'
\echo '   ALTER ROLE rf_admin WITH PASSWORD ''nueva_password'';'
\echo ''
\echo '   # Ver conexiones activas:'
\echo '   SELECT usename, count(*) FROM pg_stat_activity GROUP BY usename;'
\echo ''
\echo '   # Eliminar usuarios (si necesitas recrearlos):'
\echo '   DROP ROLE IF EXISTS rf_admin;'
\echo '   DROP ROLE IF EXISTS rf_app;'
\echo ''

\timing off
