from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.auth import User
from app.schemas.search import (
    SearchFilters, SearchResults, SearchSuggestionsResponse, SavedSearchRequest, 
    UpdateSavedSearchRequest, SavedSearchResponse, AvailableFiltersResponse
)
from app.services.api_cache_service import api_cache_service
from app.services.search_service import SearchService
from typing import List, Optional

router = APIRouter()

@router.get("", response_model=SearchResults, include_in_schema=False)
@router.get("/", response_model=SearchResults, summary="Búsqueda general")
async def search_listings(
    q: Optional[str] = Query(None, description="Texto de búsqueda"),
    location: Optional[str] = Query(None, description="Ubicación"),
    department: Optional[str] = Query(None, description="Departamento"),
    province: Optional[str] = Query(None, description="Provincia"),
    district: Optional[str] = Query(None, description="Distrito"),
    lat: Optional[float] = Query(None, description="Latitud"),
    lng: Optional[float] = Query(None, description="Longitud"),
    radius: Optional[float] = Query(None, description="Radio en km"),
    operation: Optional[str] = Query(None, description="Operación (sale, rent, temp_rent, auction, exchange)"),
    property_type: Optional[str] = Query(None, description="Tipo de propiedad (apartment, house, studio, room, office, commercial, land, warehouse, garage, other)"),
    advertiser_type: Optional[str] = Query(None, description="Tipo de anunciante (owner, agency, developer, broker)"),
    min_price: Optional[float] = Query(None, ge=0, description="Precio mínimo"),
    max_price: Optional[float] = Query(None, ge=0, description="Precio máximo"),
    currency: Optional[str] = Query(None, description="Moneda (PEN, USD, EUR)"),
    min_bedrooms: Optional[int] = Query(None, ge=0, description="Dormitorios mínimos"),
    max_bedrooms: Optional[int] = Query(None, ge=0, description="Dormitorios máximos"),
    min_bathrooms: Optional[int] = Query(None, ge=0, description="Baños mínimos"),
    max_bathrooms: Optional[int] = Query(None, ge=0, description="Baños máximos"),
    min_area_built: Optional[float] = Query(None, ge=0, description="Área construida mínima"),
    max_area_built: Optional[float] = Query(None, ge=0, description="Área construida máxima"),
    min_area_total: Optional[float] = Query(None, ge=0, description="Área total mínima"),
    max_area_total: Optional[float] = Query(None, ge=0, description="Área total máxima"),
    min_parking_spots: Optional[int] = Query(None, ge=0, description="Estacionamientos mínimos"),
    rental_term: Optional[str] = Query(None, description="Término de alquiler (daily, weekly, monthly, yearly)"),
    min_age_years: Optional[int] = Query(None, ge=0, description="Antigüedad mínima en años"),
    max_age_years: Optional[int] = Query(None, ge=0, description="Antigüedad máxima en años"),
    has_media: Optional[bool] = Query(None, description="Solo con fotos/videos"),
    pet_friendly: Optional[bool] = Query(None, description="Solo propiedades que aceptan mascotas (true) o no (false)"),
    furnished: Optional[bool] = Query(None, description="Solo propiedades amuebladas (true) o no amuebladas (false)"),
    rental_mode: Optional[str] = Query(None, description="Modalidad de alquiler (full_property, private_room, shared_room)"),
    rental_model: Optional[str] = Query(None, description="Modelo de renta (traditional, typeairbnb)"),
    airbnb_eligible: Optional[bool] = Query(None, description="Solo propiedades elegibles para Airbnb"),
    min_airbnb_score: Optional[int] = Query(None, ge=0, le=100, description="Score mínimo de elegibilidad Airbnb"),
    amenities: Optional[List[str]] = Query(None, description="Nombres de amenidades (ej: piscina, gimnasio)"),
    page: int = Query(1, ge=1, description="Página"),
    limit: int = Query(20, ge=1, le=100, description="Elementos por página"),
    sort_by: Optional[str] = Query("published_at", description="Campo para ordenar"),
    sort_order: Optional[str] = Query("desc", description="Orden (asc, desc)"),
    db: Session = Depends(get_db)
):
    """
    Búsqueda general de propiedades con filtros avanzados.
    
    Soporta:
    - Búsqueda por texto completo
    - Filtros por ubicación
    - Búsqueda por proximidad (lat/lng/radius)
    - Filtros por características de la propiedad
    - Filtros por amenidades
    - Ordenamiento personalizado
    - Paginación
    """
    try:
        # Crear objeto de filtros
        filters = SearchFilters(
            q=q, location=location, department=department, province=province, district=district,
            lat=lat, lng=lng, radius=radius, operation=operation, property_type=property_type,
            advertiser_type=advertiser_type, min_price=min_price, max_price=max_price, currency=currency,
            min_bedrooms=min_bedrooms, max_bedrooms=max_bedrooms, min_bathrooms=min_bathrooms, max_bathrooms=max_bathrooms,
            min_area_built=min_area_built, max_area_built=max_area_built, min_area_total=min_area_total, max_area_total=max_area_total,
            min_parking_spots=min_parking_spots, rental_term=rental_term, min_age_years=min_age_years, max_age_years=max_age_years,
            has_media=has_media, pet_friendly=pet_friendly, furnished=furnished, rental_mode=rental_mode, rental_model=rental_model,
            airbnb_eligible=airbnb_eligible, min_airbnb_score=min_airbnb_score,
            amenities=amenities, page=page, limit=limit, sort_by=sort_by, sort_order=sort_order
        )
        
        service = SearchService(db)
        results = service.search_listings(filters)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error performing search: {str(e)}"
        )

