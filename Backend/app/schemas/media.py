from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
import uuid

# Base schemas
class MediaBase(BaseModel):
    filename: str = Field(..., description="Nombre del archivo")
    display_order: int = Field(0, description="Orden de visualización")
    alt_text: Optional[str] = Field(None, description="Texto alternativo")

class ImageBase(MediaBase):
    width: Optional[int] = Field(None, description="Ancho en píxeles")
    height: Optional[int] = Field(None, description="Alto en píxeles")
    is_main: bool = Field(False, description="¿Es la imagen principal?")

class VideoBase(MediaBase):
    duration_seconds: Optional[int] = Field(None, description="Duración en segundos")
    width: Optional[int] = Field(None, description="Ancho en píxeles")
    height: Optional[int] = Field(None, description="Alto en píxeles")
    is_main: bool = Field(False, description="¿Es el video principal?")

# Request schemas
class ImageCreate(ImageBase):
    pass

class ImageUpdate(BaseModel):
    alt_text: Optional[str] = None
    is_main: Optional[bool] = None
    display_order: Optional[int] = None

class VideoCreate(VideoBase):
    pass

class VideoUpdate(BaseModel):
    alt_text: Optional[str] = None
    display_order: Optional[int] = None

# Response schemas
class ImageResponse(ImageBase):
    id: uuid.UUID
    listing_id: uuid.UUID
    original_url: str
    thumbnail_url: Optional[str] = None
    medium_url: Optional[str] = None
    file_size: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class VideoResponse(VideoBase):
    id: uuid.UUID
    listing_id: uuid.UUID
    original_url: str
    thumbnail_url: Optional[str] = None
    file_size: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Upload schemas
class UploadUrlRequest(BaseModel):
    filename: str = Field(..., description="Nombre del archivo")
    content_type: str = Field(..., description="Tipo de contenido MIME")
    size: Optional[int] = Field(None, description="Tamaño del archivo en bytes")

    @validator('content_type')
    def validate_content_type(cls, v):
        allowed_image_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        allowed_video_types = ['video/mp4', 'video/avi', 'video/quicktime', 'video/webm']
        allowed_types = allowed_image_types + allowed_video_types
        
        if v not in allowed_types:
            raise ValueError(f'Content type not allowed. Allowed types: {", ".join(allowed_types)}')
        return v

class UploadUrlResponse(BaseModel):
    upload_url: str = Field(..., description="URL para subir el archivo")
    file_url: str = Field(..., description="URL final donde estará el archivo")
    expires_at: datetime = Field(..., description="Cuándo expira la URL de subida")
    upload_id: str = Field(..., description="ID único para esta subida")

# Collection responses
class ImagesListResponse(BaseModel):
    images: List[ImageResponse]
    total: int

class VideosListResponse(BaseModel):
    videos: List[VideoResponse]
    total: int

# Bulk operations
class BulkImageCreate(BaseModel):
    images: List[dict] = Field(..., description="Lista de metadatos de imágenes")

class BulkMediaResponse(BaseModel):
    success: bool
    created_count: int
    errors: List[str] = Field(default_factory=list)
