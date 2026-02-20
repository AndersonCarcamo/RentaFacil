from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum
from app.models.verification import VerificationStatus, VerificationType, ModerationPriority


# Enums para schemas
class VerificationStatusEnum(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    UNDER_REVIEW = "under_review"


class VerificationTypeEnum(str, Enum):
    LISTING = "listing"
    AGENCY = "agency"
    USER = "user"


class ModerationPriorityEnum(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ModerationActionTypeEnum(str, Enum):
    REVIEW_START = "review_start"
    STATUS_CHANGE = "status_change"
    NOTE_ADD = "note_add"
    DOCUMENT_REQUEST = "document_request"
    DOCUMENT_APPROVE = "document_approve"
    DOCUMENT_REJECT = "document_reject"
    ASSIGN = "assign"
    UNASSIGN = "unassign"


# Base schemas
class VerificationBase(BaseModel):
    """Base schema para verificaciones"""
    target_type: VerificationTypeEnum
    target_id: UUID
    priority: Optional[ModerationPriorityEnum] = ModerationPriorityEnum.MEDIUM
    requester_notes: Optional[str] = None
    documents: Optional[List[UUID]] = Field(default_factory=list)
    verification_data: Optional[Dict[str, Any]] = Field(default_factory=dict)


class VerificationCreate(VerificationBase):
    """Schema para crear una verificación"""
    
    @field_validator('requester_notes')
    @classmethod
    def validate_notes(cls, v):
        if v and len(v.strip()) < 10:
            raise ValueError("Las notas deben tener al menos 10 caracteres")
        return v


class VerificationUpdate(BaseModel):
    """Schema para actualizar una verificación"""
    status: Optional[VerificationStatusEnum] = None
    priority: Optional[ModerationPriorityEnum] = None
    moderator_notes: Optional[str] = None
    requirements: Optional[List[str]] = None
    verification_data: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(from_attributes=True)


class VerificationResponse(VerificationBase):
    """Schema para respuesta de verificación"""
    id: UUID
    status: VerificationStatusEnum
    requester_id: UUID
    moderator_id: Optional[UUID] = None
    assigned_at: Optional[datetime] = None
    moderator_notes: Optional[str] = None
    requirements: Optional[List[str]] = Field(default_factory=list)
    submission_count: int = 1
    review_started_at: Optional[datetime] = None
    review_completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class VerificationDetailResponse(VerificationResponse):
    """Schema detallado de verificación con información adicional"""
    requester_name: Optional[str] = None
    moderator_name: Optional[str] = None
    target_name: Optional[str] = None  # Nombre de la entidad verificada
    document_files: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    actions: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    queue_position: Optional[int] = None
    estimated_completion: Optional[datetime] = None


# Schemas para documentos
class VerificationDocumentBase(BaseModel):
    """Base schema para documentos de verificación"""
    document_type: str
    file_name: str


class VerificationDocumentCreate(VerificationDocumentBase):
    """Schema para crear documento de verificación"""
    verification_id: UUID
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None


class VerificationDocumentResponse(VerificationDocumentBase):
    """Schema para respuesta de documento"""
    id: UUID
    verification_id: UUID
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    verified: bool = False
    verification_notes: Optional[str] = None
    uploaded_by: UUID
    uploaded_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Schemas para cola de moderación
class ModerationQueueBase(BaseModel):
    """Base schema para cola de moderación"""
    priority: ModerationPriorityEnum = ModerationPriorityEnum.MEDIUM
    priority_score: int = 0


class ModerationQueueResponse(ModerationQueueBase):
    """Schema para respuesta de cola de moderación"""
    id: UUID
    verification_id: UUID
    assigned_to: Optional[UUID] = None
    assigned_at: Optional[datetime] = None
    estimated_completion: Optional[datetime] = None
    queue_position: Optional[int] = None
    processing_started: bool = False
    processing_started_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Información de la verificación asociada
    verification: Optional[VerificationResponse] = None
    
    model_config = ConfigDict(from_attributes=True)


class ModerationAssignment(BaseModel):
    """Schema para asignar moderación"""
    moderator_id: UUID
    estimated_completion: Optional[datetime] = None
    priority: Optional[ModerationPriorityEnum] = None


class ModerationActionCreate(BaseModel):
    """Schema para crear acción de moderación"""
    verification_id: UUID
    action_type: ModerationActionTypeEnum
    action_description: Optional[str] = None
    action_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    previous_status: Optional[str] = None
    new_status: Optional[str] = None


class ModerationActionResponse(BaseModel):
    """Schema para respuesta de acción de moderación"""
    id: UUID
    verification_id: UUID
    moderator_id: UUID
    action_type: str
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    action_description: Optional[str] = None
    action_data: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    moderator_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


# Schemas para plantillas
class VerificationTemplateBase(BaseModel):
    """Base schema para plantillas de verificación"""
    name: str
    verification_type: VerificationTypeEnum
    description: Optional[str] = None


class VerificationTemplateCreate(VerificationTemplateBase):
    """Schema para crear plantilla de verificación"""
    required_documents: Optional[List[str]] = Field(default_factory=list)
    optional_documents: Optional[List[str]] = Field(default_factory=list)
    verification_steps: Optional[List[str]] = Field(default_factory=list)
    auto_approve_criteria: Optional[Dict[str, Any]] = Field(default_factory=dict)


class VerificationTemplateResponse(VerificationTemplateBase):
    """Schema para respuesta de plantilla"""
    id: UUID
    required_documents: List[str] = Field(default_factory=list)
    optional_documents: List[str] = Field(default_factory=list)
    verification_steps: List[str] = Field(default_factory=list)
    auto_approve_criteria: Dict[str, Any] = Field(default_factory=dict)
    active: bool = True
    version: str = "1.0"
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Schemas para estadísticas y dashboards
class VerificationStats(BaseModel):
    """Estadísticas de verificaciones"""
    total_verifications: int = 0
    pending_verifications: int = 0
    approved_verifications: int = 0
    rejected_verifications: int = 0
    under_review_verifications: int = 0
    average_processing_time_hours: Optional[float] = None
    queue_length: int = 0
    
    # Por tipo
    by_type: Dict[str, int] = Field(default_factory=dict)
    
    # Por prioridad
    by_priority: Dict[str, int] = Field(default_factory=dict)


class ModerationDashboard(BaseModel):
    """Dashboard de moderación"""
    stats: VerificationStats
    recent_verifications: List[VerificationResponse] = Field(default_factory=list)
    pending_queue: List[ModerationQueueResponse] = Field(default_factory=list)
    my_assigned: List[VerificationResponse] = Field(default_factory=list)
    recent_actions: List[ModerationActionResponse] = Field(default_factory=list)


# Schemas para filtros y búsquedas
class VerificationFilters(BaseModel):
    """Filtros para búsqueda de verificaciones"""
    status: Optional[List[VerificationStatusEnum]] = None
    verification_type: Optional[List[VerificationTypeEnum]] = None
    priority: Optional[List[ModerationPriorityEnum]] = None
    requester_id: Optional[UUID] = None
    moderator_id: Optional[UUID] = None
    assigned: Optional[bool] = None  # True para asignadas, False para no asignadas
    created_from: Optional[datetime] = None
    created_to: Optional[datetime] = None
    
    # Búsqueda por texto
    search: Optional[str] = None  # Búsqueda en notas, nombres, etc.


class VerificationListResponse(BaseModel):
    """Respuesta paginada de verificaciones"""
    items: List[VerificationResponse]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool
    has_prev: bool
