-- =====================================================
-- 15. SISTEMA DE RESERVAS PARA PROPIEDADES TIPO AIRBNB
-- =====================================================
-- Descripción: Sistema completo de reservas con pago fraccionado
-- Versión: 1.0
-- Fecha: 2025-11-22

-- =====================================================
-- 1. ENUMS - TIPOS DE DATOS
-- =====================================================

-- Estado de las reservas
CREATE TYPE core.booking_status AS ENUM (
    'pending_confirmation',    -- Esperando confirmación del propietario
    'confirmed',               -- Confirmada, esperando pago de reserva
    'reservation_paid',        -- 50% pagado (reserva confirmada)
    'checked_in',              -- Check-in realizado
    'completed',               -- Reserva completada (100% pagado)
    'cancelled_by_guest',      -- Cancelada por huésped
    'cancelled_by_host',       -- Cancelada por propietario
    'cancelled_no_payment',    -- Cancelada por falta de pago
    'refunded'                 -- Reembolsada
);

-- Estado de los pagos de reserva (renombrado para evitar conflicto)
CREATE TYPE core.booking_payment_status AS ENUM (
    'pending',              -- Pendiente de pago
    'processing',           -- Procesando pago
    'completed',            -- Pago exitoso (equivalente a 'succeeded')
    'failed',               -- Pago fallido
    'refunded',             -- Reembolsado
    'partially_refunded'    -- Parcialmente reembolsado
);

-- Tipo de pago
CREATE TYPE core.payment_type AS ENUM (
    'reservation',  -- Pago de reserva (50%)
    'checkin',      -- Pago al check-in (50%)
    'full',         -- Pago completo (100%)
    'refund'        -- Reembolso
);

COMMENT ON TYPE core.booking_status IS 'Estados del flujo de reserva Airbnb';
COMMENT ON TYPE core.booking_payment_status IS 'Estados de procesamiento de pagos de reservas (diferente del payment_status general)';
COMMENT ON TYPE core.payment_type IS 'Tipos de pago en el flujo de reserva';

-- =====================================================
-- 2. TABLA PRINCIPAL: BOOKINGS
-- =====================================================

CREATE TABLE core.bookings (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL,
    listing_created_at TIMESTAMPTZ NOT NULL,  -- Partition key needed for FK
    guest_user_id UUID NOT NULL,
    host_user_id UUID NOT NULL,
    
    -- Fechas de la reserva
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights INTEGER NOT NULL,
    
    -- Información de precios (en PEN)
    price_per_night NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    reservation_amount NUMERIC(10,2) NOT NULL,  -- 50% del total
    checkin_amount NUMERIC(10,2) NOT NULL,      -- 50% del total
    service_fee NUMERIC(10,2) DEFAULT 0.00,
    cleaning_fee NUMERIC(10,2) DEFAULT 0.00,
    
    -- Estado de la reserva
    status core.booking_status NOT NULL DEFAULT 'pending_confirmation',
    
    -- Información de huéspedes
    number_of_guests INTEGER NOT NULL,
    
    -- Comunicación
    guest_message TEXT,
    host_response TEXT,
    cancellation_reason TEXT,
    
    -- Timestamps de eventos
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    reservation_paid_at TIMESTAMPTZ,
    checked_in_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Metadata adicional
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints de validación
    CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
    CONSTRAINT valid_nights CHECK (nights > 0),
    CONSTRAINT valid_guests CHECK (number_of_guests > 0),
    CONSTRAINT valid_prices CHECK (
        total_price > 0 AND 
        reservation_amount > 0 AND 
        checkin_amount > 0
    ),
    
    -- Foreign Keys
    CONSTRAINT fk_bookings_listing FOREIGN KEY (listing_id, listing_created_at) 
        REFERENCES core.listings(id, created_at) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_guest FOREIGN KEY (guest_user_id) 
        REFERENCES core.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_host FOREIGN KEY (host_user_id) 
        REFERENCES core.users(id) ON DELETE CASCADE
);

