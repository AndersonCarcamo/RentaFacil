from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

class Image(Base):
    __tablename__ = "images"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id = Column(UUID(as_uuid=True), nullable=False)
    listing_created_at = Column(DateTime(timezone=True), nullable=False)
    filename = Column(String, nullable=False)
    original_url = Column(String, nullable=False)
    thumbnail_url = Column(String)
    medium_url = Column(String)
    display_order = Column(Integer, nullable=False, default=0)
    alt_text = Column(Text)
    width = Column(Integer)
    height = Column(Integer)
    file_size = Column(Integer)
    is_main = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Image(id={self.id}, listing_id={self.listing_id}, filename='{self.filename}')>"


class Video(Base):
    __tablename__ = "videos"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id = Column(UUID(as_uuid=True), nullable=False)
    listing_created_at = Column(DateTime(timezone=True), nullable=False)
    filename = Column(String, nullable=False)
    original_url = Column(String, nullable=False)
    thumbnail_url = Column(String)
    duration_seconds = Column(Integer)
    file_size = Column(Integer)
    width = Column(Integer)
    height = Column(Integer)
    display_order = Column(Integer, nullable=False, default=0)
    is_main = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Video(id={self.id}, listing_id={self.listing_id}, filename='{self.filename}')>"
