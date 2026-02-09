-- Script para generar slugs únicos para propiedades existentes
-- Ejecutar en PostgreSQL

-- 1. Crear función para generar slug base desde el título
CREATE OR REPLACE FUNCTION generate_slug_from_title(title_text TEXT, property_type TEXT, district TEXT)
RETURNS TEXT AS $$
DECLARE
    slug_text TEXT;
BEGIN
    -- Concatenar tipo de propiedad, distrito y primeras palabras del título
    slug_text := LOWER(
        REGEXP_REPLACE(
            CONCAT(
                COALESCE(property_type, ''),
                '-',
                COALESCE(district, ''),
                '-',
                SUBSTRING(title_text, 1, 50)
            ),
            '[^a-z0-9\s-]', '', 'gi'  -- Remover caracteres especiales
        )
    );
    
    -- Reemplazar espacios múltiples con guión
    slug_text := REGEXP_REPLACE(slug_text, '\s+', '-', 'g');
    
    -- Remover guiones múltiples
    slug_text := REGEXP_REPLACE(slug_text, '-+', '-', 'g');
    
    -- Remover guiones al inicio y final
    slug_text := TRIM(BOTH '-' FROM slug_text);
    
    -- Transliterar caracteres con acentos
    slug_text := TRANSLATE(slug_text, 
        'áéíóúàèìòùäëïöüâêîôûãõñçÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÃÕÑÇ',
        'aeiouaeiouaeiouaeiouaoncAEIOUAEIOUAEIOUAEIOUAONC'
    );
    
    RETURN slug_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Generar slugs únicos para todas las propiedades que no tienen slug
DO $$
DECLARE
    listing_record RECORD;
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER;
    slug_exists BOOLEAN;
BEGIN
    -- Iterar sobre todas las propiedades sin slug
    FOR listing_record IN 
        SELECT id, title, property_type::TEXT as property_type, district 
        FROM core.listings 
        WHERE slug IS NULL OR slug = ''
    LOOP
        -- Generar slug base
        base_slug := generate_slug_from_title(
            listing_record.title, 
            listing_record.property_type, 
            listing_record.district
        );
        
        -- Limitar longitud a 100 caracteres
        base_slug := SUBSTRING(base_slug, 1, 100);
        
        -- Verificar si el slug ya existe
        final_slug := base_slug;
        counter := 1;
        
        LOOP
            SELECT EXISTS(
                SELECT 1 FROM core.listings 
                WHERE slug = final_slug AND id != listing_record.id
            ) INTO slug_exists;
            
            EXIT WHEN NOT slug_exists;
            
            -- Si existe, agregar contador
            final_slug := base_slug || '-' || counter;
            counter := counter + 1;
            
            -- Limitar longitud nuevamente
            final_slug := SUBSTRING(final_slug, 1, 100);
        END LOOP;
        
        -- Actualizar el slug
        UPDATE core.listings 
        SET slug = final_slug 
        WHERE id = listing_record.id;
        
        RAISE NOTICE 'Generated slug for %: %', listing_record.title, final_slug;
    END LOOP;
    
    RAISE NOTICE 'Slug generation completed!';
END $$;

-- 3. Verificar resultados
SELECT 
    id,
    title,
    slug,
    property_type,
    district,
    status
FROM core.listings
ORDER BY created_at DESC
LIMIT 20;

-- 4. Crear índice para búsqueda rápida de slugs (no puede ser único por particionamiento)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'core' 
        AND tablename = 'listings' 
        AND indexname = 'idx_listings_slug'
    ) THEN
        CREATE INDEX idx_listings_slug ON core.listings(slug) 
        WHERE slug IS NOT NULL;
        RAISE NOTICE 'Created index on slug';
    ELSE
        RAISE NOTICE 'Index already exists';
    END IF;
END $$;

-- Nota: No se puede crear índice UNIQUE porque la tabla está particionada por created_at
-- La unicidad se garantiza a nivel de aplicación con ensure_unique_slug()

-- 5. Verificar que no hay slugs duplicados
SELECT slug, COUNT(*) as count
FROM core.listings
WHERE slug IS NOT NULL
GROUP BY slug
HAVING COUNT(*) > 1;

-- Si hay duplicados, el script debe lanzar una advertencia
