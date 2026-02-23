-- ========================================
-- CHAT SYSTEM - Real-time messaging between clients and property owners

-- ========================================
-- Tabla: Conversaciones
-- ========================================
CREATE TABLE IF NOT EXISTS chat.conversations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id          UUID NOT NULL,  -- FK validado por trigger (listings es tabla particionada)
    
    -- Participantes
    client_user_id      UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    owner_user_id       UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    
    -- Metadata
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at     TIMESTAMPTZ,
    
    -- Estado
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    archived_by_client  BOOLEAN NOT NULL DEFAULT FALSE,
    archived_by_owner   BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Índices únicos para evitar duplicados
    CONSTRAINT unique_conversation_per_listing UNIQUE (listing_id, client_user_id, owner_user_id),
    
    -- Validación: cliente y propietario deben ser diferentes
    CONSTRAINT different_users CHECK (client_user_id != owner_user_id)
);

-- Índices para optimización
CREATE INDEX idx_conversations_client ON chat.conversations(client_user_id, is_active);
CREATE INDEX idx_conversations_owner ON chat.conversations(owner_user_id, is_active);
CREATE INDEX idx_conversations_listing ON chat.conversations(listing_id);
CREATE INDEX idx_conversations_updated ON chat.conversations(updated_at DESC);

COMMENT ON TABLE chat.conversations IS 'Conversaciones entre clientes y propietarios sobre un listing específico';
COMMENT ON COLUMN chat.conversations.listing_id IS 'Propiedad sobre la cual se está conversando';
COMMENT ON COLUMN chat.conversations.client_user_id IS 'Usuario interesado en la propiedad';
COMMENT ON COLUMN chat.conversations.owner_user_id IS 'Propietario o agente de la propiedad';

-- ========================================
-- TRIGGERS DE VALIDACIÓN
-- ========================================

-- Trigger para validar que el listing existe (reemplazo de FK ya que listings es particionada)
CREATE OR REPLACE FUNCTION chat.validate_listing_exists()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar que el listing existe
    IF NOT EXISTS (
        SELECT 1 FROM core.listings WHERE id = NEW.listing_id
    ) THEN
        RAISE EXCEPTION 'El listing % no existe', NEW.listing_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_listing_exists
    BEFORE INSERT OR UPDATE OF listing_id ON chat.conversations
    FOR EACH ROW
    EXECUTE FUNCTION chat.validate_listing_exists();

COMMENT ON FUNCTION chat.validate_listing_exists() IS 'Valida que el listing referenciado existe (alternativa a FK para tablas particionadas)';

-- Trigger para eliminar conversaciones cuando se borra un listing (cascada manual)
CREATE OR REPLACE FUNCTION core.delete_listing_conversations()
RETURNS TRIGGER AS $$
BEGIN
    -- Eliminar todas las conversaciones asociadas al listing
    DELETE FROM chat.conversations WHERE listing_id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_listing_conversations
    BEFORE DELETE ON core.listings
    FOR EACH ROW
    EXECUTE FUNCTION core.delete_listing_conversations();

COMMENT ON FUNCTION core.delete_listing_conversations() IS 'Elimina conversaciones asociadas cuando se borra un listing (cascada manual para tablas particionadas)';

-- ========================================
-- Tabla: Mensajes
-- ========================================
CREATE TABLE IF NOT EXISTS chat.messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     UUID NOT NULL REFERENCES chat.conversations(id) ON DELETE CASCADE,
    
    -- Remitente
    sender_user_id      UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    
    -- Contenido
    message_type        chat.message_type NOT NULL DEFAULT 'text',
    content             TEXT NOT NULL,
    media_url           TEXT,
    
    -- Estado y lectura
    status              chat.message_status NOT NULL DEFAULT 'sent',
    read_at             TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    
    -- Metadata
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Soft delete
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at          TIMESTAMPTZ,
    
    -- Validaciones
    CONSTRAINT content_not_empty CHECK (
        CASE 
            WHEN message_type = 'text' THEN LENGTH(TRIM(content)) > 0
            ELSE TRUE
        END
    ),
    CONSTRAINT content_max_length CHECK (LENGTH(content) <= 5000)
);

