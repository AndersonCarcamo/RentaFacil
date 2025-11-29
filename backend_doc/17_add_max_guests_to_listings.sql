-- ===== Agregar campo max_guests para propiedades Airbnb =====
-- Este campo indica la cantidad máxima de huéspedes permitidos

-- Agregar columna max_guests a la tabla listings
ALTER TABLE core.listings 
ADD COLUMN IF NOT EXISTS max_guests INTEGER;

-- Agregar comentario
COMMENT ON COLUMN core.listings.max_guests IS 'Número máximo de huéspedes permitidos (para propiedades tipo Airbnb con rental_term=daily)';

-- Agregar constraint para valores razonables
ALTER TABLE core.listings 
ADD CONSTRAINT listings_max_guests_check 
CHECK (max_guests IS NULL OR (max_guests >= 1 AND max_guests <= 50));

-- Actualizar la propiedad de prueba existente
UPDATE core.listings 
SET max_guests = 4 
WHERE rental_term = 'daily' 
AND max_guests IS NULL;

-- Verificar el cambio
SELECT 
    id,
    title,
    rental_term,
    bedrooms,
    max_guests,
    price
FROM core.listings
WHERE rental_term = 'daily'
ORDER BY created_at DESC
LIMIT 5;
