from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

# Enums
class LeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    CONVERTED = "converted"
    LOST = "lost"

class ReviewTargetType(str, Enum):
    LISTING = "listing"
    AGENT = "agent"
    AGENCY = "agency"

class ReviewStatus(str, Enum):
    PUBLISHED = "published"
    HIDDEN = "hidden"
    PENDING = "pending"

# Favorite Schemas
class FavoriteResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    listing_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

class FavoriteWithListing(FavoriteResponse):
    listing: Optional[dict] = None

    class Config:
        from_attributes = True

# Lead Schemas
class CreateLeadRequest(BaseModel):
    listing_id: uuid.UUID = Field(..., description="ID de la propiedad")
    message: str = Field(..., min_length=10, max_length=2000, description="Mensaje de consulta")
    phone: Optional[str] = Field(None, max_length=50, description="Teléfono de contacto")
    preferred_contact_time: Optional[str] = Field(None, description="Horario preferido de contacto")
    utm_source: Optional[str] = Field(None, max_length=255)
    utm_medium: Optional[str] = Field(None, max_length=255)
    utm_campaign: Optional[str] = Field(None, max_length=255)

class UpdateLeadRequest(BaseModel):
    status: Optional[LeadStatus] = None
    notes: Optional[str] = Field(None, max_length=2000)
    follow_up_date: Optional[datetime] = None

class LeadNoteRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000, description="Contenido de la nota")

class LeadNoteResponse(BaseModel):
    id: uuid.UUID
    lead_id: uuid.UUID
    user_id: uuid.UUID
    content: str
    created_at: datetime
    user: Optional[dict] = None

    class Config:
        from_attributes = True

class LeadResponse(BaseModel):
    id: uuid.UUID
    listing_id: uuid.UUID
    user_id: Optional[uuid.UUID]
    contact_name: Optional[str]
    contact_email: Optional[str]
    contact_phone: Optional[str]
    message: str
    status: str
    source: Optional[str]
    utm_source: Optional[str]
    utm_medium: Optional[str]
    utm_campaign: Optional[str]
    preferred_contact_time: Optional[str]
    notes: Optional[str]
    follow_up_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LeadDetailResponse(LeadResponse):
    listing: Optional[dict] = None
    user: Optional[dict] = None
    notes_history: List[LeadNoteResponse] = []

    class Config:
        from_attributes = True

# Review Schemas
class CreateReviewRequest(BaseModel):
    target_type: ReviewTargetType = Field(..., description="Tipo de entidad a reseñar")
    target_id: uuid.UUID = Field(..., description="ID de la entidad")
    rating: int = Field(..., ge=1, le=5, description="Calificación de 1 a 5 estrellas")
    comment: str = Field(..., min_length=1, max_length=2000, description="Comentario de la reseña")

    @field_validator('rating')
    @classmethod
    def validate_rating(cls, v):
        if v < 1 or v > 5:
            raise ValueError('Rating must be between 1 and 5')
        return v

class UpdateReviewRequest(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=2000)

    @field_validator('rating')
    @classmethod
    def validate_rating(cls, v):
        if v is not None and (v < 1 or v > 5):
            raise ValueError('Rating must be between 1 and 5')
        return v

class ReviewResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    target_type: str
    target_id: uuid.UUID
    rating: int
    comment: Optional[str]
    status: str
    helpful_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReviewDetailResponse(ReviewResponse):
    user: Optional[dict] = None

    class Config:
        from_attributes = True

# Pagination Responses
class PaginatedFavorites(BaseModel):
    data: List[FavoriteWithListing]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool

class PaginatedLeads(BaseModel):
    data: List[LeadResponse]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool

class PaginatedReviews(BaseModel):
    data: List[ReviewDetailResponse]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool
