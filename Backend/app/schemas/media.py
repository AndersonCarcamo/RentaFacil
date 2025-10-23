from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from enum import Enum

class MediaType(str, Enum):
    """Types of media supported"""
    IMAGE = "image"
    VIDEO = "video"
    VIRTUAL_TOUR = "virtual_tour"

class MediaUploadResponse(BaseModel):
    """Response after uploading a media file"""
    id: UUID
    url: str
    thumbnail_url: Optional[str] = None
    media_type: MediaType
    display_order: int
    is_primary: bool
    file_size_bytes: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True

class ListingMediaResponse(BaseModel):
    """Response model for listing media"""
    id: UUID
    listing_id: UUID
    media_type: MediaType
    url: str
    thumbnail_url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    display_order: int
    is_primary: bool
    file_size_bytes: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration_seconds: Optional[int] = None
    mime_type: Optional[str] = None
    uploaded_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UpdateMediaRequest(BaseModel):
    """Request to update media metadata"""
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    display_order: Optional[int] = Field(None, ge=0)
    is_primary: Optional[bool] = None

class MediaBatchUploadResponse(BaseModel):
    """Response for batch upload operations"""
    message: str
    uploaded: List[MediaUploadResponse]
    failed: List[dict]
    total_uploaded: int
    total_failed: int

class ListingMediaSummary(BaseModel):
    """Summary of media for a listing"""
    listing_id: UUID
    total_media: int
    total_images: int
    total_videos: int
    total_virtual_tours: int
    primary_media_url: Optional[str] = None
    total_size_bytes: Optional[int] = None
    image_urls: List[str] = []
    video_urls: List[str] = []

    class Config:
        from_attributes = True

class UploadUrlRequest(BaseModel):
    """Request to generate a presigned upload URL"""
    filename: str
    content_type: str
    file_size: int = Field(..., gt=0)
    listing_id: Optional[str] = None

class UploadUrlResponse(BaseModel):
    """Response with presigned upload URL"""
    upload_url: str
    file_url: str
    expires_at: datetime
    upload_id: str
