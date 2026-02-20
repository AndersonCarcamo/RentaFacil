"""
Schemas para verificación de identidad
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class VerificationStatus(str, Enum):
    """Estados de verificación"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    UNDER_REVIEW = "under_review"


class VerificationType(str, Enum):
    """Tipos de verificación"""
    USER = "user"
    LISTING = "listing"
    AGENCY = "agency"


class DNIVerificationRequest(BaseModel):
    """Request para iniciar verificación de DNI"""
    # Las imágenes se subirán como FormData multipart
    pass


class DNIVerificationResponse(BaseModel):
    """Response del proceso de verificación DNI"""
    id: str
    status: VerificationStatus
    message: str
    extracted_data: Optional[Dict] = None
    validation_result: Optional[Dict] = None
    confidence_score: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class VerificationDocumentUpload(BaseModel):
    """Información de documento subido"""
    document_type: str = Field(..., description="Tipo de documento: dni_front, dni_back")
    file_name: str
    file_size: int
    uploaded_at: datetime


class UserVerificationStatus(BaseModel):
    """Estado de verificación del usuario"""
    is_verified: bool
    verification_status: Optional[VerificationStatus] = None
    verification_date: Optional[datetime] = None
    pending_verification: bool = False
    
    class Config:
        from_attributes = True


class VerificationListResponse(BaseModel):
    """Lista de verificaciones del usuario"""
    verifications: List[DNIVerificationResponse]
    total: int
    pending_count: int
    approved_count: int
    rejected_count: int
