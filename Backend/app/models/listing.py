from sqlalchemy import Column, String, Boolean, DateTime, Enum, Text, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base

class OperationType(str, enum.Enum):
    RENT = "rent"
    SALE = "sale"

class PropertyType(str, enum.Enum):
    APARTMENT = "apartment"
    HOUSE = "house"
    OFFICE = "office"
    LAND = "land"
    OTHER = "other"

class ListingStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    UNPUBLISHED = "unpublished"
    ARCHIVED = "archived"
    DELETED = "deleted"

class Listing(Base):
    __tablename__ = "listings"
    __table_args__ = {"schema": "core"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    operation_type = Column(Enum(OperationType), nullable=False)
    property_type = Column(Enum(PropertyType), nullable=False)
    price = Column(Float, nullable=False)
    area = Column(Float, nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    district = Column(String(100), nullable=True)
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    age_years = Column(Integer, nullable=True)
    features = Column(Text, nullable=True)
    amenities = Column(Text, nullable=True)
    verified = Column(Boolean, default=False)
    status = Column(Enum(ListingStatus), nullable=False, default=ListingStatus.DRAFT)
    owner_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    published_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Listing(id={self.id}, title={self.title}, status={self.status})>"
