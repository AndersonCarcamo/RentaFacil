-- ========================================
-- BOOKING CALENDAR - DB CONCURRENCY HARDENING
-- Garantiza unicidad por fecha/listing y patrón upsert seguro
-- ========================================

BEGIN;

-- 1) Limpieza defensiva de duplicados (si existieran)
WITH ranked AS (
    SELECT
        ctid,
        row_number() OVER (
            PARTITION BY listing_id, listing_created_at, date
            ORDER BY
                is_available ASC,
                updated_at DESC NULLS LAST,
                created_at DESC NULLS LAST,
                ctid DESC
        ) AS rn
    FROM core.booking_calendar
)
DELETE FROM core.booking_calendar t
USING ranked r
WHERE t.ctid = r.ctid
  AND r.rn > 1;

-- 2) Índice único para conflicto atómico por día/listing
CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_calendar_listing_created_date_idx
    ON core.booking_calendar(listing_id, listing_created_at, date);

-- 3) Constraint único (si no existe) usando el índice
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'core'
          AND t.relname = 'booking_calendar'
          AND c.contype = 'u'
          AND c.conname = 'unique_listing_date'
    ) THEN
        ALTER TABLE core.booking_calendar
            ADD CONSTRAINT unique_listing_date
            UNIQUE USING INDEX uq_booking_calendar_listing_created_date_idx;
    END IF;
END;
$$;

-- 4) Función de apoyo para bloquear fechas con upsert (idempotente)
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
    SELECT listing_id, listing_created_at, check_in_date, check_out_date
    INTO v_listing_id, v_listing_created_at, v_check_in, v_check_out
    FROM core.bookings
    WHERE id = p_booking_id;

    v_current_date := v_check_in;
    WHILE v_current_date < v_check_out LOOP
        INSERT INTO core.booking_calendar (
            listing_id,
            listing_created_at,
            date,
            is_available,
            booking_id,
            created_at,
            updated_at
        )
        VALUES (
            v_listing_id,
            v_listing_created_at,
            v_current_date,
            FALSE,
            p_booking_id,
            now(),
            now()
        )
        ON CONFLICT (listing_id, listing_created_at, date)
        DO UPDATE SET
            is_available = FALSE,
            booking_id = p_booking_id,
            updated_at = now();

        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION core.block_booking_dates(UUID)
IS 'Bloquea fechas por reserva usando UPSERT atómico para evitar carreras concurrentes.';

COMMIT;