-- Comentarios
COMMENT ON TABLE core.bookings IS 'Reservas de propiedades tipo Airbnb con pago fraccionado';
COMMENT ON COLUMN core.bookings.listing_created_at IS 'Partition key de la tabla listings (requerido para foreign key)';
COMMENT ON COLUMN core.bookings.reservation_amount IS 'Monto del primer pago (50% del total)';
COMMENT ON COLUMN core.bookings.checkin_amount IS 'Monto del segundo pago al check-in (50% restante)';
COMMENT ON COLUMN core.bookings.metadata IS 'Datos adicionales: políticas de cancelación, instrucciones especiales, etc.';

-- Índices para optimizar consultas
CREATE INDEX idx_bookings_listing ON core.bookings(listing_id);
CREATE INDEX idx_bookings_guest ON core.bookings(guest_user_id);
CREATE INDEX idx_bookings_host ON core.bookings(host_user_id);
CREATE INDEX idx_bookings_status ON core.bookings(status);
CREATE INDEX idx_bookings_dates ON core.bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_created_at ON core.bookings(created_at DESC);

-- Índice compuesto para búsquedas comunes
CREATE INDEX idx_bookings_listing_status ON core.bookings(listing_id, status);
CREATE INDEX idx_bookings_guest_status ON core.bookings(guest_user_id, status);

-- =====================================================
-- 3. TABLA: BOOKING_PAYMENTS
-- =====================================================

CREATE TABLE core.booking_payments (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL,
    
    -- Información del pago
    payment_type core.payment_type NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PEN',
    
    -- Estado del pago
    status core.booking_payment_status NOT NULL DEFAULT 'pending',
    
    -- Integración con Stripe
    payment_method VARCHAR(50),           -- 'card', 'stripe', etc.
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_charge_id TEXT,
    stripe_refund_id TEXT,
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20),               -- 'visa', 'mastercard', etc.
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    
    -- Metadata y errores
    metadata JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    error_code VARCHAR(50),
    
    -- Constraints
    CONSTRAINT valid_amount CHECK (amount > 0),
    
    -- Foreign Key
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) 
        REFERENCES core.bookings(id) ON DELETE CASCADE
);

-- Comentarios
COMMENT ON TABLE core.booking_payments IS 'Registro de pagos asociados a reservas Airbnb';
COMMENT ON COLUMN core.booking_payments.stripe_payment_intent_id IS 'ID del PaymentIntent de Stripe para tracking';
COMMENT ON COLUMN core.booking_payments.metadata IS 'Información adicional del pago (IP, browser, etc.)';

-- Índices
CREATE INDEX idx_payments_booking ON core.booking_payments(booking_id);
CREATE INDEX idx_payments_status ON core.booking_payments(status);
CREATE INDEX idx_payments_stripe_intent ON core.booking_payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_created_at ON core.booking_payments(created_at DESC);

-- Índice para búsquedas por tipo de pago
CREATE INDEX idx_payments_type_status ON core.booking_payments(payment_type, status);

-- =====================================================
-- 4. TABLA: BOOKING_CALENDAR (Disponibilidad)
-- =====================================================

CREATE TABLE core.booking_calendar (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL,
    listing_created_at TIMESTAMPTZ NOT NULL,  -- Partition key needed for FK
    date DATE NOT NULL,
    
    -- Disponibilidad
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Precios dinámicos
    price_override NUMERIC(10,2),         -- Precio especial para esta fecha (opcional)
    minimum_nights INTEGER,               -- Mínimo de noches requerido desde esta fecha
    
    -- Referencia a reserva (si está ocupada)
    booking_id UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Notas internas
    notes TEXT,
    
    -- Constraint: Una fecha única por propiedad
    CONSTRAINT unique_listing_date UNIQUE (listing_id, listing_created_at, date),
    
    -- Foreign Keys
    CONSTRAINT fk_calendar_listing FOREIGN KEY (listing_id, listing_created_at) 
        REFERENCES core.listings(id, created_at) ON DELETE CASCADE,
    CONSTRAINT fk_calendar_booking FOREIGN KEY (booking_id) 
        REFERENCES core.bookings(id) ON DELETE SET NULL
);

