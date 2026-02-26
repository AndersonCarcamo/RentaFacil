-- ========================================
-- ASYNC IMPROVEMENTS (índices + lease fields)
-- Optimización de tablas existentes para workers/concurrencia
-- ========================================

BEGIN;

-- ========================================
-- Notification Queue: lease fields para workers
-- ========================================
ALTER TABLE IF EXISTS core.notification_queue
    ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS lock_owner VARCHAR(100),
    ADD COLUMN IF NOT EXISTS available_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Índice para consumo eficiente (cola)
CREATE INDEX IF NOT EXISTS idx_notification_queue_worker_pick
    ON core.notification_queue(processing, available_at, priority_score DESC, created_at);

-- Índice para inspección de locks
CREATE INDEX IF NOT EXISTS idx_notification_queue_locks
    ON core.notification_queue(lock_owner, locked_at)
    WHERE processing = TRUE;

-- ========================================
-- Notification Deliveries: retries/histórico
-- ========================================
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_retry
    ON core.notification_deliveries(status, next_attempt_at, attempt_count);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_timeline
    ON core.notification_deliveries(notification_id, created_at DESC);

-- ========================================
-- Chat: conversations inbox
-- ========================================
CREATE INDEX IF NOT EXISTS idx_conversations_client_inbox
    ON chat.conversations(client_user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_owner_inbox
    ON chat.conversations(owner_user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_client_archived
    ON chat.conversations(client_user_id, archived_by_client, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_owner_archived
    ON chat.conversations(owner_user_id, archived_by_owner, updated_at DESC);

-- ========================================
-- Chat: messages no leídos / timeline
-- ========================================
CREATE INDEX IF NOT EXISTS idx_messages_conversation_timeline
    ON chat.messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_unread_sender
    ON chat.messages(conversation_id, status, sender_user_id)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_messages_mark_read
    ON chat.messages(conversation_id, sender_user_id, status)
    WHERE is_deleted = FALSE;

-- ========================================
-- Webhooks: entrega y reintentos
-- ========================================
CREATE INDEX IF NOT EXISTS idx_webhooks_active_user
    ON public.webhooks(active, user_id);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_ops
    ON public.webhook_deliveries(webhook_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry
    ON public.webhook_deliveries(status, next_retry_at, attempt_count);

CREATE INDEX IF NOT EXISTS idx_webhook_event_logs_processed
    ON public.webhook_event_logs(processed, created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_event_logs_type_created
    ON public.webhook_event_logs(event_type, created_at DESC);

-- ========================================
-- Bookings y pagos: consultas operativas
-- ========================================
CREATE INDEX IF NOT EXISTS idx_bookings_host_created
    ON core.bookings(host_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_guest_created
    ON core.bookings(guest_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_status_deadline
    ON core.bookings(status, payment_deadline);

CREATE INDEX IF NOT EXISTS idx_bookings_listing_dates
    ON core.bookings(listing_id, check_in_date, check_out_date);

CREATE INDEX IF NOT EXISTS idx_booking_payments_booking_created
    ON core.booking_payments(booking_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_payments_status_created
    ON core.booking_payments(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_payments_type_status
    ON core.booking_payments(payment_type, status);

-- ========================================
-- Logs/eventos de alto volumen
-- ========================================
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created
    ON core.analytics_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_external_api_logs_created
    ON public.external_api_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_occurred
    ON core.user_activity(user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_listing_views_listing_viewed
    ON core.listing_views(listing_id, viewed_at DESC);

COMMIT;
