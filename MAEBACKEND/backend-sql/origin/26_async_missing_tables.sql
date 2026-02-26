-- ========================================
-- ASYNC MISSING TABLES (estado detectado en BD actual)
-- Crea tablas que faltan para soporte de procesos asíncronos
-- ========================================

BEGIN;

-- ========================================
-- Tabla: Entregas de notificaciones
-- ========================================
CREATE TABLE IF NOT EXISTS core.notification_deliveries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id     UUID NOT NULL REFERENCES core.notifications(id) ON DELETE CASCADE,

    -- Método de entrega
    delivery_method     core.delivery_method NOT NULL,

    -- Estado de la entrega
    status              core.notification_status NOT NULL DEFAULT 'pending',

    -- Detalles del intento
    attempt_count       INTEGER NOT NULL DEFAULT 0,
    last_attempt_at     TIMESTAMPTZ,
    next_attempt_at     TIMESTAMPTZ,

    -- Información específica del proveedor
    provider            VARCHAR(100),
    external_id         VARCHAR(255),

    -- Resultado
    delivery_result     JSONB NOT NULL DEFAULT '{}',
    error_message       TEXT,
    error_code          VARCHAR(50),

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    delivered_at        TIMESTAMPTZ,
    failed_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification_id
    ON core.notification_deliveries(notification_id);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status
    ON core.notification_deliveries(status);

-- ========================================
-- Tabla: Cola de notificaciones
-- ========================================
CREATE TABLE IF NOT EXISTS core.notification_queue (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id     UUID NOT NULL REFERENCES core.notifications(id) ON DELETE CASCADE,

    -- Priorización en cola
    priority_score      INTEGER NOT NULL DEFAULT 0,
    scheduled_for       TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Estado de procesamiento
    processing          BOOLEAN NOT NULL DEFAULT FALSE,
    processing_started_at TIMESTAMPTZ,
    worker_id           VARCHAR(100),

    -- Reintentos
    retry_count         INTEGER NOT NULL DEFAULT 0,
    max_retries         INTEGER NOT NULL DEFAULT 3,
    last_error          TEXT,

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_notification_id
    ON core.notification_queue(notification_id);

CREATE INDEX IF NOT EXISTS idx_notification_queue_priority_score
    ON core.notification_queue(priority_score);

CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_for
    ON core.notification_queue(scheduled_for);

-- ========================================
-- Tabla: Eventos de analytics (core)
-- ========================================
CREATE TABLE IF NOT EXISTS core.analytics_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type          VARCHAR(100) NOT NULL,
    event_category      VARCHAR(50) NOT NULL,
    event_action        VARCHAR(100) NOT NULL,
    event_label         VARCHAR(255),

    user_id             UUID REFERENCES core.users(id) ON DELETE SET NULL,
    listing_id          UUID,
    session_id          VARCHAR(255),

    ip_address          VARCHAR(45),
    user_agent          TEXT,
    referrer            VARCHAR(500),
    page_url            VARCHAR(500),

    country             VARCHAR(2),
    region              VARCHAR(100),
    city                VARCHAR(100),

    duration            INTEGER,
    value               NUMERIC(10,2),
    properties          JSONB NOT NULL DEFAULT '{}',

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id
    ON core.analytics_events(user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_listing_id
    ON core.analytics_events(listing_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id
    ON core.analytics_events(session_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type
    ON core.analytics_events(event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_category
    ON core.analytics_events(event_category);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
    ON core.analytics_events(created_at);

-- ========================================
-- Tabla: Logs de APIs externas (public)
-- ========================================
CREATE TABLE IF NOT EXISTS public.external_api_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    provider            VARCHAR(50) NOT NULL,
    service             VARCHAR(50) NOT NULL,
    endpoint            VARCHAR(200) NOT NULL,
    method              VARCHAR(10) NOT NULL,

    request_headers     JSONB,
    request_body        TEXT,
    request_size        INTEGER,

    response_status     INTEGER,
    response_headers    JSONB,
    response_body       TEXT,
    response_size       INTEGER,

    started_at          TIMESTAMPTZ NOT NULL,
    completed_at        TIMESTAMPTZ,
    duration_ms         INTEGER,

    error_code          VARCHAR(50),
    error_message       TEXT,
    retry_attempt       INTEGER DEFAULT 0,

    user_id             UUID REFERENCES core.users(id) ON DELETE SET NULL,
    correlation_id      VARCHAR(100),

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_api_logs_provider
    ON public.external_api_logs(provider);

CREATE INDEX IF NOT EXISTS idx_external_api_logs_service
    ON public.external_api_logs(service);

CREATE INDEX IF NOT EXISTS idx_external_api_logs_response_status
    ON public.external_api_logs(response_status);

CREATE INDEX IF NOT EXISTS idx_external_api_logs_duration_ms
    ON public.external_api_logs(duration_ms);

CREATE INDEX IF NOT EXISTS idx_external_api_logs_user_id
    ON public.external_api_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_external_api_logs_correlation_id
    ON public.external_api_logs(correlation_id);

-- ========================================
-- Tabla: Actividad de usuario (core)
-- ========================================
CREATE TABLE IF NOT EXISTS core.user_activity (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,

    activity_type       VARCHAR(100) NOT NULL,
    activity_description VARCHAR(500),

    entity_type         VARCHAR(50),
    entity_id           UUID,

    ip_address          VARCHAR(45),
    user_agent          TEXT,
    session_id          VARCHAR(255),

    occurred_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id
    ON core.user_activity(user_id);

CREATE INDEX IF NOT EXISTS idx_user_activity_activity_type
    ON core.user_activity(activity_type);

CREATE INDEX IF NOT EXISTS idx_user_activity_occurred_at
    ON core.user_activity(occurred_at);

-- ========================================
-- Tabla: Vistas de listings (core)
-- ========================================
CREATE TABLE IF NOT EXISTS core.listing_views (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id          UUID NOT NULL,
    user_id             UUID REFERENCES core.users(id) ON DELETE SET NULL,
    session_id          VARCHAR(255),

    ip_address          VARCHAR(45),
    user_agent          TEXT,
    referrer            VARCHAR(500),

    time_spent          INTEGER,
    scroll_depth        INTEGER,
    images_viewed       INTEGER,
    contact_clicked     BOOLEAN,

    country             VARCHAR(2),
    region              VARCHAR(100),
    city                VARCHAR(100),

    viewed_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id
    ON core.listing_views(listing_id);

CREATE INDEX IF NOT EXISTS idx_listing_views_user_id
    ON core.listing_views(user_id);

CREATE INDEX IF NOT EXISTS idx_listing_views_session_id
    ON core.listing_views(session_id);

CREATE INDEX IF NOT EXISTS idx_listing_views_viewed_at
    ON core.listing_views(viewed_at);

COMMIT;
