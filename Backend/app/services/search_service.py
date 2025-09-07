from sqlalchemy.orm import Session
from sqlalchemy import func, text, and_, or_, desc, asc
from app.models.listing import Listing
from app.models.search import Alert, Amenity, ListingAmenity
from app.schemas.search import (
    SearchFilters, SearchResults, SearchInfo, SearchFacets, FacetItem, PriceRange,
    SearchSuggestion, SuggestionType, SavedSearchRequest, UpdateSavedSearchRequest,
    AvailableFiltersResponse
)
from typing import List, Optional, Dict, Any, Tuple
import uuid
import time
import math

class SearchService:
    def __init__(self, db: Session):
        self.db = db

    def search_listings(self, filters: SearchFilters) -> SearchResults:
        """Búsqueda principal de listings"""
        start_time = time.time()
        
        # Query base
        query = self.db.query(Listing).filter(
            Listing.status == 'active',
            Listing.published_at.isnot(None)
        )
        
        # Aplicar filtros
        query = self._apply_filters(query, filters)
        
        # Contar total antes de paginación
        total_count = query.count()
        
        # Aplicar paginación
        offset = (filters.page - 1) * filters.limit
        listings = query.offset(offset).limit(filters.limit).all()
        
        # Convertir listings a dict
        listings_data = [self._listing_to_dict(listing) for listing in listings]
        
        # Calcular tiempo de búsqueda
        search_time = (time.time() - start_time) * 1000  # en ms
        
        # Calcular páginas totales
        total_pages = math.ceil(total_count / filters.limit)
        
        # Generar facetas
        facets = self._generate_facets(filters)
        
        # Crear info de búsqueda
        search_info = SearchInfo(
            query=filters.q,
            total_results=total_count,
            search_time=search_time,
            page=filters.page,
            limit=filters.limit,
            total_pages=total_pages
        )
        
        return SearchResults(
            data=listings_data,
            meta=search_info,
            facets=facets
        )

    def get_suggestions(self, q: str, suggestion_type: Optional[str] = None) -> List[SearchSuggestion]:
        """Obtener sugerencias de búsqueda"""
        suggestions = []
        
        if suggestion_type in [None, "all", "location"]:
            # Sugerencias de ubicación
            location_suggestions = self._get_location_suggestions(q)
            suggestions.extend(location_suggestions)
        
        if suggestion_type in [None, "all", "property_type"]:
            # Sugerencias de tipos de propiedad
            property_suggestions = self._get_property_type_suggestions(q)
            suggestions.extend(property_suggestions)
        
        return suggestions[:10]  # Limitar a 10 sugerencias

    def get_available_filters(self, location: Optional[str] = None) -> AvailableFiltersResponse:
        """Obtener filtros disponibles"""
        base_query = self.db.query(Listing).filter(
            Listing.status == 'active',
            Listing.published_at.isnot(None)
        )
        
        if location:
            base_query = base_query.filter(
                or_(
                    Listing.department.ilike(f'%{location}%'),
                    Listing.province.ilike(f'%{location}%'),
                    Listing.district.ilike(f'%{location}%')
                )
            )
        
        # Obtener datos únicos
        departments = self._get_facet_items(base_query, Listing.department)
        provinces = self._get_facet_items(base_query, Listing.province)
        districts = self._get_facet_items(base_query, Listing.district)
        property_types = self._get_facet_items(base_query, Listing.property_type)
        
        # Rango de precios
        price_stats = base_query.filter(Listing.price.isnot(None)).with_entities(
            func.min(Listing.price).label('min_price'),
            func.max(Listing.price).label('max_price'),
            func.avg(Listing.price).label('avg_price')
        ).first()
        
        price_range = {
            'min': float(price_stats.min_price or 0),
            'max': float(price_stats.max_price or 0),
            'avg': float(price_stats.avg_price or 0)
        }
        
        # Amenidades disponibles
        amenities = self.db.query(Amenity).all()
        amenities_data = [{'id': a.id, 'name': a.name, 'icon': a.icon} for a in amenities]
        
        return AvailableFiltersResponse(
            departments=departments,
            provinces=provinces,
            districts=districts,
            property_types=property_types,
            price_range=price_range,
            amenities=amenities_data
        )

    def get_saved_searches(self, user_id: str) -> List[Alert]:
        """Obtener búsquedas guardadas del usuario"""
        return self.db.query(Alert).filter(
            Alert.user_id == uuid.UUID(user_id),
            Alert.is_active == True
        ).order_by(desc(Alert.updated_at)).all()

    def save_search(self, user_id: str, request: SavedSearchRequest) -> Alert:
        """Guardar una búsqueda"""
        alert = Alert(
            user_id=uuid.UUID(user_id),
            name=request.name,
            search_params=request.filters,
            is_active=request.notifications
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        return alert

    def get_saved_search(self, user_id: str, search_id: str) -> Optional[Alert]:
        """Obtener una búsqueda guardada específica"""
        return self.db.query(Alert).filter(
            Alert.id == uuid.UUID(search_id),
            Alert.user_id == uuid.UUID(user_id)
        ).first()

    def update_saved_search(self, user_id: str, search_id: str, request: UpdateSavedSearchRequest) -> Optional[Alert]:
        """Actualizar búsqueda guardada"""
        alert = self.get_saved_search(user_id, search_id)
        if not alert:
            return None
        
        if request.name is not None:
            alert.name = request.name
        if request.filters is not None:
            alert.search_params = request.filters
        if request.notifications is not None:
            alert.is_active = request.notifications
        
        self.db.commit()
        self.db.refresh(alert)
        return alert

    def delete_saved_search(self, user_id: str, search_id: str) -> bool:
        """Eliminar búsqueda guardada"""
        alert = self.get_saved_search(user_id, search_id)
        if not alert:
            return False
        
        self.db.delete(alert)
        self.db.commit()
        return True

    def _apply_filters(self, query, filters: SearchFilters):
        """Aplicar filtros a la query"""
        
        # Búsqueda por texto
        if filters.q:
            search_query = text(
                "search_doc @@ plainto_tsquery('spanish_unaccent', :search_text)"
            ).bindparam(search_text=filters.q)
            query = query.filter(search_query)
        
        # Filtros de ubicación
        if filters.department:
            query = query.filter(Listing.department.ilike(f'%{filters.department}%'))
        if filters.province:
            query = query.filter(Listing.province.ilike(f'%{filters.province}%'))
        if filters.district:
            query = query.filter(Listing.district.ilike(f'%{filters.district}%'))
        if filters.location:
            query = query.filter(
                or_(
                    Listing.department.ilike(f'%{filters.location}%'),
                    Listing.province.ilike(f'%{filters.location}%'),
                    Listing.district.ilike(f'%{filters.location}%'),
                    Listing.address.ilike(f'%{filters.location}%')
                )
            )
        
        # Búsqueda por proximidad
        if filters.lat and filters.lng and filters.radius:
            distance_query = text(
                """
                ST_DWithin(
                    ST_Transform(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326), 3857),
                    ST_Transform(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), 3857),
                    :radius * 1000
                )
                """
            ).bindparam(lat=filters.lat, lng=filters.lng, radius=filters.radius)
            query = query.filter(distance_query)
        
        # Filtros de propiedad
        if filters.operation:
            query = query.filter(Listing.operation == filters.operation)
        if filters.property_type:
            query = query.filter(Listing.property_type == filters.property_type)
        
        # Filtros de precio
        if filters.min_price is not None:
            query = query.filter(Listing.price >= filters.min_price)
        if filters.max_price is not None:
            query = query.filter(Listing.price <= filters.max_price)
        
        # Filtros de características
        if filters.min_bedrooms is not None:
            query = query.filter(Listing.bedrooms >= filters.min_bedrooms)
        if filters.max_bedrooms is not None:
            query = query.filter(Listing.bedrooms <= filters.max_bedrooms)
        if filters.min_bathrooms is not None:
            query = query.filter(Listing.bathrooms >= filters.min_bathrooms)
        if filters.max_bathrooms is not None:
            query = query.filter(Listing.bathrooms <= filters.max_bathrooms)
        if filters.min_area is not None:
            query = query.filter(Listing.area_total >= filters.min_area)
        if filters.max_area is not None:
            query = query.filter(Listing.area_total <= filters.max_area)
        
        # Filtro de amenidades
        if filters.amenities:
            amenity_query = self.db.query(ListingAmenity.listing_id).filter(
                ListingAmenity.amenity_id.in_(filters.amenities)
            ).subquery()
            query = query.filter(Listing.id.in_(amenity_query))
        
        # Ordenar por relevancia (si hay búsqueda por texto) o por fecha
        if filters.q:
            rank_query = text(
                "ts_rank(search_doc, plainto_tsquery('spanish_unaccent', :search_text))"
            ).bindparam(search_text=filters.q)
            query = query.order_by(desc(rank_query), desc(Listing.published_at))
        else:
            query = query.order_by(desc(Listing.published_at))
        
        return query

    def _generate_facets(self, filters: SearchFilters) -> SearchFacets:
        """Generar facetas para filtros dinámicos"""
        # Query base sin filtros de ubicación específicos para generar facetas
        base_query = self.db.query(Listing).filter(
            Listing.status == 'active',
            Listing.published_at.isnot(None)
        )
        
        # Aplicar solo algunos filtros para facetas
        if filters.q:
            search_query = text(
                "search_doc @@ plainto_tsquery('spanish_unaccent', :search_text)"
            ).bindparam(search_text=filters.q)
            base_query = base_query.filter(search_query)
        
        cities = self._get_facet_items(base_query, Listing.province)
        districts = self._get_facet_items(base_query, Listing.district)
        property_types = self._get_facet_items(base_query, Listing.property_type)
        operations = self._get_facet_items(base_query, Listing.operation)
        
        return SearchFacets(
            cities=cities,
            districts=districts,
            property_types=property_types,
            operations=operations,
            price_ranges=[]  # Implementar rangos de precios si es necesario
        )

    def _get_facet_items(self, query, field) -> List[FacetItem]:
        """Obtener items de faceta para un campo específico"""
        facets = query.filter(field.isnot(None)).with_entities(
            field,
            func.count().label('count')
        ).group_by(field).order_by(desc('count')).limit(20).all()
        
        return [FacetItem(name=f[0], count=f[1]) for f in facets]

    def _get_location_suggestions(self, q: str) -> List[SearchSuggestion]:
        """Obtener sugerencias de ubicación"""
        suggestions = []
        
        # Buscar en departamentos, provincias y distritos
        for field, field_type in [
            (Listing.department, 'department'),
            (Listing.province, 'city'),
            (Listing.district, 'district')
        ]:
            results = self.db.query(field, func.count().label('count')).filter(
                field.ilike(f'%{q}%'),
                field.isnot(None),
                Listing.status == 'active'
            ).group_by(field).order_by(desc('count')).limit(5).all()
            
            for result in results:
                suggestions.append(SearchSuggestion(
                    value=result[0],
                    type=SuggestionType.LOCATION,
                    count=result[1],
                    highlight=result[0].replace(q, f"<strong>{q}</strong>")
                ))
        
        return suggestions

    def _get_property_type_suggestions(self, q: str) -> List[SearchSuggestion]:
        """Obtener sugerencias de tipos de propiedad"""
        results = self.db.query(Listing.property_type, func.count().label('count')).filter(
            Listing.property_type.ilike(f'%{q}%'),
            Listing.property_type.isnot(None),
            Listing.status == 'active'
        ).group_by(Listing.property_type).order_by(desc('count')).limit(5).all()
        
        return [
            SearchSuggestion(
                value=result[0],
                type=SuggestionType.PROPERTY_TYPE,
                count=result[1]
            ) for result in results
        ]

    def _listing_to_dict(self, listing: Listing) -> Dict[str, Any]:
        """Convertir listing a diccionario para la respuesta"""
        return {
            'id': str(listing.id),
            'title': listing.title,
            'description': listing.description,
            'operation': listing.operation,
            'property_type': listing.property_type,
            'price': float(listing.price) if listing.price else None,
            'currency': listing.currency,
            'bedrooms': listing.bedrooms,
            'bathrooms': listing.bathrooms,
            'area_total': float(listing.area_total) if listing.area_total else None,
            'area_built': float(listing.area_built) if listing.area_built else None,
            'department': listing.department,
            'province': listing.province,
            'district': listing.district,
            'address': listing.address,
            'latitude': float(listing.latitude) if listing.latitude else None,
            'longitude': float(listing.longitude) if listing.longitude else None,
            'published_at': listing.published_at.isoformat() if listing.published_at else None,
            'created_at': listing.created_at.isoformat() if listing.created_at else None,
            'views_count': listing.views_count,
            'favorites_count': listing.favorites_count,
            'has_media': listing.has_media
        }
