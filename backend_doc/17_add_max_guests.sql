-- ===== Agregar columna max_guests a listings =====
-- Para propiedades tipo Airbnb que necesitan limitar la cantidad de huéspedes

-- Agregar columna max_guests a la tabla principal
ALTER TABLE core.listings 
ADD COLUMN IF NOT EXISTS max_guests INTEGER;

-- Agregar comentario descriptivo
COMMENT ON COLUMN core.listings.max_guests IS 'Número máximo de huéspedes permitidos (especialmente para propiedades tipo Airbnb/alquiler temporal)';

-- Actualizar la propiedad de prueba con max_guests = 4
UPDATE core.listings 
SET max_guests = 4 
WHERE rental_term = 'daily' 
  AND title LIKE '%Departamento Moderno en Miraflores%';

-- Verificar los cambios
SELECT 
    id,
    title,
    rental_term,
    max_guests,
    price,
    bedrooms,
    bathrooms
FROM core.listings
WHERE rental_term = 'daily'
ORDER BY created_at DESC
LIMIT 5;
