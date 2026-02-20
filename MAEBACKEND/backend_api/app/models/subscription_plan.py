"""
Subscription Plan Model
Modelo de planes de suscripción
"""

from sqlalchemy import Column, String, Numeric, Integer, Boolean, TIMESTAMP, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class SubscriptionPlan(Base):
    """Modelo de planes de suscripción"""
    
    __tablename__ = "subscription_plans"
    __table_args__ = {'schema': 'core'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_code = Column(String(50), unique=True, nullable=False, index=True)  # basico, premium, profesional
    name = Column(String(100), nullable=False)
    description = Column(Text)
    
    # Precios
    price_monthly = Column(Numeric(10, 2), nullable=False, default=0)
    price_yearly = Column(Numeric(10, 2), nullable=False, default=0)
    
    # Límites y características (JSON para flexibilidad)
    limits = Column(JSON, nullable=False, default={
        "max_listings": 3,
        "max_images": 5,
        "max_videos": 0,
        "featured_listings": 0,
        "analytics_access": False,
        "priority_support": False
    })
    
    # Características visibles al usuario
    features = Column(JSON, nullable=False, default=[])
    
    # Estado y orden
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0)
    
    # Auditoría
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now())
    updated_by = Column(String(255))  # Email del admin que modificó
    
    def __repr__(self):
        return f"<SubscriptionPlan {self.plan_code}: {self.name}>"
