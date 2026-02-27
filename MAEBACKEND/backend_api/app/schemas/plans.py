"""
Plans Schemas
Esquemas para gestión de planes del sistema (core.plans)
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
from decimal import Decimal
from datetime import datetime
from uuid import UUID
from enum import Enum


class PlanTier(str, Enum):
    """Niveles de planes"""
    individual_free = "individual_free"
    individual_basic = "individual_basic"
    individual_premium = "individual_premium"
    enterprise_free = "enterprise_free"
    enterprise_basic = "enterprise_basic"
    enterprise_premium = "enterprise_premium"


class PlanPeriod(str, Enum):
    """Períodos de facturación"""
    monthly = "monthly"
    quarterly = "quarterly"
    yearly = "yearly"
    permanent = "permanent"


class PlanTargetType(str, Enum):
    """Tipo de usuario objetivo del plan"""
    individual = "individual"  # Para usuarios individuales
    agency = "agency"  # Para agencias


class PlanBase(BaseModel):
    """Esquema base de plan"""
    code: str = Field(..., description="Código único del plan (ej: free, basic-monthly)")
    name: str = Field(..., min_length=1, max_length=200, description="Nombre del plan")
    description: Optional[str] = Field(None, description="Descripción del plan")
    tier: PlanTier = Field(..., description="Nivel del plan")
    period: PlanPeriod = Field(..., description="Período de facturación")
    period_months: int = Field(default=1, ge=0, description="Duración en meses")
    target_user_type: PlanTargetType = Field(default=PlanTargetType.individual, description="Tipo de usuario objetivo")
    price_amount: Decimal = Field(..., ge=0, description="Precio del plan")
    price_currency: str = Field(default="PEN", max_length=3, description="Moneda (PEN, USD, etc)")
    
    # Límites
    max_active_listings: int = Field(default=1, ge=0, description="Máximo de propiedades activas")
    listing_active_days: int = Field(default=30, ge=0, description="Días que permanece activa una propiedad")
    max_images_per_listing: int = Field(default=5, ge=0, description="Máximo de imágenes por propiedad")
    max_videos_per_listing: int = Field(default=0, ge=0, description="Máximo de videos por propiedad")
    max_video_seconds: int = Field(default=60, ge=0, description="Duración máxima de video en segundos")
    max_image_width: int = Field(default=1920, ge=0, description="Ancho máximo de imagen")
    max_image_height: int = Field(default=1080, ge=0, description="Alto máximo de imagen")
    
    # Características
    featured_listings: bool = Field(default=False, description="Propiedades destacadas")
    priority_support: bool = Field(default=False, description="Soporte prioritario")
    analytics_access: bool = Field(default=False, description="Acceso a analíticas")
    api_access: bool = Field(default=False, description="Acceso a API")
    
    # Flags
    is_active: bool = Field(default=True, description="Plan activo")
    is_default: bool = Field(default=False, description="Plan por defecto")

    @validator('period_months')
    def validate_period_months(cls, v, values):
        """Validar que period_months sea coherente con period"""
        if 'period' in values:
            period = values['period']
            if period == PlanPeriod.permanent and v != 0:
                raise ValueError('Los planes permanentes deben tener period_months = 0')
            if period == PlanPeriod.monthly and v != 1:
                raise ValueError('Los planes mensuales deben tener period_months = 1')
            if period == PlanPeriod.quarterly and v != 3:
                raise ValueError('Los planes trimestrales deben tener period_months = 3')
            if period == PlanPeriod.yearly and v != 12:
                raise ValueError('Los planes anuales deben tener period_months = 12')
        return v


class PlanCreate(PlanBase):
    """Esquema para crear un plan"""
    pass


class PlanUpdate(BaseModel):
    """Esquema para actualizar un plan"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    tier: Optional[PlanTier] = None
    period: Optional[PlanPeriod] = None
    period_months: Optional[int] = Field(None, ge=0)
    target_user_type: Optional[PlanTargetType] = None
    price_amount: Optional[Decimal] = Field(None, ge=0)
    price_currency: Optional[str] = Field(None, max_length=3)
    
    # Límites
    max_active_listings: Optional[int] = Field(None, ge=0)
    listing_active_days: Optional[int] = Field(None, ge=0)
    max_images_per_listing: Optional[int] = Field(None, ge=0)
    max_videos_per_listing: Optional[int] = Field(None, ge=0)
    max_video_seconds: Optional[int] = Field(None, ge=0)
    max_image_width: Optional[int] = Field(None, ge=0)
    max_image_height: Optional[int] = Field(None, ge=0)
    
    # Características
    featured_listings: Optional[bool] = None
    priority_support: Optional[bool] = None
    analytics_access: Optional[bool] = None
    api_access: Optional[bool] = None
    
    # Flags
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


class PlanResponse(PlanBase):
    """Esquema de respuesta de plan"""
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v),
            UUID: lambda v: str(v),
        }


class PlanListResponse(BaseModel):
    """Lista de planes"""
    plans: list[PlanResponse]
    total: int
