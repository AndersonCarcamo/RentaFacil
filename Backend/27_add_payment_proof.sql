-- =====================================================
-- 27. PAYMENT PROOF - COMPROBANTE DE PAGO
-- =====================================================
-- Agrega campos para almacenar comprobante de pago

\echo '💳 Agregando campos para comprobante de pago...'

-- Agregar columnas para comprobante de pago
ALTER TABLE core.bookings
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_verified_by UUID,
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN core.bookings.payment_proof_url IS 
'URL del comprobante de pago (voucher/transferencia) subido por el huésped';

COMMENT ON COLUMN core.bookings.payment_proof_uploaded_at IS 
'Fecha y hora cuando el huésped subió el comprobante de pago';

COMMENT ON COLUMN core.bookings.payment_verified_by IS 
'ID del usuario admin que verificó el pago';

COMMENT ON COLUMN core.bookings.payment_verified_at IS 
'Fecha y hora cuando se verificó el pago';

\echo '✅ Campos de comprobante de pago agregados exitosamente'
