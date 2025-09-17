from sqlalchemy import Column, String, Numeric, Integer, Boolean, DateTime, Text, ForeignKey, ARRAY, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.core.database import Base


class Plan(Base):
    """Modelo para planes de suscripción"""
    __tablename__ = "subscription_plans"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    price_monthly = Column(Numeric(10, 2), nullable=False)
    price_yearly = Column(Numeric(10, 2), nullable=False)
    features = Column(ARRAY(String), default=list)  # Lista de características
    limits = Column(JSON, default=dict)  # Límites del plan (max_listings, etc.)
    active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)  # Para ordenar planes
    
    # Metadatos
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    subscriptions = relationship("Subscription", back_populates="plan")


class Subscription(Base):
    """Modelo para suscripciones de usuarios"""
    __tablename__ = "user_subscriptions"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), nullable=False, index=True)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("core.subscription_plans.id"), nullable=False)
    
    # Estado de la suscripción
    status = Column(String(50), default="active")  # active, paused, cancelled, expired
    billing_cycle = Column(String(20), default="monthly")  # monthly, yearly
    
    # Fechas importantes
    start_date = Column(DateTime, default=datetime.utcnow)
    current_period_start = Column(DateTime, default=datetime.utcnow)
    current_period_end = Column(DateTime, nullable=False)
    cancelled_at = Column(DateTime)
    pause_until = Column(DateTime)
    
    # Información de pago
    payment_method_id = Column(String(100))  # ID del método de pago externo
    last_payment_date = Column(DateTime)
    next_payment_date = Column(DateTime)
    
    # Configuraciones
    auto_renewal = Column(Boolean, default=True)
    cancel_at_period_end = Column(Boolean, default=False)
    cancellation_reason = Column(Text)
    
    # Metadatos
    extra_data = Column(JSON, default=dict)  # Información adicional (renombrado de metadata)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    plan = relationship("Plan", back_populates="subscriptions")
    # user = relationship("User", back_populates="subscriptions")  # Será definido en el modelo User


class SubscriptionUsage(Base):
    """Modelo para rastrear el uso de la suscripción"""
    __tablename__ = "subscription_usage"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("core.user_subscriptions.id"), nullable=False)
    
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
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("core.user_subscriptions.id"), nullable=False)
    
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
