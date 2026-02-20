from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, Any
from datetime import datetime
import uuid

class ImageBase(BaseModel):
    filename: str
    original_url: str
    thumbnail_url: Optional[str] = None
    medium_url: Optional[str] = None
    display_order: int = 0
    alt_text: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    file_size: Optional[int] = None
    is_main: bool = False

class ImageCreate(ImageBase):
    listing_id: str
    listing_created_at: datetime

class ImageUpdate(BaseModel):
    display_order: Optional[int] = None
    alt_text: Optional[str] = None
    is_main: Optional[bool] = None

class ImageResponse(ImageBase):
    id: str
    listing_id: str
    created_at: datetime
    url: Optional[str] = None  # Alias para original_url para compatibilidad con frontend

    @field_validator('id', 'listing_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    @model_validator(mode='after')
    def set_url_from_original(self) -> 'ImageResponse':
        """Asigna original_url a url si url no está definido"""
        if self.url is None and self.original_url:
            self.url = self.original_url
        return self

    class Config:
        from_attributes = True

class ImageUploadResponse(BaseModel):
    id: str
    url: str
    thumbnail_url: Optional[str]
    message: str

class ImagesListResponse(BaseModel):
    """Response containing a list of images"""
    images: list
    total: int

class BulkMediaResponse(BaseModel):
    """Response for bulk media operations"""
    message: str
    uploaded: list
    failed: list
    total_uploaded: int
    total_failed: int
