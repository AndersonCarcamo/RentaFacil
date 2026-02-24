-- Script para insertar datos históricos de analytics para MÚLTIPLES propiedades
-- Esto permite tener datos de tendencias en todas tus propiedades

DO $$
DECLARE
    v_listing RECORD;
    v_day_offset INT;
    v_views_count INT;
    v_contacts_count INT;
    v_base_date DATE := CURRENT_DATE - INTERVAL '30 days';
    v_total_listings INT := 0;
    v_session_ids UUID[];
    v_session_id UUID;
BEGIN
    -- Generar un pool de session_ids para simular usuarios recurrentes (40% únicos)
    FOR i IN 1..100 LOOP
        v_session_ids := array_append(v_session_ids, gen_random_uuid());
    END LOOP;
    
    -- Procesar solo la propiedad específica
    FOR v_listing IN 
        SELECT id, title 
        FROM core.listings 
        WHERE id = 'c206dbac-244e-4821-88da-3d4eef6a845f'::uuid
    LOOP
        v_total_listings := v_total_listings + 1;
        
        RAISE NOTICE '=== Procesando: % (ID: %) ===', v_listing.title, v_listing.id;
        
        -- Insertar datos para los últimos 30 días
        FOR v_day_offset IN 0..29 LOOP
            -- Generar tendencia al alza con variación realista
            -- Días 0-10: Bajo (5-15 vistas)
            -- Días 11-20: Medio (15-30 vistas)
            -- Días 21-30: Alto (30-50 vistas)
            v_views_count := CASE 
                WHEN v_day_offset < 10 THEN
                    5 + FLOOR(v_day_offset * 0.8) + FLOOR(RANDOM() * 5)::INT
                WHEN v_day_offset < 20 THEN
                    15 + FLOOR((v_day_offset - 10) * 1.2) + FLOOR(RANDOM() * 8)::INT
                ELSE
                    30 + FLOOR((v_day_offset - 20) * 1.5) + FLOOR(RANDOM() * 10)::INT
            END;
            
            -- Calcular contactos (3-8% conversión realista)
            v_contacts_count := GREATEST(0, FLOOR(v_views_count * (0.03 + RANDOM() * 0.05))::INT);
            
            -- Insertar vistas (40% visitantes únicos con sesiones repetidas)
            FOR i IN 1..v_views_count LOOP
                -- Seleccionar session_id del pool (simula usuarios recurrentes)
                v_session_id := v_session_ids[1 + FLOOR(RANDOM() * array_length(v_session_ids, 1))::INT];
                
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
                    NULL,
                    v_session_id,
                    'view',
                    v_listing.id,
                    jsonb_build_object(
                        'referrer', CASE FLOOR(RANDOM() * 5)::INT
                            WHEN 0 THEN 'https://www.google.com'
                            WHEN 1 THEN 'https://www.facebook.com'
                            WHEN 2 THEN 'direct'
                            WHEN 3 THEN 'https://www.instagram.com'
                            ELSE 'https://www.olx.com.pe'
                        END,
                        'device_type', CASE FLOOR(RANDOM() * 3)::INT
                            WHEN 0 THEN 'desktop'
                            WHEN 1 THEN 'mobile'
                            ELSE 'tablet'
                        END
                    ),
                    ('192.168.1.' || FLOOR(RANDOM() * 255)::TEXT)::inet,
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    (v_base_date + (v_day_offset || ' days')::INTERVAL) + 
                    (FLOOR(RANDOM() * 86400) || ' seconds')::INTERVAL
                );
            END LOOP;
            
            -- Insertar contactos
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
                    NULL,
                    gen_random_uuid(),
                    'contact',
                    v_listing.id,
                    jsonb_build_object(
                        'contact_type', CASE FLOOR(RANDOM() * 3)::INT
                            WHEN 0 THEN 'whatsapp'
                            WHEN 1 THEN 'phone'
                            ELSE 'email'
                        END
                    ),
                    ('192.168.1.' || FLOOR(RANDOM() * 255)::TEXT)::inet,
                    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
                    (v_base_date + (v_day_offset || ' days')::INTERVAL) + 
                    (FLOOR(RANDOM() * 86400) || ' seconds')::INTERVAL
                );
            END LOOP;
        END LOOP;
        
        -- Actualizar contadores
        UPDATE core.listings 
        SET 
            views_count = (
                SELECT COUNT(*) 
                FROM analytics.events 
                WHERE listing_id = v_listing.id 
                AND event_type = 'view'
            ),
            leads_count = (
                SELECT COUNT(*) 
                FROM analytics.events 
                WHERE listing_id = v_listing.id 
                AND event_type = 'contact'
            )
        WHERE id = v_listing.id;
        
        RAISE NOTICE 'Completado: % vistas, % contactos', 
            (SELECT views_count FROM core.listings WHERE id = v_listing.id),
            (SELECT leads_count FROM core.listings WHERE id = v_listing.id);
    END LOOP;
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Proceso completado para % propiedades', v_total_listings;
END $$;

-- Resumen de datos por propiedad
SELECT 
    l.title as propiedad,
    COUNT(CASE WHEN e.event_type = 'view' THEN 1 END) as vistas_totales,
    COUNT(CASE WHEN e.event_type = 'contact' THEN 1 END) as contactos_totales,
    ROUND(
        100.0 * COUNT(CASE WHEN e.event_type = 'contact' THEN 1 END) / 
        NULLIF(COUNT(CASE WHEN e.event_type = 'view' THEN 1 END), 0), 
        2
    ) as conversion_rate
FROM core.listings l
LEFT JOIN analytics.events e ON e.listing_id = l.id
WHERE l.status = 'published'
GROUP BY l.id, l.title
ORDER BY vistas_totales DESC;

-- Tendencia diaria agregada (últimos 30 días)
SELECT 
    DATE(created_at) as fecha,
    COUNT(CASE WHEN event_type = 'view' THEN 1 END) as vistas,
    COUNT(CASE WHEN event_type = 'contact' THEN 1 END) as contactos
FROM analytics.events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;
