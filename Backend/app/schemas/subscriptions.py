from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
import uuid
from enum import Enum


# Enums
class SubscriptionStatus(str, Enum):
    """Estados de suscripción"""
    ACTIVE = "active"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class BillingCycle(str, Enum):
    """Ciclos de facturación"""
    MONTHLY = "monthly"
    YEARLY = "yearly"


class PaymentStatus(str, Enum):
    """Estados de pago"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


# =================== PLAN SCHEMAS ===================

class PlanLimits(BaseModel):
    """Límites del plan"""
    max_listings: Optional[int] = Field(None, description="Máximo número de listings (-1 para ilimitado)")
    max_images: Optional[int] = Field(None, description="Máximo número de imágenes por listing")
    max_videos: Optional[int] = Field(None, description="Máximo número de videos por listing")
    api_calls_per_day: Optional[int] = Field(None, description="Llamadas API por día")
    featured_listings: Optional[int] = Field(None, description="Listings destacados permitidos")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "max_listings": 50,
                "max_images": 20,
                "max_videos": 2,
                "api_calls_per_day": 1000,
                "featured_listings": 5
            }
        }
    }


class PlanBase(BaseModel):
    """Schema base para planes"""
    name: str = Field(..., min_length=1, max_length=100, description="Nombre del plan")
    description: Optional[str] = Field(None, description="Descripción del plan")
    price_monthly: Decimal = Field(..., ge=0, description="Precio mensual")
    price_yearly: Decimal = Field(..., ge=0, description="Precio anual")
    features: List[str] = Field(default_factory=list, description="Lista de características")
    limits: PlanLimits = Field(default_factory=PlanLimits, description="Límites del plan")
    active: bool = Field(True, description="Si el plan está activo")
    sort_order: int = Field(0, description="Orden de visualización")


class PlanResponse(PlanBase):
    """Schema de respuesta para planes"""
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class CreatePlanRequest(PlanBase):
    """Schema para crear un plan"""
    pass


class UpdatePlanRequest(BaseModel):
    """Schema para actualizar un plan"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    price_monthly: Optional[Decimal] = Field(None, ge=0)
    price_yearly: Optional[Decimal] = Field(None, ge=0)
    features: Optional[List[str]] = None
    limits: Optional[PlanLimits] = None
    active: Optional[bool] = None
    sort_order: Optional[int] = None


# =================== SUBSCRIPTION SCHEMAS ===================

class SubscriptionBase(BaseModel):
    """Schema base para suscripciones"""
    plan_id: uuid.UUID = Field(..., description="ID del plan")
    billing_cycle: BillingCycle = Field(BillingCycle.MONTHLY, description="Ciclo de facturación")
    payment_method_id: Optional[str] = Field(None, description="ID del método de pago")


class SubscriptionResponse(BaseModel):
    """Schema de respuesta para suscripciones"""
    id: uuid.UUID
    user_id: uuid.UUID
    plan_id: uuid.UUID
    status: SubscriptionStatus
    billing_cycle: BillingCycle
    
    # Fechas
    start_date: datetime
    current_period_start: datetime
    current_period_end: datetime
    cancelled_at: Optional[datetime] = None
    pause_until: Optional[datetime] = None
    
    # Configuraciones
    auto_renewal: bool
    cancel_at_period_end: bool
    cancellation_reason: Optional[str] = None
    
    # Información del plan
    plan: Optional[PlanResponse] = None
    
    # Metadatos
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class SubscriptionDetailResponse(SubscriptionResponse):
    """Schema detallado de suscripción con información adicional"""
    payment_method_id: Optional[str] = None
    last_payment_date: Optional[datetime] = None
    next_payment_date: Optional[datetime] = None
    
    # Uso actual (será calculado)
    current_usage: Optional[Dict[str, int]] = None
    remaining_limits: Optional[Dict[str, int]] = None


class CreateSubscriptionRequest(SubscriptionBase):
    """Schema para crear suscripción"""
    
    @field_validator('billing_cycle')
    @classmethod
    def validate_billing_cycle(cls, v):
        if v not in [BillingCycle.MONTHLY, BillingCycle.YEARLY]:
            raise ValueError('Billing cycle must be monthly or yearly')
        return v


class UpdateSubscriptionRequest(BaseModel):
    """Schema para actualizar suscripción"""
    plan_id: Optional[uuid.UUID] = None
    billing_cycle: Optional[BillingCycle] = None


class CancelSubscriptionRequest(BaseModel):
    """Schema para cancelar suscripción"""
    reason: Optional[str] = Field(None, max_length=500, description="Razón de cancelación")
    cancel_at_period_end: bool = Field(True, description="Cancelar al final del período")


class PauseSubscriptionRequest(BaseModel):
    """Schema para pausar suscripción"""
    pause_until: Optional[datetime] = Field(None, description="Fecha hasta la cual pausar")
    
    @field_validator('pause_until')
    @classmethod
    def validate_pause_until(cls, v):
        if v and v <= datetime.utcnow():
            raise ValueError('Pause date must be in the future')
        return v


# =================== USAGE SCHEMAS ===================

class UsageResponse(BaseModel):
    """Schema para respuesta de uso"""
    subscription_id: uuid.UUID
    period_start: datetime
    period_end: datetime
    listings_used: int
    images_uploaded: int
    videos_uploaded: int
    api_calls: int
    limits_snapshot: Dict[str, Any]
    
    model_config = {"from_attributes": True}


# =================== PAYMENT SCHEMAS ===================

class PaymentResponse(BaseModel):
    """Schema para respuesta de pagos"""
    id: uuid.UUID
    subscription_id: uuid.UUID
    amount: Decimal
    currency: str
    payment_method: Optional[str]
    status: PaymentStatus
    payment_date: Optional[datetime]
    period_start: datetime
    period_end: datetime
    description: Optional[str]
    invoice_url: Optional[str]
    created_at: datetime
    
    model_config = {"from_attributes": True}


# =================== PAGINATED RESPONSES ===================

class PaginatedPlans(BaseModel):
    """Respuesta paginada de planes"""
    data: List[PlanResponse]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool


class PaginatedSubscriptions(BaseModel):
    """Respuesta paginada de suscripciones"""
    data: List[SubscriptionResponse]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool


class PaginatedPayments(BaseModel):
    """Respuesta paginada de pagos"""
    data: List[PaymentResponse]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool
