from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean, Integer, JSON, Enum as SQLEnum, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from enum import Enum
from app.core.database import Base


# Enums
class AuditActionType(str, Enum):
    """Tipos de acciones de auditoría"""
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


class UserStatus(str, Enum):
    """Estados de usuario para administración"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"
    BANNED = "banned"


class ListingFlagReason(str, Enum):
    """Razones para marcar listings"""
    SPAM = "spam"
    INAPPROPRIATE = "inappropriate"
    FALSE_INFO = "false_info"
    DUPLICATE = "duplicate"
    FRAUD = "fraud"
    OTHER = "other"


class SystemStatus(str, Enum):
    """Estados del sistema"""
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    MAINTENANCE = "maintenance"


class AuditLog(Base):
    """Log de auditoría del sistema"""
    __tablename__ = "audit_logs"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Información de la acción
    action_type = Column(SQLEnum(AuditActionType, name="audit_action_type"), nullable=False, index=True)
    action_description = Column(String(500), nullable=False)
    
    # Usuario que realizó la acción
    user_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), index=True)
    user_email = Column(String(255))  # Duplicado para casos donde el usuario se elimine
    user_role = Column(String(50))
    
    # Entidad afectada
    target_type = Column(String(100), index=True)  # user, listing, subscription, etc.
    target_id = Column(UUID(as_uuid=True), index=True)
    
    # Información técnica
    ip_address = Column(String(45))  # IPv4 o IPv6
    user_agent = Column(String(500))
    request_method = Column(String(10))
    request_path = Column(String(500))
    response_status = Column(Integer)
    
    # Datos adicionales
    old_values = Column(JSON, default=dict)  # Valores anteriores (para updates)
    new_values = Column(JSON, default=dict)  # Valores nuevos
    extra_data = Column(JSON, default=dict)  # Información adicional
    
    # Severidad y categorización
    severity = Column(String(20), default="info")  # info, warning, error, critical
    category = Column(String(100), index=True)  # security, business, system, etc.
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relaciones
    # user = relationship("User", back_populates="audit_logs")


class AdminAction(Base):
    """Acciones administrativas específicas"""
    __tablename__ = "admin_actions"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Admin que realizó la acción
    admin_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), nullable=False, index=True)
    
    # Información de la acción
    action_type = Column(String(100), nullable=False)
    target_type = Column(String(100), nullable=False)
    target_id = Column(UUID(as_uuid=True), nullable=False)
    
    # Detalles específicos
    reason = Column(Text)
    duration_days = Column(Integer)  # Para suspensiones temporales
    notes = Column(Text)
    
    # Datos adicionales
    action_data = Column(JSON, default=dict)
    
    # Estado
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime)  # Para acciones temporales
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    # admin = relationship("User", back_populates="admin_actions")


class SystemMetric(Base):
    """Métricas del sistema para monitoreo"""
    __tablename__ = "system_metrics"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identificación de la métrica
    metric_name = Column(String(100), nullable=False, index=True)
    metric_type = Column(String(50), nullable=False)  # counter, gauge, histogram
    
    # Valor y unidad
    value = Column(Float, nullable=False)
    unit = Column(String(20))  # seconds, bytes, count, percentage, etc.
    
    # Contexto
    service = Column(String(100))  # api, database, cache, etc.
    instance = Column(String(100))  # server instance identifier
    environment = Column(String(50))  # production, staging, development
    
    # Metadatos
    tags = Column(JSON, default=dict)  # key-value pairs for filtering
    dimensions = Column(JSON, default=dict)  # additional dimensions
    
    # Timestamps
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SystemHealth(Base):
    """Estado de salud de los componentes del sistema"""
    __tablename__ = "system_health"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identificación del componente
    component_name = Column(String(100), nullable=False, unique=True, index=True)
    component_type = Column(String(50), nullable=False)  # database, cache, api, external_service
    
    # Estado actual
    status = Column(SQLEnum(SystemStatus, name="system_status"), nullable=False, index=True)
    status_message = Column(String(500))
    
    # Métricas de salud
    response_time_ms = Column(Float)
    uptime_percentage = Column(Float)
    last_error = Column(Text)
    error_count = Column(Integer, default=0)
    
    # Configuración de checks
    check_interval_seconds = Column(Integer, default=60)
    timeout_seconds = Column(Integer, default=30)
    enabled = Column(Boolean, default=True)
    
    # Metadatos
    version = Column(String(50))
    configuration = Column(JSON, default=dict)
    dependencies = Column(JSON, default=list)  # Lista de componentes dependientes
    
    # Timestamps
    last_check_at = Column(DateTime, default=datetime.utcnow, index=True)
    last_healthy_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserSuspension(Base):
    """Suspensiones de usuarios"""
    __tablename__ = "user_suspensions"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Usuario suspendido
    user_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), nullable=False, index=True)
    
    # Admin responsable
    suspended_by = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), nullable=False)
    
    # Detalles de la suspensión
    reason = Column(Text, nullable=False)
    duration_days = Column(Integer)  # null = indefinida
    notes = Column(Text)
    
    # Estado
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    suspended_at = Column(DateTime, default=datetime.utcnow, index=True)
    expires_at = Column(DateTime)  # Calculado basado en duration_days
    lifted_at = Column(DateTime)  # Cuando se quitó la suspensión
    lifted_by = Column(UUID(as_uuid=True), ForeignKey("core.users.id"))
    
    # Relaciones
    # user = relationship("User", foreign_keys=[user_id], back_populates="suspensions")
    # suspended_by_user = relationship("User", foreign_keys=[suspended_by])
    # lifted_by_user = relationship("User", foreign_keys=[lifted_by])


class ListingFlag(Base):
    """Marcado de listings problemáticos"""
    __tablename__ = "listing_flags"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Listing marcado
    listing_id = Column(UUID(as_uuid=True), ForeignKey("core.listings.id"), nullable=False, index=True)
    
    # Información del reporte
    reported_by = Column(UUID(as_uuid=True), ForeignKey("core.users.id"))  # null si es admin
    admin_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id"))  # admin que procesó
    
    # Detalles del flag
    reason = Column(SQLEnum(ListingFlagReason, name="listing_flag_reason"), nullable=False)
    description = Column(Text)
    admin_notes = Column(Text)
    
    # Estado del flag
    status = Column(String(20), default="pending")  # pending, reviewed, resolved, dismissed
    is_resolved = Column(Boolean, default=False)
    
    # Acción tomada
    action_taken = Column(String(100))  # warning, listing_removed, user_suspended, etc.
    action_data = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    reviewed_at = Column(DateTime)
    resolved_at = Column(DateTime)
    
    # Relaciones
    # listing = relationship("Listing", back_populates="flags")
    # reporter = relationship("User", foreign_keys=[reported_by])
    # admin = relationship("User", foreign_keys=[admin_id])


class ConfigurationSetting(Base):
    """Configuraciones del sistema administrables"""
    __tablename__ = "configuration_settings"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identificación
    key = Column(String(100), nullable=False, unique=True, index=True)
    category = Column(String(50), nullable=False, index=True)  # system, ui, business, security
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Valor
    value = Column(Text, nullable=False)
    data_type = Column(String(20), nullable=False)  # string, integer, float, boolean, json
    default_value = Column(Text)
    
    # Validación
    validation_rules = Column(JSON, default=dict)  # min, max, regex, enum, etc.
    
    # Estado
    is_public = Column(Boolean, default=False)  # Si se expone en APIs públicas
    is_editable = Column(Boolean, default=True)  # Si se puede modificar por admin
    requires_restart = Column(Boolean, default=False)  # Si requiere reinicio del sistema
    
    # Metadatos
    tags = Column(JSON, default=list)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_modified_by = Column(UUID(as_uuid=True), ForeignKey("core.users.id"))
    
    # Relaciones
    # last_modifier = relationship("User", back_populates="modified_settings")
