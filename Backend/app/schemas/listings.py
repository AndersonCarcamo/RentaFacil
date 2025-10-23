from pydantic import BaseModel, Field, field_validator, computed_field
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
import uuid

# Import media response for including images in listing
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.schemas.media import ListingMediaResponse

class CreateListingRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=500)
    description: Optional[str] = None
    operation: str = Field(..., description="Operation type: rent, sale, temp_rent")
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
    rental_term: Optional[str] = Field(None, description="Rental term: daily, weekly, monthly, yearly")
    rental_model: Optional[str] = Field('traditional', description="Rental model: traditional or airbnb")
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
    
    # Airbnb-specific fields
    smoking_allowed: Optional[bool] = Field(None, description="Whether smoking is allowed")
    deposit_required: Optional[bool] = Field(False, description="Whether deposit is required")
    deposit_amount: Optional[Decimal] = Field(None, ge=0, description="Deposit amount if required")
    minimum_stay_nights: Optional[int] = Field(1, ge=1, description="Minimum stay in nights")
    maximum_stay_nights: Optional[int] = Field(None, ge=1, description="Maximum stay in nights")
    check_in_time: Optional[str] = Field(None, description="Check-in time (HH:MM format)")
    check_out_time: Optional[str] = Field(None, description="Check-out time (HH:MM format)")
    max_guests: Optional[int] = Field(None, ge=1, description="Maximum number of guests")
    cleaning_included: Optional[bool] = Field(False, description="Whether cleaning is included")
    cleaning_fee: Optional[Decimal] = Field(None, ge=0, description="Cleaning fee amount")
    utilities_included: Optional[bool] = Field(False, description="Whether utilities are included")
    internet_included: Optional[bool] = Field(False, description="Whether internet is included")
    house_rules: Optional[str] = Field(None, description="House rules text")
    cancellation_policy: Optional[str] = Field('flexible', description="Cancellation policy: flexible, moderate, strict")
    available_from: Optional[str] = Field(None, description="Date when property is available (YYYY-MM-DD)")
    
    # Amenities
    amenities: Optional[List[int]] = Field(default=[], description="List of amenity IDs")
    
    # Contact information
    contact_name: Optional[str] = Field(None, description="Contact person name")
    contact_phone_e164: Optional[str] = Field(None, description="Contact phone in E.164 format")
    contact_whatsapp_phone_e164: Optional[str] = Field(None, description="WhatsApp phone in E.164 format")
    contact_whatsapp_link: Optional[str] = Field(None, description="Pre-generated WhatsApp link")

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
    rental_term: Optional[str] = None
    rental_model: Optional[str] = None
    airbnb_score: Optional[int] = None
    airbnb_eligible: Optional[bool] = None
    airbnb_opted_out: Optional[bool] = None
    address: Optional[str] = None
    department: Optional[str] = None
    province: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    
    # Airbnb-specific fields
    smoking_allowed: Optional[bool] = None
    deposit_required: Optional[bool] = None
    deposit_amount: Optional[Decimal] = None
    minimum_stay_nights: Optional[int] = None
    maximum_stay_nights: Optional[int] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    max_guests: Optional[int] = None
    cleaning_included: Optional[bool] = None
    cleaning_fee: Optional[Decimal] = None
    utilities_included: Optional[bool] = None
    internet_included: Optional[bool] = None
    house_rules: Optional[str] = None
    cancellation_policy: Optional[str] = None
    available_from: Optional[str] = None
    amenities: Optional[List[int]] = None
    
    # Contact information
    contact_name: Optional[str] = None
    contact_phone_e164: Optional[str] = None
    contact_whatsapp_phone_e164: Optional[str] = None
    contact_whatsapp_link: Optional[str] = None

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
    rental_term: Optional[str]
    rental_model: Optional[str]
    airbnb_score: Optional[int]
    airbnb_eligible: Optional[bool]
    airbnb_opted_out: Optional[bool]
    
    # Airbnb-specific fields
    smoking_allowed: Optional[bool]
    deposit_required: Optional[bool]
    deposit_amount: Optional[Decimal]
    minimum_stay_nights: Optional[int]
    maximum_stay_nights: Optional[int]
    check_in_time: Optional[str]
    check_out_time: Optional[str]
    max_guests: Optional[int]
    cleaning_included: Optional[bool]
    cleaning_fee: Optional[Decimal]
    utilities_included: Optional[bool]
    internet_included: Optional[bool]
    house_rules: Optional[str]
    cancellation_policy: Optional[str]
    available_from: Optional[str]
    
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
    
    # Contact information
    contact_name: Optional[str]
    contact_phone_e164: Optional[str]
    contact_whatsapp_phone_e164: Optional[str]
    contact_whatsapp_link: Optional[str]
    
    status: str
    verification_status: str
    owner_user_id: str
    agency_id: Optional[str]
    views_count: int
    leads_count: int
    favorites_count: int
    has_media: bool
    images: List[dict] = []  # Lista de imágenes
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]

    @field_validator('id', 'owner_user_id', 'agency_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v
    
    @field_validator('check_in_time', 'check_out_time', mode='before')
    @classmethod
    def convert_time_to_str(cls, v):
        if v is None:
            return v
        if hasattr(v, 'isoformat'):
            return v.isoformat()
        return str(v) if v else None
    
    @field_validator('available_from', mode='before')
    @classmethod
    def convert_date_to_str(cls, v):
        if v is None:
            return v
        if hasattr(v, 'isoformat'):
            return v.isoformat()
        return str(v) if v else None

    class Config:
        from_attributes = True

class ChangeListingStatusRequest(BaseModel):
    status: str = Field(..., description="New status: draft, published, unpublished, archived")

class RegisterViewRequest(BaseModel):
    viewer_id: Optional[str] = None
    metadata: Optional[dict] = None