-- Comentarios
COMMENT ON TABLE core.booking_calendar IS 'Calendario de disponibilidad y precios por fecha para cada propiedad';
COMMENT ON COLUMN core.booking_calendar.listing_created_at IS 'Partition key de la tabla listings (requerido para foreign key)';
COMMENT ON COLUMN core.booking_calendar.price_override IS 'Precio especial para días festivos, temporada alta, etc.';
COMMENT ON COLUMN core.booking_calendar.booking_id IS 'Referencia a la reserva que bloqueó esta fecha';

-- Índices para consultas de disponibilidad
CREATE INDEX idx_calendar_listing ON core.booking_calendar(listing_id);
CREATE INDEX idx_calendar_date ON core.booking_calendar(date);
CREATE INDEX idx_calendar_available ON core.booking_calendar(is_available);
CREATE INDEX idx_calendar_listing_date ON core.booking_calendar(listing_id, date);

-- Índice para rango de fechas (muy usado)
CREATE INDEX idx_calendar_listing_date_range ON core.booking_calendar(listing_id, date) 
    WHERE is_available = TRUE;

-- =====================================================
-- 5. TRIGGERS - ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Trigger para actualizar updated_at en bookings
CREATE OR REPLACE FUNCTION core.update_booking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON core.bookings
    FOR EACH ROW
    EXECUTE FUNCTION core.update_booking_timestamp();

-- Trigger para actualizar updated_at en payments
CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON core.booking_payments
    FOR EACH ROW
    EXECUTE FUNCTION core.update_booking_timestamp();

-- Trigger para actualizar updated_at en calendar
CREATE TRIGGER trg_calendar_updated_at
    BEFORE UPDATE ON core.booking_calendar
    FOR EACH ROW
    EXECUTE FUNCTION core.update_booking_timestamp();

-- =====================================================
-- 6. FUNCIONES ÚTILES
-- =====================================================

-- Función: Bloquear fechas al confirmar reserva
CREATE OR REPLACE FUNCTION core.block_booking_dates(
    p_booking_id UUID
) RETURNS VOID AS $$
DECLARE
    v_listing_id UUID;
    v_listing_created_at TIMESTAMPTZ;
    v_check_in DATE;
    v_check_out DATE;
    v_current_date DATE;
BEGIN
    -- Obtener datos de la reserva
    SELECT listing_id, listing_created_at, check_in_date, check_out_date
    INTO v_listing_id, v_listing_created_at, v_check_in, v_check_out
    FROM core.bookings
    WHERE id = p_booking_id;
    
    -- Bloquear cada fecha en el rango
    v_current_date := v_check_in;
    WHILE v_current_date < v_check_out LOOP
        INSERT INTO core.booking_calendar (listing_id, listing_created_at, date, is_available, booking_id)
        VALUES (v_listing_id, v_listing_created_at, v_current_date, FALSE, p_booking_id)
        ON CONFLICT (listing_id, listing_created_at, date) 
        DO UPDATE SET 
            is_available = FALSE,
            booking_id = p_booking_id,
            updated_at = now();
        
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION core.block_booking_dates IS 'Bloquea las fechas en el calendario cuando se confirma una reserva';

