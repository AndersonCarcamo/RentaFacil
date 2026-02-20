from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
import uuid

class VideoBase(BaseModel):
    filename: str
    original_url: str
    thumbnail_url: Optional[str] = None
    display_order: int = 0
    title: Optional[str] = None
    description: Optional[str] = None
    duration_seconds: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    file_size: Optional[int] = None
    is_main: bool = False

class VideoCreate(VideoBase):
    listing_id: str
    listing_created_at: datetime

class VideoUpdate(BaseModel):
    display_order: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    is_main: Optional[bool] = None

class VideoResponse(VideoBase):
    id: str
    listing_id: str
    created_at: datetime

    @field_validator('id', 'listing_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

class VideoUploadResponse(BaseModel):
    id: str
    url: str
    thumbnail_url: Optional[str]
    message: str

class VideosListResponse(BaseModel):
    """Response containing a list of videos"""
    videos: list
    total: int
