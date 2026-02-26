from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_user
from app.services.media_service import MediaService
from app.schemas.images import ImageResponse, ImageUpdate, ImagesListResponse, BulkMediaResponse
from app.schemas.videos import VideoResponse, VideoUpdate, VideosListResponse
from app.schemas.media import UploadUrlRequest, UploadUrlResponse
from app.models.listing import Listing
from app.core.exceptions import BusinessLogicError
import uuid
import logging
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

# =====================================
# IMAGE ENDPOINTS
# =====================================

@router.get("/listings/{listing_id}/images", 
           response_model=ImagesListResponse,
           summary="Obtener imágenes de propiedad")
async def get_listing_images(
    listing_id: str,
    db: Session = Depends(get_db)
):
    """Obtiene todas las imágenes de una propiedad específica"""
    try:
        media_service = MediaService(db)
        images = media_service.get_listing_images(listing_id)
        
        return ImagesListResponse(
            images=images,
            total=len(images)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving images: {str(e)}")


@router.post("/listings/{listing_id}/images",
            response_model=BulkMediaResponse,
            status_code=status.HTTP_201_CREATED,
            summary="Subir imágenes")
async def upload_images(
    listing_id: str,
    images: List[UploadFile] = File(...),
    descriptions: Optional[List[str]] = Form(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Sube una o más imágenes para una propiedad usando LocalMediaService"""
    try:
        # Verificar que el listing existe y pertenece al usuario
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Verificar propiedad del listing
        if str(listing.owner_user_id) != str(current_user.get("user_id", current_user.get("id"))):
            raise HTTPException(status_code=403, detail="Not authorized to modify this listing")
        
        media_service = MediaService(db)
        created_count = 0
        errors = []
        
        for i, image_file in enumerate(images):
            try:
                # Validar tipo de archivo
                if not image_file.content_type.startswith('image/'):
                    errors.append(f"File {image_file.filename}: Invalid file type")
                    continue
                
                # Leer datos del archivo
                file_data = await image_file.read()
                
                # Obtener descripción correspondiente
                description = descriptions[i] if descriptions and i < len(descriptions) else None
                
                # Crear imagen usando el nuevo sistema LocalMediaService
                image = media_service.create_image(
                    listing_id=listing_id,
                    listing_created_at=listing.created_at,
                    file_data=file_data,
                    filename=image_file.filename,
                    alt_text=description
                )
                
                created_count += 1
                logger.info(f"Image uploaded successfully: {image.id}")
                
            except BusinessLogicError as e:
                errors.append(f"File {image_file.filename}: {str(e)}")
            except Exception as e:
                errors.append(f"File {image_file.filename}: Unexpected error - {str(e)}")
                logger.error(f"Unexpected error uploading {image_file.filename}: {e}")
        
        return BulkMediaResponse(
            success=created_count > 0,
            created_count=created_count,
            errors=errors
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading images for listing {listing_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error uploading images: {str(e)}")


@router.put("/listings/{listing_id}/images/{image_id}",
           response_model=ImageResponse,
           summary="Actualizar imagen")
async def update_image(
    listing_id: str,
    image_id: str,
    image_update: ImageUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualiza los metadatos de una imagen específica"""
    try:
        # Verificar propiedad del listing
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if str(listing.owner_user_id) != str(current_user.get("user_id", current_user.get("id"))):
            raise HTTPException(status_code=403, detail="Not authorized to modify this listing")
        
        media_service = MediaService(db)
        image = media_service.update_image(listing_id, image_id, image_update)
        
        if not image:
            raise HTTPException(status_code=404, detail="Image not found")
        
        return image
        
    except HTTPException:
        raise
    except BusinessLogicError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating image: {str(e)}")


@router.delete("/listings/{listing_id}/images/{image_id}",
              summary="Eliminar imagen")
async def delete_image(
    listing_id: str,
    image_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Elimina una imagen específica"""
    try:
        # Verificar propiedad del listing
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if str(listing.owner_user_id) != str(current_user.get("user_id", current_user.get("id"))):
            raise HTTPException(status_code=403, detail="Not authorized to modify this listing")
        
        media_service = MediaService(db)
        deleted = media_service.delete_image(listing_id, image_id)
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Image not found")
        
        return {"message": "Image deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting image: {str(e)}")


# =====================================
# VIDEO ENDPOINTS
# =====================================

@router.get("/listings/{listing_id}/videos",
           response_model=VideosListResponse,
           summary="Obtener videos de propiedad")
async def get_listing_videos(
    listing_id: str,
    db: Session = Depends(get_db)
):
    """Obtiene todos los videos de una propiedad específica"""
    try:
        media_service = MediaService(db)
        videos = media_service.get_listing_videos(listing_id)
        
        return VideosListResponse(
            videos=videos,
            total=len(videos)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving videos: {str(e)}")


@router.post("/listings/{listing_id}/videos",
            response_model=VideoResponse,
            status_code=status.HTTP_201_CREATED,
            summary="Subir video")
async def upload_video(
    listing_id: str,
    video: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Sube un video para una propiedad"""
    try:
        # Verificar que el listing existe y pertenece al usuario
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if str(listing.owner_user_id) != str(current_user.get("user_id", current_user.get("id"))):
            raise HTTPException(status_code=403, detail="Not authorized to modify this listing")
        
        # Validar tipo de archivo
        if not video.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="Invalid file type. Only videos allowed.")
        
        # Validar tamaño (máximo 100MB)
        max_size = 100 * 1024 * 1024  # 100MB
        content = await video.read()
        if len(content) > max_size:
            raise HTTPException(status_code=400, detail="File too large (max 100MB)")
        
        media_service = MediaService(db)
        
        # Preparar datos del video
        video_data = {
            'filename': video.filename,
            'original_url': f"/temp/{video.filename}",  # Temporal, se actualizará después de procesamiento
            'alt_text': title or description,
            'display_order': 0,
            'is_main': True,  # Primer video como principal
            'file_size': len(content),
            'duration_seconds': None,  # Se determinará durante el procesamiento
            'width': None,
            'height': None
        }
        
        # Crear video en base de datos
        new_video = media_service.create_video(listing_id, listing.created_at, video_data)
        
        # TODO: Aquí iría el procesamiento real del video:
        # - Subir a S3 o almacenamiento local
        # - Generar thumbnail
        # - Extraer duración y dimensiones
        # - Actualizar URLs reales
        
        return new_video
        
    except HTTPException:
        raise
    except BusinessLogicError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading video: {str(e)}")


@router.put("/listings/{listing_id}/videos/{video_id}",
           response_model=VideoResponse,
           summary="Actualizar video")
async def update_video(
    listing_id: str,
    video_id: str,
    video_update: VideoUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualiza los metadatos de un video específico"""
    try:
        # Verificar propiedad del listing
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if str(listing.owner_user_id) != str(current_user.get("user_id", current_user.get("id"))):
            raise HTTPException(status_code=403, detail="Not authorized to modify this listing")
        
        media_service = MediaService(db)
        video = media_service.update_video(listing_id, video_id, video_update)
        
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        return video
        
    except HTTPException:
        raise
    except BusinessLogicError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating video: {str(e)}")


@router.delete("/listings/{listing_id}/videos/{video_id}",
              summary="Eliminar video")
async def delete_video(
    listing_id: str,
    video_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Elimina un video específico"""
    try:
        # Verificar propiedad del listing
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if str(listing.owner_user_id) != str(current_user.get("user_id", current_user.get("id"))):
            raise HTTPException(status_code=403, detail="Not authorized to modify this listing")
        
        media_service = MediaService(db)
        deleted = media_service.delete_video(listing_id, video_id)
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Video not found")
        
        return {"message": "Video deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting video: {str(e)}")


# =====================================
# UPLOAD URL ENDPOINT
# =====================================

@router.post("/upload-url",
            response_model=UploadUrlResponse,
            summary="Obtener URL de subida directa")
async def get_upload_url(
    request: UploadUrlRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Genera una URL de subida presignada para subida directa a S3 u otro storage"""
    try:
        media_service = MediaService(db)
        upload_response = media_service.generate_upload_url(request)
        
        return upload_response
        
    except BusinessLogicError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating upload URL: {str(e)}")


# =====================================
# UTILIDADES Y ESTADÍSTICAS
# =====================================

@router.get("/stats",
           summary="Obtener estadísticas del sistema de media")
async def get_media_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtiene estadísticas del sistema de media y cache"""
    try:
        media_service = MediaService(db)
        stats = media_service.get_media_statistics()
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "system_stats": stats
        }
        
    except Exception as e:
        logger.error(f"Error getting media stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")


@router.post("/cache/invalidate/{listing_id}",
            summary="Invalidar cache de listing")
async def invalidate_listing_cache(
    listing_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Invalida el cache de media de un listing específico"""
    try:
        # Verificar que el listing existe y pertenece al usuario
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if str(listing.owner_user_id) != str(current_user.get("user_id", current_user.get("id"))):
            raise HTTPException(status_code=403, detail="Not authorized")
        
        media_service = MediaService(db)
        cache_invalidated = media_service.cache_service.invalidate_listing_cache(listing_id)
        
        return {
            "success": cache_invalidated,
            "message": f"Cache invalidated for listing {listing_id}" if cache_invalidated else "Cache not available"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error invalidating cache for listing {listing_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error invalidating cache: {str(e)}")


@router.get("/resize/{file_path:path}",
           summary="Redimensionar imagen on-demand")
async def resize_image(
    file_path: str,
    width: Optional[int] = None,
    height: Optional[int] = None,
    quality: Optional[int] = 85
):
    """
    Redimensiona una imagen on-demand para el proxy de Nginx.
    Este endpoint es llamado internamente por Nginx cuando no encuentra un thumbnail.
    """
    try:
        # TODO: Implementar redimensionado dinámico
        # Por ahora retornamos un placeholder
        
        logger.info(f"Resize request for: {file_path}, size: {width}x{height}, quality: {quality}")
        
        # En implementación real:
        # 1. Verificar que el archivo original existe
        # 2. Generar thumbnail del tamaño solicitado
        # 3. Guardarlo en el sistema de archivos
        # 4. Retornar el archivo redimensionado
        
        return {
            "message": "Image resize endpoint - Not implemented yet",
            "file_path": file_path,
            "requested_size": f"{width}x{height}" if width and height else "original",
            "quality": quality
        }
        
    except Exception as e:
        logger.error(f"Error resizing image {file_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Error resizing image: {str(e)}")


# =====================================
# HEALTH CHECK PARA MEDIA
# =====================================

@router.get("/health",
           summary="Health check del sistema de media")
async def media_health_check(db: Session = Depends(get_db)):
    """Verifica el estado del sistema de media"""
    try:
        media_service = MediaService(db)
        
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "database": "up",
                "cache": "up" if media_service.cache_service.is_available() else "down",
                "storage": "local"
            }
        }
        
        # Verificar base de datos
        try:
            db.execute(text("SELECT 1"))
            health_status["services"]["database"] = "up"
        except:
            health_status["services"]["database"] = "down"
            health_status["status"] = "degraded"
        
        # Verificar cache Redis
        if not media_service.cache_service.is_available():
            health_status["status"] = "degraded"
            health_status["services"]["cache"] = "down"
        
        return health_status
        
    except Exception as e:
        logger.error(f"Error in media health check: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }
