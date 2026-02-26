import uuid
import asyncio
from datetime import date, timedelta
from types import SimpleNamespace
from concurrent.futures import ThreadPoolExecutor, wait, ALL_COMPLETED

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.main import app
from app.api.deps import get_current_user
from app.api.endpoints.bookings import process_payment
from app.core.database import SessionLocal
from app.models.booking import Booking, BookingPayment


def _resolve_rental_model(db_session):
    labels = db_session.execute(
        text(
            """
            SELECT e.enumlabel
            FROM pg_type t
            JOIN pg_namespace n ON n.oid = t.typnamespace
            JOIN pg_enum e ON e.enumtypid = t.oid
            WHERE n.nspname = 'core' AND t.typname = 'rental_model'
            ORDER BY e.enumsortorder
            """
        )
    ).fetchall()
    values = [row.enumlabel for row in labels]
    for candidate in ("typeairbnb", "airbnb", "traditional"):
        if candidate in values:
            return candidate
    return values[0] if values else "traditional"


def _ensure_listings_default_partition(db_session):
    partition_exists = db_session.execute(
        text(
            """
            SELECT EXISTS (
                SELECT 1
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'core'
                  AND c.relname = 'listings_test_default'
            )
            """
        )
    ).scalar_one()
    if partition_exists:
        return

    db_session.execute(
        text(
            """
            CREATE TABLE core.listings_test_default
            PARTITION OF core.listings DEFAULT
            """
        )
    )
    db_session.commit()


def _ensure_booking_payments_compat(db_session):
    paid_at_exists = db_session.execute(
        text(
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'core'
                  AND table_name = 'booking_payments'
                  AND column_name = 'paid_at'
            )
            """
        )
    ).scalar_one()
    if paid_at_exists:
        return

    db_session.execute(
        text(
            """
            ALTER TABLE core.booking_payments
            ADD COLUMN paid_at TIMESTAMPTZ
            """
        )
    )
    db_session.commit()


@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def user_ids(db_session):
    created_user_ids = []
    email_column = db_session.execute(
        text(
            """
            SELECT column_name, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'core'
              AND table_name = 'users'
              AND column_name = 'email'
            """
        )
    ).fetchone()

    needs_email = bool(email_column and email_column.is_nullable == "NO")

    owner_id = uuid.uuid4()
    guest_id = uuid.uuid4()

    for user_id in (owner_id, guest_id):
        params = {"user_id": user_id}
        if needs_email:
            params["email"] = f"atomicity_{user_id.hex[:10]}@test.local"
            db_session.execute(
                text(
                    """
                    INSERT INTO core.users (id, email, role, is_active, is_verified)
                    VALUES (:user_id, :email, 'user', TRUE, TRUE)
                    """
                ),
                params,
            )
        else:
            db_session.execute(
                text(
                    """
                    INSERT INTO core.users (id, role, is_active, is_verified)
                    VALUES (:user_id, 'user', TRUE, TRUE)
                    """
                ),
                params,
            )
        created_user_ids.append(user_id)

    db_session.commit()

    return {
        "owner_id": owner_id,
        "guest_id": guest_id,
        "created_user_ids": created_user_ids,
    }


@pytest.fixture
def listing_seed(db_session, user_ids):
    db_session.rollback()
    _ensure_booking_payments_compat(db_session)
    _ensure_listings_default_partition(db_session)
    rental_model_value = _resolve_rental_model(db_session)

    listing_row = db_session.execute(
        text(
            """
            INSERT INTO core.listings (
                owner_user_id,
                title,
                operation,
                property_type,
                advertiser_type,
                country,
                price,
                status,
                verification_status,
                rental_model,
                created_at,
                updated_at
            )
            VALUES (
                :owner_user_id,
                :title,
                'temp_rent',
                'apartment',
                'owner',
                'PE',
                :price,
                'published',
                'verified',
                :rental_model,
                now(),
                now()
            )
            RETURNING id, created_at, owner_user_id
            """
        ),
        {
            "owner_user_id": user_ids["owner_id"],
            "title": f"Listing Atomicity {uuid.uuid4().hex[:8]}",
            "price": 250,
            "rental_model": rental_model_value,
        },
    ).fetchone()
    db_session.commit()

    if not listing_row:
        pytest.skip("No se pudo crear listing de prueba para atomicidad")

    yield listing_row

    db_session.execute(
        text(
            "DELETE FROM core.listings WHERE id = :listing_id AND created_at = :created_at"
        ),
        {
            "listing_id": listing_row.id,
            "created_at": listing_row.created_at,
        },
    )
    db_session.commit()


@pytest.fixture
def guest_user(user_ids):
    return SimpleNamespace(
        id=user_ids["guest_id"],
        email="atomicity-tester@test.local",
        first_name="Atomic",
        last_name="Tester",
        role="user",
    )


@pytest.fixture(autouse=True)
def cleanup_created_users(db_session, user_ids):
    yield
    created_user_ids = user_ids.get("created_user_ids", [])
    if created_user_ids:
        db_session.rollback()
        db_session.execute(
            text("DELETE FROM core.users WHERE id = ANY(:ids)"),
            {"ids": created_user_ids},
        )
        db_session.commit()


@pytest.fixture
def api_client(guest_user):
    async def override_current_user():
        return guest_user

    app.dependency_overrides[get_current_user] = override_current_user
    with TestClient(app, base_url="http://localhost") as client:
        yield client
    app.dependency_overrides.clear()


def _create_confirmed_booking(db_session, listing_seed, guest_user):
    check_in = date.today() + timedelta(days=7)
    check_out = check_in + timedelta(days=2)

    booking = Booking(
        listing_id=listing_seed.id,
        listing_created_at=listing_seed.created_at,
        guest_user_id=guest_user.id,
        host_user_id=listing_seed.owner_user_id,
        check_in_date=check_in,
        check_out_date=check_out,
        nights=2,
        price_per_night=120,
        total_price=240,
        reservation_amount=120,
        checkin_amount=120,
        service_fee=0,
        cleaning_fee=0,
        status="confirmed",
        number_of_guests=2,
    )
    db_session.add(booking)
    db_session.commit()
    db_session.refresh(booking)
    return booking


def _cleanup_booking_artifacts(db_session, booking_id):
    db_session.execute(
        text("DELETE FROM core.booking_calendar WHERE booking_id = :booking_id"),
        {"booking_id": booking_id},
    )
    db_session.execute(
        text("DELETE FROM core.booking_payments WHERE booking_id = :booking_id"),
        {"booking_id": booking_id},
    )
    db_session.execute(
        text("DELETE FROM core.bookings WHERE id = :booking_id"),
        {"booking_id": booking_id},
    )
    db_session.commit()


def _patch_culqi(monkeypatch, charge_id, outcome_type="venta_exitosa", action_code=None):
    class FakeCharge:
        def create(self, data=None, **options):
            payload = {
                "id": charge_id,
                "outcome": {"type": outcome_type},
                "object": "charge",
            }
            if action_code is not None:
                payload["action_code"] = action_code
            return payload

    class FakeCulqi:
        def __init__(self, public_key, secret_key):
            self.charge = FakeCharge()

    monkeypatch.setattr("culqi.client.Culqi", FakeCulqi, raising=False)


@pytest.mark.integration
def test_process_payment_success_is_atomic(db_session, listing_seed, guest_user, api_client, monkeypatch):
    booking = _create_confirmed_booking(db_session, listing_seed, guest_user)
    charge_id = f"ch_atomic_{uuid.uuid4().hex[:16]}"
    _patch_culqi(monkeypatch, charge_id=charge_id)

    response = api_client.post(
        f"/v1/bookings/{booking.id}/process-payment",
        json={
            "token": f"tok_{uuid.uuid4().hex[:10]}",
            "payment_type": "reservation",
            "idempotency_key": f"idem_{uuid.uuid4().hex[:12]}",
        },
    )

    try:
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["status"] == "reservation_paid"
        assert body["charge_id"] == charge_id

        db_session.refresh(booking)
        assert booking.status == "reservation_paid"

        payment = (
            db_session.query(BookingPayment)
            .filter(BookingPayment.booking_id == booking.id)
            .order_by(BookingPayment.created_at.desc())
            .first()
        )
        assert payment is not None
        assert payment.status == "completed"
        assert payment.stripe_charge_id == charge_id
    finally:
        _cleanup_booking_artifacts(db_session, booking.id)


@pytest.mark.integration
def test_process_payment_same_idempotency_key_is_deduplicated(db_session, listing_seed, guest_user, api_client, monkeypatch):
    booking = _create_confirmed_booking(db_session, listing_seed, guest_user)
    idem_key = f"idem_same_{uuid.uuid4().hex[:12]}"
    charge_id = f"ch_idem_{uuid.uuid4().hex[:16]}"
    _patch_culqi(monkeypatch, charge_id=charge_id)

    payload = {
        "token": f"tok_{uuid.uuid4().hex[:10]}",
        "payment_type": "reservation",
        "idempotency_key": idem_key,
    }

    first_response = api_client.post(f"/v1/bookings/{booking.id}/process-payment", json=payload)
    second_response = api_client.post(f"/v1/bookings/{booking.id}/process-payment", json=payload)

    try:
        assert first_response.status_code == 200, first_response.text
        assert second_response.status_code == 200, second_response.text

        second_body = second_response.json()
        assert second_body.get("already_processed") is True

        payment_count = db_session.execute(
            text(
                """
                SELECT COUNT(*)
                FROM core.booking_payments
                WHERE booking_id = :booking_id
                  AND payment_type = 'reservation'
                  AND metadata->>'idempotency_key' = :idem_key
                """
            ),
            {"booking_id": booking.id, "idem_key": idem_key},
        ).scalar_one()

        assert payment_count == 1
    finally:
        _cleanup_booking_artifacts(db_session, booking.id)


@pytest.mark.integration
def test_duplicate_external_charge_conflict_returns_409(db_session, listing_seed, guest_user, api_client, monkeypatch):
    has_unique_index = db_session.execute(
        text(
            """
            SELECT EXISTS (
                SELECT 1
                FROM pg_indexes
                WHERE schemaname = 'core'
                  AND tablename = 'booking_payments'
                  AND indexname = 'uq_booking_payments_external_charge'
            )
            """
        )
    ).scalar_one()

    if not has_unique_index:
        pytest.skip("No existe índice uq_booking_payments_external_charge en este entorno")

    booking_one = _create_confirmed_booking(db_session, listing_seed, guest_user)
    booking_two = _create_confirmed_booking(db_session, listing_seed, guest_user)
    repeated_charge_id = f"ch_collision_{uuid.uuid4().hex[:14]}"
    _patch_culqi(monkeypatch, charge_id=repeated_charge_id)

    payload_one = {
        "token": f"tok_{uuid.uuid4().hex[:10]}",
        "payment_type": "reservation",
        "idempotency_key": f"idem_a_{uuid.uuid4().hex[:8]}",
    }
    payload_two = {
        "token": f"tok_{uuid.uuid4().hex[:10]}",
        "payment_type": "reservation",
        "idempotency_key": f"idem_b_{uuid.uuid4().hex[:8]}",
    }

    first_response = api_client.post(f"/v1/bookings/{booking_one.id}/process-payment", json=payload_one)
    second_response = api_client.post(f"/v1/bookings/{booking_two.id}/process-payment", json=payload_two)

    try:
        assert first_response.status_code == 200, first_response.text
        assert second_response.status_code == 409, second_response.text
    finally:
        _cleanup_booking_artifacts(db_session, booking_one.id)
        _cleanup_booking_artifacts(db_session, booking_two.id)


@pytest.mark.integration
def test_process_payment_heavy_concurrent_atomicity(db_session, listing_seed, guest_user, monkeypatch):
    booking = _create_confirmed_booking(db_session, listing_seed, guest_user)
    idem_key = f"idem_heavy_{uuid.uuid4().hex[:12]}"
    token = f"tok_heavy_{uuid.uuid4().hex[:10]}"
    charge_id = f"ch_heavy_{uuid.uuid4().hex[:16]}"
    _patch_culqi(monkeypatch, charge_id=charge_id)

    payload = {
        "token": token,
        "payment_type": "reservation",
        "idempotency_key": idem_key,
    }

    total_requests = 20
    batch_timeout_seconds = 60

    def _activity_snapshot():
        rows = db_session.execute(
            text(
                """
                SELECT
                    pid,
                    state,
                    wait_event_type,
                    wait_event,
                    LEFT(query, 120) AS query
                FROM pg_stat_activity
                WHERE datname = current_database()
                  AND state <> 'idle'
                ORDER BY state, pid
                LIMIT 15
                """
            )
        ).fetchall()
        return [dict(row._mapping) for row in rows]

    def _call_payment_direct():
        isolated_db = SessionLocal()
        isolated_user = SimpleNamespace(
            id=guest_user.id,
            email=guest_user.email,
            first_name=guest_user.first_name,
            last_name=guest_user.last_name,
            role=guest_user.role,
        )
        try:
            result = asyncio.run(
                process_payment(
                    booking_id=str(booking.id),
                    payment_data=payload,
                    db=isolated_db,
                    current_user=isolated_user,
                )
            )
            return {"kind": "ok", "result": result}
        except HTTPException as http_exc:
            return {
                "kind": "http",
                "status_code": http_exc.status_code,
                "detail": http_exc.detail,
            }
        except Exception as exc:
            return {"kind": "error", "detail": str(exc)}
        finally:
            isolated_db.close()

    try:
        results = []
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = [executor.submit(_call_payment_direct) for _ in range(total_requests)]
            done, pending = wait(futures, timeout=batch_timeout_seconds, return_when=ALL_COMPLETED)

            if pending:
                for future in pending:
                    future.cancel()
                snapshot = _activity_snapshot()
                pytest.fail(
                    f"Posible bloqueo/starvation: {len(pending)} requests no completaron en {batch_timeout_seconds}s. "
                    f"Actividad DB: {snapshot}"
                )

            for future in done:
                results.append(future.result())

        oks = [entry for entry in results if entry["kind"] == "ok"]
        http_responses = [entry for entry in results if entry["kind"] == "http"]
        errors = [entry for entry in results if entry["kind"] == "error"]

        assert len(oks) >= 1, results
        assert not errors, errors
        assert all(r["status_code"] < 500 for r in http_responses), http_responses

        payment_count = db_session.execute(
            text(
                """
                SELECT COUNT(*)
                FROM core.booking_payments
                WHERE booking_id = :booking_id
                  AND payment_type = 'reservation'
                  AND metadata->>'idempotency_key' = :idem_key
                """
            ),
            {"booking_id": booking.id, "idem_key": idem_key},
        ).scalar_one()
        assert payment_count == 1

        completed_count = db_session.execute(
            text(
                """
                SELECT COUNT(*)
                FROM core.booking_payments
                WHERE booking_id = :booking_id
                  AND payment_type = 'reservation'
                  AND status = 'completed'
                """
            ),
            {"booking_id": booking.id},
        ).scalar_one()
        assert completed_count == 1

        db_session.refresh(booking)
        assert booking.status == "reservation_paid"

    finally:
        _cleanup_booking_artifacts(db_session, booking.id)
