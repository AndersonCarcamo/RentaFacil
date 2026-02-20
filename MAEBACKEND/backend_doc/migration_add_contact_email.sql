-- ============================================================================
-- MIGRATION: Agregar campo contact_email a listings
-- Fecha: 2025-10-25
-- Descripción: Agrega el campo contact_email para permitir un email de 
--              contacto específico por propiedad, diferente al email del propietario
-- ============================================================================

-- Verificar que estamos en el esquema correcto
SET search_path TO core, public;

-- ============================================================================
-- 1. AGREGAR COLUMNA contact_email
-- ============================================================================
DO $$
BEGIN
    -- Verificar si la columna ya existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'core' 
        AND table_name = 'listings' 
        AND column_name = 'contact_email'
    ) THEN
        -- Agregar columna
        ALTER TABLE core.listings 
        ADD COLUMN contact_email citext;
        
        RAISE NOTICE 'Columna contact_email agregada exitosamente a core.listings';
    ELSE
        RAISE NOTICE 'La columna contact_email ya existe en core.listings';
    END IF;
END $$;

-- ============================================================================
-- 2. AGREGAR COMENTARIO DESCRIPTIVO
-- ============================================================================
COMMENT ON COLUMN core.listings.contact_email IS 
'Email de contacto para la propiedad. Puede ser diferente al email del propietario. '
'Este campo permite que el propietario especifique un email de contacto alternativo '
'para consultas sobre esta propiedad específica.';

-- ============================================================================
-- 3. CREAR ÍNDICE PARA BÚSQUEDAS (OPCIONAL)
-- ============================================================================
-- Si se necesita buscar por email de contacto frecuentemente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE schemaname = 'core' 
        AND tablename = 'listings' 
        AND indexname = 'idx_listings_contact_email'
    ) THEN
        CREATE INDEX idx_listings_contact_email 
        ON core.listings (contact_email) 
        WHERE contact_email IS NOT NULL;
        
        RAISE NOTICE 'Índice idx_listings_contact_email creado exitosamente';
    ELSE
        RAISE NOTICE 'El índice idx_listings_contact_email ya existe';
    END IF;
END $$;

-- ============================================================================
-- 4. VALIDACIÓN: Verificar que se agregó correctamente
-- ============================================================================
DO $$
DECLARE
    column_exists BOOLEAN;
    column_type TEXT;
BEGIN
    SELECT 
        EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'core' 
            AND table_name = 'listings' 
            AND column_name = 'contact_email'
        ),
        data_type
    INTO column_exists, column_type
    FROM information_schema.columns 
    WHERE table_schema = 'core' 
    AND table_name = 'listings' 
    AND column_name = 'contact_email';
    
    IF column_exists THEN
        RAISE NOTICE '✅ VALIDACIÓN EXITOSA';
        RAISE NOTICE 'Columna: contact_email';
        RAISE NOTICE 'Tipo: %', column_type;
        RAISE NOTICE 'Schema: core';
        RAISE NOTICE 'Tabla: listings';
    ELSE
        RAISE EXCEPTION '❌ VALIDACIÓN FALLIDA: La columna contact_email no existe';
    END IF;
END $$;

-- ============================================================================
-- 5. EJEMPLO DE USO
-- ============================================================================
-- Para actualizar un listing con email de contacto:
-- UPDATE core.listings 
-- SET contact_email = 'contacto@ejemplo.com'
-- WHERE id = '<listing_id>';

-- Para consultar listings con email de contacto:
-- SELECT id, title, contact_email 
-- FROM core.listings 
-- WHERE contact_email IS NOT NULL;

RAISE NOTICE '==============================================================';
RAISE NOTICE 'MIGRACIÓN COMPLETADA EXITOSAMENTE';
RAISE NOTICE 'Campo contact_email agregado a core.listings';
RAISE NOTICE '==============================================================';
