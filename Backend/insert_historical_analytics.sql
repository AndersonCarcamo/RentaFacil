-- Script para insertar datos históricos de analytics (últimos 30 días)
-- Esto permite visualizar tendencias y proyecciones en el dashboard

-- Primero, obtener un listing_id existente para usar en los datos de prueba
-- REEMPLAZA 'tu-listing-id' con un ID real de tu tabla core.listings

DO $$
DECLARE
    v_listing_id UUID;
    v_user_id UUID;
    v_day_offset INT;
    v_views_count INT;
    v_contacts_count INT;
    v_base_date DATE := CURRENT_DATE - INTERVAL '30 days';
BEGIN
    -- Obtener el primer listing disponible (o usa un ID específico)
    SELECT id INTO v_listing_id FROM core.listings LIMIT 1;
    
    -- Obtener el user_id del propietario
    SELECT user_id INTO v_user_id FROM core.listings WHERE id = v_listing_id;
    
    IF v_listing_id IS NULL THEN
        RAISE EXCEPTION 'No se encontraron listings en la base de datos';
    END IF;
    
    RAISE NOTICE 'Insertando datos históricos para listing_id: %', v_listing_id;
    
    -- Insertar datos para los últimos 30 días
    FOR v_day_offset IN 0..29 LOOP
        -- Calcular cantidad de vistas con tendencia creciente y variación
        v_views_count := 5 + (v_day_offset * 2) + FLOOR(RANDOM() * 10)::INT;
        
        -- Calcular contactos (aprox 10-20% de las vistas)
        v_contacts_count := FLOOR(v_views_count * (0.10 + RANDOM() * 0.10))::INT;
        
        -- Insertar vistas para ese día
        FOR i IN 1..v_views_count LOOP
            INSERT INTO analytics.events (
                user_id,
                session_id,
                event_type,
                listing_id,
                properties,
                ip_address,
                user_agent,
                created_at
            ) VALUES (
                NULL, -- anonymous views
                gen_random_uuid(),
                'view',
                v_listing_id,
                jsonb_build_object(
                    'referrer', CASE FLOOR(RANDOM() * 4)::INT
                        WHEN 0 THEN 'https://www.google.com'
                        WHEN 1 THEN 'https://www.facebook.com'
                        WHEN 2 THEN 'direct'
                        ELSE 'https://www.instagram.com'
                    END,
                    'user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'device_type', 'desktop'
                ),
                '192.168.1.' || FLOOR(RANDOM() * 255)::TEXT,
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                (v_base_date + (v_day_offset || ' days')::INTERVAL) + 
                (FLOOR(RANDOM() * 86400) || ' seconds')::INTERVAL
            );
        END LOOP;
        
        -- Insertar contactos para ese día
        FOR i IN 1..v_contacts_count LOOP
            INSERT INTO analytics.events (
                user_id,
                session_id,
                event_type,
                listing_id,
                properties,
                ip_address,
                user_agent,
                created_at
            ) VALUES (
                NULL, -- anonymous contacts
                gen_random_uuid(),
                'contact',
                v_listing_id,
                jsonb_build_object(
                    'contact_type', CASE FLOOR(RANDOM() * 3)::INT
                        WHEN 0 THEN 'whatsapp'
                        WHEN 1 THEN 'phone'
                        ELSE 'email'
                    END,
                    'user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                ),
                '192.168.1.' || FLOOR(RANDOM() * 255)::TEXT,
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                (v_base_date + (v_day_offset || ' days')::INTERVAL) + 
                (FLOOR(RANDOM() * 86400) || ' seconds')::INTERVAL
            );
        END LOOP;
        
        RAISE NOTICE 'Día %: % vistas, % contactos', 
            (v_base_date + (v_day_offset || ' days')::INTERVAL)::DATE, 
            v_views_count, 
            v_contacts_count;
    END LOOP;
    
    -- Actualizar los contadores en core.listings
    UPDATE core.listings 
    SET 
        views_count = (
            SELECT COUNT(*) 
            FROM analytics.events 
            WHERE listing_id = v_listing_id 
            AND event_type = 'view'
        ),
        leads_count = (
            SELECT COUNT(*) 
            FROM analytics.events 
            WHERE listing_id = v_listing_id 
            AND event_type = 'contact'
        )
    WHERE id = v_listing_id;
    
    RAISE NOTICE 'Datos históricos insertados exitosamente para listing: %', v_listing_id;
    RAISE NOTICE 'Total vistas: %', (SELECT views_count FROM core.listings WHERE id = v_listing_id);
    RAISE NOTICE 'Total contactos: %', (SELECT leads_count FROM core.listings WHERE id = v_listing_id);
END $$;

-- Verificar los datos insertados
SELECT 
    DATE(created_at) as fecha,
    event_type as tipo_evento,
    COUNT(*) as cantidad
FROM analytics.events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), event_type
ORDER BY fecha DESC, tipo_evento;
