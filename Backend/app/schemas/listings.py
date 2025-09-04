from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime

class OperationType(str, Enum):
    RENT = "rent"
    SALE = "sale"

class PropertyType(str, Enum):
    APARTMENT = "apartment"
    HOUSE = "house"
    OFFICE = "office"
    LAND = "land"
    OTHER = "other"

class ListingStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    UNPUBLISHED = "unpublished"
    ARCHIVED = "archived"
    DELETED = "deleted"

class CreateListingRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    operation_type: OperationType
    property_type: PropertyType
    price: float
    area: float
    address: str
    city: str
    district: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    age_years: Optional[int] = None
    features: Optional[List[str]] = None
    amenities: Optional[List[str]] = None

class UpdateListingRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    area: Optional[float] = None
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    age_years: Optional[int] = None
    features: Optional[List[str]] = None
    amenities: Optional[List[str]] = None
    status: Optional[ListingStatus] = None

class ListingResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    operation_type: OperationType
    property_type: PropertyType
    price: float
    area: float
    address: str
    city: str
    district: Optional[str]
    bedrooms: Optional[int]
    bathrooms: Optional[int]
    age_years: Optional[int]
    features: Optional[List[str]]
    amenities: Optional[List[str]]
    verified: bool
    status: ListingStatus
    owner_id: str
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]

    class Config:
        from_attributes = True

class ChangeListingStatusRequest(BaseModel):
    status: ListingStatus

class RegisterViewRequest(BaseModel):
    viewer_id: Optional[str] = None
    metadata: Optional[dict] = None
