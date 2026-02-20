from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from uuid import UUID
from enum import Enum
from app.models.notification import (
    NotificationType, NotificationPriority, DeliveryMethod, 
    NotificationStatus
)


# Enums para schemas
class NotificationTypeEnum(str, Enum):
    SYSTEM = "system"
    VERIFICATION = "verification"
    LISTING = "listing"
    SUBSCRIPTION = "subscription"
    MESSAGE = "message"
    LEAD = "lead"
    REVIEW = "review"
    PAYMENT = "payment"
    SECURITY = "security"


class NotificationPriorityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class DeliveryMethodEnum(str, Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"


class NotificationStatusEnum(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"


class DigestFrequencyEnum(str, Enum):
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"


# Base schemas
class NotificationBase(BaseModel):
    """Base schema para notificaciones"""
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    notification_type: NotificationTypeEnum
    category: Optional[str] = Field(None, max_length=100)
    priority: NotificationPriorityEnum = NotificationPriorityEnum.MEDIUM
    summary: Optional[str] = Field(None, max_length=500)
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError("El título no puede estar vacío")
        return v.strip()
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v):
        if not v or not v.strip():
            raise ValueError("El mensaje no puede estar vacío")
        return v.strip()


class NotificationCreate(NotificationBase):
    """Schema para crear notificación"""
    user_id: Optional[UUID] = None  # Si no se proporciona, se toma del token
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[UUID] = None
    action_url: Optional[str] = Field(None, max_length=500)
    action_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    extra_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    delivery_methods: Optional[List[DeliveryMethodEnum]] = Field(default_factory=lambda: [DeliveryMethodEnum.IN_APP])
    expires_at: Optional[datetime] = None


class NotificationUpdate(BaseModel):
    """Schema para actualizar notificación (admin only)"""
    title: Optional[str] = Field(None, max_length=255)
    message: Optional[str] = None
    priority: Optional[NotificationPriorityEnum] = None
    expires_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(NotificationBase):
    """Schema para respuesta de notificación"""
    id: UUID
    user_id: UUID
    status: NotificationStatusEnum
    read_at: Optional[datetime] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[UUID] = None
    action_url: Optional[str] = None
    action_data: Dict[str, Any] = Field(default_factory=dict)
    extra_data: Dict[str, Any] = Field(default_factory=dict)
    delivery_methods: List[str] = Field(default_factory=list)
    delivered_via: List[str] = Field(default_factory=list)
    expires_at: Optional[datetime] = None
    created_at: datetime
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class NotificationMarkRead(BaseModel):
    """Schema para marcar notificaciones como leídas"""
    notification_ids: Optional[List[UUID]] = None  # Si es None, marca todas


# Schemas para configuración de notificaciones
class NotificationMethodSettings(BaseModel):
    """Configuración de métodos de entrega por tipo"""
    in_app: bool = True
    email: bool = True
    sms: bool = False
    push: bool = True


class NotificationSettingsBase(BaseModel):
    """Base schema para configuración de notificaciones"""
    enabled: bool = True
    quiet_hours_enabled: bool = False
    quiet_hours_start: str = Field("22:00", pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    quiet_hours_end: str = Field("08:00", pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    timezone: str = "UTC"
    digest_frequency: DigestFrequencyEnum = DigestFrequencyEnum.DAILY
    digest_time: str = Field("09:00", pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    marketing_emails: bool = False
    newsletter_subscription: bool = False
    
    @field_validator('timezone')
    @classmethod
    def validate_timezone(cls, v):
        # Validación básica de timezone
        if not v or len(v.strip()) == 0:
            return "UTC"
        return v.strip()


class NotificationSettingsCreate(NotificationSettingsBase):
    """Schema para crear configuración de notificaciones"""
    # Configuración por tipo de notificación
    system_notifications: NotificationMethodSettings = Field(default_factory=lambda: NotificationMethodSettings())
    verification_notifications: NotificationMethodSettings = Field(default_factory=lambda: NotificationMethodSettings())
    listing_notifications: NotificationMethodSettings = Field(default_factory=lambda: NotificationMethodSettings())
    subscription_notifications: NotificationMethodSettings = Field(default_factory=lambda: NotificationMethodSettings(sms=False, push=False))
    message_notifications: NotificationMethodSettings = Field(default_factory=lambda: NotificationMethodSettings(sms=True))
    lead_notifications: NotificationMethodSettings = Field(default_factory=lambda: NotificationMethodSettings(sms=True))
    review_notifications: NotificationMethodSettings = Field(default_factory=lambda: NotificationMethodSettings(sms=False, push=False))
    payment_notifications: NotificationMethodSettings = Field(default_factory=lambda: NotificationMethodSettings(sms=True))
    security_notifications: NotificationMethodSettings = Field(default_factory=lambda: NotificationMethodSettings(sms=True))


class NotificationSettingsUpdate(BaseModel):
    """Schema para actualizar configuración de notificaciones"""
    enabled: Optional[bool] = None
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = Field(None, pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    quiet_hours_end: Optional[str] = Field(None, pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    timezone: Optional[str] = None
    digest_frequency: Optional[DigestFrequencyEnum] = None
    digest_time: Optional[str] = Field(None, pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    marketing_emails: Optional[bool] = None
    newsletter_subscription: Optional[bool] = None
    
    # Configuración por tipo
    system_notifications: Optional[NotificationMethodSettings] = None
    verification_notifications: Optional[NotificationMethodSettings] = None
    listing_notifications: Optional[NotificationMethodSettings] = None
    subscription_notifications: Optional[NotificationMethodSettings] = None
    message_notifications: Optional[NotificationMethodSettings] = None
    lead_notifications: Optional[NotificationMethodSettings] = None
    review_notifications: Optional[NotificationMethodSettings] = None
    payment_notifications: Optional[NotificationMethodSettings] = None
    security_notifications: Optional[NotificationMethodSettings] = None
    
    model_config = ConfigDict(from_attributes=True)


class NotificationSettingsResponse(NotificationSettingsBase):
    """Schema para respuesta de configuración"""
    id: UUID
    user_id: UUID
    system_notifications: Dict[str, bool] = Field(default_factory=dict)
    verification_notifications: Dict[str, bool] = Field(default_factory=dict)
    listing_notifications: Dict[str, bool] = Field(default_factory=dict)
    subscription_notifications: Dict[str, bool] = Field(default_factory=dict)
    message_notifications: Dict[str, bool] = Field(default_factory=dict)
    lead_notifications: Dict[str, bool] = Field(default_factory=dict)
    review_notifications: Dict[str, bool] = Field(default_factory=dict)
    payment_notifications: Dict[str, bool] = Field(default_factory=dict)
    security_notifications: Dict[str, bool] = Field(default_factory=dict)
    sms_verification_required: bool = False
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Schemas para plantillas
class NotificationTemplateBase(BaseModel):
    """Base schema para plantillas de notificación"""
    template_key: str = Field(..., max_length=100)
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    notification_type: NotificationTypeEnum
    category: Optional[str] = Field(None, max_length=100)


class NotificationTemplateCreate(NotificationTemplateBase):
    """Schema para crear plantilla de notificación"""
    title_template: str
    message_template: str
    summary_template: Optional[str] = Field(None, max_length=500)
    default_delivery_methods: List[DeliveryMethodEnum] = Field(default_factory=lambda: [DeliveryMethodEnum.IN_APP])
    default_priority: NotificationPriorityEnum = NotificationPriorityEnum.MEDIUM
    allowed_variables: List[str] = Field(default_factory=list)
    required_variables: List[str] = Field(default_factory=list)


class NotificationTemplateResponse(NotificationTemplateBase):
    """Schema para respuesta de plantilla"""
    id: UUID
    title_template: str
    message_template: str
    summary_template: Optional[str] = None
    default_delivery_methods: List[str] = Field(default_factory=list)
    default_priority: NotificationPriorityEnum
    allowed_variables: List[str] = Field(default_factory=list)
    required_variables: List[str] = Field(default_factory=list)
    active: bool = True
    version: str = "1.0"
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Schemas para estadísticas
class NotificationStats(BaseModel):
    """Estadísticas de notificaciones del usuario"""
    total_notifications: int = 0
    unread_notifications: int = 0
    read_notifications: int = 0
    
    # Por tipo
    by_type: Dict[str, int] = Field(default_factory=dict)
    
    # Por prioridad
    by_priority: Dict[str, int] = Field(default_factory=dict)
    
    # Por estado
    by_status: Dict[str, int] = Field(default_factory=dict)
    
    # Recientes (últimos 7 días)
    recent_count: int = 0


class NotificationFilters(BaseModel):
    """Filtros para búsqueda de notificaciones"""
    notification_type: Optional[List[NotificationTypeEnum]] = None
    status: Optional[List[NotificationStatusEnum]] = None
    priority: Optional[List[NotificationPriorityEnum]] = None
    category: Optional[str] = None
    read: Optional[bool] = None  # True para leídas, False para no leídas
    created_from: Optional[datetime] = None
    created_to: Optional[datetime] = None
    search: Optional[str] = None  # Búsqueda en título y mensaje


class NotificationListResponse(BaseModel):
    """Respuesta paginada de notificaciones"""
    items: List[NotificationResponse]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool
    has_prev: bool
    unread_count: int = 0


# Schemas para operaciones masivas
class BulkNotificationCreate(BaseModel):
    """Schema para crear notificaciones masivas"""
    user_ids: Optional[List[UUID]] = None  # Si es None, a todos los usuarios activos
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    notification_type: NotificationTypeEnum
    category: Optional[str] = Field(None, max_length=100)
    priority: NotificationPriorityEnum = NotificationPriorityEnum.MEDIUM
    delivery_methods: List[DeliveryMethodEnum] = Field(default_factory=lambda: [DeliveryMethodEnum.IN_APP])
    expires_at: Optional[datetime] = None
    
    # Filtros para seleccionar usuarios (si user_ids es None)
    user_filters: Optional[Dict[str, Any]] = Field(default_factory=dict)


class BulkNotificationResponse(BaseModel):
    """Respuesta de operación masiva"""
    total_users: int
    notifications_created: int
    failed_count: int = 0
    errors: List[str] = Field(default_factory=list)
