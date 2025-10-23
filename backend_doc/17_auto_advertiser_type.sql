-- ===== Actualización: Sistema Automático de Advertiser Type =====
-- Este script agrega un trigger que determina automáticamente el advertiser_type
-- basándose en el rol del usuario y su asociación con agencias
-- Ejecutar este script en el servidor de producción/desarrollo ya configurado

BEGIN;

-- 1. Crear función para auto-determinar advertiser_type
CREATE OR REPLACE FUNCTION core.set_advertiser_type()
RETURNS TRIGGER LANGUAGE plpgsql AS $set_advertiser$
DECLARE
    user_role TEXT;
    user_agency_id UUID;
    user_agency_name TEXT;
BEGIN
    -- Solo ejecutar si advertiser_type no fue explícitamente establecido
    -- o si es el valor por defecto 'owner'
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.advertiser_type = NEW.advertiser_type) THEN
        
        -- Obtener rol del usuario
        SELECT role INTO user_role 
        FROM core.users 
        WHERE id = NEW.owner_user_id;
        
        -- Obtener la primera agencia asociada al usuario (si existe)
        SELECT ua.agency_id, a.name 
        INTO user_agency_id, user_agency_name
        FROM core.user_agency ua
        JOIN core.agencies a ON a.id = ua.agency_id
        WHERE ua.user_id = NEW.owner_user_id
        LIMIT 1;
        
        -- Determinar advertiser_type basado en el rol y agencia
        CASE user_role
            WHEN 'agent' THEN
                IF user_agency_id IS NOT NULL THEN
                    -- Agente con agencia -> advertiser_type = 'agency'
                    NEW.advertiser_type := 'agency'::core.advertiser_type;
                    -- Establecer agency_id si no está ya establecido
                    IF NEW.agency_id IS NULL THEN
                        NEW.agency_id := user_agency_id;
                    END IF;
                ELSE
                    -- Agente sin agencia -> advertiser_type = 'broker'
                    NEW.advertiser_type := 'broker'::core.advertiser_type;
                    NEW.agency_id := NULL;
                END IF;
                
            WHEN 'landlord', 'user' THEN
                -- Propietario o usuario básico -> advertiser_type = 'owner'
                NEW.advertiser_type := 'owner'::core.advertiser_type;
                NEW.agency_id := NULL;
                
            WHEN 'admin' THEN
                -- Admin puede ser cualquier tipo, si no está establecido, usar 'owner'
                IF NEW.advertiser_type IS NULL THEN
                    NEW.advertiser_type := 'owner'::core.advertiser_type;
                END IF;
                
            ELSE
                -- Cualquier otro rol -> usar 'owner' por defecto
                NEW.advertiser_type := 'owner'::core.advertiser_type;
                NEW.agency_id := NULL;
        END CASE;
        
        -- Log para debugging (opcional, comentar en producción si no es necesario)
        RAISE NOTICE 'Listing % - User role: %, Agency: %, Advertiser type set to: %', 
            NEW.id, user_role, user_agency_name, NEW.advertiser_type;
    END IF;
    
    RETURN NEW;
END $set_advertiser$;

-- 2. Eliminar trigger si existe y crearlo
DROP TRIGGER IF EXISTS trigger_set_advertiser_type ON core.listings;

CREATE TRIGGER trigger_set_advertiser_type
    BEFORE INSERT OR UPDATE OF owner_user_id ON core.listings
    FOR EACH ROW
    EXECUTE FUNCTION core.set_advertiser_type();

-- 3. Crear función auxiliar para obtener el advertiser_type de un usuario
-- Útil para consultas y validaciones
CREATE OR REPLACE FUNCTION core.get_user_advertiser_type(p_user_id UUID)
RETURNS core.advertiser_type LANGUAGE plpgsql AS $get_advertiser$
DECLARE
    user_role TEXT;
    has_agency BOOLEAN;
    result core.advertiser_type;
BEGIN
    -- Obtener rol del usuario
    SELECT role INTO user_role 
    FROM core.users 
    WHERE id = p_user_id;
    
    -- Verificar si tiene agencia
    SELECT EXISTS(
        SELECT 1 FROM core.user_agency 
        WHERE user_id = p_user_id
    ) INTO has_agency;
    
    -- Determinar advertiser_type
    CASE user_role
        WHEN 'agent' THEN
            result := CASE 
                WHEN has_agency THEN 'agency'::core.advertiser_type
                ELSE 'broker'::core.advertiser_type
            END;
        WHEN 'landlord', 'user' THEN
            result := 'owner'::core.advertiser_type;
        ELSE
            result := 'owner'::core.advertiser_type;
    END CASE;
    
    RETURN result;
END $get_advertiser$;

-- 4. Crear vista para mostrar usuarios con su advertiser_type esperado
CREATE OR REPLACE VIEW core.v_users_with_advertiser_type AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    CASE 
        WHEN u.role = 'agent' THEN
            CASE 
                WHEN ua.agency_id IS NOT NULL THEN 'agency'
                ELSE 'broker'
            END
        WHEN u.role IN ('landlord', 'user') THEN 'owner'
        ELSE 'owner'
    END::core.advertiser_type as expected_advertiser_type,
    a.id as agency_id,
    a.name as agency_name,
    a.is_verified as agency_verified
FROM core.users u
LEFT JOIN core.user_agency ua ON ua.user_id = u.id
LEFT JOIN core.agencies a ON a.id = ua.agency_id;

-- 5. Actualizar listings existentes (opcional, comentar si no se quiere aplicar retroactivamente)
-- Este UPDATE aplicará la lógica a todos los listings existentes
DO $$
DECLARE
    updated_count INTEGER := 0;
    listing_record RECORD;
