from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from uuid import UUID
from enum import Enum
from app.models.admin import (
    AuditActionType, UserStatus, ListingFlagReason, 
    SystemStatus
)


# Enums para schemas
class AuditActionTypeEnum(str, Enum):
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_REGISTER = "user_register"
    USER_UPDATE = "user_update"
    USER_SUSPEND = "user_suspend"
    USER_UNSUSPEND = "user_unsuspend"
    USER_DELETE = "user_delete"
    LISTING_CREATE = "listing_create"
    LISTING_UPDATE = "listing_update"
    LISTING_DELETE = "listing_delete"
    LISTING_FLAG = "listing_flag"
    LISTING_APPROVE = "listing_approve"
    LISTING_REJECT = "listing_reject"
    PAYMENT_SUCCESS = "payment_success"
    PAYMENT_FAILED = "payment_failed"
    SUBSCRIPTION_CREATE = "subscription_create"
    SUBSCRIPTION_CANCEL = "subscription_cancel"
    ADMIN_ACCESS = "admin_access"
    SYSTEM_CONFIG = "system_config"
    DATA_EXPORT = "data_export"
    SECURITY_EVENT = "security_event"


class UserStatusEnum(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"
    BANNED = "banned"


class ListingFlagReasonEnum(str, Enum):
    SPAM = "spam"
    INAPPROPRIATE = "inappropriate"
    FALSE_INFO = "false_info"
    DUPLICATE = "duplicate"
    FRAUD = "fraud"
    OTHER = "other"


class SystemStatusEnum(str, Enum):
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    MAINTENANCE = "maintenance"


class UserRoleEnum(str, Enum):
    USER = "user"
    TENANT = "tenant"
    LANDLORD = "landlord"
    AGENT = "agent"
    ADMIN = "admin"


# Dashboard Schemas
class DashboardStats(BaseModel):
    """Estadísticas principales del dashboard"""
    total_users: int = 0
    active_users: int = 0
    suspended_users: int = 0
    new_users_today: int = 0
    new_users_week: int = 0
    
    total_listings: int = 0
    active_listings: int = 0
    pending_listings: int = 0
    flagged_listings: int = 0
    new_listings_today: int = 0
    new_listings_week: int = 0
    
    total_revenue: float = 0.0
    revenue_today: float = 0.0
    revenue_week: float = 0.0
    revenue_month: float = 0.0
    
    active_subscriptions: int = 0
    expired_subscriptions: int = 0
    
    pending_verifications: int = 0
    unresolved_flags: int = 0


class SystemHealthSummary(BaseModel):
    """Resumen del estado del sistema"""
    overall_status: SystemStatusEnum
    components: List[Dict[str, Any]] = Field(default_factory=list)
    last_incident: Optional[datetime] = None
    uptime_percentage: float = 100.0


class AdminDashboardResponse(BaseModel):
    """Respuesta completa del dashboard administrativo"""
    stats: DashboardStats
    system_health: SystemHealthSummary
    recent_activities: List[Dict[str, Any]] = Field(default_factory=list)
    alerts: List[Dict[str, Any]] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# User Management Schemas
class AdminUserBase(BaseModel):
    """Base schema para gestión de usuarios"""
    email: str
    full_name: str
    phone_number: Optional[str] = None
    role: UserRoleEnum
    status: UserStatusEnum


class AdminUserResponse(AdminUserBase):
    """Respuesta de usuario para administración"""
    id: UUID
    is_verified: bool = False
    verification_documents: int = 0
    listings_count: int = 0
    active_subscriptions: int = 0
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Información de suspensión
    is_suspended: bool = False
    suspension_reason: Optional[str] = None
    suspension_expires: Optional[datetime] = None
    
    # Estadísticas
    total_payments: float = 0.0
    flags_received: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class UserSuspensionCreate(BaseModel):
    """Schema para suspender usuario"""
    reason: str = Field(..., min_length=10, max_length=1000)
    duration: Optional[int] = Field(None, gt=0, le=365, description="Días de suspensión (null = indefinida)")
    notes: Optional[str] = Field(None, max_length=2000)
    
    @field_validator('reason')
    @classmethod
    def validate_reason(cls, v):
        if not v or not v.strip():
            raise ValueError("La razón de suspensión es requerida")
        return v.strip()


class UserSuspensionResponse(BaseModel):
    """Respuesta de suspensión de usuario"""
    id: UUID
    user_id: UUID
    suspended_by: UUID
    reason: str
    duration_days: Optional[int] = None
    notes: Optional[str] = None
    is_active: bool = True
    suspended_at: datetime
    expires_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class AdminUserListResponse(BaseModel):
    """Respuesta paginada de usuarios para administración"""
    items: List[AdminUserResponse]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool
    has_prev: bool


# Listing Management Schemas
class AdminListingBase(BaseModel):
    """Base schema para gestión de listings"""
    title: str
    property_type: str
    listing_type: str
    status: str


class AdminListingResponse(AdminListingBase):
    """Respuesta de listing para administración"""
    id: UUID
    owner_id: UUID
    owner_name: str
    price: float
    currency: str
    location: str
    verification_status: Optional[str] = None
    views_count: int = 0
    favorites_count: int = 0
    leads_count: int = 0
    flags_count: int = 0
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ListingFlagCreate(BaseModel):
    """Schema para marcar listing"""
    reason: ListingFlagReasonEnum
    notes: Optional[str] = Field(None, max_length=1000)
    
    @field_validator('notes')
    @classmethod
    def validate_notes(cls, v):
        if v and len(v.strip()) < 5:
            raise ValueError("Las notas deben tener al menos 5 caracteres")
        return v.strip() if v else None


class ListingFlagResponse(BaseModel):
    """Respuesta de flag de listing"""
    id: UUID
    listing_id: UUID
    listing_title: str
    reported_by: Optional[UUID] = None
    reporter_name: Optional[str] = None
    admin_id: Optional[UUID] = None
    admin_name: Optional[str] = None
    reason: ListingFlagReasonEnum
    description: Optional[str] = None
    admin_notes: Optional[str] = None
    status: str = "pending"
    is_resolved: bool = False
    action_taken: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class AdminListingListResponse(BaseModel):
    """Respuesta paginada de listings para administración"""
    items: List[AdminListingResponse]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool
    has_prev: bool


# Audit Log Schemas
class AuditLogCreate(BaseModel):
    """Schema para crear entrada de auditoría"""
    action_type: AuditActionTypeEnum
    action_description: str
    target_type: Optional[str] = None
    target_id: Optional[UUID] = None
    old_values: Optional[Dict[str, Any]] = Field(default_factory=dict)
    new_values: Optional[Dict[str, Any]] = Field(default_factory=dict)
    extra_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    severity: str = "info"
    category: Optional[str] = None


class AuditLogResponse(BaseModel):
    """Respuesta de entrada de auditoría"""
    id: UUID
    action_type: str
    action_description: str
    user_id: Optional[UUID] = None
    user_email: Optional[str] = None
    user_role: Optional[str] = None
    target_type: Optional[str] = None
    target_id: Optional[UUID] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_method: Optional[str] = None
    request_path: Optional[str] = None
    response_status: Optional[int] = None
    old_values: Dict[str, Any] = Field(default_factory=dict)
    new_values: Dict[str, Any] = Field(default_factory=dict)
    extra_data: Dict[str, Any] = Field(default_factory=dict)
    severity: str = "info"
    category: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    """Respuesta paginada de auditoría"""
    items: List[AuditLogResponse]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool
    has_prev: bool


# System Health Schemas
class SystemComponentHealth(BaseModel):
    """Estado de salud de un componente"""
    component_name: str
    component_type: str
    status: SystemStatusEnum
    status_message: Optional[str] = None
    response_time_ms: Optional[float] = None
    uptime_percentage: Optional[float] = None
    last_error: Optional[str] = None
    error_count: int = 0
    version: Optional[str] = None
    last_check_at: datetime
    last_healthy_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class SystemHealthResponse(BaseModel):
    """Respuesta completa del estado del sistema"""
    overall_status: SystemStatusEnum
    components: List[SystemComponentHealth]
    summary: Dict[str, int] = Field(default_factory=dict)
    last_updated: datetime = Field(default_factory=datetime.utcnow)


# System Metrics Schemas
class SystemMetricResponse(BaseModel):
    """Respuesta de métrica del sistema"""
    id: UUID
    metric_name: str
    metric_type: str
    value: float
    unit: Optional[str] = None
    service: Optional[str] = None
    instance: Optional[str] = None
    environment: Optional[str] = None
    tags: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SystemMetricsResponse(BaseModel):
    """Respuesta de múltiples métricas"""
    metrics: List[SystemMetricResponse]
    summary: Dict[str, Any] = Field(default_factory=dict)
    time_range: Dict[str, datetime] = Field(default_factory=dict)


# Configuration Schemas
class ConfigurationSettingBase(BaseModel):
    """Base schema para configuraciones"""
    key: str
    category: str
    name: str
    description: Optional[str] = None
    value: str
    data_type: str = "string"


class ConfigurationSettingCreate(ConfigurationSettingBase):
    """Schema para crear configuración"""
    default_value: Optional[str] = None
    validation_rules: Optional[Dict[str, Any]] = Field(default_factory=dict)
    is_public: bool = False
    is_editable: bool = True
    requires_restart: bool = False
    tags: Optional[List[str]] = Field(default_factory=list)


class ConfigurationSettingResponse(ConfigurationSettingBase):
    """Respuesta de configuración"""
    id: UUID
    default_value: Optional[str] = None
    validation_rules: Dict[str, Any] = Field(default_factory=dict)
    is_public: bool = False
    is_editable: bool = True
    requires_restart: bool = False
    tags: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    last_modified_by: Optional[UUID] = None
    
    model_config = ConfigDict(from_attributes=True)


# Filter Schemas
class UserFilters(BaseModel):
    """Filtros para búsqueda de usuarios"""
    role: Optional[List[UserRoleEnum]] = None
    status: Optional[List[UserStatusEnum]] = None
    search: Optional[str] = None
    created_from: Optional[datetime] = None
    created_to: Optional[datetime] = None
    last_login_from: Optional[datetime] = None
    last_login_to: Optional[datetime] = None


class ListingFilters(BaseModel):
    """Filtros para búsqueda de listings"""
    status: Optional[List[str]] = None
    verification_status: Optional[List[str]] = None
    property_type: Optional[List[str]] = None
    listing_type: Optional[List[str]] = None
    owner_id: Optional[UUID] = None
    search: Optional[str] = None
    created_from: Optional[datetime] = None
    created_to: Optional[datetime] = None
    flagged: Optional[bool] = None


class AuditLogFilters(BaseModel):
    """Filtros para búsqueda de logs de auditoría"""
    action: Optional[List[AuditActionTypeEnum]] = None
    user_id: Optional[UUID] = None
    target_type: Optional[str] = None
    target_id: Optional[UUID] = None
    severity: Optional[List[str]] = None
    category: Optional[List[str]] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    search: Optional[str] = None


# Bulk Operations Schemas
class BulkUserAction(BaseModel):
    """Acción masiva sobre usuarios"""
    user_ids: List[UUID] = Field(..., min_length=1)
    action: str = Field(..., pattern="^(suspend|unsuspend|verify|unverify)$")
    reason: Optional[str] = None
    duration_days: Optional[int] = Field(None, gt=0, le=365)


class BulkUserActionResponse(BaseModel):
    """Respuesta de acción masiva"""
    total_users: int
    successful_actions: int
    failed_actions: int
    errors: List[str] = Field(default_factory=list)
    processed_user_ids: List[UUID] = Field(default_factory=list)
