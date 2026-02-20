from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean, Integer, JSON, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from enum import Enum
from app.core.database import Base


# Enums
class VerificationStatus(str, Enum):
    """Estados de verificación"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    UNDER_REVIEW = "under_review"


class VerificationType(str, Enum):
    """Tipos de verificación"""
    LISTING = "listing"
    AGENCY = "agency"
    USER = "user"


class ModerationPriority(str, Enum):
    """Prioridades de moderación"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Verification(Base):
    """Modelo para verificaciones"""
    __tablename__ = "verifications"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Información de la verificación
    target_type = Column(SQLEnum(VerificationType, name="verification_type"), nullable=False, index=True)
    target_id = Column(UUID(as_uuid=True), nullable=False, index=True)  # ID de la entidad a verificar
    
    # Estado y proceso
    status = Column(SQLEnum(VerificationStatus, name="verification_status"), default=VerificationStatus.PENDING, index=True)
    priority = Column(SQLEnum(ModerationPriority, name="moderation_priority"), default=ModerationPriority.MEDIUM)
    
    # Usuarios involucrados
    requester_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), nullable=False, index=True)
    moderator_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), index=True)
    assigned_at = Column(DateTime)
    
    # Documentos y notas
    documents = Column(JSON, default=list)  # Lista de IDs de documentos/archivos
    requester_notes = Column(Text)  # Notas del solicitante
    moderator_notes = Column(Text)  # Notas del moderador
    requirements = Column(JSON, default=list)  # Requisitos adicionales solicitados
    
    # Información de proceso
    submission_count = Column(Integer, default=1)  # Número de envíos
    review_started_at = Column(DateTime)
    review_completed_at = Column(DateTime)
    
    # Metadatos adicionales
    verification_data = Column(JSON, default=dict)  # Datos específicos de la verificación
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    # requester = relationship("User", foreign_keys=[requester_id], back_populates="requested_verifications")
    # moderator = relationship("User", foreign_keys=[moderator_id], back_populates="moderated_verifications")


class ModerationQueue(Base):
    """Cola de moderación para organizar el trabajo"""
    __tablename__ = "moderation_queue"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    verification_id = Column(UUID(as_uuid=True), ForeignKey("core.verifications.id"), nullable=False, unique=True)
    
    # Priorización
    priority = Column(SQLEnum(ModerationPriority, name="queue_priority"), default=ModerationPriority.MEDIUM, index=True)
    priority_score = Column(Integer, default=0)  # Score calculado para ordenar
    
    # Asignación
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), index=True)
    assigned_at = Column(DateTime)
    estimated_completion = Column(DateTime)
    
    # Estado en la cola
    queue_position = Column(Integer)
    processing_started = Column(Boolean, default=False)
    processing_started_at = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    verification = relationship("Verification", backref="queue_entry")
    # assigned_moderator = relationship("User", back_populates="assigned_moderations")


class VerificationDocument(Base):
    """Documentos asociados a verificaciones"""
    __tablename__ = "verification_documents"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    verification_id = Column(UUID(as_uuid=True), ForeignKey("core.verifications.id"), nullable=False, index=True)
    
    # Información del documento
    document_type = Column(String(100), nullable=False)  # ID, license, certificate, etc.
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))
    
    # Estado del documento
    verified = Column(Boolean, default=False)
    verification_notes = Column(Text)
    
    # Metadatos
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    verification = relationship("Verification", backref="document_files")
    # uploader = relationship("User", back_populates="uploaded_documents")


class ModerationAction(Base):
    """Historial de acciones de moderación"""
    __tablename__ = "moderation_actions"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    verification_id = Column(UUID(as_uuid=True), ForeignKey("core.verifications.id"), nullable=False, index=True)
    moderator_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), nullable=False, index=True)
    
    # Información de la acción
    action_type = Column(String(50), nullable=False)  # review_start, status_change, note_add, etc.
    previous_status = Column(String(50))
    new_status = Column(String(50))
    
    # Detalles de la acción
    action_description = Column(Text)
    action_data = Column(JSON, default=dict)  # Datos adicionales de la acción
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relaciones
    verification = relationship("Verification", backref="actions")
    # moderator = relationship("User", back_populates="moderation_actions")


class VerificationTemplate(Base):
    """Plantillas para diferentes tipos de verificación"""
    __tablename__ = "verification_templates"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Información de la plantilla
    name = Column(String(255), nullable=False)
    verification_type = Column(SQLEnum(VerificationType, name="template_type"), nullable=False)
    description = Column(Text)
    
    # Configuración de la plantilla
    required_documents = Column(JSON, default=list)  # Tipos de documentos requeridos
    optional_documents = Column(JSON, default=list)  # Documentos opcionales
    verification_steps = Column(JSON, default=list)  # Pasos del proceso
    auto_approve_criteria = Column(JSON, default=dict)  # Criterios para aprobación automática
    
    # Estado
    active = Column(Boolean, default=True)
    version = Column(String(20), default="1.0")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
