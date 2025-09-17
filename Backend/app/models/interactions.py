from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, ForeignKey, Index, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (
        Index('idx_favorites_user_listing', 'user_id', 'listing_id', unique=True),
        {'schema': 'core'}
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    listing_id = Column(UUID(as_uuid=True), nullable=False)
    listing_created_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Favorite(user_id={self.user_id}, listing_id={self.listing_id})>"


class Lead(Base):
    __tablename__ = "leads"
    __table_args__ = {'schema': 'core'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id = Column(UUID(as_uuid=True), nullable=False)
    listing_created_at = Column(DateTime(timezone=True), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=True)  # Null if anonymous
    contact_name = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    contact_phone_e164 = Column(String(50), nullable=True)
    message = Column(Text, nullable=False)
    status = Column(String(50), default='new', nullable=False)
    source = Column(String(100), nullable=True)
    utm_source = Column(String(255), nullable=True)
    utm_medium = Column(String(255), nullable=True)
    utm_campaign = Column(String(255), nullable=True)
    preferred_contact_time = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    follow_up_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Lead(id={self.id}, listing_id={self.listing_id}, status='{self.status}')>"


class LeadNote(Base):
    __tablename__ = "lead_notes"
    __table_args__ = {'schema': 'core'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), nullable=False)
    lead_created_at = Column(DateTime(timezone=True), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<LeadNote(lead_id={self.lead_id}, user_id={self.user_id})>"


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = {'schema': 'core'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    target_type = Column(String(50), nullable=False)  # listing, agent, agency
    target_id = Column(UUID(as_uuid=True), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    comment = Column(Text, nullable=True)
    status = Column(String(50), default='published', nullable=False)
    helpful_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Review(id={self.id}, target_type='{self.target_type}', rating={self.rating})>"
