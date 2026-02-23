-- ===== Real Estate Marketplace MVP - Enums & Types =====
-- Comprehensive enumeration types for marketplace operations

BEGIN;

-- Core listing enums
DO $main$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
        CREATE TYPE core.listing_status AS ENUM ('draft','published','archived','moderated','removed', 'pending_verification');
    END IF;
END $main$;

DO $types1$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operation_type') THEN
        CREATE TYPE core.operation_type AS ENUM ('sale','rent','temp_rent');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type') THEN
        CREATE TYPE core.property_type AS ENUM (
            'studio','apartment','house','office','commercial','land','warehouse','garage','room','other'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_tier') THEN
        CREATE TYPE core.plan_tier AS ENUM (
            -- Individual
            'individual_free',
            'individual_basic',
            'individual_premium',
            -- Empresa
            'enterprise_basic',
            'enterprise_premium',
            'enterprise_unlimited'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'advertiser_type') THEN
        CREATE TYPE core.advertiser_type AS ENUM ('owner','developer','agency','broker');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'advertiser_status') THEN
        CREATE TYPE core.advertiser_status AS ENUM ('active','inactive','suspended');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rental_term') THEN
        CREATE TYPE core.rental_term AS ENUM ('daily','weekly','monthly','yearly');
    END IF;
    
    -- New enum for rental modality (how the space is shared)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rental_mode') THEN
        CREATE TYPE core.rental_mode AS ENUM ('full_property','private_room','shared_room');
    END IF;
END $types1$;

-- Verification workflow
DO $types2$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE core.verification_status AS ENUM ('pending','verified','rejected');
    END IF;
END $types2$;

-- Analytics and user behavior
DO $types3$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
        CREATE TYPE analytics.event_type AS ENUM (
            'page_view','listing_view','search','contact','favorite','unfavorite','lead','conversion'
        );
    END IF;
END $types3$;

-- User roles and permissions
DO $user_roles$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE core.user_role AS ENUM (
            'user',        -- Usuario básico (navegar, buscar)
            'tenant',      -- Inquilino/Cliente (busca propiedades)
            'landlord',    -- Propietario (publica propiedades)
            'agency',      -- Agencia inmobiliaria (maneja múltiples propiedades y agentes)
            'agent',       -- Agente inmobiliario (maneja múltiples propiedades)
            'admin'        -- Administrador del sistema
        );
    END IF;
END $user_roles$;

-- Subscription and billing
DO $types4$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_period') THEN
        CREATE TYPE core.plan_period AS ENUM ('monthly','yearly','permanent');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE core.subscription_status AS ENUM ('active','trialing','past_due','canceled','paused');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_target_type') THEN
        CREATE TYPE core.plan_target_type AS ENUM ('individual', 'agency');
    END IF;
END $types4$;

-- Billing system enums
DO $types5$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        CREATE TYPE core.invoice_status AS ENUM ('draft','open','paid','void','uncollectible');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE core.payment_status AS ENUM ('pending','succeeded','failed','refunded');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_provider') THEN
        CREATE TYPE core.billing_provider AS ENUM ('culqi','stripe','mercadopago','paypal','bank_transfer','other');
    END IF;
END $types5$;

COMMIT;

--Estado de las reservas

DO $reservation_status$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE core.booking_status AS ENUM (
            'pending_confirmation',    -- Esperando confirmación del propietario
            'confirmed',               -- Confirmada, esperando pago de reserva
            'reservation_paid',        -- 50% pagado (reserva confirmada)
            'checked_in',              -- Check-in realizado
            'completed',               -- Reserva completada (100% pagado)
            'cancelled_by_guest',      -- Cancelada por huésped
            'cancelled_by_host',       -- Cancelada por propietario
            'cancelled_no_payment',    -- Cancelada por falta de pago
            'cancelled_payment_expired', -- Cancelada por vencimiento de pago
            'refunded'                 -- Reembolsada
        );
    END IF;
END $reservation_status$;

-- Estado de los pagos relacionados a las reservas
DO $payment_status$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_payment_status') THEN
        CREATE TYPE core.booking_payment_status AS ENUM (
            'pending',              -- Pendiente de pago
            'processing',           -- Procesando pago
            'completed',            -- Pago exitoso (equivalente a 'succeeded')
            'failed',               -- Pago fallido
            'refunded',             -- Reembolsado
            'partially_refunded'    -- Parcialmente reembolsado
        );
    END IF;
END $payment_status$;

-- Estado de los pagos relacionados a las reservas
DO $payment_type$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN
        CREATE TYPE core.payment_type AS ENUM (
            'reservation',  -- Pago de reserva (50%)
            'checkin',      -- Pago al check-in (50%)
            'full',         -- Pago completo (100%)
            'refund'        -- Reembolso
        );
    END IF;
END $payment_type$;

COMMENT ON TYPE core.booking_status IS 'Estados del flujo de reserva Airbnb';
COMMENT ON TYPE core.booking_payment_status IS 'Estados de procesamiento de pagos de reservas (diferente del payment_status general)';
COMMENT ON TYPE core.payment_type IS 'Tipos de pago en el flujo de reserva';

-- Media Type enums

DO $media_type$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN
        CREATE TYPE core.media_type AS ENUM ('image', 'video', 'virtual_tour', 'document');
    END IF;
END $media_type$;

-- MENSAJES

DO $message_status$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_status') THEN
        CREATE TYPE chat.message_status AS ENUM (
            'sent',
            'delivered',
            'read'
        );
    END IF;
END $message_status$;

DO $message_type$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
        CREATE TYPE chat.message_type AS ENUM (
            'text',
            'image',
            'document',
            'system'
        );
    END IF;
END $message_type$;

-- Notificaciones

-- Enum para tipo de notificación
DO $notification_type$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE core.notification_type AS ENUM (
            'system',
            'verification',
            'listing',
            'subscription',
            'message',
            'lead',
            'review',
            'payment',
            'security'
        );
    END IF;
END $notification_type$;

-- Enum para prioridad de notificación
do $notification_priority$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_priority') THEN
        CREATE TYPE core.notification_priority AS ENUM (
            'low',
            'medium',
            'high',
            'urgent'
        );
    END IF;
END $notification_priority$;

-- Enum para método de entrega
DO $notification_method$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_method') THEN
        CREATE TYPE core.delivery_method AS ENUM (
            'in_app',
            'email',
            'sms',
            'push'
        );
    END IF;
END $notification_method$;

-- Enum para estado de notificación
DO $notification_status$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
        CREATE TYPE core.notification_status AS ENUM (
            'pending',
            'sent',
            'delivered',
            'read',
            'failed'
        );
    END IF;
END $notification_status$;

-- Enum para frecuencia de digest
DO $digest_frequency$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'digest_frequency') THEN
        CREATE TYPE core.digest_frequency AS ENUM (
            'none',
            'daily',
            'weekly'
        );
    END IF;
END $digest_frequency$;
