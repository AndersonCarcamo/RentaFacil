from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.listings import (
    CreateListingRequest, UpdateListingRequest, ListingResponse, ChangeListingStatusRequest
)
from app.services.listing_service import ListingService
from app.api.deps import get_current_user
from typing import List, Optional, Dict, Any
from uuid import UUID

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
        return [ListingResponse.from_orm(l) for l in listings]
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
            
        return [ListingResponse.from_orm(l) for l in listings]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving user listings: {str(e)}")

@router.get("/{listing_id}", response_model=ListingResponse, summary="Obtener propiedad por ID")
async def get_listing(listing_id: str, db: Session = Depends(get_db)):
    service = ListingService(db)
    listing = service.get_listing(listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return ListingResponse.from_orm(listing)

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
