-- Actualizar el tipo de columna priority de INTEGER a VARCHAR
SET search_path TO core, public;

-- Cambiar el tipo de columna
ALTER TABLE core.verifications 
    ALTER COLUMN priority TYPE VARCHAR(20);

-- Actualizar valores existentes si los hay
UPDATE core.verifications 
SET priority = 'MEDIUM' 
WHERE priority IS NULL OR priority::text = '0';

-- Agregar constraint
ALTER TABLE core.verifications
    ADD CONSTRAINT verifications_priority_check 
    CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW'));

-- Verificar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'core' 
AND table_name = 'verifications' 
AND column_name = 'priority';

RAISE NOTICE '✅ Columna priority actualizada a VARCHAR(20)';