@router.get("/suggestions", response_model=SearchSuggestionsResponse, summary="Sugerencias de búsqueda")
async def get_search_suggestions(
    q: str = Query(..., min_length=1, description="Texto para autocompletar"),
    type: Optional[str] = Query(None, description="Tipo de sugerencia"),
    db: Session = Depends(get_db)
):
    """
    Obtener sugerencias para autocompletar búsquedas.
    
    Tipos soportados:
    - location: Ubicaciones (departamentos, provincias, distritos)
    - property_type: Tipos de propiedad
    - all: Todas las sugerencias
    """
    try:
        service = SearchService(db)
        suggestions = service.get_suggestions(q, type)
        return SearchSuggestionsResponse(suggestions=suggestions)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting suggestions: {str(e)}"
        )

@router.get("/filters", response_model=AvailableFiltersResponse, summary="Obtener filtros disponibles")
async def get_available_filters(
    location: Optional[str] = Query(None, description="Ubicación para filtrar opciones"),
    db: Session = Depends(get_db)
):
    """
    Obtener filtros disponibles basados en los datos existentes.
    
    Retorna opciones disponibles para:
    - Departamentos, provincias, distritos
    - Tipos de propiedad
    - Rangos de precio
    - Amenidades disponibles
    """
    try:
        location_key = (location or "all").strip().lower()
        cached_filters = api_cache_service.get_static_data("search-filters", location_key)
        if cached_filters is not None:
            return cached_filters

        service = SearchService(db)
        filters = service.get_available_filters(location)
        api_cache_service.set_static_data(
            "search-filters",
            location_key,
            filters.model_dump(mode="json"),
        )
        return filters
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting available filters: {str(e)}"
        )

@router.get("/saved", response_model=List[SavedSearchResponse], summary="Búsquedas guardadas")
async def get_saved_searches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener todas las búsquedas guardadas del usuario actual"""
    try:
        service = SearchService(db)
        saved_searches = service.get_saved_searches(str(current_user.id))
        return [SavedSearchResponse.from_orm(search) for search in saved_searches]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting saved searches: {str(e)}"
        )

@router.post("/saved", response_model=SavedSearchResponse, status_code=status.HTTP_201_CREATED, summary="Guardar búsqueda")
async def save_search(
    request: SavedSearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Guardar una nueva búsqueda para recibir alertas"""
    try:
        service = SearchService(db)
        saved_search = service.save_search(str(current_user.id), request)
        return SavedSearchResponse.from_orm(saved_search)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error saving search: {str(e)}"
        )

@router.get("/saved/{search_id}", response_model=SavedSearchResponse, summary="Obtener búsqueda guardada")
async def get_saved_search(
    search_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener una búsqueda guardada específica"""
    try:
        service = SearchService(db)
        saved_search = service.get_saved_search(str(current_user.id), search_id)
        if not saved_search:
            raise HTTPException(status_code=404, detail="Saved search not found")
        return SavedSearchResponse.from_orm(saved_search)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid search ID: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting saved search: {str(e)}"
        )

@router.put("/saved/{search_id}", response_model=SavedSearchResponse, summary="Actualizar búsqueda guardada")
async def update_saved_search(
    search_id: str,
    request: UpdateSavedSearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar una búsqueda guardada existente"""
    try:
        service = SearchService(db)
        saved_search = service.update_saved_search(str(current_user.id), search_id, request)
        if not saved_search:
            raise HTTPException(status_code=404, detail="Saved search not found")
        return SavedSearchResponse.from_orm(saved_search)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid search ID: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating saved search: {str(e)}"
        )

@router.delete("/saved/{search_id}", status_code=status.HTTP_200_OK, summary="Eliminar búsqueda guardada")
async def delete_saved_search(
    search_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Eliminar una búsqueda guardada"""
    try:
        service = SearchService(db)
        success = service.delete_saved_search(str(current_user.id), search_id)
        if not success:
            raise HTTPException(status_code=404, detail="Saved search not found")
        return {"message": "Saved search deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid search ID: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting saved search: {str(e)}"
        )

@router.get("/amenities", summary="Obtener catálogo de amenidades")
async def get_amenities(db: Session = Depends(get_db)):
    """Obtener la lista de todas las amenidades disponibles"""
    from app.models.search import Amenity
    try:
        cached_amenities = api_cache_service.get_static_data("amenities-catalog")
        if cached_amenities is not None:
            return cached_amenities

        amenities = db.query(Amenity).order_by(Amenity.name).all()
        response = [{"id": a.id, "name": a.name, "icon": a.icon} for a in amenities]
        api_cache_service.set_static_data("amenities-catalog", "default", response)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching amenities: {str(e)}"
        )
