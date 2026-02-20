"""
Subscription Plans Schemas
Esquemas para gestión de planes de suscripción
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from decimal import Decimal
from datetime import datetime
from uuid import UUID


class PlanLimits(BaseModel):
    """Límites y características del plan"""
    max_listings: int = Field(default=3, description="Máximo de propiedades activas")
    max_images: int = Field(default=5, description="Máximo de imágenes por propiedad")
    max_videos: int = Field(default=0, description="Máximo de videos por propiedad")
    featured_listings: int = Field(default=0, description="Propiedades destacadas simultáneas")
    analytics_access: bool = Field(default=False, description="Acceso a analíticas")
    priority_support: bool = Field(default=False, description="Soporte prioritario")


class PlanBase(BaseModel):
    """Esquema base de plan de suscripción"""
    plan_code: str = Field(..., description="Código único del plan (ej: basico, premium)")
    name: str = Field(..., min_length=1, max_length=100, description="Nombre del plan")
    description: Optional[str] = Field(None, description="Descripción del plan")
    price_monthly: Decimal = Field(..., ge=0, description="Precio mensual en soles")
    price_yearly: Decimal = Field(..., ge=0, description="Precio anual en soles")
    limits: PlanLimits = Field(..., description="Límites y características del plan")
    features: List[str] = Field(default_factory=list, description="Lista de características")
    is_active: bool = Field(default=True, description="Plan activo o no")
    sort_order: int = Field(default=0, description="Orden de visualización")

    @validator('price_yearly')
    def validate_yearly_price(cls, v, values):
        """Validar que el precio anual tenga sentido"""
        if 'price_monthly' in values and v > 0:
            monthly = values['price_monthly']
            if v > monthly * 12:
                raise ValueError('El precio anual no puede ser mayor a 12 meses')
        return v

    @validator('features')
    def validate_features(cls, v):
        """Validar que las características no estén vacías"""
        if v:
            v = [f.strip() for f in v if f and f.strip()]
        return v


class PlanCreate(PlanBase):
    """Esquema para crear un plan"""
    pass


class PlanUpdate(BaseModel):
    """Esquema para actualizar un plan"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    price_monthly: Optional[Decimal] = Field(None, ge=0)
    price_yearly: Optional[Decimal] = Field(None, ge=0)
    limits: Optional[PlanLimits] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class PlanResponse(PlanBase):
    """Esquema de respuesta de plan"""
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v),
            UUID: lambda v: str(v),
        }


class PlanListResponse(BaseModel):
    """Lista de planes"""
    plans: List[PlanResponse]
    total: int


class PlanStatsResponse(BaseModel):
    """Estadísticas de un plan"""
    plan_id: UUID
    plan_code: str
    plan_name: str
    active_subscriptions: int
    monthly_revenue: Decimal
    yearly_revenue: Decimal
    total_revenue: Decimal
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v),
            UUID: lambda v: str(v),
        }
