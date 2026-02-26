-- =====================================================
-- 30. HOTFIX: email + índice en core.users
-- =====================================================
-- Uso: aplicar en entornos donde la columna email no se creó por error humano
-- Nota: este script NO fuerza NOT NULL ni UNIQUE para evitar romper data existente.
--       Si luego quieres forzar unicidad/no-null, se hace en un script aparte tras limpieza.

-- 1) Agregar columna email si no existe
ALTER TABLE core.users
ADD COLUMN IF NOT EXISTS email CITEXT;

-- 2) Crear índice para búsquedas por email
CREATE INDEX IF NOT EXISTS users_email_idx
ON core.users(email);

-- 3) (Opcional suave) Constraint de formato, sin validar histórico
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_email_domain_check'
          AND conrelid = 'core.users'::regclass
    ) THEN
        ALTER TABLE core.users
        ADD CONSTRAINT users_email_domain_check
        CHECK (email IS NULL OR email ~ '^[^@]+@[^@]+\.[^@]+$') NOT VALID;
    END IF;
END
$$;
