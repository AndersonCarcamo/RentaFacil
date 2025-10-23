-- ===== Sistema de Gestión de Multimedia para Listings =====
-- Tabla para almacenar URLs de imágenes y videos de propiedades
-- Los archivos físicos se almacenan en el servidor web (Nginx) en /media/listings/{listing_id}/

-- Enum para tipos de media
DO $$ BEGIN
    CREATE TYPE core.media_type AS ENUM ('image', 'video', 'virtual_tour');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabla de medios de listings
CREATE TABLE IF NOT EXISTS core.listing_media (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id          UUID NOT NULL,
    listing_created_at  TIMESTAMPTZ NOT NULL,
    
    -- Media information
    media_type          core.media_type NOT NULL DEFAULT 'image',
    url                 TEXT NOT NULL, -- URL relativa: /media/listings/{listing_id}/{filename}
    thumbnail_url       TEXT, -- URL del thumbnail (para videos)
    title               TEXT, -- Título descriptivo opcional
    description         TEXT, -- Descripción opcional
    
    -- Ordering and display
    display_order       INTEGER NOT NULL DEFAULT 0, -- Orden de visualización
    is_primary          BOOLEAN NOT NULL DEFAULT FALSE, -- Imagen principal/destacada
    
    -- Metadata
    file_size_bytes     BIGINT, -- Tamaño del archivo en bytes
    width               INTEGER, -- Ancho en píxeles (para imágenes/videos)
    height              INTEGER, -- Alto en píxeles (para imágenes/videos)
    duration_seconds    INTEGER, -- Duración en segundos (solo para videos)
    mime_type           TEXT, -- Tipo MIME (image/jpeg, video/mp4, etc.)
    
    -- Timestamps
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Foreign key con partición
    CONSTRAINT fk_listing_media_listing
        FOREIGN KEY (listing_id, listing_created_at)
        REFERENCES core.listings(id, created_at) ON DELETE CASCADE
) PARTITION BY RANGE (listing_created_at);

-- Índices
CREATE INDEX IF NOT EXISTS listing_media_listing_id_idx ON core.listing_media(listing_id);
CREATE INDEX IF NOT EXISTS listing_media_type_idx ON core.listing_media(media_type);
CREATE INDEX IF NOT EXISTS listing_media_order_idx ON core.listing_media(listing_id, display_order);
CREATE INDEX IF NOT EXISTS listing_media_primary_idx ON core.listing_media(listing_id, is_primary) WHERE is_primary = true;

-- Comentarios
COMMENT ON TABLE core.listing_media IS 'Almacena URLs de imágenes, videos y tours virtuales de las propiedades. Los archivos físicos se sirven via Nginx.';
COMMENT ON COLUMN core.listing_media.url IS 'URL relativa del archivo multimedia, ej: /media/listings/{listing_id}/image_001.jpg';
COMMENT ON COLUMN core.listing_media.is_primary IS 'Indica si es la imagen/video principal que se muestra en listados';
COMMENT ON COLUMN core.listing_media.display_order IS 'Orden de visualización en galerías (menor número = se muestra primero)';

-- Crear particiones mensuales para los últimos 3 meses y próximos 3 meses
DO $$
DECLARE
    start_date DATE := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months');
    end_date DATE := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '4 months');
    partition_date DATE := start_date;
    partition_name TEXT;
    partition_start TEXT;
    partition_end TEXT;
BEGIN
    WHILE partition_date < end_date LOOP
        partition_name := 'listing_media_' || TO_CHAR(partition_date, 'YYYY_MM');
        partition_start := TO_CHAR(partition_date, 'YYYY-MM-DD');
        partition_end := TO_CHAR(partition_date + INTERVAL '1 month', 'YYYY-MM-DD');
        
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS core.%I PARTITION OF core.listing_media
             FOR VALUES FROM (%L) TO (%L)',
            partition_name, partition_start, partition_end
        );
        
        partition_date := partition_date + INTERVAL '1 month';
    END LOOP;
END $$;

-- Trigger para auto-actualizar updated_at
CREATE OR REPLACE FUNCTION core.update_listing_media_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listing_media_update_timestamp
    BEFORE UPDATE ON core.listing_media
    FOR EACH ROW
    EXECUTE FUNCTION core.update_listing_media_timestamp();

-- Trigger para asegurar que solo hay una imagen primaria por listing
CREATE OR REPLACE FUNCTION core.ensure_single_primary_media()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        -- Quitar is_primary de otros medios del mismo listing
        UPDATE core.listing_media
        SET is_primary = false
        WHERE listing_id = NEW.listing_id
          AND id != NEW.id
          AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listing_media_single_primary
    AFTER INSERT OR UPDATE ON core.listing_media
    FOR EACH ROW
    WHEN (NEW.is_primary = true)
    EXECUTE FUNCTION core.ensure_single_primary_media();

-- Trigger para actualizar has_media en listings
CREATE OR REPLACE FUNCTION core.update_listing_has_media()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar has_media basado en si hay medios
    UPDATE core.listings
    SET has_media = EXISTS (
        SELECT 1 FROM core.listing_media
        WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id)
    )
    WHERE id = COALESCE(NEW.listing_id, OLD.listing_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listing_media_update_has_media
    AFTER INSERT OR DELETE ON core.listing_media
    FOR EACH ROW
    EXECUTE FUNCTION core.update_listing_has_media();

-- Vista para obtener información de medios por listing
CREATE OR REPLACE VIEW core.v_listing_media_summary AS
SELECT 
    l.id AS listing_id,
    l.title AS listing_title,
    COUNT(lm.id) AS total_media,
    COUNT(lm.id) FILTER (WHERE lm.media_type = 'image') AS total_images,
    COUNT(lm.id) FILTER (WHERE lm.media_type = 'video') AS total_videos,
    COUNT(lm.id) FILTER (WHERE lm.media_type = 'virtual_tour') AS total_virtual_tours,
    MAX(lm.url) FILTER (WHERE lm.is_primary = true) AS primary_media_url,
    SUM(lm.file_size_bytes) AS total_size_bytes,
    ARRAY_AGG(lm.url ORDER BY lm.display_order) FILTER (WHERE lm.media_type = 'image') AS image_urls,
    ARRAY_AGG(lm.url ORDER BY lm.display_order) FILTER (WHERE lm.media_type = 'video') AS video_urls
FROM core.listings l
LEFT JOIN core.listing_media lm ON l.id = lm.listing_id
GROUP BY l.id, l.title;

COMMENT ON VIEW core.v_listing_media_summary IS 'Resumen de medios multimedia por listing con contadores y arrays de URLs';

-- Función para obtener medios de un listing ordenados
CREATE OR REPLACE FUNCTION core.get_listing_media(
    p_listing_id UUID,
    p_media_type core.media_type DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    media_type core.media_type,
    url TEXT,
    thumbnail_url TEXT,
    title TEXT,
    display_order INTEGER,
    is_primary BOOLEAN,
    width INTEGER,
    height INTEGER,
    uploaded_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lm.id,
        lm.media_type,
        lm.url,
        lm.thumbnail_url,
        lm.title,
        lm.display_order,
        lm.is_primary,
        lm.width,
        lm.height,
        lm.uploaded_at
    FROM core.listing_media lm
    WHERE lm.listing_id = p_listing_id
      AND (p_media_type IS NULL OR lm.media_type = p_media_type)
    ORDER BY lm.display_order, lm.uploaded_at;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION core.get_listing_media IS 'Obtiene todos los medios de un listing, opcionalmente filtrados por tipo';
