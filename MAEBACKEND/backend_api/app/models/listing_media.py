from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, BigInteger, ForeignKeyConstraint, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base
import uuid
import enum

class MediaType(str, enum.Enum):
    """Enum for media types"""
    IMAGE = "image"
    VIDEO = "video"
    VIRTUAL_TOUR = "virtual_tour"

class ListingMedia(Base):
    """Model for listing multimedia (images, videos, virtual tours)"""
    __tablename__ = "listing_media"
    __table_args__ = (
        ForeignKeyConstraint(
            ['listing_id', 'listing_created_at'],
            ['listings.id', 'listings.created_at'],
            ondelete='CASCADE'
        ),
        {'schema': 'core'}
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    listing_created_at = Column(DateTime(timezone=True), nullable=False)
    
    # Media information
    media_type = Column(SQLEnum(MediaType, name='media_type', schema='core'), nullable=False, default=MediaType.IMAGE)
    url = Column(Text, nullable=False)  # Relative URL: /media/listings/{listing_id}/{filename}
    thumbnail_url = Column(Text, nullable=True)  # Thumbnail URL (for videos)
    title = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    
    # Ordering and display
    display_order = Column(Integer, nullable=False, default=0)
    is_primary = Column(Boolean, nullable=False, default=False)
    
    # Metadata
    file_size_bytes = Column(BigInteger, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    duration_seconds = Column(Integer, nullable=True)  # For videos
    mime_type = Column(Text, nullable=True)
    
    # Timestamps
    uploaded_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<ListingMedia(id={self.id}, listing_id={self.listing_id}, type={self.media_type}, url={self.url})>"
