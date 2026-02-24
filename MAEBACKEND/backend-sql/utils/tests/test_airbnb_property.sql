-- ===== Propiedad de Prueba Tipo Airbnb =====
-- Inserta una propiedad configurada para reservas por días (Airbnb style)

-- NOTA: Este script asume que ya tienes al menos un usuario en la base de datos.
-- Si no tienes usuarios, primero crea uno o ajusta el owner_user_id

DO $$
DECLARE
    v_user_id UUID;
    v_listing_id UUID := gen_random_uuid();
    v_listing_created_at TIMESTAMPTZ := now();
BEGIN
    -- Obtener o crear usuario de prueba
    SELECT id INTO v_user_id FROM core.users WHERE email = 'test@example.com' LIMIT 1;
    
    -- Si no existe, crear usuario de prueba
    IF v_user_id IS NULL THEN
        INSERT INTO core.users (
            email,
            first_name,
            last_name,
            phone,
            role,
            is_verified,
            is_active
        ) VALUES (
            'test@example.com',
            'Usuario',
            'Prueba',
            '+51987654321',
            'user',
            true,
            true
        ) RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'Usuario de prueba creado con ID: %', v_user_id;
    ELSE
        RAISE NOTICE 'Usando usuario existente con ID: %', v_user_id;
    END IF;
    
    -- Insertar propiedad tipo Airbnb
    INSERT INTO core.listings (
        id,
        owner_user_id,
        title,
        description,
        operation,
        property_type,
        advertiser_type,
        
        -- Ubicación (Miraflores, Lima)
        country,
        department,
        province,
        district,
        address,
        latitude,
        longitude,
        
        -- Detalles de la propiedad
        price,
        currency,
        area_built,
        bedrooms,
        bathrooms,
        parking_spots,
        age_years,
        
        -- IMPORTANTE: Configuración para Airbnb
        rental_term,
        rental_mode,
        furnished,
        max_guests,
        
        -- Estado
        verification_status,
        status,
        
        -- Contacto
        contact_name,
        contact_phone_e164,
        contact_whatsapp_phone_e164,
        
        -- SEO
        slug,
        meta_title,
        meta_description,
        
        -- Publicación
        published_at,
        published_until,
        
        -- Timestamps
        created_at,
        updated_at
    ) VALUES (
        v_listing_id,
        v_user_id,
        '🏖️ Departamento Moderno en Miraflores - Vista al Parque',
        E'Hermoso departamento completamente amoblado en el corazón de Miraflores.\n\n' ||
        E'✨ CARACTERÍSTICAS:\n' ||
        E'• 2 habitaciones con closets amplios\n' ||
        E'• 2 baños completos (uno en suite)\n' ||
        E'• Capacidad para 4 huéspedes\n' ||
        E'• Sala-comedor con vista panorámica\n' ||
        E'• Cocina equipada (refrigeradora, cocina, microondas)\n' ||
        E'• Balcón con vista al Parque Kennedy\n' ||
        E'• Estacionamiento techado\n' ||
        E'• WiFi de alta velocidad incluido\n\n' ||
        E'🏢 EDIFICIO:\n' ||
        E'• Seguridad 24/7\n' ||
        E'• Ascensor\n' ||
        E'• Gimnasio\n' ||
        E'• Lavandería\n\n' ||
        E'📍 UBICACIÓN:\n' ||
        E'• A 2 cuadras del Parque Kennedy\n' ||
        E'• A 5 minutos caminando de Larcomar\n' ||
        E'• Cerca de restaurantes, cafés y supermercados\n' ||
        E'• Excelente transporte público\n\n' ||
        E'💰 PRECIO: S/ 200 por noche\n' ||
        E'✅ Mínimo 2 noches\n' ||
        E'✅ Check-in: 3:00 PM\n' ||
        E'✅ Check-out: 12:00 PM\n\n' ||
        E'Ideal para turistas, viajeros de negocios o estadías temporales.',
        'rent', -- operation
        'apartment', -- property_type
        'owner', -- advertiser_type
        
        -- Ubicación
        'PE',
        'Lima',
        'Lima',
        'Miraflores',
        'Av. Arequipa 4567, Miraflores',
        -12.1203461, -- Latitud (Miraflores)
        -77.0286950, -- Longitud (Miraflores)
        
        -- Detalles
        200.00, -- S/ 200 por noche
        'PEN',
        85.50, -- m2
        2, -- habitaciones
        2, -- baños
        1, -- estacionamiento
        5, -- años de antigüedad
        
        -- CONFIGURACIÓN AIRBNB
        'daily', -- ⭐ rental_term: alquiler por días
        'full_property', -- ⭐ rental_mode: propiedad completa
        true, -- ⭐ furnished: amoblado
        4, -- ⭐ max_guests: máximo 4 huéspedes
        
        -- Estado
        'verified', -- verification_status
        'published', -- status
        
        -- Contacto
        'María González',
        '+51987654321',
        '+51987654321',
        
        -- SEO
        'departamento-moderno-miraflores-vista-parque',
        'Alquiler por Días - Departamento en Miraflores',
        'Departamento amoblado de 2 habitaciones en Miraflores. Alquiler por días. Vista al parque, WiFi, estacionamiento. Ideal para turistas.',
        
        -- Publicación
        now() - interval '1 day', -- published_at (publicado ayer)
        now() + interval '6 months', -- published_until (disponible por 6 meses)
        
        -- Timestamps
        v_listing_created_at,
        v_listing_created_at
    );
    
    RAISE NOTICE '✅ Propiedad Airbnb creada exitosamente!';
    RAISE NOTICE 'Listing ID: %', v_listing_id;
    RAISE NOTICE 'Created At: %', v_listing_created_at;
    
    -- Insertar algunas imágenes de ejemplo
    INSERT INTO core.images (
        listing_id,
        listing_created_at,
        filename,
        original_url,
        thumbnail_url,
        medium_url,
        display_order,
        alt_text,
        is_main
    ) VALUES
    (
        v_listing_id,
        v_listing_created_at,
        'sala-principal.jpg',
        'https://via.placeholder.com/1200x800/4A90E2/FFFFFF?text=Sala+Principal',
        'https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=Sala+Principal',
        'https://via.placeholder.com/600x400/4A90E2/FFFFFF?text=Sala+Principal',
        1,
        'Sala principal con vista panorámica',
        true -- Imagen principal
    ),
    (
        v_listing_id,
        v_listing_created_at,
        'habitacion-master.jpg',
        'https://via.placeholder.com/1200x800/50C878/FFFFFF?text=Habitación+Master',
        'https://via.placeholder.com/300x200/50C878/FFFFFF?text=Habitación+Master',
        'https://via.placeholder.com/600x400/50C878/FFFFFF?text=Habitación+Master',
        2,
        'Habitación master con baño en suite',
        false
    ),
    (
        v_listing_id,
        v_listing_created_at,
        'cocina.jpg',
        'https://via.placeholder.com/1200x800/FF6B6B/FFFFFF?text=Cocina+Equipada',
        'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Cocina+Equipada',
        'https://via.placeholder.com/600x400/FF6B6B/FFFFFF?text=Cocina+Equipada',
        3,
        'Cocina completamente equipada',
        false
    ),
    (
        v_listing_id,
        v_listing_created_at,
        'balcon-vista.jpg',
        'https://via.placeholder.com/1200x800/FFD700/000000?text=Balcón+Vista+Parque',
        'https://via.placeholder.com/300x200/FFD700/000000?text=Balcón+Vista+Parque',
        'https://via.placeholder.com/600x400/FFD700/000000?text=Balcón+Vista+Parque',
        4,
        'Balcón con vista al Parque Kennedy',
        false
    ),
    (
        v_listing_id,
        v_listing_created_at,
        'bano-principal.jpg',
        'https://via.placeholder.com/1200x800/9B59B6/FFFFFF?text=Baño+Principal',
        'https://via.placeholder.com/300x200/9B59B6/FFFFFF?text=Baño+Principal',
        'https://via.placeholder.com/600x400/9B59B6/FFFFFF?text=Baño+Principal',
        5,
        'Baño principal moderno',
        false
    );
    
    -- Actualizar has_media flag
    UPDATE core.listings 
    SET has_media = true 
    WHERE id = v_listing_id AND created_at = v_listing_created_at;
    
    RAISE NOTICE '✅ 5 imágenes agregadas a la propiedad';
    
    -- Información importante para las pruebas
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'INFORMACIÓN PARA PRUEBAS DE RESERVAS';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Listing ID: %', v_listing_id;
    RAISE NOTICE 'Created At: %', v_listing_created_at;
    RAISE NOTICE 'Owner User ID: %', v_user_id;
    RAISE NOTICE 'Precio por noche: S/ 200';
    RAISE NOTICE 'Tipo de alquiler: DAILY (Airbnb style)';
    RAISE NOTICE 'Modo: FULL_PROPERTY (propiedad completa)';
    RAISE NOTICE 'Capacidad: 4 huéspedes máximo';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Ahora puedes crear reservas usando estos datos en el frontend!';
    RAISE NOTICE '';
    
END $$;

-- Verificar que la propiedad fue creada correctamente
SELECT 
    id,
    title,
    operation,
    property_type,
    rental_term,
    rental_mode,
    max_guests,
    price,
    currency,
    bedrooms,
    bathrooms,
    district,
    status,
    verification_status,
    has_media,
    published_at IS NOT NULL as is_published
FROM core.listings
WHERE rental_term = 'daily'
ORDER BY created_at DESC
LIMIT 1;

-- Ver las imágenes asociadas
SELECT 
    l.title,
    i.filename,
    i.display_order,
    i.is_main,
    i.alt_text
FROM core.listings l
JOIN core.images i ON i.listing_id = l.id AND i.listing_created_at = l.created_at
WHERE l.rental_term = 'daily'
ORDER BY l.created_at DESC, i.display_order
LIMIT 10;
