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
    operation: Optional[str] = Field(None, description="Tipo de operación (rent, sale)")
    property_type: Optional[str] = Field(None, description="Tipo de propiedad")
    min_price: Optional[float] = Field(None, ge=0, description="Precio mínimo")
    max_price: Optional[float] = Field(None, ge=0, description="Precio máximo")
    
    # Características
    min_bedrooms: Optional[int] = Field(None, ge=0, description="Mínimo de dormitorios")
    max_bedrooms: Optional[int] = Field(None, ge=0, description="Máximo de dormitorios")
    min_bathrooms: Optional[int] = Field(None, ge=0, description="Mínimo de baños")
    max_bathrooms: Optional[int] = Field(None, ge=0, description="Máximo de baños")
    min_area: Optional[float] = Field(None, ge=0, description="Área mínima")
    max_area: Optional[float] = Field(None, ge=0, description="Área máxima")
    
    # Amenidades
    amenities: Optional[List[int]] = Field(None, description="IDs de amenidades")
    
    # Paginación
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)

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
