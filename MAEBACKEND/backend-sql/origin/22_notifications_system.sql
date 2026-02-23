-- ========================================
-- NOTIFICATIONS SYSTEM - In-app notification system

-- ========================================
-- Tabla: Notificaciones
-- ========================================
CREATE TABLE IF NOT EXISTS core.notifications (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Usuario destinatario
    user_id                 UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    
    -- Tipo y categoría
    notification_type       core.notification_type NOT NULL,
    category                VARCHAR(100),  -- Subcategoría específica
    
    -- Contenido
    title                   VARCHAR(255) NOT NULL,
    message                 TEXT NOT NULL,
    summary                 VARCHAR(500),  -- Resumen corto para notificaciones push
    
    -- Prioridad y urgencia
    priority                core.notification_priority DEFAULT 'medium',
    expires_at              TIMESTAMPTZ,  -- Cuándo expira la notificación
    
    -- Estado
    status                  core.notification_status DEFAULT 'pending',
    read_at                 TIMESTAMPTZ,
    
    -- Referencia a entidad relacionada
    related_entity_type     VARCHAR(100),  -- listing, verification, subscription, etc.
    related_entity_id       UUID,
    
    -- Datos adicionales
    action_url              VARCHAR(500),  -- URL para acción relacionada
    action_data             JSONB DEFAULT '{}',  -- Datos adicionales para la acción
    extra_data              JSONB DEFAULT '{}',  -- Datos extra específicos del tipo
    
    -- Control de entrega
    delivery_methods        JSONB DEFAULT '[]',  -- Métodos de entrega solicitados
    delivered_via           JSONB DEFAULT '[]',  -- Métodos por los que se entregó exitosamente
    failed_deliveries       JSONB DEFAULT '[]',  -- Intentos fallidos
    
    -- Timestamps
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at                 TIMESTAMPTZ,
    delivered_at            TIMESTAMPTZ,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para optimización
CREATE INDEX idx_notifications_user ON core.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON core.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_type ON core.notifications(notification_type);
CREATE INDEX idx_notifications_priority ON core.notifications(priority);
CREATE INDEX idx_notifications_status ON core.notifications(status);
CREATE INDEX idx_notifications_related ON core.notifications(related_entity_type, related_entity_id);
CREATE INDEX idx_notifications_created ON core.notifications(created_at DESC);

COMMENT ON TABLE core.notifications IS 'Sistema de notificaciones in-app para usuarios';
COMMENT ON COLUMN core.notifications.user_id IS 'Usuario destinatario de la notificación';
COMMENT ON COLUMN core.notifications.notification_type IS 'Tipo de notificación (system, verification, etc.)';
COMMENT ON COLUMN core.notifications.priority IS 'Prioridad de la notificación';
COMMENT ON COLUMN core.notifications.expires_at IS 'Fecha de expiración de la notificación';

-- ========================================
-- Tabla: Configuración de notificaciones por usuario
-- ========================================
CREATE TABLE IF NOT EXISTS core.notification_settings (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                         UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Configuración general
    enabled                         BOOLEAN DEFAULT TRUE,
    quiet_hours_enabled             BOOLEAN DEFAULT FALSE,
    quiet_hours_start               VARCHAR(5) DEFAULT '22:00',  -- HH:MM format
    quiet_hours_end                 VARCHAR(5) DEFAULT '08:00',  -- HH:MM format
    timezone                        VARCHAR(50) DEFAULT 'UTC',
    
    -- Configuración por tipo de notificación (JSON con estructura tipo: {in_app: bool, email: bool, sms: bool, push: bool})
    system_notifications            JSONB DEFAULT '{"in_app": true, "email": true, "sms": false, "push": true}',
    verification_notifications      JSONB DEFAULT '{"in_app": true, "email": true, "sms": false, "push": true}',
    listing_notifications           JSONB DEFAULT '{"in_app": true, "email": true, "sms": false, "push": true}',
    subscription_notifications      JSONB DEFAULT '{"in_app": true, "email": true, "sms": false, "push": false}',
    message_notifications           JSONB DEFAULT '{"in_app": true, "email": true, "sms": true, "push": true}',
    lead_notifications              JSONB DEFAULT '{"in_app": true, "email": true, "sms": true, "push": true}',
    review_notifications            JSONB DEFAULT '{"in_app": true, "email": true, "sms": false, "push": true}',
    payment_notifications           JSONB DEFAULT '{"in_app": true, "email": true, "sms": true, "push": true}',
    security_notifications          JSONB DEFAULT '{"in_app": true, "email": true, "sms": true, "push": true}',
    
    -- Digest emails
    digest_frequency                core.digest_frequency DEFAULT 'none',
    last_digest_sent_at             TIMESTAMPTZ,
    
    -- Timestamps
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_settings_user ON core.notification_settings(user_id);

COMMENT ON TABLE core.notification_settings IS 'Configuración de notificaciones por usuario';
COMMENT ON COLUMN core.notification_settings.quiet_hours_enabled IS 'Si está activado el modo silencioso en horas específicas';
COMMENT ON COLUMN core.notification_settings.digest_frequency IS 'Frecuencia de envío de resumen de notificaciones';

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger para actualizar updated_at en notifications
CREATE OR REPLACE FUNCTION core.update_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_timestamp
    BEFORE UPDATE ON core.notifications
    FOR EACH ROW
    EXECUTE FUNCTION core.update_notification_timestamp();

-- Trigger para actualizar updated_at en notification_settings
CREATE TRIGGER trigger_update_notification_settings_timestamp
    BEFORE UPDATE ON core.notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION core.update_notification_timestamp();

-- Trigger para crear configuración de notificaciones al crear usuario
CREATE OR REPLACE FUNCTION core.create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO core.notification_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_notification_settings
    AFTER INSERT ON core.users
    FOR EACH ROW
    EXECUTE FUNCTION core.create_default_notification_settings();

COMMENT ON FUNCTION core.create_default_notification_settings() IS 'Crea configuración de notificaciones por defecto al crear un usuario';

-- ========================================
-- FUNCIONES ÚTILES
-- ========================================

-- Función para marcar notificaciones como leídas
CREATE OR REPLACE FUNCTION core.mark_notifications_as_read(
    p_user_id UUID,
    p_notification_ids UUID[] DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
    updated_count INT;
BEGIN
    IF p_notification_ids IS NULL THEN
        -- Marcar todas las no leídas del usuario
        UPDATE core.notifications
        SET read_at = now(), status = 'read'
        WHERE user_id = p_user_id AND read_at IS NULL;
    ELSE
        -- Marcar solo las especificadas
        UPDATE core.notifications
        SET read_at = now(), status = 'read'
        WHERE user_id = p_user_id 
          AND id = ANY(p_notification_ids)
          AND read_at IS NULL;
    END IF;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION core.mark_notifications_as_read IS 'Marca notificaciones como leídas para un usuario';

-- Función para limpiar notificaciones expiradas
CREATE OR REPLACE FUNCTION core.cleanup_expired_notifications()
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM core.notifications
    WHERE expires_at IS NOT NULL 
      AND expires_at < now()
      AND status = 'read';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION core.cleanup_expired_notifications IS 'Elimina notificaciones expiradas que ya fueron leídas';

-- Función para limpiar notificaciones antiguas leídas
CREATE OR REPLACE FUNCTION core.cleanup_old_read_notifications(days_old INT DEFAULT 30)
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM core.notifications
    WHERE read_at IS NOT NULL 
      AND read_at < now() - (days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION core.cleanup_old_read_notifications IS 'Elimina notificaciones leídas más antiguas que X días';
