-- =====================================================
-- 29. CONCURRENCIA / IDEMPOTENCIA DE PAGOS (BOOKINGS + INVOICES)
-- =====================================================
-- Objetivo:
-- 1) Evitar duplicados por retries/reintentos concurrentes.
-- 2) Forzar unicidad de identificadores externos del proveedor.
-- 3) Blindar el flujo invoice/payment para que un invoice no se pague dos veces.

-- =====================================================

-- BOOKING PAYMENTS (core.booking_payments)
-- =====================================================

-- Un charge externo no debe registrarse más de una vez
CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_payments_external_charge
ON core.booking_payments (stripe_charge_id)
WHERE stripe_charge_id IS NOT NULL;

-- Idempotencia por booking + payment_type + idempotency_key en metadata JSONB
CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_payments_idempotency_key
ON core.booking_payments (
    booking_id,
    payment_type,
    (metadata ->> 'idempotency_key')
)
WHERE metadata ? 'idempotency_key';

-- Máximo un pago exitoso de reserva/full por booking
CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_payments_single_success
ON core.booking_payments (booking_id, payment_type)
WHERE status = 'completed'
  AND payment_type IN ('reservation', 'full');


-- =====================================================
-- BILLING PAYMENTS (core.payments)
-- =====================================================

-- Un pago externo del proveedor debe mapear a un único registro interno
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_provider_payment_id
ON core.payments (provider, provider_payment_id)
WHERE provider_payment_id IS NOT NULL;

-- Un invoice no debe terminar con más de un pago en estado succeeded
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_single_succeeded_per_invoice
ON core.payments (invoice_id)
WHERE status = 'succeeded';
