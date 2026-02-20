-- Agregar tipo de usuario objetivo para los planes
-- Diferencia entre planes para usuarios individuales y agencias

-- Crear enum para tipo de usuario objetivo
CREATE TYPE core.plan_target_type AS ENUM ('individual', 'agency', 'both');

-- Agregar columna a la tabla plans
ALTER TABLE core.plans 
ADD COLUMN IF NOT EXISTS target_user_type core.plan_target_type NOT NULL DEFAULT 'individual';

-- Crear índice para facilitar consultas por tipo de usuario
CREATE INDEX IF NOT EXISTS plans_target_type_idx ON core.plans(target_user_type, is_active);

-- Actualizar planes existentes según su tier (opcional - ajustar según necesidad)
-- Los planes enterprise suelen ser para agencias
UPDATE core.plans 
SET target_user_type = 'agency' 
WHERE tier = 'enterprise';

-- Comentarios en la columna
COMMENT ON COLUMN core.plans.target_user_type IS 'Tipo de usuario al que está dirigido el plan: individual (usuarios), agency (agencias), both (ambos)';
