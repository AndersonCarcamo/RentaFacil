from pydantic import BaseModel, Field, field_validator, computed_field
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
    furnished: Optional[bool] = Field(None, description="Whether the property is furnished")
    rental_mode: Optional[str] = Field(None, description="Rental mode: full_property, private_room, shared_room")
    airbnb_score: Optional[int] = Field(None, ge=0, le=100, description="Airbnb eligibility score (0-100)")
    airbnb_eligible: Optional[bool] = Field(None, description="Whether the property is eligible for Airbnb")
    airbnb_opted_out: Optional[bool] = Field(False, description="Whether the owner opted out of Airbnb functionality")
    
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
    furnished: Optional[bool] = None
    rental_mode: Optional[str] = None
    airbnb_score: Optional[int] = None
    airbnb_eligible: Optional[bool] = None
    airbnb_opted_out: Optional[bool] = None
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
    furnished: Optional[bool]
    rental_mode: Optional[str]
    airbnb_score: Optional[int]
    airbnb_eligible: Optional[bool]
    airbnb_opted_out: Optional[bool]
    
    @computed_field
    @property
    def is_airbnb_available(self) -> Optional[bool]:
        """Computed field: whether property is available for Airbnb"""
        if self.airbnb_eligible is None:
            return None
        return (
            bool(self.airbnb_eligible) and 
            not bool(self.airbnb_opted_out) and 
            self.operation in ['rent', 'temp_rent']
        )
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
