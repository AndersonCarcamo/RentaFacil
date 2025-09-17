from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, DECIMAL, Enum
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
    APARTMENT = "apartment"
    HOUSE = "house"
    STUDIO = "studio"
    ROOM = "room"
    OFFICE = "office"
    COMMERCIAL = "commercial"
    LAND = "land"
    WAREHOUSE = "warehouse"
    GARAGE = "garage"
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
    created_at = Column(DateTime(timezone=True), primary_key=True, server_default=func.now())
    
    # Referencias
    owner_user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    agency_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Información básica de la propiedad
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    operation = Column(Text, nullable=False)  # core.operation_type enum
    property_type = Column(Text, nullable=False)  # core.property_type enum
    advertiser_type = Column(Text, nullable=False, default='owner')  # core.advertiser_type enum
    
    # Ubicación
    country = Column(Text, nullable=False, default='PE')
    department = Column(Text, nullable=True)
    province = Column(Text, nullable=True)
    district = Column(Text, nullable=True)
    address = Column(Text, nullable=True)
    latitude = Column(DECIMAL(10, 8), nullable=True)
    longitude = Column(DECIMAL(11, 8), nullable=True)
    
    # Detalles de la propiedad
    price = Column(DECIMAL(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, default='PEN')
    area_built = Column(DECIMAL(8, 2), nullable=True)
    area_total = Column(DECIMAL(8, 2), nullable=True)
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    parking_spots = Column(Integer, nullable=True)
    floors = Column(Integer, nullable=True)
    floor_number = Column(Integer, nullable=True)
    age_years = Column(Integer, nullable=True)
    rental_term = Column(Text, nullable=True)  # core.rental_term enum
    pet_friendly = Column(Boolean, nullable=True)  # Nueva columna: si acepta mascotas
    furnished = Column(Boolean, nullable=True)  # Nueva columna: si está amueblada
    rental_mode = Column(Text, nullable=True)  # core.rental_mode enum - modalidad de alquiler
    airbnb_score = Column(Integer, nullable=True)  # Score de elegibilidad Airbnb (0-100)
    airbnb_eligible = Column(Boolean, nullable=True)  # Si es elegible para Airbnb
    airbnb_opted_out = Column(Boolean, nullable=False, default=False)  # Si el usuario optó por NO ser Airbnb
    
    # Verificación y estado
    verification_status = Column(Text, nullable=False, default='pending')  # core.verification_status enum
    status = Column(Text, nullable=False, default='draft')  # core.listing_status enum
    
    # Información de contacto
    contact_name = Column(Text, nullable=True)
    contact_phone_e164 = Column(Text, nullable=True)
    contact_whatsapp_phone_e164 = Column(Text, nullable=True)
    contact_whatsapp_link = Column(Text, nullable=True)
    
    # SEO y búsqueda
    slug = Column(Text, nullable=True)
    meta_title = Column(Text, nullable=True)
    meta_description = Column(Text, nullable=True)
    search_doc = Column(TSVECTOR, nullable=True)
    has_media = Column(Boolean, nullable=False, default=False)
    
    # Control de publicación
    published_at = Column(DateTime(timezone=True), nullable=True)
    published_until = Column(DateTime(timezone=True), nullable=True)
    views_count = Column(Integer, nullable=False, default=0)
    leads_count = Column(Integer, nullable=False, default=0)
    favorites_count = Column(Integer, nullable=False, default=0)
    
    # Timestamps
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    @property
    def is_airbnb_available(self) -> bool:
        """Determina si la propiedad está disponible para funcionar como Airbnb"""
        return (
            bool(self.airbnb_eligible) and 
            not bool(self.airbnb_opted_out) and 
            self.operation in ['rent', 'temp_rent']
        )

    def __repr__(self):
        return f"<Listing(id={self.id}, title={self.title}, status={self.status})>"
