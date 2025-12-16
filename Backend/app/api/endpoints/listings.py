from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.schemas.listings import (
    CreateListingRequest, UpdateListingRequest, ListingResponse, ChangeListingStatusRequest
)
from app.schemas.images import ImageResponse, ImageUpdate
from app.schemas.videos import VideoResponse
from app.services.listing_service import ListingService
from app.api.deps import get_current_user
from app.models.listing import Listing
from app.models.media import Image, Video
from app.core.exceptions import http_400_bad_request, http_403_forbidden, http_404_not_found, http_500_internal_error
from typing import List, Optional, Dict, Any
from uuid import UUID
from pathlib import Path
from PIL import Image as PILImage
from datetime import datetime, timezone
import io
import os
import logging

logger = logging.getLogger(__name__)

# Configuración de media
MEDIA_DIR = Path(__file__).parent.parent.parent.parent / "media"
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/avi', 'video/quicktime', 'video/webm']

router = APIRouter()

@router.get("/", response_model=List[ListingResponse], summary="Listar propiedades")
async def list_listings(
    operation_type: Optional[str] = None,
    property_type: Optional[str] = None,
    city: Optional[str] = None,
    district: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    bedrooms: Optional[int] = None,
    bathrooms: Optional[int] = None,
    min_area: Optional[float] = None,
    max_area: Optional[float] = None,
    min_age_years: Optional[int] = None,
    max_age_years: Optional[int] = None,
    verified: Optional[bool] = None,
    furnished: Optional[bool] = None,
    rental_mode: Optional[str] = None,
    sort: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    try:
        offset = (page - 1) * limit
        service = ListingService(db)
        listings = service.list_listings(
            operation=operation_type,
            property_type=property_type,
            department=city,  # Mapeando city a department para coincidir con el DB
            min_price=min_price,
            max_price=max_price,
            limit=limit,
            offset=offset
        )
        
        # Obtener IDs de todos los listings
        listing_ids = [l.id for l in listings]
        
        # Cargar todas las imágenes de una vez (más eficiente que N+1 queries)
        images_by_listing = {}
        if listing_ids:
            all_images = db.query(Image).filter(
                Image.listing_id.in_(listing_ids)
            ).order_by(Image.listing_id, Image.display_order, Image.created_at).all()
            
            # Agrupar imágenes por listing_id
            for img in all_images:
                if img.listing_id not in images_by_listing:
                    images_by_listing[img.listing_id] = []
                images_by_listing[img.listing_id].append({
                    "id": str(img.id),
                    "url": img.original_url,
                    "thumbnail_url": img.thumbnail_url,
                    "medium_url": img.medium_url,
                    "filename": img.filename,
                    "alt_text": img.alt_text,
                    "display_order": img.display_order,
                    "is_main": img.is_main,
                    "width": img.width,
                    "height": img.height,
                    "file_size": img.file_size
                })
        
        # Convertir listings a dicts e incluir imágenes
        result = []
        for listing in listings:
            # 🔍 DEBUG: Ver si max_guests está en el objeto
            print(f"🔍 DEBUG list_listings - listing.id: {listing.id}, max_guests: {getattr(listing, 'max_guests', 'NO ATTRIBUTE')}")
            
            listing_dict = ListingResponse.from_orm(listing).dict()
            listing_dict['images'] = images_by_listing.get(listing.id, [])
            result.append(listing_dict)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing properties: {str(e)}")

@router.post("/", response_model=ListingResponse, status_code=status.HTTP_201_CREATED, summary="Crear nueva propiedad")
async def create_listing(request: CreateListingRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        service = ListingService(db)
        listing = service.create_listing(request, owner_user_id=str(current_user.id))
        return ListingResponse.from_orm(listing)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating listing: {str(e)}")

@router.get("/my", response_model=List[ListingResponse], summary="Mis propiedades")
async def list_my_listings(db: Session = Depends(get_db), current_user=Depends(get_current_user), status: Optional[str] = None):
    try:
        service = ListingService(db)
        user_id = str(current_user.id) if hasattr(current_user.id, '__str__') else current_user.id
        listings = service.get_user_listings(user_id)
        
        # Filter by status if provided
        if status:
            listings = [l for l in listings if l.status == status]
        
        # Obtener IDs de todos los listings
        listing_ids = [l.id for l in listings]
        
        # Cargar todas las imágenes de una vez
        images_by_listing = {}
        if listing_ids:
            all_images = db.query(Image).filter(
                Image.listing_id.in_(listing_ids)
            ).order_by(Image.listing_id, Image.display_order, Image.created_at).all()
            
            # Agrupar imágenes por listing_id
            for img in all_images:
                if img.listing_id not in images_by_listing:
                    images_by_listing[img.listing_id] = []
                images_by_listing[img.listing_id].append({
                    "id": str(img.id),
                    "url": img.original_url,
                    "thumbnail_url": img.thumbnail_url,
                    "medium_url": img.medium_url,
                    "filename": img.filename,
                    "alt_text": img.alt_text,
                    "display_order": img.display_order,
                    "is_main": img.is_main,
                    "width": img.width,
                    "height": img.height,
                    "file_size": img.file_size
                })
        
        # Convertir listings a dicts e incluir imágenes
        result = []
        for listing in listings:
            listing_dict = ListingResponse.from_orm(listing).dict()
            listing_dict['images'] = images_by_listing.get(listing.id, [])
            result.append(listing_dict)
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving user listings: {str(e)}")

# ========================================
# AMENITIES ENDPOINTS (BEFORE /{listing_id} to avoid routing conflicts)
# ========================================

@router.get("/amenities", 
    response_model=List[Dict[str, Any]],
    summary="Obtener todas las amenidades"
)
async def get_all_amenities(db: Session = Depends(get_db)):
    """
    Obtiene todas las amenidades disponibles.
    No requiere autenticación.
    """
    try:
        result = db.execute(text("""
            SELECT id, name, icon 
            FROM core.amenities 
            ORDER BY name
        """))
        
        amenities = [
            {"id": row[0], "name": row[1], "icon": row[2]}
            for row in result.fetchall()
        ]
        
        return amenities
        
    except Exception as e:
        logger.error(f"Error obteniendo amenidades: {e}")
        raise HTTPException(status_code=500, detail=f"Error al obtener amenidades: {str(e)}")


@router.get("/{listing_id}/amenities",
    response_model=List[Dict[str, Any]],
    summary="Obtener amenidades de un listing"
)
async def get_listing_amenities(
    listing_id: str,
    db: Session = Depends(get_db)
):
    """
    Obtiene todas las amenidades de un listing específico.
    """
    try:
        listing_uuid = UUID(listing_id)
        
        result = db.execute(text("""
            SELECT a.id, a.name, a.icon
            FROM core.listing_amenities la
            JOIN core.amenities a ON la.amenity_id = a.id
            WHERE la.listing_id = :listing_id
            ORDER BY a.name
        """), {"listing_id": listing_uuid})
        
        amenities = [
            {"id": row[0], "name": row[1], "icon": row[2]}
            for row in result.fetchall()
        ]
        
        return amenities
        
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de listing inválido")
    except Exception as e:
        logger.error(f"Error obteniendo amenidades del listing: {e}")
        raise HTTPException(status_code=500, detail=f"Error al obtener amenidades: {str(e)}")


@router.put("/{listing_id}/amenities",
    status_code=status.HTTP_200_OK,
    summary="Actualizar amenidades de un listing"
)
async def update_listing_amenities(
    listing_id: str,
    amenity_ids: List[int] = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Actualiza las amenidades de un listing.
    Reemplaza todas las amenidades existentes con las nuevas.
    """
    try:
        listing_uuid = UUID(listing_id)
        
        # Verificar que el listing existe y pertenece al usuario
        listing = db.query(Listing).filter(Listing.id == listing_uuid).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing no encontrado")
        
        if listing.agency_id != current_user["agency_id"]:
            raise HTTPException(status_code=403, detail="No tienes permiso")
        
        # Eliminar amenidades existentes
        db.execute(text("""
            DELETE FROM core.listing_amenities
            WHERE listing_id = :listing_id
        """), {"listing_id": listing_uuid})
        
        # Insertar nuevas amenidades
        if amenity_ids:
            for amenity_id in amenity_ids:
                db.execute(text("""
                    INSERT INTO core.listing_amenities 
                    (listing_id, listing_created_at, amenity_id)
                    VALUES (:listing_id, :created_at, :amenity_id)
                """), {
                    "listing_id": listing_uuid,
                    "created_at": listing.created_at,
                    "amenity_id": amenity_id
                })
        
        db.commit()
        
        return {"message": "Amenidades actualizadas correctamente"}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de listing inválido")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error actualizando amenidades: {e}")
        raise HTTPException(status_code=500, detail=f"Error al actualizar amenidades: {str(e)}")


@router.get("/{listing_id}", response_model=ListingResponse, summary="Obtener propiedad por ID")
async def get_listing(listing_id: str, db: Session = Depends(get_db)):
    service = ListingService(db)
    listing = service.get_listing(listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # 🔍 DEBUG: Ver si max_guests está en el objeto
    print(f"🔍 DEBUG get_listing - max_guests: {getattr(listing, 'max_guests', 'NO ATTRIBUTE')}")
    
    # Obtener imágenes del listing
    images = db.query(Image).filter(
        Image.listing_id == listing.id
    ).order_by(Image.display_order, Image.created_at).all()
    
    # Convertir a dict para el response
    listing_dict = ListingResponse.from_orm(listing).dict()
    listing_dict['images'] = [{
        "id": str(img.id),
        "url": img.original_url,
        "thumbnail_url": img.thumbnail_url,
        "medium_url": img.medium_url,
        "filename": img.filename,
        "alt_text": img.alt_text,
        "display_order": img.display_order,
        "is_main": img.is_main,
        "width": img.width,
        "height": img.height,
        "file_size": img.file_size
    } for img in images]
    
    return listing_dict

@router.put("/{listing_id}", response_model=ListingResponse, summary="Actualizar propiedad")
async def update_listing(listing_id: str, request: UpdateListingRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    service = ListingService(db)
    listing = service.update_listing(listing_id, request)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return ListingResponse.from_orm(listing)

@router.delete("/{listing_id}", status_code=status.HTTP_200_OK, summary="Eliminar propiedad")
async def delete_listing(listing_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    service = ListingService(db)
    success = service.delete_listing(listing_id)
    if not success:
        raise HTTPException(status_code=404, detail="Listing not found")
    return {"message": "Listing deleted"}

@router.put("/{listing_id}/status", response_model=ListingResponse, summary="Cambiar estado de propiedad")
async def change_status(listing_id: str, request: ChangeListingStatusRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        service = ListingService(db)
        listing = service.change_status(listing_id, request.status)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        return ListingResponse.from_orm(listing)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error changing status: {str(e)}")

@router.post("/{listing_id}/publish", response_model=ListingResponse, summary="Publicar propiedad")
async def publish_listing(listing_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        service = ListingService(db)
        listing = service.publish_listing(listing_id)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        return ListingResponse.from_orm(listing)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error publishing listing: {str(e)}")

@router.post("/{listing_id}/unpublish", response_model=ListingResponse, summary="Despublicar propiedad")
async def unpublish_listing(listing_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        service = ListingService(db)
        listing = service.unpublish_listing(listing_id)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        return ListingResponse.from_orm(listing)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error unpublishing listing: {str(e)}")

@router.post("/{listing_id}/duplicate", response_model=ListingResponse, status_code=status.HTTP_201_CREATED, summary="Duplicar propiedad")
async def duplicate_listing(listing_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        service = ListingService(db)
        user_id = str(current_user.id) if hasattr(current_user.id, '__str__') else current_user.id
        listing = service.duplicate_listing(listing_id, user_id)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        return ListingResponse.from_orm(listing)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error duplicating listing: {str(e)}")

@router.post("/{listing_id}/validate-airbnb", summary="Validar elegibilidad Airbnb")
async def validate_airbnb_eligibility(
    listing_id: str, 
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user)
):
    """
    Valida si una propiedad puede ser utilizada como Airbnb.
    Retorna score de elegibilidad, requerimientos faltantes y sugerencias.
    """
    try:
        service = ListingService(db)
        validation_result = service.validate_airbnb_listing(listing_id)
        
        if validation_result is None:
            raise HTTPException(status_code=404, detail="Listing not found")
            
        return {
            "success": True,
            "listing_id": listing_id,
            "validation": validation_result,
            "message": "Validación de Airbnb completada"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating Airbnb eligibility: {str(e)}")

@router.put("/{listing_id}/optimize-for-airbnb", response_model=ListingResponse, summary="Optimizar para Airbnb")
async def optimize_for_airbnb(
    listing_id: str, 
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user)
):
    """
    Optimiza una propiedad existente para Airbnb después de validar elegibilidad.
    No cambia el tipo de operación, sino que mejora el score para estilo Airbnb.
    """
    try:
        service = ListingService(db)
        listing = service.get_listing(listing_id)
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
            
        # Validate current operation is rent or temp_rent
        if listing.operation not in ['rent', 'temp_rent']:
            raise HTTPException(
                status_code=400, 
                detail="Only rent and temp_rent properties can be optimized for Airbnb"
            )
            
        # Re-validate Airbnb eligibility
        validation_result = service.validate_airbnb_listing(listing_id)
        
        if not validation_result or not validation_result.get("can_be_airbnb", False):
            raise HTTPException(
                status_code=400, 
                detail={
                    "message": "Property is not eligible for Airbnb style",
                    "suggestions": validation_result.get("suggestions", []) if validation_result else [],
                    "missing_requirements": validation_result.get("missing_requirements", []) if validation_result else []
                }
            )
        
        # The listing is already optimized through the validation process
        # Return the updated listing
        service.db.refresh(listing)
        return ListingResponse.from_orm(listing)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error optimizing for Airbnb: {str(e)}")


@router.post("/{listing_id}/opt-out-airbnb", response_model=ListingResponse, summary="Desactivar Airbnb")
async def opt_out_airbnb(
    listing_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permite al propietario desactivar explícitamente la funcionalidad Airbnb para su propiedad.
    
    - **listing_id**: ID de la propiedad
    - **Autorización**: Solo el propietario puede desactivar Airbnb
    - **Resultado**: Marca airbnb_opted_out = True
    """
    try:
        service = ListingService(db)
        listing = service.get_listing(str(listing_id))
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
            
        # Verificar que el usuario es el propietario
        if str(listing.owner_user_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to modify this listing")
        
        # Usar el servicio para opt-out
        updated_listing = service.opt_out_airbnb(str(listing_id))
        
        if not updated_listing:
            raise HTTPException(status_code=400, detail="Failed to opt out of Airbnb")
        
        return ListingResponse.from_orm(updated_listing)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error opting out of Airbnb: {str(e)}")


@router.post("/{listing_id}/opt-in-airbnb", response_model=ListingResponse, summary="Reactivar Airbnb")
async def opt_in_airbnb(
    listing_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permite al propietario reactivar la funcionalidad Airbnb para su propiedad.
    
    - **listing_id**: ID de la propiedad
    - **Autorización**: Solo el propietario puede reactivar Airbnb
    - **Resultado**: Marca airbnb_opted_out = False y re-valida elegibilidad
    """
    try:
        service = ListingService(db)
        listing = service.get_listing(str(listing_id))
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
            
        # Verificar que el usuario es el propietario
        if str(listing.owner_user_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to modify this listing")
        
        # Usar el servicio para opt-in
        updated_listing = service.opt_in_airbnb(str(listing_id))
        
        if not updated_listing:
            raise HTTPException(status_code=400, detail="Failed to opt in to Airbnb")
        
        return ListingResponse.from_orm(updated_listing)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error opting in to Airbnb: {str(e)}")


# ============================================
# MEDIA ENDPOINTS (Images & Videos)
# ============================================

@router.post("/{listing_id}/images",
             response_model=ImageResponse,
             status_code=status.HTTP_201_CREATED,
             summary="Subir imagen a una publicación")
async def upload_listing_image(
    listing_id: str,
    file: UploadFile = File(..., description="Archivo de imagen"),
    alt_text: Optional[str] = Form(None, description="Texto alternativo"),
    is_main: bool = Form(False, description="¿Es la imagen principal?"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Subir imagen a una publicación.
    Archivos en: /media/listings/{listing_id}/images/
    """
    try:
        # Convertir listing_id a UUID
        try:
            listing_uuid = UUID(listing_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de listing inválido")
        
        # Verificar listing y permisos
        listing = db.query(Listing).filter(Listing.id == listing_uuid).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if str(listing.owner_user_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="No tienes permiso para subir imágenes a esta publicación")
        
        # Validar tipo de archivo
        if not file.content_type or file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail=f"Tipo de imagen inválido. Permitidos: {', '.join(ALLOWED_IMAGE_TYPES)}")
        
        # Leer archivo
        file_data = await file.read()
        
        # Validar tamaño
        if len(file_data) > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail=f"Archivo muy grande. Máximo: {MAX_IMAGE_SIZE // (1024*1024)}MB")
        
        # Crear directorio para imágenes
        listing_images_dir = MEDIA_DIR / "listings" / str(listing_uuid) / "images"
        listing_images_dir.mkdir(parents=True, exist_ok=True)
        
        # Contar imágenes existentes
        existing_count = db.query(Image).filter(Image.listing_id == listing_uuid).count()
        
        # Generar nombre único
        file_ext = os.path.splitext(file.filename)[1] or '.jpg'
        unique_filename = f"image_{existing_count + 1}{file_ext}"
        file_path = listing_images_dir / unique_filename
        
        # Extraer dimensiones
        width, height = None, None
        try:
            img = PILImage.open(io.BytesIO(file_data))
            width, height = img.size
        except Exception as e:
            logger.warning(f"No se pudieron extraer dimensiones: {e}")
        
        # Guardar archivo
        with open(file_path, "wb") as f:
            f.write(file_data)
        
        # URL relativa
        image_url = f"/media/listings/{listing_uuid}/images/{unique_filename}"
        
        # Si es main, desmarcar otras
        if is_main:
            db.query(Image).filter(
                Image.listing_id == listing_uuid,
                Image.is_main == True
            ).update({"is_main": False})
        
        # Crear registro
        image_record = Image(
            listing_id=listing_uuid,
            listing_created_at=listing.created_at,
            filename=unique_filename,
            original_url=image_url,
            alt_text=alt_text,
            display_order=existing_count,
            is_main=is_main or existing_count == 0,  # Primera imagen es main por defecto
            file_size=len(file_data),
            width=width,
            height=height
        )
        
        db.add(image_record)
        db.commit()
        db.refresh(image_record)
        
        logger.info(f"Imagen subida: {image_record.id} para listing {listing_id}")
        
        return image_record
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error subiendo imagen: {e}")
        raise HTTPException(status_code=500, detail=f"Error al subir imagen: {str(e)}")


@router.get("/{listing_id}/images",
            response_model=List[ImageResponse],
            summary="Obtener imágenes de una publicación")
async def get_listing_images(
    listing_id: str,
    db: Session = Depends(get_db)
):
    """Obtener todas las imágenes de una publicación"""
    try:
        # Convertir listing_id a UUID
        try:
            listing_uuid = UUID(listing_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de listing inválido")
        
        images = db.query(Image).filter(
            Image.listing_id == listing_uuid
        ).order_by(Image.display_order, Image.created_at).all()
        
        return images
        
    except Exception as e:
        logger.error(f"Error obteniendo imágenes: {e}")
        raise HTTPException(status_code=500, detail=f"Error al obtener imágenes: {str(e)}")


@router.patch("/{listing_id}/images/{image_id}",
              response_model=ImageResponse,
              summary="Actualizar imagen")
async def update_listing_image(
    listing_id: str,
    image_id: str,
    update_data: ImageUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualizar propiedades de una imagen (imagen principal, alt text, orden)"""
    # Extraer valores del modelo
    is_main = update_data.is_main
    alt_text = update_data.alt_text
    display_order = update_data.display_order
    
    try:
        # Convertir IDs a UUID
        try:
            listing_uuid = UUID(listing_id)
            image_uuid = UUID(image_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID inválido")
        
        # Verificar permisos
        listing = db.query(Listing).filter(Listing.id == listing_uuid).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if str(listing.owner_user_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="No tienes permiso para actualizar imágenes de esta publicación")
        
        # Buscar imagen
        image = db.query(Image).filter(
            Image.id == image_uuid,
            Image.listing_id == listing_uuid
        ).first()
        
        if not image:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Si se establece como imagen principal, quitar flag de otras imágenes
        if is_main is True:
            # Desmarcar todas las imágenes del listing como principales
            db.query(Image).filter(
                Image.listing_id == listing_uuid,
                Image.id != image_uuid
            ).update({"is_main": False}, synchronize_session=False)
            
            # Marcar esta imagen como principal
            image.is_main = True
            
            logger.info(f"Imagen {image_uuid} marcada como principal para listing {listing_uuid}")
        elif is_main is False:
            # Si se desmarca explícitamente
            image.is_main = False
        
        # Actualizar otros campos si se proporcionan
        if alt_text is not None:
            image.alt_text = alt_text
        
        if display_order is not None:
            image.display_order = display_order
        
        db.commit()
        db.refresh(image)
        
        logger.info(f"Imagen actualizada: {image.id}, is_main={image.is_main}")
        
        return image
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando imagen: {e}")
        raise HTTPException(status_code=500, detail=f"Error al actualizar imagen: {str(e)}")


@router.delete("/{listing_id}/images/{image_id}",
               summary="Eliminar imagen")
async def delete_listing_image(
    listing_id: str,
    image_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Eliminar una imagen de una publicación"""
    try:
        # Convertir IDs a UUID
        try:
            listing_uuid = UUID(listing_id)
            image_uuid = UUID(image_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID inválido")
        
        # Verificar permisos
        listing = db.query(Listing).filter(Listing.id == listing_uuid).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if str(listing.owner_user_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="No tienes permiso para eliminar imágenes de esta publicación")
        
        # Buscar imagen
        image = db.query(Image).filter(
            Image.id == image_uuid,
            Image.listing_id == listing_uuid
        ).first()
        
        if not image:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Eliminar archivo físico
        try:
            file_path = Path(image.original_url.lstrip('/'))
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Archivo eliminado: {file_path}")
        except Exception as e:
            logger.warning(f"No se pudo eliminar archivo: {e}")
        
        db.delete(image)
        db.commit()
        
        return {"message": "Imagen eliminada exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando imagen: {e}")
        raise HTTPException(status_code=500, detail=f"Error al eliminar imagen: {str(e)}")


# ===================================================================
# VIDEOS - Endpoints for managing listing videos
# ===================================================================

@router.post("/{listing_id}/videos", 
    response_model=VideoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Subir video al listing"
)
async def upload_listing_video(
    listing_id: str,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    display_order: int = Form(0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Sube un video para un listing específico.
    El video se guardará en: /media/listings/{listing_uuid}/videos/
    """
    try:
        # Validar UUID del listing
        try:
            listing_uuid = UUID(listing_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de listing inválido")

        # Verificar que el listing existe y el usuario tiene permisos
        listing = db.query(Listing).filter(
            Listing.id == listing_uuid
        ).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing no encontrado")
        
        if listing.agency_id != current_user["agency_id"]:
            raise HTTPException(status_code=403, detail="No tienes permiso para subir videos a este listing")
        
        # Validar tipo de archivo
        if not file.content_type or not file.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="El archivo debe ser un video")
        
        # Validar tamaño (máximo 100MB)
        contents = await file.read()
        file_size = len(contents)
        if file_size > 100 * 1024 * 1024:  # 100MB
            raise HTTPException(status_code=400, detail="El video no puede superar 100MB")
        
        # Crear directorio para videos del listing
        listing_videos_dir = MEDIA_DIR / "listings" / str(listing_uuid) / "videos"
        listing_videos_dir.mkdir(parents=True, exist_ok=True)
        
        # Generar nombre único
        original_extension = Path(file.filename).suffix
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"video_{timestamp}{original_extension}"
        
        # Guardar video
        file_path = listing_videos_dir / unique_filename
        with open(file_path, 'wb') as f:
            f.write(contents)
        
        logger.info(f"Video guardado en: {file_path}")
        
        # URL del video
        video_url = f"/media/listings/{listing_uuid}/videos/{unique_filename}"
        
        # Crear registro en BD
        new_video = Video(
            listing_id=listing_uuid,
            listing_created_at=listing.created_at,
            filename=unique_filename,
            original_url=video_url,
            title=title,
            description=description,
            display_order=display_order,
            file_size=file_size,
            duration=None,  # Podría extraerse con ffmpeg si se requiere
            created_at=datetime.now(timezone.utc)
        )
        
        db.add(new_video)
        db.commit()
        db.refresh(new_video)
        
        logger.info(f"Video creado en BD con ID: {new_video.id}")
        
        return new_video
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error subiendo video: {e}")
        raise HTTPException(status_code=500, detail=f"Error al subir video: {str(e)}")


@router.get("/{listing_id}/videos", 
    response_model=List[VideoResponse],
    summary="Obtener videos del listing"
)
async def get_listing_videos(
    listing_id: str,
    db: Session = Depends(get_db)
):
    """
    Obtiene todos los videos de un listing específico.
    """
    try:
        # Validar UUID del listing
        try:
            listing_uuid = UUID(listing_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID de listing inválido")

        videos = db.query(Video).filter(
            Video.listing_id == listing_uuid
        ).order_by(Video.display_order, Video.created_at).all()
        
        return videos
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo videos: {e}")
        raise HTTPException(status_code=500, detail=f"Error al obtener videos: {str(e)}")


@router.delete("/{listing_id}/videos/{video_id}", 
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar video del listing"
)
async def delete_listing_video(
    listing_id: str,
    video_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Elimina un video del listing (archivo y registro en BD).
    """
    try:
        # Validar UUIDs
        try:
            listing_uuid = UUID(listing_id)
            video_uuid = UUID(video_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="ID inválido")

        # Verificar que el listing existe y el usuario tiene permisos
        listing = db.query(Listing).filter(
            Listing.id == listing_uuid
        ).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing no encontrado")
        
        if listing.agency_id != current_user["agency_id"]:
            raise HTTPException(status_code=403, detail="No tienes permiso")
        
        # Buscar el video
        video = db.query(Video).filter(
            Video.id == video_uuid,
            Video.listing_id == listing_uuid
        ).first()
        
        if not video:
            raise HTTPException(status_code=404, detail="Video no encontrado")
        
        # Eliminar archivo físico
        try:
            file_path = Path(video.original_url.lstrip('/'))
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Archivo eliminado: {file_path}")
        except Exception as e:
            logger.warning(f"No se pudo eliminar archivo: {e}")
        
        # Eliminar registro de BD
        db.delete(video)
        db.commit()
        
        logger.info(f"Video eliminado: {video_id}")
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando video: {e}")
        raise HTTPException(status_code=500, detail=f"Error al eliminar video: {str(e)}")
