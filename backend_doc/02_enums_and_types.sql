-- ===== Real Estate Marketplace MVP - Enums & Types =====
-- Comprehensive enumeration types for marketplace operations

BEGIN;

-- Core listing enums
DO $main$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
        CREATE TYPE core.listing_status AS ENUM ('draft','published','archived','moderated','removed');
    END IF;
    
    -- Add pending_verification if not exists
    BEGIN
       SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid 
       WHERE t.typname='listing_status' AND e.enumlabel='pending_verification';
      IF NOT FOUND THEN 
          EXECUTE 'ALTER TYPE core.listing_status ADD VALUE IF NOT EXISTS ''pending_verification'''; 
      END IF;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $main$;

DO $types1$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operation_type') THEN
        CREATE TYPE core.operation_type AS ENUM ('sale','rent','temp_rent','auction','exchange');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type') THEN
        CREATE TYPE core.property_type AS ENUM (
            'apartment','house','office','commercial','land','warehouse','garage','other'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'advertiser_type') THEN
        CREATE TYPE core.advertiser_type AS ENUM ('owner','agency','developer','broker');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rental_term') THEN
        CREATE TYPE core.rental_term AS ENUM ('daily','weekly','monthly','yearly');
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
            'agent',       -- Agente inmobiliario (maneja múltiples propiedades)
            'admin'        -- Administrador del sistema
        );
    END IF;
END $user_roles$;

-- Subscription and billing
DO $types4$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_tier') THEN
        CREATE TYPE core.plan_tier AS ENUM ('free','basic','premium','enterprise');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_period') THEN
        CREATE TYPE core.plan_period AS ENUM ('monthly','quarterly','yearly','permanent');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE core.subscription_status AS ENUM ('active','trialing','past_due','canceled','paused');
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
        CREATE TYPE core.billing_provider AS ENUM ('stripe','culqi','mercadopago','paypal','bank_transfer','other');
    END IF;
END $types5$;

COMMIT;
