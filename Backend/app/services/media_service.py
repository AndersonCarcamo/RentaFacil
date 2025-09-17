from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta, timezone
from app.models.media import Image, Video
from app.models.listing import Listing
from app.schemas.media import (
    ImageCreate, ImageUpdate, VideoCreate, VideoUpdate,
    UploadUrlRequest, UploadUrlResponse
)
from app.core.exceptions import BusinessLogicError
import uuid
import os
import logging

# Hacer boto3 opcional
try:
    import boto3
    from botocore.exceptions import ClientError
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False
    boto3 = None
    ClientError = Exception

logger = logging.getLogger(__name__)

class MediaService:
    def __init__(self, db: Session):
        self.db = db
        
        # Configuración de S3/storage
        self.use_s3 = os.getenv("USE_S3", "false").lower() == "true"
        self.s3_bucket = os.getenv("S3_BUCKET_NAME", "your-bucket-name")
        self.s3_region = os.getenv("AWS_REGION", "us-east-1")
        self.cdn_base_url = os.getenv("CDN_BASE_URL", "")
        self.local_upload_path = os.getenv("UPLOAD_PATH", "./uploads")
        
        # Solo inicializar S3 client si boto3 está disponible y S3 está habilitado
        if self.use_s3 and HAS_BOTO3:
            self.s3_client = boto3.client('s3', region_name=self.s3_region)
        elif self.use_s3 and not HAS_BOTO3:
            logger.warning("S3 is enabled but boto3 is not installed. Falling back to local storage.")
            self.use_s3 = False
    
    # =====================================
    # IMAGE MANAGEMENT
    # =====================================
    
    def get_listing_images(self, listing_id: str) -> List[Image]:
        """Obtener todas las imágenes de un listing"""
        return (self.db.query(Image)
                .filter(Image.listing_id == listing_id)
                .order_by(Image.display_order, Image.created_at)
                .all())
    
    def get_image_by_id(self, listing_id: str, image_id: str) -> Optional[Image]:
        """Obtener una imagen específica"""
        return (self.db.query(Image)
                .filter(and_(Image.listing_id == listing_id, Image.id == image_id))
                .first())
    
    def create_image(self, listing_id: str, listing_created_at: datetime, image_data: dict) -> Image:
        """Crear una nueva imagen"""
        # Verificar que el listing existe
        listing = self.db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise BusinessLogicError("Listing not found")
        
        # Verificar límites del plan del usuario
        self._check_image_limits(listing_id)
        
        # Si es la imagen principal, quitar el flag de otras imágenes
        if image_data.get('is_main', False):
            self._unset_main_image(listing_id)
        
        # Crear la imagen
        image = Image(
            listing_id=listing_id,
            listing_created_at=listing_created_at,
            **image_data
        )
        
        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)
        
        # Actualizar el flag has_media del listing
        self._update_listing_has_media(listing_id)
        
        return image
    
    def update_image(self, listing_id: str, image_id: str, image_update: ImageUpdate) -> Optional[Image]:
        """Actualizar una imagen"""
        image = self.get_image_by_id(listing_id, image_id)
        if not image:
            return None
        
        update_data = image_update.dict(exclude_unset=True)
        
        # Si se está marcando como principal, quitar el flag de otras
        if update_data.get('is_main', False):
            self._unset_main_image(listing_id)
        
        for field, value in update_data.items():
            setattr(image, field, value)
        
        self.db.commit()
        self.db.refresh(image)
        return image
    
    def delete_image(self, listing_id: str, image_id: str) -> bool:
        """Eliminar una imagen"""
        image = self.get_image_by_id(listing_id, image_id)
        if not image:
            return False
        
        # Eliminar archivo físico si es necesario
        self._delete_physical_file(image.original_url)
        if image.thumbnail_url:
            self._delete_physical_file(image.thumbnail_url)
        if image.medium_url:
            self._delete_physical_file(image.medium_url)
        
        self.db.delete(image)
        self.db.commit()
        
        # Actualizar el flag has_media del listing
        self._update_listing_has_media(listing_id)
        
        return True
    
    # =====================================
    # VIDEO MANAGEMENT
    # =====================================
    
    def get_listing_videos(self, listing_id: str) -> List[Video]:
        """Obtener todos los videos de un listing"""
        return (self.db.query(Video)
                .filter(Video.listing_id == listing_id)
                .order_by(Video.display_order, Video.created_at)
                .all())
    
    def get_video_by_id(self, listing_id: str, video_id: str) -> Optional[Video]:
        """Obtener un video específico"""
        return (self.db.query(Video)
                .filter(and_(Video.listing_id == listing_id, Video.id == video_id))
                .first())
    
    def create_video(self, listing_id: str, listing_created_at: datetime, video_data: dict) -> Video:
        """Crear un nuevo video"""
        # Verificar que el listing existe
        listing = self.db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise BusinessLogicError("Listing not found")
        
        # Verificar límites del plan del usuario
        self._check_video_limits(listing_id)
        
        # Si es el video principal, quitar el flag de otros videos
        if video_data.get('is_main', False):
            self._unset_main_video(listing_id)
        
        # Crear el video
        video = Video(
            listing_id=listing_id,
            listing_created_at=listing_created_at,
            **video_data
        )
        
        self.db.add(video)
        self.db.commit()
        self.db.refresh(video)
        
        # Actualizar el flag has_media del listing
        self._update_listing_has_media(listing_id)
        
        return video
    
    def update_video(self, listing_id: str, video_id: str, video_update: VideoUpdate) -> Optional[Video]:
        """Actualizar un video"""
        video = self.get_video_by_id(listing_id, video_id)
        if not video:
            return None
        
        update_data = video_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(video, field, value)
        
        self.db.commit()
        self.db.refresh(video)
        return video
    
    def delete_video(self, listing_id: str, video_id: str) -> bool:
        """Eliminar un video"""
        video = self.get_video_by_id(listing_id, video_id)
        if not video:
            return False
        
        # Eliminar archivo físico si es necesario
        self._delete_physical_file(video.original_url)
        if video.thumbnail_url:
            self._delete_physical_file(video.thumbnail_url)
        
        self.db.delete(video)
        self.db.commit()
        
        # Actualizar el flag has_media del listing
        self._update_listing_has_media(listing_id)
        
        return True
    
    # =====================================
    # UPLOAD URL GENERATION
    # =====================================
    
    def generate_upload_url(self, request: UploadUrlRequest) -> UploadUrlResponse:
        """Generar URL de subida presignada"""
        upload_id = str(uuid.uuid4())
        
        # Generar nombre de archivo único
        file_extension = self._get_file_extension(request.filename)
        unique_filename = f"{upload_id}{file_extension}"
        
        if self.use_s3:
            return self._generate_s3_upload_url(unique_filename, request, upload_id)
        else:
            return self._generate_local_upload_url(unique_filename, request, upload_id)
    
    def _generate_s3_upload_url(self, filename: str, request: UploadUrlRequest, upload_id: str) -> UploadUrlResponse:
        """Generar URL de subida para S3"""
        if not HAS_BOTO3:
            raise BusinessLogicError("S3 upload requested but boto3 is not available")
        
        key = f"media/{filename}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        
        try:
            upload_url = self.s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': self.s3_bucket,
                    'Key': key,
                    'ContentType': request.content_type
                },
                ExpiresIn=900  # 15 minutos
            )
            
            file_url = f"https://{self.s3_bucket}.s3.{self.s3_region}.amazonaws.com/{key}"
            if self.cdn_base_url:
                file_url = f"{self.cdn_base_url}/{key}"
            
            return UploadUrlResponse(
                upload_url=upload_url,
                file_url=file_url,
                expires_at=expires_at,
                upload_id=upload_id
            )
            
        except ClientError as e:
            logger.error(f"Error generating S3 upload URL: {e}")
            raise BusinessLogicError("Could not generate upload URL")
    
    def _generate_local_upload_url(self, filename: str, request: UploadUrlRequest, upload_id: str) -> UploadUrlResponse:
        """Generar URL de subida para almacenamiento local"""
        # Para almacenamiento local, devolvemos una URL que el frontend puede usar
        # para subir directamente a nuestro endpoint
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        
        return UploadUrlResponse(
            upload_url=f"{base_url}/api/v1/media/upload/{upload_id}",
            file_url=f"{base_url}/uploads/{filename}",
            expires_at=expires_at,
            upload_id=upload_id
        )
    
    # =====================================
    # HELPER METHODS
    # =====================================
    
    def _check_image_limits(self, listing_id: str):
        """Verificar límites de imágenes según el plan"""
        current_count = self.db.query(Image).filter(Image.listing_id == listing_id).count()
        
        # TODO: Implementar verificación de límites según el plan del usuario
        # Por ahora, límite básico de 25 imágenes desde configuración
        from app.core.config import settings
        max_images = getattr(settings, 'default_max_images_per_listing', 25)
        
        if current_count >= max_images:
            raise BusinessLogicError(f"Maximum image limit ({max_images}) reached for this listing")
    
    def _check_video_limits(self, listing_id: str):
        """Verificar límites de videos según el plan"""
        current_count = self.db.query(Video).filter(Video.listing_id == listing_id).count()
        
        # TODO: Implementar verificación de límites según el plan del usuario
        # Por ahora, límite básico de 5 videos desde configuración
        from app.core.config import settings
        max_videos = getattr(settings, 'default_max_videos_per_listing', 5)
        
        if current_count >= max_videos:
            raise BusinessLogicError(f"Maximum video limit ({max_videos}) reached for this listing")
    
    def _unset_main_image(self, listing_id: str):
        """Quitar el flag de imagen principal de otras imágenes"""
        self.db.query(Image).filter(
            and_(Image.listing_id == listing_id, Image.is_main == True)
        ).update({Image.is_main: False})
    
    def _unset_main_video(self, listing_id: str):
        """Quitar el flag de video principal de otros videos"""
        self.db.query(Video).filter(
            and_(Video.listing_id == listing_id, Video.is_main == True)
        ).update({Video.is_main: False})
    
    def _update_listing_has_media(self, listing_id: str):
        """Actualizar el flag has_media del listing"""
        has_images = self.db.query(Image).filter(Image.listing_id == listing_id).count() > 0
        has_videos = self.db.query(Video).filter(Video.listing_id == listing_id).count() > 0
        has_media = has_images or has_videos
        
        self.db.query(Listing).filter(Listing.id == listing_id).update({
            Listing.has_media: has_media
        })
        self.db.commit()
    
    def _delete_physical_file(self, file_url: str):
        """Eliminar archivo físico del almacenamiento"""
        if not file_url:
            return
        
        try:
            if self.use_s3 and HAS_BOTO3:
                # Extraer la key de la URL de S3
                if self.s3_bucket in file_url:
                    key = file_url.split(f"{self.s3_bucket}.s3.{self.s3_region}.amazonaws.com/")[-1]
                    self.s3_client.delete_object(Bucket=self.s3_bucket, Key=key)
            else:
                # Para almacenamiento local, eliminar el archivo
                if file_url.startswith('/uploads/'):
                    file_path = os.path.join(self.local_upload_path, file_url.replace('/uploads/', ''))
                    if os.path.exists(file_path):
                        os.remove(file_path)
        except Exception as e:
            logger.error(f"Error deleting file {file_url}: {e}")
    
    def _get_file_extension(self, filename: str) -> str:
        """Obtener extensión de archivo"""
        return os.path.splitext(filename)[1].lower()
