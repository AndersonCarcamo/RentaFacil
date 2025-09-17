from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean, JSON, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from enum import Enum
from app.core.database import Base


# Enums
class NotificationType(str, Enum):
    """Tipos de notificación"""
    SYSTEM = "system"
    VERIFICATION = "verification"
    LISTING = "listing"
    SUBSCRIPTION = "subscription"
    MESSAGE = "message"
    LEAD = "lead"
    REVIEW = "review"
    PAYMENT = "payment"
    SECURITY = "security"


class NotificationPriority(str, Enum):
    """Prioridades de notificación"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class DeliveryMethod(str, Enum):
    """Métodos de entrega de notificaciones"""
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"


class NotificationStatus(str, Enum):
    """Estados de notificación"""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"


class Notification(Base):
    """Modelo principal para notificaciones"""
    __tablename__ = "notifications"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Usuario destinatario
    user_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), nullable=False, index=True)
    
    # Tipo y categoría
    notification_type = Column(SQLEnum(NotificationType, name="notification_type"), nullable=False, index=True)
    category = Column(String(100))  # Subcategoría específica
    
    # Contenido
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    summary = Column(String(500))  # Resumen corto para notificaciones push
    
    # Prioridad y urgencia
    priority = Column(SQLEnum(NotificationPriority, name="notification_priority"), default=NotificationPriority.MEDIUM, index=True)
    expires_at = Column(DateTime)  # Cuándo expira la notificación
    
    # Estado
    status = Column(SQLEnum(NotificationStatus, name="notification_status"), default=NotificationStatus.PENDING, index=True)
    read_at = Column(DateTime)
    
    # Referencia a entidad relacionada
    related_entity_type = Column(String(100))  # listing, verification, subscription, etc.
    related_entity_id = Column(UUID(as_uuid=True), index=True)
    
    # Datos adicionales
    action_url = Column(String(500))  # URL para acción relacionada
    action_data = Column(JSON, default=dict)  # Datos adicionales para la acción
    extra_data = Column(JSON, default=dict)  # Datos extra específicos del tipo
    
    # Control de entrega
    delivery_methods = Column(JSON, default=list)  # Métodos de entrega solicitados
    delivered_via = Column(JSON, default=list)  # Métodos por los que se entregó exitosamente
    failed_deliveries = Column(JSON, default=list)  # Intentos fallidos
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    sent_at = Column(DateTime)
    delivered_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    # user = relationship("User", back_populates="notifications")


class NotificationSettings(Base):
    """Configuración de notificaciones por usuario"""
    __tablename__ = "notification_settings"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), nullable=False, unique=True, index=True)
    
    # Configuración general
    enabled = Column(Boolean, default=True)
    quiet_hours_enabled = Column(Boolean, default=False)
    quiet_hours_start = Column(String(5), default="22:00")  # HH:MM format
    quiet_hours_end = Column(String(5), default="08:00")    # HH:MM format
    timezone = Column(String(50), default="UTC")
    
    # Configuración por tipo de notificación (JSON con estructura tipo: {in_app: bool, email: bool, sms: bool, push: bool})
    system_notifications = Column(JSON, default={"in_app": True, "email": True, "sms": False, "push": True})
    verification_notifications = Column(JSON, default={"in_app": True, "email": True, "sms": False, "push": True})
    listing_notifications = Column(JSON, default={"in_app": True, "email": True, "sms": False, "push": True})
    subscription_notifications = Column(JSON, default={"in_app": True, "email": True, "sms": False, "push": False})
    message_notifications = Column(JSON, default={"in_app": True, "email": True, "sms": True, "push": True})
    lead_notifications = Column(JSON, default={"in_app": True, "email": True, "sms": True, "push": True})
    review_notifications = Column(JSON, default={"in_app": True, "email": True, "sms": False, "push": False})
    payment_notifications = Column(JSON, default={"in_app": True, "email": True, "sms": True, "push": True})
    security_notifications = Column(JSON, default={"in_app": True, "email": True, "sms": True, "push": True})
    
    # Configuración de frecuencia
    digest_frequency = Column(String(20), default="daily")  # none, daily, weekly
    digest_time = Column(String(5), default="09:00")  # HH:MM format
    
    # Configuración avanzada
    marketing_emails = Column(Boolean, default=False)
    newsletter_subscription = Column(Boolean, default=False)
    sms_verification_required = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    # user = relationship("User", back_populates="notification_settings", uselist=False)


class NotificationTemplate(Base):
    """Plantillas para diferentes tipos de notificaciones"""
    __tablename__ = "notification_templates"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identificación de la plantilla
    template_key = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Tipo y categoría
    notification_type = Column(SQLEnum(NotificationType, name="template_notification_type"), nullable=False)
    category = Column(String(100))
    
    # Contenido de la plantilla
    title_template = Column(Text, nullable=False)  # Plantilla del título con variables
    message_template = Column(Text, nullable=False)  # Plantilla del mensaje
    summary_template = Column(String(500))  # Plantilla del resumen
    
    # Configuración de entrega
    default_delivery_methods = Column(JSON, default=["in_app"])
    default_priority = Column(SQLEnum(NotificationPriority, name="template_priority"), default=NotificationPriority.MEDIUM)
    
    # Variables permitidas
    allowed_variables = Column(JSON, default=list)  # Lista de variables que se pueden usar
    required_variables = Column(JSON, default=list)  # Variables obligatorias
    
    # Estado y versión
    active = Column(Boolean, default=True)
    version = Column(String(20), default="1.0")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class NotificationDelivery(Base):
    """Registro de entregas de notificaciones"""
    __tablename__ = "notification_deliveries"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    notification_id = Column(UUID(as_uuid=True), ForeignKey("core.notifications.id"), nullable=False, index=True)
    
    # Método de entrega
    delivery_method = Column(SQLEnum(DeliveryMethod, name="delivery_method"), nullable=False)
    
    # Estado de la entrega
    status = Column(SQLEnum(NotificationStatus, name="delivery_status"), default=NotificationStatus.PENDING, index=True)
    
    # Detalles del intento
    attempt_count = Column(Integer, default=0)
    last_attempt_at = Column(DateTime)
    next_attempt_at = Column(DateTime)
    
    # Información específica del método
    provider = Column(String(100))  # Proveedor del servicio (SendGrid, Twilio, etc.)
    external_id = Column(String(255))  # ID externo del proveedor
    
    # Resultado
    delivery_result = Column(JSON, default=dict)  # Respuesta del proveedor
    error_message = Column(Text)
    error_code = Column(String(50))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    delivered_at = Column(DateTime)
    failed_at = Column(DateTime)
    
    # Relaciones
    notification = relationship("Notification", backref="deliveries")


class NotificationQueue(Base):
    """Cola de notificaciones pendientes de envío"""
    __tablename__ = "notification_queue"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    notification_id = Column(UUID(as_uuid=True), ForeignKey("core.notifications.id"), nullable=False, index=True)
    
    # Priorización en la cola
    priority_score = Column(Integer, default=0, index=True)  # Score calculado para ordenar
    scheduled_for = Column(DateTime, default=datetime.utcnow, index=True)  # Cuándo debe enviarse
    
    # Estado en la cola
    processing = Column(Boolean, default=False)
    processing_started_at = Column(DateTime)
    worker_id = Column(String(100))  # ID del worker que está procesando
    
    # Reintentos
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    last_error = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    notification = relationship("Notification", backref="queue_entry")
