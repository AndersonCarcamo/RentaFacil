"""
Schemas para gestión de planes de suscripción y administradores
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# ==================== SCHEMAS DE PLANES ====================

class SubscriptionPlanLimits(BaseModel):
    """Límites de un plan de suscripción."""
    max_listings: Optional[int] = Field(None, description="Máximo de propiedades")
    max_images: Optional[int] = Field(None, description="Máximo de imágenes por propiedad")
    max_videos: Optional[int] = Field(None, description="Máximo de videos por propiedad")
    featured_listings: Optional[int] = Field(None, description="Propiedades destacadas permitidas")
    analytics_access: Optional[bool] = Field(None, description="Acceso a analíticas avanzadas")
    priority_support: Optional[bool] = Field(None, description="Soporte prioritario")
    
    class Config:
        json_schema_extra = {
            "example": {
                "max_listings": 20,
                "max_images": 15,
                "max_videos": 2,
                "featured_listings": 2,
                "analytics_access": False,
                "priority_support": False
            }
        }


class SubscriptionPlanUpdate(BaseModel):
    """Datos para actualizar un plan de suscripción."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    price_monthly: Optional[float] = Field(None, ge=0)
    price_yearly: Optional[float] = Field(None, ge=0)
    features: Optional[List[str]] = Field(None, description="Lista de características")
    limits: Optional[Dict[str, Any]] = Field(None, description="Límites del plan")
    active: Optional[bool] = Field(None, description="Plan activo/inactivo")
    sort_order: Optional[int] = Field(None, ge=0)
    
    @validator('features')
    def validate_features(cls, v):
        if v is not None and len(v) == 0:
            raise ValueError('El plan debe tener al menos una característica')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Premium",
                "description": "Para arrendadores que quieren destacar",
                "price_monthly": 29.90,
                "price_yearly": 287.52,
                "features": [
                    "Hasta 20 propiedades activas",
                    "Hasta 15 imágenes por propiedad",
                    "2 videos por propiedad",
                    "Soporte prioritario"
                ],
                "limits": {
                    "max_listings": 20,
                    "max_images": 15,
                    "max_videos": 2,
                    "featured_listings": 2
                },
                "active": True,
                "sort_order": 2
            }
        }


class SubscriptionPlanResponse(BaseModel):
    """Respuesta con datos completos de un plan."""
    id: str
    name: str
    description: str
    price_monthly: float
    price_yearly: float
    features: List[str]
    limits: Dict[str, Any]
    active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "premium",
                "name": "Premium",
                "description": "Para arrendadores que quieren destacar",
                "price_monthly": 29.90,
                "price_yearly": 287.52,
                "features": [
                    "Hasta 20 propiedades activas",
                    "Hasta 15 imágenes por propiedad",
                    "2 videos por propiedad",
                    "Soporte prioritario"
                ],
                "limits": {
                    "max_listings": 20,
                    "max_images": 15,
                    "max_videos": 2,
                    "featured_listings": 2
                },
                "active": True,
                "sort_order": 2,
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-20T10:30:00"
            }
        }


# ==================== SCHEMAS DE ADMINISTRADORES ====================

class AdminUserCreate(BaseModel):
    """Datos para crear un nuevo administrador."""
    email: EmailStr = Field(..., description="Email del usuario a convertir en administrador")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "nuevo.admin@easyrent.pe"
            }
        }


class AdminUserResponse(BaseModel):
    """Respuesta con datos de un administrador."""
    email: str
    addedDate: str = Field(..., description="Fecha en que fue agregado como admin")
    addedBy: Optional[str] = Field(None, description="Quién lo agregó como admin")
    isSystemAdmin: bool = Field(default=False, description="Es un admin del sistema (no eliminable)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "admin@easyrent.pe",
                "addedDate": "2024-01-01T00:00:00",
                "addedBy": "Sistema",
                "isSystemAdmin": True
            }
        }


# ==================== SCHEMAS DE AUDITORÍA ====================

class AdminActionLog(BaseModel):
    """Log de acción administrativa."""
    id: str
    admin_email: str
    action_type: str = Field(..., description="Tipo de acción (plan_update, admin_add, etc.)")
    target_type: str = Field(..., description="Tipo de objeto afectado (plan, user, etc.)")
    target_id: str = Field(..., description="ID del objeto afectado")
    description: str
    changes: Optional[Dict[str, Any]] = Field(None, description="Cambios realizados")
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "log_123",
                "admin_email": "admin@easyrent.pe",
                "action_type": "plan_update",
                "target_type": "subscription_plan",
                "target_id": "premium",
                "description": "Actualizado precio mensual del plan Premium",
                "changes": {
                    "price_monthly": {"old": 29.90, "new": 39.90}
                },
                "ip_address": "192.168.1.1",
                "user_agent": "Mozilla/5.0...",
                "created_at": "2024-01-20T10:30:00"
            }
        }


# ==================== SCHEMAS DE ESTADÍSTICAS ====================

class AdminOverviewStats(BaseModel):
    """Estadísticas generales para el panel de administrador."""
    totalUsers: int
    activeListings: int
    premiumSubscriptions: int
    monthlyRevenue: float
    lastUpdated: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "totalUsers": 1234,
                "activeListings": 567,
                "premiumSubscriptions": 89,
                "monthlyRevenue": 8450.00,
                "lastUpdated": "2024-01-20T10:30:00"
            }
        }
