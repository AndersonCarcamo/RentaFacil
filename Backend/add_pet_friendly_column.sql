-- Agregar nueva columna 'pet_friendly' a la tabla listings
-- Esta query debe ejecutarse en la base de datos PostgreSQL

BEGIN;

-- Agregar la columna a la tabla principal (se propagará a las particiones)
ALTER TABLE core.listings 
ADD COLUMN pet_friendly BOOLEAN DEFAULT NULL;

-- Agregar comentario para documentación
COMMENT ON COLUMN core.listings.pet_friendly IS 'Indica si la propiedad acepta mascotas';

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'core' 
  AND table_name = 'listings' 
  AND column_name = 'pet_friendly';

COMMIT;

-- Crear índice para optimizar búsquedas por este campo (sin CONCURRENTLY para tablas particionadas)
CREATE INDEX IF NOT EXISTS listings_pet_friendly_idx ON core.listings(pet_friendly) 
WHERE pet_friendly IS NOT NULL;

-- Ejemplo de update para testing (opcional)
-- UPDATE core.listings SET pet_friendly = true WHERE property_type = 'house';
-- UPDATE core.listings SET pet_friendly = false WHERE property_type = 'office' OR property_type = 'commercial';
