from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.listings import (
    CreateListingRequest, UpdateListingRequest, ListingResponse, ChangeListingStatusRequest
)
from app.services.listing_service import ListingService
from app.api.deps import get_current_user
from typing import List, Optional

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
    sort: Optional[str] = None,
    db: Session = Depends(get_db)
):
    filters = {
        "operation_type": operation_type,
        "property_type": property_type,
        "city": city,
        "district": district,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "verified": verified
    }
    service = ListingService(db)
    listings = service.list_listings(filters)
    return [ListingResponse.from_orm(l) for l in listings]

@router.post("/", response_model=ListingResponse, status_code=status.HTTP_201_CREATED, summary="Crear nueva propiedad")
async def create_listing(request: CreateListingRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    service = ListingService(db)
    listing = service.create_listing(request, owner_id=current_user.id)
    return ListingResponse.from_orm(listing)

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
    service = ListingService(db)
    listing = service.change_status(listing_id, request.status)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return ListingResponse.from_orm(listing)

@router.post("/{listing_id}/publish", response_model=ListingResponse, summary="Publicar propiedad")
async def publish_listing(listing_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    service = ListingService(db)
    listing = service.publish_listing(listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return ListingResponse.from_orm(listing)

@router.post("/{listing_id}/unpublish", response_model=ListingResponse, summary="Despublicar propiedad")
async def unpublish_listing(listing_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    service = ListingService(db)
    listing = service.unpublish_listing(listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return ListingResponse.from_orm(listing)

@router.post("/{listing_id}/duplicate", response_model=ListingResponse, status_code=status.HTTP_201_CREATED, summary="Duplicar propiedad")
async def duplicate_listing(listing_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    service = ListingService(db)
    listing = service.duplicate_listing(listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return ListingResponse.from_orm(listing)

@router.get("/my", response_model=List[ListingResponse], summary="Mis propiedades")
async def list_my_listings(db: Session = Depends(get_db), current_user=Depends(get_current_user), status: Optional[str] = None):
    service = ListingService(db)
    listings = service.list_my_listings(owner_id=current_user.id, status=status)
    return [ListingResponse.from_orm(l) for l in listings]
