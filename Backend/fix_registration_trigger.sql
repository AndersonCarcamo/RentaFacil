-- Deshabilitar el trigger que está causando el problema
-- Este trigger intenta refrescar una vista materializada que no existe

-- Opción 1: Deshabilitar el trigger temporalmente
ALTER TABLE core.users DISABLE TRIGGER create_free_subscription_trigger;

-- Si necesitas volver a habilitarlo después:
-- ALTER TABLE core.users ENABLE TRIGGER create_free_subscription_trigger;

-- Opción 2: Eliminar completamente el trigger (si no lo necesitas)
-- DROP TRIGGER IF EXISTS create_free_subscription_trigger ON core.users;

-- Opción 3: Eliminar la función que causa el problema
-- DROP FUNCTION IF EXISTS core.refresh_user_plan_view() CASCADE;
