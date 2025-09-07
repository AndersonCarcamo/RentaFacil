from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, DECIMAL
from sqlalchemy.dialects.postgresql import UUID, JSONB, TSVECTOR
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class Alert(Base):
    """Modelo para búsquedas guardadas/alertas de usuario"""
    __tablename__ = "alerts"
    __table_args__ = {"schema": "core"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(Text, nullable=False)
    search_params = Column(JSONB, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    frequency = Column(Text, nullable=False, default='daily')
    last_notified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Alert(id={self.id}, name={self.name}, user_id={self.user_id})>"

class Amenity(Base):
    """Modelo para amenidades/comodidades"""
    __tablename__ = "amenities"
    __table_args__ = {"schema": "core"}

    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False, unique=True)
    icon = Column(Text, nullable=True)

    def __repr__(self):
        return f"<Amenity(id={self.id}, name={self.name})>"

class ListingAmenity(Base):
    """Tabla de relación entre listings y amenidades"""
    __tablename__ = "listing_amenities"
    __table_args__ = {"schema": "core"}

    listing_id = Column(UUID(as_uuid=True), nullable=False, primary_key=True)
    listing_created_at = Column(DateTime(timezone=True), nullable=False, primary_key=True)
    amenity_id = Column(Integer, nullable=False, primary_key=True)

    def __repr__(self):
        return f"<ListingAmenity(listing_id={self.listing_id}, amenity_id={self.amenity_id})>"