-- Índices para mensajes
CREATE INDEX idx_messages_conversation ON chat.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON chat.messages(sender_user_id);
CREATE INDEX idx_messages_unread ON chat.messages(conversation_id, status) 
    WHERE status != 'read' AND is_deleted = FALSE;
CREATE INDEX idx_messages_created_at ON chat.messages(created_at DESC);

COMMENT ON TABLE chat.messages IS 'Mensajes enviados en las conversaciones';
COMMENT ON COLUMN chat.messages.content IS 'Contenido del mensaje (texto o descripción si es multimedia)';
COMMENT ON COLUMN chat.messages.media_url IS 'URL del archivo multimedia si aplica';
COMMENT ON COLUMN chat.messages.status IS 'Estado del mensaje: enviado, entregado o leído';

-- ========================================
-- Tabla: Presencia de usuarios
-- ========================================
CREATE TABLE IF NOT EXISTS chat.user_presence (
    user_id             UUID PRIMARY KEY REFERENCES core.users(id) ON DELETE CASCADE,
    is_online           BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    connection_count    INTEGER NOT NULL DEFAULT 0,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_presence_online ON chat.user_presence(is_online, last_seen_at);

COMMENT ON TABLE chat.user_presence IS 'Estado de presencia de usuarios (online/offline)';
COMMENT ON COLUMN chat.user_presence.connection_count IS 'Número de conexiones WebSocket activas del usuario';

-- ========================================
-- Tabla: Notificaciones push
-- ========================================
CREATE TABLE IF NOT EXISTS chat.push_notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    message_id          UUID NOT NULL REFERENCES chat.messages(id) ON DELETE CASCADE,
    
    -- Estado
    sent_at             TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    failed_at           TIMESTAMPTZ,
    error_message       TEXT,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_notifications_user ON chat.push_notifications(user_id, created_at DESC);
CREATE INDEX idx_push_notifications_pending ON chat.push_notifications(created_at) 
    WHERE sent_at IS NULL AND failed_at IS NULL;

COMMENT ON TABLE chat.push_notifications IS 'Registro de notificaciones push enviadas por mensajes';

-- ========================================
-- FUNCIONES Y TRIGGERS
-- ========================================

-- Actualizar timestamp de conversación cuando llega un mensaje
CREATE OR REPLACE FUNCTION chat.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat.conversations
    SET 
        last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
    AFTER INSERT ON chat.messages
    FOR EACH ROW
    EXECUTE FUNCTION chat.update_conversation_timestamp();

COMMENT ON FUNCTION chat.update_conversation_timestamp() IS 'Actualiza el timestamp de la conversación cuando se envía un mensaje';

-- Marcar mensaje como entregado automáticamente
CREATE OR REPLACE FUNCTION chat.auto_set_delivered()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'sent' THEN
        NEW.status := 'delivered';
        NEW.delivered_at := now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_set_delivered
    BEFORE INSERT ON chat.messages
    FOR EACH ROW
    EXECUTE FUNCTION chat.auto_set_delivered();

COMMENT ON FUNCTION chat.auto_set_delivered() IS 'Marca automáticamente los mensajes como entregados al insertarse';

-- Actualizar updated_at en conversaciones
CREATE OR REPLACE FUNCTION chat.update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_conversations_updated_at
    BEFORE UPDATE ON chat.conversations
    FOR EACH ROW
    EXECUTE FUNCTION chat.update_conversations_updated_at();

-- Actualizar updated_at en mensajes
CREATE TRIGGER trigger_messages_updated_at
    BEFORE UPDATE ON chat.messages
    FOR EACH ROW
    EXECUTE FUNCTION chat.update_conversations_updated_at();

-- ========================================
-- VISTAS
-- ========================================

-- Vista: Conversaciones con último mensaje y detalles
CREATE OR REPLACE VIEW chat.conversations_with_details AS
SELECT 
    c.id,
    c.listing_id,
    c.client_user_id,
    c.owner_user_id,
    c.created_at,
    c.updated_at,
    c.last_message_at,
    c.is_active,
    c.archived_by_client,
    c.archived_by_owner,
    
    -- Datos del último mensaje
    lm.id AS last_message_id,
    lm.sender_user_id AS last_message_sender_id,
    lm.content AS last_message_content,
    lm.message_type AS last_message_type,
    lm.created_at AS last_message_created_at,
    lm.status AS last_message_status,
    
    -- Datos del listing
    l.title AS listing_title,
    l.price AS listing_price,
    l.currency AS listing_currency,
    l.property_type AS listing_property_type,
    l.operation AS listing_operation,
    
    -- Datos del cliente
    client.first_name AS client_first_name,
    client.last_name AS client_last_name,
    client.email AS client_email,
    client.profile_picture_url AS client_profile_picture,
    
    -- Datos del propietario
    owner.first_name AS owner_first_name,
    owner.last_name AS owner_last_name,
    owner.email AS owner_email,
    owner.profile_picture_url AS owner_profile_picture,
    
    -- Presencia del cliente
    client_presence.is_online AS client_is_online,
    client_presence.last_seen_at AS client_last_seen_at,
    
    -- Presencia del propietario
    owner_presence.is_online AS owner_is_online,
    owner_presence.last_seen_at AS owner_last_seen_at
    
FROM chat.conversations c
LEFT JOIN LATERAL (
    SELECT *
    FROM chat.messages
    WHERE conversation_id = c.id
      AND is_deleted = FALSE
    ORDER BY created_at DESC
    LIMIT 1
) lm ON TRUE
LEFT JOIN core.listings l ON c.listing_id = l.id
LEFT JOIN core.users client ON c.client_user_id = client.id
LEFT JOIN core.users owner ON c.owner_user_id = owner.id
LEFT JOIN chat.user_presence client_presence ON c.client_user_id = client_presence.user_id
LEFT JOIN chat.user_presence owner_presence ON c.owner_user_id = owner_presence.user_id;

COMMENT ON VIEW chat.conversations_with_details IS 'Vista completa de conversaciones con detalles de participantes, listing y último mensaje';

-- ========================================
-- FUNCIONES DE UTILIDAD
-- ========================================

-- Función: Contar mensajes no leídos
CREATE OR REPLACE FUNCTION chat.get_unread_count(
    p_user_id UUID,
    p_conversation_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF p_conversation_id IS NOT NULL THEN
        -- Contar no leídos en una conversación específica
        SELECT COUNT(*)
        INTO v_count
        FROM chat.messages m
        JOIN chat.conversations c ON m.conversation_id = c.id
        WHERE m.conversation_id = p_conversation_id
          AND m.sender_user_id != p_user_id
          AND m.status != 'read'
          AND m.is_deleted = FALSE;
    ELSE
        -- Contar no leídos en todas las conversaciones del usuario
        SELECT COUNT(*)
        INTO v_count
        FROM chat.messages m
        JOIN chat.conversations c ON m.conversation_id = c.id
        WHERE (c.client_user_id = p_user_id OR c.owner_user_id = p_user_id)
          AND m.sender_user_id != p_user_id
          AND m.status != 'read'
          AND m.is_deleted = FALSE;
    END IF;
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION chat.get_unread_count(UUID, UUID) IS 'Cuenta mensajes no leídos para un usuario en una conversación específica o en todas';

-- Función: Marcar todos los mensajes de una conversación como leídos
CREATE OR REPLACE FUNCTION chat.mark_conversation_as_read(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE chat.messages
    SET 
        status = 'read',
        read_at = now(),
        updated_at = now()
    WHERE conversation_id = p_conversation_id
      AND sender_user_id != p_user_id
      AND status != 'read'
      AND is_deleted = FALSE;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION chat.mark_conversation_as_read(UUID, UUID) IS 'Marca todos los mensajes no leídos de una conversación como leídos para un usuario';

-- Función: Obtener o crear conversación
CREATE OR REPLACE FUNCTION chat.get_or_create_conversation(
    p_listing_id UUID,
    p_client_user_id UUID,
    p_owner_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Validar que los usuarios sean diferentes
    IF p_client_user_id = p_owner_user_id THEN
        RAISE EXCEPTION 'Client and owner must be different users';
    END IF;
    
    -- Intentar obtener conversación existente
    SELECT id INTO v_conversation_id
    FROM chat.conversations
    WHERE listing_id = p_listing_id
      AND client_user_id = p_client_user_id
      AND owner_user_id = p_owner_user_id
    LIMIT 1;
    
    -- Si no existe, crear una nueva
    IF v_conversation_id IS NULL THEN
        INSERT INTO chat.conversations (
            listing_id,
            client_user_id,
            owner_user_id
        ) VALUES (
            p_listing_id,
            p_client_user_id,
            p_owner_user_id
        )
        RETURNING id INTO v_conversation_id;
    END IF;
    
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION chat.get_or_create_conversation(UUID, UUID, UUID) IS 'Obtiene una conversación existente o crea una nueva si no existe';

-- ========================================
-- PERMISOS
-- ========================================

-- Crear rol app_user si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user WITH LOGIN PASSWORD 'your_secure_password_here';
        RAISE NOTICE 'Rol app_user creado exitosamente';
    ELSE
        RAISE NOTICE 'Rol app_user ya existe';
    END IF;
END
$$;

-- Otorgar permisos al rol app_user
GRANT USAGE ON SCHEMA chat TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA chat TO app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA chat TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA chat TO app_user;

-- ========================================
-- DATOS INICIALES
-- ========================================

-- No se requieren datos iniciales para el sistema de chat

-- ========================================
-- ESTADÍSTICAS Y ANÁLISIS
-- ========================================

-- Análisis de actividad de chat
CREATE OR REPLACE VIEW chat.analytics_conversation_stats AS
SELECT 
    DATE_TRUNC('day', c.created_at) AS conversation_date,
    COUNT(DISTINCT c.id) AS total_conversations,
    COUNT(DISTINCT c.client_user_id) AS unique_clients,
    COUNT(DISTINCT c.owner_user_id) AS unique_owners,
    COUNT(DISTINCT c.listing_id) AS unique_listings,
    AVG(
        (SELECT COUNT(*) 
         FROM chat.messages m 
         WHERE m.conversation_id = c.id AND m.is_deleted = FALSE)
    ) AS avg_messages_per_conversation
FROM chat.conversations c
GROUP BY DATE_TRUNC('day', c.created_at)
ORDER BY conversation_date DESC;

COMMENT ON VIEW chat.analytics_conversation_stats IS 'Estadísticas diarias de actividad de conversaciones';

-- Análisis de mensajes por hora
CREATE OR REPLACE VIEW chat.analytics_message_volume AS
SELECT 
    DATE_TRUNC('hour', created_at) AS message_hour,
    COUNT(*) AS message_count,
    COUNT(DISTINCT sender_user_id) AS unique_senders,
    COUNT(DISTINCT conversation_id) AS active_conversations,
    COUNT(*) FILTER (WHERE message_type = 'text') AS text_messages,
    COUNT(*) FILTER (WHERE message_type = 'image') AS image_messages,
    COUNT(*) FILTER (WHERE message_type = 'document') AS document_messages
FROM chat.messages
WHERE is_deleted = FALSE
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY message_hour DESC;

COMMENT ON VIEW chat.analytics_message_volume IS 'Volumen de mensajes por hora con desglose por tipo';

-- ========================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ========================================

-- Índice para búsqueda de texto en mensajes (si se necesita búsqueda full-text)
-- CREATE INDEX idx_messages_content_gin ON chat.messages USING gin(to_tsvector('spanish', content))
--     WHERE message_type = 'text' AND is_deleted = FALSE;

-- ========================================
-- COMENTARIOS FINALES
-- ========================================

COMMENT ON SCHEMA chat IS 'Sistema de mensajería en tiempo real entre clientes y propietarios';

-- Fin del script
