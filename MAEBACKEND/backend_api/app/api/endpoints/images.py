from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.images import ImageResponse, ImageUpdate, ImageUploadResponse
from app.services.image_service import ImageService
from app.api.deps import get_current_user
from typing import List

router = APIRouter()

@router.post("/{listing_id}/upload", response_model=ImageUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(
    listing_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Subir una imagen para un listing.
    Formatos permitidos: JPG, JPEG, PNG, WEBP, GIF
    """
    try:
        service = ImageService(db)
        image = service.upload_image(listing_id, file)
        
        return ImageUploadResponse(
            id=str(image.id),
            url=image.original_url,
            thumbnail_url=image.thumbnail_url,
            message="Image uploaded successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")

@router.get("/{listing_id}", response_model=List[ImageResponse])
async def get_listing_images(
    listing_id: str,
    db: Session = Depends(get_db)
):
    """Obtener todas las imágenes de un listing"""
    service = ImageService(db)
    images = service.get_listing_images(listing_id)
    return [ImageResponse.from_orm(img) for img in images]

@router.put("/{image_id}", response_model=ImageResponse)
async def update_image(
    image_id: str,
    data: ImageUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualizar metadatos de una imagen (orden, alt_text, is_main)"""
    service = ImageService(db)
    image = service.update_image(image_id, data)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return ImageResponse.from_orm(image)

@router.delete("/{image_id}", status_code=status.HTTP_200_OK)
async def delete_image(
    image_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Eliminar una imagen"""
    service = ImageService(db)
    success = service.delete_image(image_id)
    if not success:
        raise HTTPException(status_code=404, detail="Image not found")
    return {"message": "Image deleted successfully"}

@router.post("/{image_id}/set-main", response_model=ImageResponse)
async def set_main_image(
    image_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Marcar una imagen como principal"""
    service = ImageService(db)
    image = service.set_main_image(image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return ImageResponse.from_orm(image)

@router.post("/{listing_id}/reorder", response_model=List[ImageResponse])
async def reorder_images(
    listing_id: str,
    image_ids: List[str],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Reordenar imágenes de un listing"""
    service = ImageService(db)
    images = service.reorder_images(listing_id, image_ids)
    return [ImageResponse.from_orm(img) for img in images]