BEGIN
    RAISE NOTICE 'Iniciando actualización de advertiser_type en listings existentes...';
    
    FOR listing_record IN 
        SELECT l.id, l.created_at, l.owner_user_id, l.advertiser_type as old_type,
               u.role, ua.agency_id, a.name as agency_name
        FROM core.listings l
        JOIN core.users u ON u.id = l.owner_user_id
        LEFT JOIN core.user_agency ua ON ua.user_id = l.owner_user_id
        LEFT JOIN core.agencies a ON a.id = ua.agency_id
    LOOP
        DECLARE
            new_type core.advertiser_type;
            new_agency_id UUID;
        BEGIN
            -- Determinar el nuevo advertiser_type
            CASE listing_record.role
                WHEN 'agent' THEN
                    IF listing_record.agency_id IS NOT NULL THEN
                        new_type := 'agency'::core.advertiser_type;
                        new_agency_id := listing_record.agency_id;
                    ELSE
                        new_type := 'broker'::core.advertiser_type;
                        new_agency_id := NULL;
                    END IF;
                WHEN 'landlord', 'user' THEN
                    new_type := 'owner'::core.advertiser_type;
                    new_agency_id := NULL;
                ELSE
                    new_type := 'owner'::core.advertiser_type;
                    new_agency_id := NULL;
            END CASE;
            
            -- Actualizar solo si cambió
            IF listing_record.old_type != new_type THEN
                UPDATE core.listings
                SET advertiser_type = new_type,
                    agency_id = new_agency_id,
                    updated_at = now()
                WHERE id = listing_record.id 
                  AND created_at = listing_record.created_at;
                
                updated_count := updated_count + 1;
                
                RAISE NOTICE 'Listing % actualizado: % -> % (Agency: %)', 
                    listing_record.id, listing_record.old_type, new_type, listing_record.agency_name;
            END IF;
        END;
    END LOOP;
    
    RAISE NOTICE 'Actualización completada: % listings actualizados', updated_count;
END $$;

COMMIT;

-- Verificar que todo se creó correctamente
DO $$
DECLARE
    trigger_exists BOOLEAN;
    function_exists BOOLEAN;
    view_exists BOOLEAN;
    total_listings INTEGER;
    type_record RECORD;
BEGIN
    -- Verificar función
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'core' 
        AND p.proname = 'set_advertiser_type'
    ) INTO function_exists;
    
    -- Verificar trigger
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'core'
        AND c.relname = 'listings'
        AND t.tgname = 'trigger_set_advertiser_type'
    ) INTO trigger_exists;
    
    -- Verificar vista
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'core' 
        AND table_name = 'v_users_with_advertiser_type'
    ) INTO view_exists;
    
    -- Contar listings por advertiser_type
    SELECT COUNT(*) INTO total_listings FROM core.listings;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verificación de actualización:';
    RAISE NOTICE '- Función set_advertiser_type(): %', CASE WHEN function_exists THEN '✓ OK' ELSE '✗ FALTA' END;
    RAISE NOTICE '- Trigger trigger_set_advertiser_type: %', CASE WHEN trigger_exists THEN '✓ OK' ELSE '✗ FALTA' END;
    RAISE NOTICE '- Vista v_users_with_advertiser_type: %', CASE WHEN view_exists THEN '✓ OK' ELSE '✗ FALTA' END;
    RAISE NOTICE '- Total listings procesados: %', total_listings;
    RAISE NOTICE '========================================';
    
    -- Mostrar distribución de advertiser_types
    RAISE NOTICE 'Distribución de advertiser_types:';
    FOR type_record IN 
        SELECT advertiser_type::TEXT as type, COUNT(*) as count
        FROM core.listings
        GROUP BY advertiser_type
        ORDER BY count DESC
    LOOP
        RAISE NOTICE '  - %: % listings', type_record.type, type_record.count;
    END LOOP;
    RAISE NOTICE '========================================';
END $$;

-- Comentarios finales
COMMENT ON FUNCTION core.set_advertiser_type() IS 
'Función trigger que determina automáticamente el advertiser_type basándose en el rol del usuario y su asociación con agencias. 
Mapeo: agent+agency->agency, agent sin agency->broker, landlord/user->owner';

COMMENT ON FUNCTION core.get_user_advertiser_type(UUID) IS 
'Función auxiliar que retorna el advertiser_type esperado para un usuario específico sin modificar la base de datos';

COMMENT ON VIEW core.v_users_with_advertiser_type IS 
'Vista que muestra todos los usuarios con su advertiser_type esperado y su información de agencia asociada';

COMMENT ON TRIGGER trigger_set_advertiser_type ON core.listings IS
'Trigger que se ejecuta antes de INSERT/UPDATE en listings para establecer automáticamente el advertiser_type y agency_id';

-- Ejemplos de uso:
-- 
-- 1. Crear un listing (advertiser_type se establece automáticamente):
-- INSERT INTO core.listings (owner_user_id, title, description, operation, property_type, price, ...)
-- VALUES (user_id, 'Título', 'Descripción', 'rent', 'apartment', 1500, ...);
--
-- 2. Consultar advertiser_type esperado de un usuario:
-- SELECT core.get_user_advertiser_type('user_uuid_here');
--
-- 3. Ver todos los usuarios con su advertiser_type esperado:
-- SELECT * FROM core.v_users_with_advertiser_type WHERE role = 'agent';
--
-- 4. Verificar si algún listing tiene advertiser_type incorrecto:
-- SELECT l.id, l.advertiser_type, v.expected_advertiser_type
-- FROM core.listings l
-- JOIN core.v_users_with_advertiser_type v ON v.id = l.owner_user_id
-- WHERE l.advertiser_type != v.expected_advertiser_type;
