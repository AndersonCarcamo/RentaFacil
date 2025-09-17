from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum
import uuid

class SuggestionType(str, Enum):
    LOCATION = "location"
    PROPERTY_TYPE = "property_type"
    FEATURE = "feature"
    ALL = "all"

class SearchFilters(BaseModel):
    """Filtros de búsqueda"""
    q: Optional[str] = Field(None, description="Texto de búsqueda")
    location: Optional[str] = Field(None, description="Ubicación (ciudad, distrito, etc.)")
    department: Optional[str] = Field(None, description="Departamento")
    province: Optional[str] = Field(None, description="Provincia")
    district: Optional[str] = Field(None, description="Distrito")
    
    # Búsqueda por proximidad
    lat: Optional[float] = Field(None, description="Latitud")
    lng: Optional[float] = Field(None, description="Longitud")
    radius: Optional[float] = Field(None, description="Radio en kilómetros")
    
    # Filtros de propiedad
    operation: Optional[str] = Field(None, description="Tipo de operación (rent, sale, temp_rent, auction, exchange)")
    property_type: Optional[str] = Field(None, description="Tipo de propiedad (apartment, house, office, commercial, land, warehouse, garage, other)")
    advertiser_type: Optional[str] = Field(None, description="Tipo de anunciante (owner, agency, developer, broker)")
    min_price: Optional[float] = Field(None, ge=0, description="Precio mínimo")
    max_price: Optional[float] = Field(None, ge=0, description="Precio máximo")
    currency: Optional[str] = Field(None, description="Moneda (PEN, USD, EUR)")
    
    # Características
    min_bedrooms: Optional[int] = Field(None, ge=0, description="Mínimo de dormitorios")
    max_bedrooms: Optional[int] = Field(None, ge=0, description="Máximo de dormitorios")
    min_bathrooms: Optional[int] = Field(None, ge=0, description="Mínimo de baños")
    max_bathrooms: Optional[int] = Field(None, ge=0, description="Máximo de baños")
    min_area_built: Optional[float] = Field(None, ge=0, description="Área construida mínima")
    max_area_built: Optional[float] = Field(None, ge=0, description="Área construida máxima")
    min_area_total: Optional[float] = Field(None, ge=0, description="Área total mínima")
    max_area_total: Optional[float] = Field(None, ge=0, description="Área total máxima")
    min_parking_spots: Optional[int] = Field(None, ge=0, description="Mínimo de estacionamientos")
    
    # Filtros adicionales
    rental_term: Optional[str] = Field(None, description="Término de alquiler (daily, weekly, monthly, yearly)")
    min_age_years: Optional[int] = Field(None, ge=0, description="Antigüedad mínima en años")
    max_age_years: Optional[int] = Field(None, ge=0, description="Antigüedad máxima en años")
    has_media: Optional[bool] = Field(None, description="Solo propiedades con fotos/videos")
    pet_friendly: Optional[bool] = Field(None, description="Solo propiedades que aceptan mascotas (true) o no (false)")
    furnished: Optional[bool] = Field(None, description="Solo propiedades amuebladas (true) o no amuebladas (false)")
    rental_mode: Optional[str] = Field(None, description="Modalidad de alquiler (full_property, private_room, shared_room)")
    airbnb_eligible: Optional[bool] = Field(None, description="Solo propiedades elegibles para Airbnb")
    min_airbnb_score: Optional[int] = Field(None, ge=0, le=100, description="Score mínimo de elegibilidad Airbnb")
    
    # Amenidades
    amenities: Optional[List[int]] = Field(None, description="IDs de amenidades")
    
    # Paginación y ordenamiento
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
    sort_by: Optional[str] = Field(default="published_at", description="Campo para ordenar (published_at, price, area_total)")
    sort_order: Optional[str] = Field(default="desc", description="Orden (asc, desc)")
    
    @field_validator('operation')
    @classmethod
    def validate_operation(cls, v):
        if v is not None:
            valid_operations = ['sale', 'rent', 'temp_rent', 'auction', 'exchange']
            if v not in valid_operations:
                raise ValueError(f'operation must be one of: {valid_operations}')
        return v
    
    @field_validator('property_type')
    @classmethod
    def validate_property_type(cls, v):
        if v is not None:
            valid_types = ['apartment', 'house', 'studio', 'room', 'office', 'commercial', 'land', 'warehouse', 'garage', 'other']
            if v not in valid_types:
                raise ValueError(f'property_type must be one of: {valid_types}')
        return v
    
    @field_validator('advertiser_type')
    @classmethod
    def validate_advertiser_type(cls, v):
        if v is not None:
            valid_types = ['owner', 'agency', 'developer', 'broker']
            if v not in valid_types:
                raise ValueError(f'advertiser_type must be one of: {valid_types}')
        return v
    
    @field_validator('rental_mode')
    @classmethod
    def validate_rental_mode(cls, v):
        if v is not None:
            valid_modes = ['full_property', 'private_room', 'shared_room']
            if v not in valid_modes:
                raise ValueError(f'rental_mode must be one of: {valid_modes}')
        return v

class FacetItem(BaseModel):
    """Item de faceta para filtros"""
    name: str
    count: int
    value: Optional[str] = None

class PriceRange(BaseModel):
    """Rango de precios"""
    min: float
    max: float
    count: int

class SearchFacets(BaseModel):
    """Facetas para filtros dinámicos"""
    cities: List[FacetItem] = []
    districts: List[FacetItem] = []
    property_types: List[FacetItem] = []
    operations: List[FacetItem] = []
    price_ranges: List[PriceRange] = []

class SearchInfo(BaseModel):
    """Información de la búsqueda"""
    query: Optional[str] = None
    total_results: int
    search_time: float  # en millisegundos
    page: int
    limit: int
    total_pages: int

class SearchResults(BaseModel):
    """Resultados de búsqueda"""
    data: List[Dict[str, Any]]  # Listings
    meta: SearchInfo
    facets: SearchFacets

class SearchSuggestion(BaseModel):
    """Sugerencia de búsqueda"""
    value: str
    type: SuggestionType
    count: int
    highlight: Optional[str] = None

class SearchSuggestionsResponse(BaseModel):
    """Respuesta de sugerencias"""
    suggestions: List[SearchSuggestion]

class SavedSearchRequest(BaseModel):
    """Request para guardar búsqueda"""
    name: str = Field(..., min_length=1, max_length=100)
    filters: Dict[str, Any]
    notifications: bool = Field(default=True)

class UpdateSavedSearchRequest(BaseModel):
    """Request para actualizar búsqueda guardada"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    filters: Optional[Dict[str, Any]] = None
    notifications: Optional[bool] = None

class SavedSearchResponse(BaseModel):
    """Respuesta de búsqueda guardada"""
    id: str
    user_id: str
    name: str
    search_params: Dict[str, Any]
    is_active: bool
    frequency: str
    last_notified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    @field_validator('id', 'user_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True

class AvailableFiltersResponse(BaseModel):
    """Filtros disponibles para una ubicación"""
    departments: List[FacetItem] = []
    provinces: List[FacetItem] = []
    districts: List[FacetItem] = []
    property_types: List[FacetItem] = []
    price_range: Dict[str, float] = {}  # min, max, avg
    amenities: List[Dict[str, Any]] = []
