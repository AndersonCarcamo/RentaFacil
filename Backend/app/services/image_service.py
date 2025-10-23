from sqlalchemy.orm import Session
from app.models.media import Image
from app.models.listing import Listing
from app.schemas.images import ImageCreate, ImageUpdate
from typing import List, Optional
import uuid
from datetime import datetime
from fastapi import UploadFile, HTTPException
import os
import shutil
from pathlib import Path

class ImageService:
    def __init__(self, db: Session):
        self.db = db
        # Directorio para guardar imágenes
        self.upload_dir = Path("uploads/listings")
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def create_image(self, data: ImageCreate) -> Image:
        """Crear un registro de imagen en la base de datos"""
        image = Image(
            listing_id=uuid.UUID(data.listing_id),
            listing_created_at=data.listing_created_at,
            filename=data.filename,
            original_url=data.original_url,
            thumbnail_url=data.thumbnail_url,
            medium_url=data.medium_url,
            display_order=data.display_order,
            alt_text=data.alt_text,
            width=data.width,
            height=data.height,
            file_size=data.file_size,
            is_main=data.is_main,
        )
        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)
        
        # Actualizar has_media en listing
        self._update_listing_has_media(data.listing_id)
        
        return image

    def upload_image(self, listing_id: str, file: UploadFile) -> Image:
        """Subir una imagen física y crear el registro"""
        # Verificar que el listing existe
        listing = self.db.query(Listing).filter(Listing.id == uuid.UUID(listing_id)).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Validar tipo de archivo
        allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Generar nombre único
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = self.upload_dir / listing_id / unique_filename
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Guardar archivo
        try:
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
        
        # Crear registro en BD
        file_size = file_path.stat().st_size
        
        # Obtener el orden más alto actual
        max_order = self.db.query(Image).filter(
            Image.listing_id == uuid.UUID(listing_id)
        ).count()
        
        image_data = ImageCreate(
            listing_id=listing_id,
            listing_created_at=listing.created_at,
            filename=unique_filename,
            original_url=f"/uploads/listings/{listing_id}/{unique_filename}",
            display_order=max_order,
            file_size=file_size,
            is_main=(max_order == 0),  # Primera imagen es la principal
        )
        
        return self.create_image(image_data)

    def get_listing_images(self, listing_id: str) -> List[Image]:
        """Obtener todas las imágenes de un listing"""
        return self.db.query(Image).filter(
            Image.listing_id == uuid.UUID(listing_id)
        ).order_by(Image.display_order).all()

    def get_image(self, image_id: str) -> Optional[Image]:
        """Obtener una imagen por ID"""
        return self.db.query(Image).filter(Image.id == uuid.UUID(image_id)).first()

    def update_image(self, image_id: str, data: ImageUpdate) -> Optional[Image]:
        """Actualizar metadatos de una imagen"""
        image = self.get_image(image_id)
        if not image:
            return None
        
        if data.display_order is not None:
            image.display_order = data.display_order
        if data.alt_text is not None:
            image.alt_text = data.alt_text
        if data.is_main is not None:
            # Si se marca como principal, desmarcar las demás
            if data.is_main:
                self.db.query(Image).filter(
                    Image.listing_id == image.listing_id,
                    Image.id != image.id
                ).update({"is_main": False})
            image.is_main = data.is_main
        
        self.db.commit()
        self.db.refresh(image)
        return image

    def delete_image(self, image_id: str) -> bool:
        """Eliminar una imagen"""
        image = self.get_image(image_id)
        if not image:
            return False
        
        listing_id = str(image.listing_id)
        
        # Eliminar archivo físico
        file_path = Path(image.original_url.lstrip('/'))
        if file_path.exists():
            file_path.unlink()
        
        # Eliminar registro
        self.db.delete(image)
        self.db.commit()
        
        # Actualizar has_media en listing
        self._update_listing_has_media(listing_id)
        
        return True

    def set_main_image(self, image_id: str) -> Optional[Image]:
        """Marcar una imagen como principal"""
        image = self.get_image(image_id)
        if not image:
            return None
        
        # Desmarcar todas las demás
        self.db.query(Image).filter(
            Image.listing_id == image.listing_id,
            Image.id != image.id
        ).update({"is_main": False})
        
        # Marcar esta como principal
        image.is_main = True
        self.db.commit()
        self.db.refresh(image)
        return image

    def reorder_images(self, listing_id: str, image_ids: List[str]) -> List[Image]:
        """Reordenar imágenes de un listing"""
        for index, image_id in enumerate(image_ids):
            self.db.query(Image).filter(
                Image.id == uuid.UUID(image_id)
            ).update({"display_order": index})
        
        self.db.commit()
        return self.get_listing_images(listing_id)

    def _update_listing_has_media(self, listing_id: str):
        """Actualizar el flag has_media del listing"""
        has_images = self.db.query(Image).filter(
            Image.listing_id == uuid.UUID(listing_id)
        ).count() > 0
        
        self.db.query(Listing).filter(
            Listing.id == uuid.UUID(listing_id)
        ).update({"has_media": has_images})
        self.db.commit()
