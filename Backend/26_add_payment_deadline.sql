-- =====================================================
-- 26. PAYMENT DEADLINE - PLAZO DE PAGO
-- =====================================================
-- Agrega campo payment_deadline para controlar el plazo de 6 horas
-- que tiene el huésped para pagar después de que el host confirma

\echo '📅 Agregando campo payment_deadline a bookings...'

-- Agregar nuevo valor al enum booking_status
DO $$ 
BEGIN
    -- Verificar si el valor ya existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'cancelled_payment_expired' 
        AND enumtypid = 'core.booking_status'::regtype
    ) THEN
        -- Agregar el nuevo valor al enum
        ALTER TYPE core.booking_status ADD VALUE 'cancelled_payment_expired';
        RAISE NOTICE 'Valor cancelled_payment_expired agregado al enum booking_status';
    ELSE
        RAISE NOTICE 'Valor cancelled_payment_expired ya existe en el enum';
    END IF;
END $$;

-- Agregar columna payment_deadline
ALTER TABLE core.bookings
ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN core.bookings.payment_deadline IS 
'Fecha límite para que el huésped complete el pago del 50% después de que el host confirma la reserva (6 horas)';

-- Crear índice para buscar reservas con deadline vencido
CREATE INDEX IF NOT EXISTS idx_bookings_payment_deadline 
ON core.bookings(payment_deadline) 
WHERE status = 'confirmed' AND payment_deadline IS NOT NULL;

COMMENT ON INDEX core.idx_bookings_payment_deadline IS 
'Índice para buscar reservas confirmadas con deadline de pago pendiente o vencido';

-- =====================================================
-- FUNCIÓN: Cancelar reservas con pago vencido
-- =====================================================

CREATE OR REPLACE FUNCTION core.cancel_expired_payment_bookings()
RETURNS TABLE(
    cancelled_booking_id UUID,
    guest_email TEXT,
    listing_title TEXT,
    deadline TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    WITH cancelled AS (
        UPDATE core.bookings b
        SET 
            status = 'cancelled_payment_expired',
            cancelled_at = NOW(),
            cancellation_reason = 'Pago no recibido dentro del plazo de 6 horas'
        WHERE 
            b.status = 'confirmed'
            AND b.payment_deadline IS NOT NULL
            AND b.payment_deadline < NOW()
            AND b.reservation_paid_at IS NULL
        RETURNING 
            b.id,
            b.guest_user_id,
            b.listing_id,
            b.payment_deadline
    )
    SELECT 
        c.id,
        u.email,
        l.title,
        c.payment_deadline
    FROM cancelled c
    JOIN core.users u ON c.guest_user_id = u.id
    JOIN core.listings l ON c.listing_id = l.id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION core.cancel_expired_payment_bookings() IS 
'Cancela automáticamente las reservas confirmadas cuyo plazo de pago (6 horas) ha vencido. Retorna las reservas canceladas para enviar notificaciones.';

-- =====================================================
-- FUNCIÓN: Obtener reservas próximas a vencer (30 min antes)
-- =====================================================

CREATE OR REPLACE FUNCTION core.get_payment_deadline_warnings()
RETURNS TABLE(
    booking_id UUID,
    guest_email TEXT,
    guest_name TEXT,
    listing_title TEXT,
    deadline TIMESTAMP WITH TIME ZONE,
    minutes_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        u.email,
        CONCAT_WS(' ', u.first_name, u.last_name),
        l.title,
        b.payment_deadline,
        EXTRACT(EPOCH FROM (b.payment_deadline - NOW()))/60 AS minutes_remaining
    FROM core.bookings b
    JOIN core.users u ON b.guest_user_id = u.id
    JOIN core.listings l ON b.listing_id = l.id
    WHERE 
        b.status = 'confirmed'
        AND b.payment_deadline IS NOT NULL
        AND b.reservation_paid_at IS NULL
        AND b.payment_deadline > NOW()
        AND b.payment_deadline <= NOW() + INTERVAL '30 minutes'
    ORDER BY b.payment_deadline ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION core.get_payment_deadline_warnings() IS 
'Retorna reservas que están a 30 minutos o menos de que venza su plazo de pago, para enviar recordatorios.';

-- =====================================================
-- VISTA: Reservas con estado de pago pendiente
-- =====================================================

CREATE OR REPLACE VIEW core.bookings_payment_status AS
SELECT 
    b.id,
    b.guest_user_id,
    b.listing_id,
    b.status,
    b.payment_deadline,
    b.confirmed_at,
    b.reservation_paid_at,
    CASE 
        WHEN b.status != 'confirmed' THEN 'not_applicable'
        WHEN b.reservation_paid_at IS NOT NULL THEN 'paid'
        WHEN b.payment_deadline IS NULL THEN 'no_deadline'
        WHEN b.payment_deadline > NOW() THEN 'pending'
        ELSE 'expired'
    END AS payment_status,
    CASE 
        WHEN b.payment_deadline IS NOT NULL AND b.payment_deadline > NOW() THEN
            EXTRACT(EPOCH FROM (b.payment_deadline - NOW()))/3600
        ELSE NULL
    END AS hours_remaining
FROM core.bookings b;

COMMENT ON VIEW core.bookings_payment_status IS 
'Vista para monitorear el estado de pago de las reservas y tiempo restante';

\echo '✅ Campo payment_deadline agregado exitosamente'
\echo '✅ Funciones de gestión de deadline creadas'
\echo ''
\echo '📝 FUNCIONES DISPONIBLES:'
\echo '  - core.cancel_expired_payment_bookings(): Cancela reservas con pago vencido'
\echo '  - core.get_payment_deadline_warnings(): Obtiene reservas próximas a vencer'
\echo ''
\echo '📊 VISTA DISPONIBLE:'
\echo '  - core.bookings_payment_status: Monitorea estado de pago de reservas'
\echo ''
\echo '💡 PRÓXIMO PASO: Configurar tarea programada (cron job) para ejecutar:'
\echo '  SELECT * FROM core.cancel_expired_payment_bookings();'
\echo '  Recomendado: Cada 15 minutos'
