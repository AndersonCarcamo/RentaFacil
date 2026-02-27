from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
import uuid
from enum import Enum


# Enums
class PlanTier(str, Enum):
    """Niveles de plan"""
    INDIVIDUAL_FREE = "individual_free"
    INDIVIDUAL_BASIC = "individual_basic"
    INDIVIDUAL_PREMIUM = "individual_premium"
    ENTERPRISE_FREE = "enterprise_free"
    ENTERPRISE_BASIC = "enterprise_basic"
    ENTERPRISE_PREMIUM = "enterprise_premium"
    ENTERPRISE_UNLIMITED = "enterprise_unlimited"


class PlanPeriod(str, Enum):
    """Períodos de facturación"""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    PERMANENT = "permanent"


class SubscriptionStatus(str, Enum):
    """Estados de suscripción"""
    ACTIVE = "active"
    TRIALING = "trialing"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    PAUSED = "paused"


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


# =================== FRONTEND-COMPATIBLE SCHEMAS ===================
# Estos schemas adaptan la estructura de la BD a lo que espera el frontend

class FrontendPlanLimits(BaseModel):
    """Límites del plan en formato frontend"""
    max_listings: Optional[int] = None
    max_images: Optional[int] = None
    max_videos: Optional[int] = None


class FrontendPlanResponse(BaseModel):
    """Plan en formato esperado por el frontend"""
    id: uuid.UUID
    name: str
    description: Optional[str]
    price_monthly: Decimal
    price_yearly: Decimal
    features: List[str]
    limits: FrontendPlanLimits
    active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime


class FrontendSubscriptionResponse(BaseModel):
    """Suscripción en formato esperado por el frontend"""
    id: uuid.UUID
    user_id: uuid.UUID
    plan_id: uuid.UUID
    status: str
    billing_cycle: str
    start_date: datetime
    current_period_start: datetime
    current_period_end: datetime
    cancelled_at: Optional[datetime] = None
    pause_until: Optional[datetime] = None
    auto_renewal: bool
    cancel_at_period_end: bool
    plan: FrontendPlanResponse
    created_at: datetime
    updated_at: datetime


# =================== PLAN SCHEMAS ===================

class PlanResponse(BaseModel):
    """Schema de respuesta para planes - coincide con la tabla core.plans"""
    id: uuid.UUID
    code: str
    name: str
    description: Optional[str]
    tier: PlanTier
    period: PlanPeriod
    period_months: int
    price_amount: Decimal
    price_currency: str
    
    # Límites y características
    max_active_listings: int
    listing_active_days: int
    max_images_per_listing: int
    max_videos_per_listing: int
    max_video_seconds: int
    max_image_width: int
    max_image_height: int
    featured_listings: bool
    priority_support: bool
    analytics_access: bool
    api_access: bool
    
    # Banderas del sistema
    is_active: bool
    is_default: bool
    
    # Metadatos
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class PlanBase(BaseModel):
    """Schema base para planes"""
    code: str = Field(..., description="Código único del plan")
    name: str = Field(..., min_length=1, max_length=100, description="Nombre del plan")
    description: Optional[str] = Field(None, description="Descripción del plan")
    tier: PlanTier = Field(..., description="Nivel del plan")
    period: PlanPeriod = Field(..., description="Período de facturación")
    period_months: int = Field(1, ge=1, description="Duración en meses")
    price_amount: Decimal = Field(0, ge=0, description="Precio del plan")
    price_currency: str = Field("PEN", max_length=3, description="Moneda")
    
    # Límites y características
    max_active_listings: int = Field(1, ge=0, description="Máximo de listados activos")
    listing_active_days: int = Field(30, ge=1, description="Días que permanece activo un listado")
    max_images_per_listing: int = Field(5, ge=0, description="Máximo de imágenes por listado")
    max_videos_per_listing: int = Field(0, ge=0, description="Máximo de videos por listado")
    max_video_seconds: int = Field(60, ge=0, description="Duración máxima de video en segundos")
    max_image_width: int = Field(1920, ge=0, description="Ancho máximo de imagen")
    max_image_height: int = Field(1080, ge=0, description="Alto máximo de imagen")
    featured_listings: bool = Field(False, description="Permite listados destacados")
    priority_support: bool = Field(False, description="Soporte prioritario")
    analytics_access: bool = Field(False, description="Acceso a analytics")
    api_access: bool = Field(False, description="Acceso a API")
    
    # Banderas del sistema
    is_active: bool = Field(True, description="Si el plan está activo")
    is_default: bool = Field(False, description="Si es el plan por defecto")


class CreatePlanRequest(PlanBase):
    """Schema para crear un plan"""
    pass


class UpdatePlanRequest(BaseModel):
    """Schema para actualizar un plan"""
    code: Optional[str] = None
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    tier: Optional[PlanTier] = None
    period: Optional[PlanPeriod] = None
    period_months: Optional[int] = None
    price_amount: Optional[Decimal] = Field(None, ge=0)
    price_currency: Optional[str] = None
    max_active_listings: Optional[int] = None
    listing_active_days: Optional[int] = None
    max_images_per_listing: Optional[int] = None
    max_videos_per_listing: Optional[int] = None
    max_video_seconds: Optional[int] = None
    max_image_width: Optional[int] = None
    max_image_height: Optional[int] = None
    featured_listings: Optional[bool] = None
    priority_support: Optional[bool] = None
    analytics_access: Optional[bool] = None
    api_access: Optional[bool] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


# =================== SUBSCRIPTION SCHEMAS ===================

class SubscriptionBase(BaseModel):
    """Schema base para suscripciones"""
    plan_id: uuid.UUID = Field(..., description="ID del plan")


class SubscriptionResponse(BaseModel):
    """Schema de respuesta para suscripciones"""
    id: uuid.UUID
    user_id: uuid.UUID
    plan_id: uuid.UUID
    status: SubscriptionStatus
    
    # Fechas
    current_period_start: datetime
    current_period_end: datetime
    trial_start: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    canceled_at: Optional[datetime] = None
    
    # Información externa
    external_subscription_id: Optional[str] = None
    
    # Configuraciones
    cancel_at_period_end: bool
    
    # Información del plan
    plan: Optional[PlanResponse] = None
    
    # Metadatos
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class SubscriptionDetailResponse(SubscriptionResponse):
    """Schema detallado de suscripción con información adicional"""
    
    # Uso actual (será calculado)
    current_usage: Optional[Dict[str, int]] = None
    remaining_limits: Optional[Dict[str, int]] = None


class CreateSubscriptionRequest(SubscriptionBase):
    """Schema para crear suscripción"""
    pass


class UpdateSubscriptionRequest(BaseModel):
    """Schema para actualizar suscripción"""
    plan_id: Optional[uuid.UUID] = None


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
