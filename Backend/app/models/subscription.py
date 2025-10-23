from sqlalchemy import Column, String, Numeric, Integer, Boolean, DateTime, Text, ForeignKey, CHAR, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.core.database import Base


class Plan(Base):
    """Modelo para planes de suscripción"""
    __tablename__ = "plans"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(Text, nullable=False, unique=True)
    name = Column(Text, nullable=False)
    description = Column(Text)
    tier = Column(String(50), nullable=False)  # free, basic, premium
    period = Column(String(50), nullable=False)  # monthly, yearly
    period_months = Column(Integer, nullable=False, default=1)
    price_amount = Column(Numeric(10, 2), nullable=False, default=0)
    price_currency = Column(CHAR(3), nullable=False, default='PEN')
    
    # Plan limits and features
    max_active_listings = Column(Integer, nullable=False, default=1)
    listing_active_days = Column(Integer, nullable=False, default=30)
    max_images_per_listing = Column(Integer, nullable=False, default=5)
    max_videos_per_listing = Column(Integer, nullable=False, default=0)
    max_video_seconds = Column(Integer, nullable=False, default=60)
    max_image_width = Column(Integer, nullable=False, default=1920)
    max_image_height = Column(Integer, nullable=False, default=1080)
    featured_listings = Column(Boolean, nullable=False, default=False)
    priority_support = Column(Boolean, nullable=False, default=False)
    analytics_access = Column(Boolean, nullable=False, default=False)
    api_access = Column(Boolean, nullable=False, default=False)
    
    # System flags
    is_active = Column(Boolean, nullable=False, default=True)
    is_default = Column(Boolean, nullable=False, default=False)
    
    # Metadatos
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relaciones
    subscriptions = relationship("Subscription", back_populates="plan")


class Subscription(Base):
    """Modelo para suscripciones de usuarios"""
    __tablename__ = "subscriptions"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), nullable=False, index=True)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("core.plans.id"), nullable=False)
    
    # Estado de la suscripción
    status = Column(String(50), default="active", nullable=False)  # active, paused, cancelled, expired
    
    # Fechas importantes
    current_period_start = Column(DateTime, default=datetime.utcnow, nullable=False)
    current_period_end = Column(DateTime, nullable=False)
    trial_start = Column(DateTime)
    trial_end = Column(DateTime)
    canceled_at = Column(DateTime)  # Nota: 'canceled' con una 'l' según tu esquema
    
    # Información externa
    external_subscription_id = Column(Text)
    
    # Configuraciones
    cancel_at_period_end = Column(Boolean, default=False, nullable=False)
    
    # Metadatos
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relaciones
    plan = relationship("Plan", back_populates="subscriptions")


class SubscriptionUsage(Base):
    """Modelo para rastrear el uso de la suscripción"""
    __tablename__ = "subscription_usage"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("core.subscriptions.id"), nullable=False)
    
    # Métricas de uso
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    listings_used = Column(Integer, default=0)
    images_uploaded = Column(Integer, default=0)
    videos_uploaded = Column(Integer, default=0)
    api_calls = Column(Integer, default=0)
    
    # Límites aplicados en este período
    limits_snapshot = Column(JSON, default=dict)
    
    # Metadatos
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PaymentHistory(Base):
    """Modelo para historial de pagos"""
    __tablename__ = "payment_history"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("core.subscriptions.id"), nullable=False)
    
    # Información del pago
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD")
    payment_method = Column(String(50))  # stripe, paypal, etc.
    external_payment_id = Column(String(100))  # ID del pago en el proveedor externo
    
    # Estado del pago
    status = Column(String(50), default="pending")  # pending, completed, failed, refunded
    payment_date = Column(DateTime)
    
    # Período que cubre este pago
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    # Información adicional
    description = Column(String(255))
    invoice_url = Column(String(500))
    failure_reason = Column(Text)
    
    # Metadatos
    extra_data = Column(JSON, default=dict)  # Información adicional
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