-- Función: Liberar fechas al cancelar reserva
CREATE OR REPLACE FUNCTION core.unblock_booking_dates(
    p_booking_id UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE core.booking_calendar
    SET 
        is_available = TRUE,
        booking_id = NULL,
        updated_at = now()
    WHERE booking_id = p_booking_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION core.unblock_booking_dates IS 'Libera las fechas bloqueadas cuando se cancela una reserva';

-- Función: Verificar disponibilidad de fechas
CREATE OR REPLACE FUNCTION core.check_availability(
    p_listing_id UUID,
    p_check_in DATE,
    p_check_out DATE
) RETURNS BOOLEAN AS $$
DECLARE
    v_blocked_count INTEGER;
BEGIN
    -- Contar fechas no disponibles en el rango
    SELECT COUNT(*)
    INTO v_blocked_count
    FROM core.booking_calendar
    WHERE listing_id = p_listing_id
      AND date >= p_check_in
      AND date < p_check_out
      AND is_available = FALSE;
    
    -- Si hay alguna fecha bloqueada, no está disponible
    RETURN (v_blocked_count = 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION core.check_availability IS 'Verifica si un rango de fechas está completamente disponible';

-- =====================================================
-- 7. VISTAS ÚTILES
-- =====================================================

-- Vista: Reservas activas con información completa
CREATE OR REPLACE VIEW core.v_active_bookings AS
SELECT 
    b.id,
    b.listing_id,
    l.title AS listing_title,
    b.guest_user_id,
    CONCAT(gu.first_name, ' ', gu.last_name) AS guest_name,
    gu.email AS guest_email,
    b.host_user_id,
    CONCAT(hu.first_name, ' ', hu.last_name) AS host_name,
    hu.email AS host_email,
    b.check_in_date,
    b.check_out_date,
    b.nights,
    b.total_price,
    b.status,
    b.number_of_guests,
    b.created_at,
    b.confirmed_at,
    b.reservation_paid_at
FROM core.bookings b
JOIN core.listings l ON b.listing_id = l.id
JOIN core.users gu ON b.guest_user_id = gu.id
JOIN core.users hu ON b.host_user_id = hu.id
WHERE b.status NOT IN ('completed', 'cancelled_by_guest', 'cancelled_by_host', 'cancelled_no_payment');

COMMENT ON VIEW core.v_active_bookings IS 'Vista de reservas activas con información de huésped, propietario y propiedad';

-- Vista: Resumen de pagos por reserva
CREATE OR REPLACE VIEW core.v_booking_payment_summary AS
SELECT 
    b.id AS booking_id,
    b.total_price,
    b.reservation_amount AS expected_reservation_payment,
    b.checkin_amount AS expected_checkin_payment,
    COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0) AS total_paid,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type = 'reservation' AND p.status = 'completed'), 0) AS reservation_paid,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type = 'checkin' AND p.status = 'completed'), 0) AS checkin_paid,
    (b.total_price - COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0)) AS pending_amount
FROM core.bookings b
LEFT JOIN core.booking_payments p ON b.id = p.booking_id
GROUP BY b.id, b.total_price, b.reservation_amount, b.checkin_amount;

COMMENT ON VIEW core.v_booking_payment_summary IS 'Resumen de pagos realizados vs esperados por cada reserva';

-- =====================================================
-- 8. DATOS INICIALES (OPCIONAL)
-- =====================================================

-- Crear entradas de calendario para los próximos 365 días para propiedades Airbnb existentes
-- (Ejecutar solo si ya existen propiedades tipo Airbnb)

-- Ejemplo de cómo generar calendario:
-- INSERT INTO core.booking_calendar (listing_id, date, is_available)
-- SELECT 
--     l.id,
--     generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '365 days', INTERVAL '1 day')::DATE,
--     TRUE
-- FROM core.listings l
-- WHERE l.property_type = 'airbnb'
-- ON CONFLICT (listing_id, date) DO NOTHING;

-- =====================================================
-- 9. PERMISOS
-- =====================================================

-- Nota: Descomentar estas líneas si tienes un rol 'app_user' creado
-- o reemplazar 'app_user' con el rol que uses para tu aplicación backend

-- Permisos para aplicación backend
-- GRANT SELECT, INSERT, UPDATE, DELETE ON core.bookings TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON core.booking_payments TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON core.booking_calendar TO app_user;

-- Permisos para vistas
-- GRANT SELECT ON core.v_active_bookings TO app_user;
-- GRANT SELECT ON core.v_booking_payment_summary TO app_user;

-- Permisos para ejecutar funciones
-- GRANT EXECUTE ON FUNCTION core.block_booking_dates TO app_user;
-- GRANT EXECUTE ON FUNCTION core.unblock_booking_dates TO app_user;
-- GRANT EXECUTE ON FUNCTION core.check_availability TO app_user;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- Verificar la creación
SELECT 'Tablas de reservas Airbnb creadas exitosamente' AS status;
