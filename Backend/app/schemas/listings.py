from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
import uuid

class CreateListingRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=500)
    description: Optional[str] = None
    operation: str = Field(..., description="Operation type: rent, sale")
    property_type: str = Field(..., description="Property type: apartment, house, office, land, etc.")
    price: Decimal = Field(..., ge=0)
    currency: Optional[str] = "PEN"
    
    # Area information
    area_built: Optional[Decimal] = None
    area_total: Optional[Decimal] = None
    
    # Property details
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    parking_spots: Optional[int] = None
    floors: Optional[int] = None
    floor_number: Optional[int] = None
    age_years: Optional[int] = None
    pet_friendly: Optional[bool] = Field(None, description="Whether the property allows pets")
    
    # Location
    address: Optional[str] = None
    department: Optional[str] = None
    province: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    
    # Contact
    contact_name: Optional[str] = None
    contact_phone_e164: Optional[str] = None

class UpdateListingRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    currency: Optional[str] = None
    area_built: Optional[Decimal] = None
    area_total: Optional[Decimal] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    parking_spots: Optional[int] = None
    floors: Optional[int] = None
    floor_number: Optional[int] = None
    age_years: Optional[int] = None
    pet_friendly: Optional[bool] = None
    address: Optional[str] = None
    department: Optional[str] = None
    province: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    contact_name: Optional[str] = None
    contact_phone_e164: Optional[str] = None

class ListingResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    operation: str
    property_type: str
    price: Decimal
    currency: str
    area_built: Optional[Decimal]
    area_total: Optional[Decimal]
    bedrooms: Optional[int]
    bathrooms: Optional[int]
    parking_spots: Optional[int]
    pet_friendly: Optional[bool]
    address: Optional[str]
    department: Optional[str]
    province: Optional[str]
    district: Optional[str]
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    status: str
    verification_status: str
    owner_user_id: str
    agency_id: Optional[str]
    views_count: int
    leads_count: int
    favorites_count: int
    has_media: bool
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]

    @field_validator('id', 'owner_user_id', 'agency_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

class ChangeListingStatusRequest(BaseModel):
    status: str = Field(..., description="New status: draft, published, unpublished, archived")

class RegisterViewRequest(BaseModel):
    viewer_id: Optional[str] = None
    metadata: Optional[dict] = None
