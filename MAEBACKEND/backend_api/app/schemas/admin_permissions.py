"""
Admin Permissions Schemas
Esquemas para gestión de permisos de administradores
"""

from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from enum import Enum
from datetime import datetime


class Permission(str, Enum):
    """Permisos disponibles en el sistema"""
    # Gestión de Administradores
    MANAGE_ADMINS = "manage_admins"
    
    # Moderación de Contenido
    MODERATE_USERS = "moderate_users"
    MODERATE_LISTINGS = "moderate_listings"
    VIEW_USER_DETAILS = "view_user_details"
    SUSPEND_USERS = "suspend_users"
    DELETE_LISTINGS = "delete_listings"
    
    # Gestión de Planes
    EDIT_PLANS = "edit_plans"
    CREATE_PLANS = "create_plans"
    DELETE_PLANS = "delete_plans"
    VIEW_SUBSCRIPTIONS = "view_subscriptions"
    
    # Configuración de Pagos
    MANAGE_CULQI_ACCOUNTS = "manage_culqi_accounts"
    VIEW_PAYMENT_HISTORY = "view_payment_history"
    
    # Analíticas
    VIEW_ANALYTICS = "view_analytics"
    EXPORT_REPORTS = "export_reports"


class AdminRoleType(str, Enum):
    """Roles predefinidos de administrador"""
    SUPER_ADMIN = "super_admin"
    MODERATOR = "moderator"
    PLANS_MANAGER = "plans_manager"
    FINANCE_MANAGER = "finance_manager"
    VIEWER = "viewer"


class AdminRoleBase(BaseModel):
    """Esquema base para roles de administrador"""
    id: str
    name: str
    description: str
    permissions: List[Permission]
    color: str
    icon: Optional[str] = None


class AdminUserBase(BaseModel):
    """Esquema base para usuario administrador"""
    email: EmailStr
    name: Optional[str] = None
    role_id: str
    custom_permissions: List[Permission] = Field(default_factory=list)


class AdminUserCreate(AdminUserBase):
    """Esquema para crear un administrador"""
    pass


class AdminUserUpdate(BaseModel):
    """Esquema para actualizar un administrador"""
    name: Optional[str] = None
    role_id: Optional[str] = None
    custom_permissions: Optional[List[Permission]] = None
    is_active: Optional[bool] = None


class AdminUserResponse(AdminUserBase):
    """Esquema de respuesta para administrador"""
    id: str
    permissions: List[Permission]  # Combinación de permisos del rol + personalizados
    added_date: datetime
    added_by: Optional[str] = None
    last_login: Optional[datetime] = None
    is_active: bool
    
    class Config:
        from_attributes = True


class AdminPermissionCheck(BaseModel):
    """Esquema para verificar permisos"""
    user_id: str
    permission: Permission
    has_permission: bool


class CulqiAccountConfig(BaseModel):
    """Configuración de cuenta Culqi"""
    account_id: str
    account_name: str
    public_key: str
    is_test_mode: bool = False
    is_active: bool = True
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class CulqiAccountCreate(BaseModel):
    """Crear configuración de Culqi"""
    account_name: str
    public_key: str
    secret_key: str  # Se guarda encriptado
    is_test_mode: bool = False


class CulqiAccountUpdate(BaseModel):
    """Actualizar configuración de Culqi"""
    account_name: Optional[str] = None
    public_key: Optional[str] = None
    secret_key: Optional[str] = None
    is_test_mode: Optional[bool] = None
    is_active: Optional[bool] = None


class AdminActivityLog(BaseModel):
    """Log de actividad de administrador"""
    id: str
    admin_id: str
    admin_email: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[dict] = None
    ip_address: Optional[str] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True
