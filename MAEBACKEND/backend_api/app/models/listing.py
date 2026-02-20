from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, DECIMAL, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, TSVECTOR
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base

# Enums que coinciden con la base de datos PostgreSQL
class ListingStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    MODERATED = "moderated"
    REMOVED = "removed"
    PENDING_VERIFICATION = "pending_verification"

class OperationType(str, enum.Enum):
    SALE = "sale"
    RENT = "rent"
    TEMP_RENT = "temp_rent"
    AUCTION = "auction"
    EXCHANGE = "exchange"

class PropertyType(str, enum.Enum):
    STUDIO = "studio"
    APARTMENT = "apartment"
    HOUSE = "house"
    OFFICE = "office"
    COMMERCIAL = "commercial"
    LAND = "land"
    WAREHOUSE = "warehouse"
    GARAGE = "garage"
    ROOM = "room"
    OTHER = "other"

class AdvertiserType(str, enum.Enum):
    OWNER = "owner"
    AGENCY = "agency"
    DEVELOPER = "developer"
    BROKER = "broker"

class RentalTerm(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

class RentalMode(str, enum.Enum):
    FULL_PROPERTY = "full_property"
    PRIVATE_ROOM = "private_room"
    SHARED_ROOM = "shared_room"

class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"

class Listing(Base):
    __tablename__ = "listings"
    __table_args__ = {"schema": "core"}

    # Clave primaria compuesta (id, created_at) para particionamiento
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), primary_key=True, nullable=False, server_default=func.now())
    
    # Foreign keys
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id", ondelete="CASCADE"), 
                          nullable=False, index=True)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("core.agencies.id"), nullable=True)
    
    # Información básica de la propiedad
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    operation = Column(Text, nullable=False)  # Maps to core.operation_type enum
    property_type = Column(Text, nullable=False)  # Maps to core.property_type enum
    advertiser_type = Column(Text, nullable=False, default='owner')  # Maps to core.advertiser_type enum
    
    # Location - Peru focused
    country = Column(Text, nullable=False, default='PE')
    department = Column(Text, nullable=True)  # Maps to "city" in API spec
    province = Column(Text, nullable=True)
    district = Column(Text, nullable=True)
    address = Column(Text, nullable=True)
    latitude = Column(DECIMAL(10, 8), nullable=True)
    longitude = Column(DECIMAL(11, 8), nullable=True)
    
    # Property details
    price = Column(DECIMAL(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, default='PEN')
    area_built = Column(DECIMAL(8, 2), nullable=True)  # Maps to "area" in API spec
    area_total = Column(DECIMAL(8, 2), nullable=True)
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    parking_spots = Column(Integer, nullable=True)
    floors = Column(Integer, nullable=True)
    floor_number = Column(Integer, nullable=True)
    age_years = Column(Integer, nullable=True)
    
    # Rental specific fields
    rental_term = Column(Text, nullable=True)  # Maps to core.rental_term enum
    rental_mode = Column(Text, nullable=True, default='full_property')  # Maps to core.rental_mode enum
    furnished = Column(Boolean, nullable=True, default=False)  # Amueblada/amoblada
    
    # Pet-friendly indicator (matches API spec)
    pet_friendly = Column(Boolean, nullable=True)  # Nueva columna para mascotas
    
    # Airbnb functionality
    airbnb_score = Column(Integer, nullable=True)  # Score 0-100 de elegibilidad Airbnb
    airbnb_eligible = Column(Boolean, nullable=True)  # Si es elegible para Airbnb
    airbnb_opted_out = Column(Boolean, nullable=False, default=False)  # Si usuario optó por NO Airbnb
    rental_model = Column(Text, nullable=True, default='traditional')  # traditional or airbnb
    
    # Airbnb-specific fields (from script 18)
    smoking_allowed = Column(Boolean, nullable=True)
    deposit_required = Column(Boolean, nullable=False, default=False)
    deposit_amount = Column(DECIMAL(12, 2), nullable=True)
    minimum_stay_nights = Column(Integer, nullable=True, default=1)
    maximum_stay_nights = Column(Integer, nullable=True)
    check_in_time = Column(Text, nullable=True)  # TIME field as text (HH:MM)
    check_out_time = Column(Text, nullable=True)  # TIME field as text (HH:MM)
    max_guests = Column(Integer, nullable=True)
    cleaning_included = Column(Boolean, nullable=False, default=False)
    cleaning_fee = Column(DECIMAL(12, 2), nullable=True)
    utilities_included = Column(Boolean, nullable=False, default=False)
    internet_included = Column(Boolean, nullable=False, default=False)
    house_rules = Column(Text, nullable=True)
    cancellation_policy = Column(Text, nullable=True, default='flexible')
    available_from = Column(Text, nullable=True)  # DATE field as text (YYYY-MM-DD)
    
    # Verification and status
    verification_status = Column(Text, nullable=False, default='pending')  # Maps to core.verification_status enum
    status = Column(Text, nullable=False, default='draft')  # Maps to core.listing_status enum
    
    # Contact information with WhatsApp integration
    contact_name = Column(Text, nullable=True)
    contact_phone_e164 = Column(Text, nullable=True)
    contact_whatsapp_phone_e164 = Column(Text, nullable=True)
    contact_whatsapp_link = Column(Text, nullable=True)
    
    # SEO and search
    slug = Column(Text, nullable=True, unique=False)  # Unique constraint handled at DB level with created_at
    meta_title = Column(Text, nullable=True)
    meta_description = Column(Text, nullable=True)
    search_doc = Column(TSVECTOR, nullable=True)
    has_media = Column(Boolean, nullable=False, default=False)
    
    # Publishing control
    published_at = Column(DateTime(timezone=True), nullable=True)
    published_until = Column(DateTime(timezone=True), nullable=True)
    
    # Counters
    views_count = Column(Integer, nullable=False, default=0)
    leads_count = Column(Integer, nullable=False, default=0)
    favorites_count = Column(Integer, nullable=False, default=0)
    
    # Update timestamp
    updated_at = Column(DateTime(timezone=True), nullable=False, 
                       server_default=func.now(), onupdate=func.now())

    @property
    def is_airbnb_available(self) -> bool:
        """Determina si la propiedad está disponible para funcionar como Airbnb"""
        return (
            bool(self.airbnb_eligible) and 
            not bool(self.airbnb_opted_out) and 
            self.operation in ['rent', 'temp_rent']
        )

    @property
    def area(self) -> float:
        """Alias para area_built para compatibilidad con API spec"""
        return float(self.area_built) if self.area_built else None

    @property 
    def city(self) -> str:
        """Alias para department para compatibilidad con API spec"""
        return self.department

    def __repr__(self):
        return f"<Listing(id={self.id}, title={self.title}, status={self.status})>"
