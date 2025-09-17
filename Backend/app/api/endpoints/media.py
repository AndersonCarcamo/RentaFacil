from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_user
from app.services.media_service import MediaService
from app.schemas.media import (
    ImageResponse, VideoResponse, ImagesListResponse, VideosListResponse,
    ImageUpdate, VideoUpdate, UploadUrlRequest, UploadUrlResponse,
    BulkMediaResponse
)
from app.models.listing import Listing
from app.core.exceptions import BusinessLogicError
import uuid
from datetime import datetime

router = APIRouter()

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
    """Sube una o más imágenes para una propiedad"""
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
                
                # Validar tamaño (máximo 10MB)
                max_size = 10 * 1024 * 1024  # 10MB
                content = await image_file.read()
                if len(content) > max_size:
                    errors.append(f"File {image_file.filename}: File too large (max 10MB)")
                    continue
                
                # Preparar datos de la imagen
                description = descriptions[i] if descriptions and i < len(descriptions) else None
                
                image_data = {
                    'filename': image_file.filename,
                    'original_url': f"/temp/{image_file.filename}",  # Temporal, se actualizará después de procesamiento
                    'alt_text': description,
                    'display_order': i,
                    'is_main': i == 0 and created_count == 0,  # Primera imagen como principal si no hay otras
                    'file_size': len(content),
                    'width': None,  # Se determinará durante el procesamiento
                    'height': None
                }
                
                # Crear imagen en base de datos
                image = media_service.create_image(listing_id, listing.created_at, image_data)
                created_count += 1
                
                # TODO: Aquí iría el procesamiento real de la imagen:
                # - Subir a S3 o almacenamiento local
                # - Generar thumbnails
                # - Extraer dimensiones
                # - Actualizar URLs reales
                
            except BusinessLogicError as e:
                errors.append(f"File {image_file.filename}: {str(e)}")
            except Exception as e:
                errors.append(f"File {image_file.filename}: Unexpected error - {str(e)}")
        
        return BulkMediaResponse(
            success=created_count > 0,
            created_count=created_count,
            errors=errors
        )
        
    except HTTPException:
        raise
    except Exception as e:
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

@router.post("/media/upload-url",
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
# DIRECT UPLOAD ENDPOINT (para almacenamiento local)
# =====================================

@router.post("/media/upload/{upload_id}",
            summary="Subida directa de archivo")
async def direct_upload(
    upload_id: str,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """Endpoint para subida directa cuando se usa almacenamiento local"""
    try:
        # TODO: Implementar subida directa a almacenamiento local
        # Por ahora retornamos un placeholder
        
        return {
            "message": "File uploaded successfully",
            "upload_id": upload_id,
            "filename": file.filename,
            "size": file.size
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")
