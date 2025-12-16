"""
Modelos para el sistema de reservas Airbnb
"""
from sqlalchemy import Column, String, Integer, Numeric, Text, TIMESTAMP, ForeignKey, CheckConstraint, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB, DATE
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from ..core.database import Base


class BookingStatus(str, enum.Enum):
    """Estados de las reservas"""
    PENDING_CONFIRMATION = "pending_confirmation"
    CONFIRMED = "confirmed"
    RESERVATION_PAID = "reservation_paid"
    CHECKED_IN = "checked_in"
    COMPLETED = "completed"
    CANCELLED_BY_GUEST = "cancelled_by_guest"
    CANCELLED_BY_HOST = "cancelled_by_host"
    CANCELLED_NO_PAYMENT = "cancelled_no_payment"
    CANCELLED_PAYMENT_EXPIRED = "cancelled_payment_expired"  # Pago no recibido en 6 horas
    REFUNDED = "refunded"


class BookingPaymentStatus(str, enum.Enum):
    """Estados de los pagos de reserva"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class PaymentType(str, enum.Enum):
    """Tipos de pago"""
    RESERVATION = "reservation"  # 50% inicial
    CHECKIN = "checkin"          # 50% al check-in
    FULL = "full"                # 100% completo
    REFUND = "refund"            # Reembolso


class Booking(Base):
    """Modelo de reservas Airbnb"""
    __tablename__ = "bookings"
    __table_args__ = {"schema": "core"}

    # Identificadores
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id = Column(UUID(as_uuid=True), nullable=False)
    listing_created_at = Column(TIMESTAMP(timezone=True), nullable=False)
    guest_user_id = Column(UUID(as_uuid=True), nullable=False)
    host_user_id = Column(UUID(as_uuid=True), nullable=False)

    # Fechas de la reserva
    check_in_date = Column(DATE, nullable=False)
    check_out_date = Column(DATE, nullable=False)
    nights = Column(Integer, nullable=False)

    # Información de precios
    price_per_night = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    reservation_amount = Column(Numeric(10, 2), nullable=False)  # 50%
    checkin_amount = Column(Numeric(10, 2), nullable=False)      # 50%
    service_fee = Column(Numeric(10, 2), default=0.00)
    cleaning_fee = Column(Numeric(10, 2), default=0.00)

    # Estado
    status = Column(String(50), nullable=False, default='pending_confirmation')

    # Información de huéspedes
    number_of_guests = Column(Integer, nullable=False)

    # Comunicación
    guest_message = Column(Text, nullable=True)
    host_response = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    confirmed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    reservation_paid_at = Column(TIMESTAMP(timezone=True), nullable=True)
    checked_in_at = Column(TIMESTAMP(timezone=True), nullable=True)
    completed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    cancelled_at = Column(TIMESTAMP(timezone=True), nullable=True)
    payment_deadline = Column(TIMESTAMP(timezone=True), nullable=True)  # Plazo de 6h para pagar
    
    # Comprobante de pago
    payment_proof_url = Column(Text, nullable=True)  # URL del comprobante subido
    payment_proof_uploaded_at = Column(TIMESTAMP(timezone=True), nullable=True)
    payment_verified_by = Column(UUID(as_uuid=True), nullable=True)  # Admin que verificó
    payment_verified_at = Column(TIMESTAMP(timezone=True), nullable=True)

    # Metadata (mapeado como extra_metadata para evitar conflicto)
    extra_metadata = Column('metadata', JSONB, default={})


class BookingPayment(Base):
    """Modelo de pagos de reserva"""
    __tablename__ = "booking_payments"
    __table_args__ = {"schema": "core"}

    # Identificadores
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), nullable=False)

    # Información del pago
    payment_type = Column(String(20), nullable=False)  # reservation, checkin, full, refund
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(50), nullable=False, default='pending')

    # Integración con Stripe
    stripe_payment_intent_id = Column(String(255), nullable=True)
    stripe_charge_id = Column(String(255), nullable=True)

    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
    paid_at = Column(TIMESTAMP(timezone=True), nullable=True)

    # Metadata (mapeado como extra_metadata para evitar conflicto)
    extra_metadata = Column('metadata', JSONB, default={})


class BookingCalendar(Base):
    """Modelo de calendario de disponibilidad"""
    __tablename__ = "booking_calendar"
    __table_args__ = {"schema": "core"}

    # Identificadores
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id = Column(UUID(as_uuid=True), nullable=False)
    date = Column(DATE, nullable=False)

    # Disponibilidad
    is_available = Column(Integer, nullable=False, default=1)  # 1 = disponible, 0 = no disponible
    booking_id = Column(UUID(as_uuid=True), nullable=True)

    # Precio
    price = Column(Numeric(10, 2), nullable=True)
    
    # Notas
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
