import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import PropertyCardHorizontal from '../components/PropertyCardHorizontal';
import SearchSidebar, { SearchFilters } from '../components/SearchSidebar';
import PropertyModal from '../components/PropertyModal';
import SearchMobileView from '../components/SearchMobileView';
import { Property, Currency, PropertyType } from '../types/index';
import { fetchProperties, PropertyFilters, PropertyResponse } from '../lib/api/properties';

// Importar el Header original
import { Header } from '../components/Header';

// Importar MapView dinámicamente solo en el cliente (evita SSR issues con Leaflet)
const MapView = dynamic(() => import('../components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando mapa...</p>
      </div>
    </div>
  )
});

// Función para convertir PropertyResponse a Property (para compatibilidad)
const convertToProperty = (apiProperty: PropertyResponse): Property => {
  // Mapear currency de string a Currency type
  const currency: Currency = (apiProperty.currency === 'USD' || apiProperty.currency === 'PEN') 
    ? apiProperty.currency as Currency 
    : 'PEN'
  
  // Mapear property_type de string a PropertyType
  const propertyTypeMap: { [key: string]: PropertyType } = {
    'apartment': 'apartment',
    'house': 'house', 
    'studio': 'studio',
    'office': 'office',
    'room': 'room',
    'TipoAirbnb': 'room' // Mapear TipoAirbnb a room por ahora
  }
  const propertyType = propertyTypeMap[apiProperty.property_type] || undefined
  
  return {
    id: apiProperty.id,
    title: apiProperty.title,
    description: apiProperty.description || 'Propiedad disponible',
    price: Number(apiProperty.price),
    currency,
    location: `${apiProperty.district || ''}, ${apiProperty.department || ''}`.replace(/^,\s*/, ''),
    propertyType,
    bedrooms: apiProperty.bedrooms || 0,
    bathrooms: apiProperty.bathrooms || 0,
    area: Number(apiProperty.area_built || apiProperty.area_total || 0),
    images: ['/images/properties/property-placeholder.svg'], // Placeholder hasta que tengamos media API
    amenities: [
      ...(apiProperty.furnished ? ['Amoblado'] : ['Sin amoblar']),
      ...(apiProperty.parking_spots ? [`${apiProperty.parking_spots} estacionamiento(s)`] : []),
      ...(apiProperty.pet_friendly ? ['Pet Friendly'] : []),
      ...(apiProperty.is_airbnb_available ? ['Apto Airbnb'] : [])
    ].slice(0, 3), // Máximo 3 amenities
    rating: parseFloat((4.5 + (Math.random() * 0.5)).toFixed(2)), // Rating simulado entre 4.5-5.0
    reviews: Math.floor(Math.random() * 50) + 10, // Reviews simuladas 10-60
    isVerified: apiProperty.verification_status === 'verified',
    isFavorite: false,
    views: apiProperty.views_count
  }
}

// Función para mapear SearchFilters a PropertyFilters
const mapSearchFiltersToPropertyFilters = (filters: SearchFilters): PropertyFilters => {
  const propertyFilters: PropertyFilters = {}
  
  if (filters.location) propertyFilters.location = filters.location
  if (filters.propertyType) propertyFilters.property_type = filters.propertyType
  if (filters.minPrice) propertyFilters.min_price = filters.minPrice
  if (filters.maxPrice) propertyFilters.max_price = filters.maxPrice
  if (filters.bedrooms) propertyFilters.min_bedrooms = filters.bedrooms
  if (filters.bathrooms) propertyFilters.min_bathrooms = filters.bathrooms
  if (filters.minArea) propertyFilters.min_area_built = filters.minArea
  if (filters.maxArea) propertyFilters.max_area_built = filters.maxArea
  if (filters.furnished !== undefined) propertyFilters.furnished = filters.furnished
  if (filters.petFriendly !== undefined) propertyFilters.pet_friendly = filters.petFriendly
  if (filters.verified !== undefined) propertyFilters.has_media = filters.verified
  
  if (filters.rentalMode) {
    switch (filters.rentalMode) {
      case 'traditional':
        propertyFilters.rental_mode = 'full_property'
        break
      case 'shared':
        propertyFilters.rental_mode = 'shared_room'
        break
      case 'coliving':
      case 'private':
        propertyFilters.rental_mode = 'private_room'
        break
      case 'airbnb':
        propertyFilters.airbnb_eligible = true
        break
    }
  }
  
  propertyFilters.page = 1
  propertyFilters.limit = 50
  propertyFilters.sort_by = 'published_at'
  propertyFilters.sort_order = 'desc'
  
  return propertyFilters
}

// Función para mapear parámetros de SearchFormExtended a PropertyFilters
const mapSearchParamsToFilters = (params: any): PropertyFilters => {
  const filters: PropertyFilters = {}
  
  // Mapear búsqueda por texto (ubicación se usa como búsqueda general)
  if (params.location) {
    filters.q = params.location // Usar como búsqueda de texto general
    filters.location = params.location // También como filtro de ubicación
  }
  
  // Mapear operación
  if (params.mode) {
    filters.operation = params.mode === 'alquiler' ? 'rent' : 
                      params.mode === 'comprar' ? 'sale' : 
                      params.mode === 'vender' ? 'sale' : 'rent'
  }
  
  // Mapear tipo de propiedad
  if (params.propertyType) {
    filters.property_type = params.propertyType
  }
  
  // Mapear precios
  if (params.minPrice) {
    filters.min_price = Number(params.minPrice)
  }
  if (params.maxPrice) {
    filters.max_price = Number(params.maxPrice)
  }
  
  // Mapear habitaciones (usar min_bedrooms y min_bathrooms)
  if (params.bedrooms) {
    filters.min_bedrooms = Number(params.bedrooms)
  }
  if (params.bathrooms) {
    filters.min_bathrooms = Number(params.bathrooms)
  }
  
  // Mapear área (usar area_built por defecto)
  if (params.minArea) {
    filters.min_area_built = Number(params.minArea)
  }
  if (params.maxArea) {
    filters.max_area_built = Number(params.maxArea)
  }
  
  // Mapear antigüedad (ageYears)
  if (params.ageYears) {
    switch (params.ageYears) {
      case 'new':
        filters.max_age_years = 0
        break
      case '0-5':
        filters.min_age_years = 0
        filters.max_age_years = 5
        break
      case '5-10':
        filters.min_age_years = 5
        filters.max_age_years = 10
        break
      case '10-20':
        filters.min_age_years = 10
        filters.max_age_years = 20
        break
      case '20+':
        filters.min_age_years = 20
        break
    }
  }
  
  // Mapear booleanos
  if (params.furnished !== undefined) {
    filters.furnished = params.furnished
  }
  if (params.verified !== undefined) {
    // El endpoint de search no tiene 'verified', usar has_media como proxy
    filters.has_media = params.verified
  }
  if (params.petFriendly !== undefined) {
    filters.pet_friendly = params.petFriendly
  }
  
  // Mapear modo de alquiler
  if (params.rentalMode) {
    switch (params.rentalMode) {
      case 'traditional':
        filters.rental_mode = 'full_property'
        break
      case 'shared':
        filters.rental_mode = 'shared_room'
        break
      case 'coliving':
      case 'private':
        filters.rental_mode = 'private_room'
        break
      case 'airbnb':
        filters.airbnb_eligible = true
        break
    }
  }
  
  // Agregar paginación por defecto
  filters.page = 1
  filters.limit = 20
  filters.sort_by = 'published_at'
  filters.sort_order = 'desc'
  
  return filters
}

// Mock data para las propiedades (como fallback)
const mockProperties: Property[] = [
  {
    id: "1",
    title: "Departamento Moderno en San Isidro",
    description: "Hermoso departamento completamente amoblado con vista al mar",
    price: 1800,
    currency: "PEN",
    location: "San Isidro, Lima",
    propertyType: "apartment",
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
    amenities: ["WiFi", "Cocina equipada", "Aire acondicionado"],
    rating: 4.8,
    reviews: 25,
    isVerified: true,
    isFavorite: false,
    views: 150
  },
  {
    id: "2",
    title: "Casa Familiar en Miraflores",
    description: "Espaciosa casa con jardín, perfecta para familias",
    price: 2500,
    currency: "PEN",
    location: "Miraflores, Lima",
    propertyType: "house",
    bedrooms: 4,
    bathrooms: 3,
    area: 180,
    images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
    amenities: ["Jardín", "Garaje", "WiFi", "Lavandería"],
    rating: 4.9,
    reviews: 18,
    isVerified: true,
    isFavorite: false,
    views: 230
  },
  {
    id: "3",
    title: "Estudio Céntrico en Barranco",
    description: "Moderno estudio en el corazón de Barranco",
    price: 1200,
    currency: "PEN",
    location: "Barranco, Lima",
    propertyType: "studio",
    bedrooms: 1,
    bathrooms: 1,
    area: 45,
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
    amenities: ["WiFi", "Cocina equipada"],
    rating: 4.6,
    reviews: 12,
    isVerified: false,
    isFavorite: false,
    views: 89
  },
  {
    id: "4",
    title: "Penthouse con Terraza en Surco",
    description: "Exclusivo penthouse con terraza y vista panorámica",
    price: 3500,
    currency: "PEN",
    location: "Santiago de Surco, Lima",
    propertyType: "apartment",
    bedrooms: 3,
    bathrooms: 3,
    area: 200,
    images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
    amenities: ["Terraza", "Jacuzzi", "Gimnasio", "WiFi", "Aire acondicionado"],
    rating: 4.95,
    reviews: 32,
    isVerified: true,
    isFavorite: false,
    views: 450
  },
  {
    id: "5",
    title: "Departamento Económico en Los Olivos",
    description: "Departamento cómodo y accesible en zona tranquila",
    price: 800,
    currency: "PEN",
    location: "Los Olivos, Lima",
    propertyType: "apartment",
    bedrooms: 2,
    bathrooms: 1,
    area: 65,
    images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
    amenities: ["WiFi", "Cocina básica"],
    rating: 4.2,
    reviews: 8,
    isVerified: true,
    isFavorite: false,
    views: 95
  },
  {
    id: "6",
    title: "Casa con Piscina en La Molina",
    description: "Hermosa casa con piscina y amplio jardín",
    price: 3000,
    currency: "PEN",
    location: "La Molina, Lima",
    propertyType: "house",
    bedrooms: 5,
    bathrooms: 4,
    area: 280,
    images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
    amenities: ["Piscina", "Jardín", "Garaje", "WiFi", "Barbacoa"],
    rating: 4.85,
    reviews: 22,
    isVerified: true,
    isFavorite: false,
    views: 380
  }
];

const SearchPage = () => {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [apiProperties, setApiProperties] = useState<PropertyResponse[]>([]); // Para el mapa
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});
  
  // Estados para hover sincronizado
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  
  // Estados para drag handle (redimensionar)
  const [mapWidth, setMapWidth] = useState(50); // Porcentaje
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  // Detectar si es móvil
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // Tablets y móviles
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const openPropertyModal = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setIsModalOpen(true);
  };

  const closePropertyModal = () => {
    setIsModalOpen(false);
    setSelectedPropertyId(null);
  };

  // Cargar propiedades desde la API
  const loadProperties = async (filters: SearchFilters) => {
    try {
      setLoading(true);
      console.log('🔍 Cargando propiedades con filtros:', filters);
      
      const propertyFilters = mapSearchFiltersToPropertyFilters(filters);
      console.log('🔍 Filtros API:', propertyFilters);
      
      const apiPropertiesResponse = await fetchProperties(propertyFilters);
      console.log('✅ Propiedades recibidas:', apiPropertiesResponse?.length || 0);
      
      if (!apiPropertiesResponse || apiPropertiesResponse.length === 0) {
        setProperties([]);
        setApiProperties([]);
        return;
      }
      
      setApiProperties(apiPropertiesResponse);
      const convertedProperties = apiPropertiesResponse.map(convertToProperty);
      setProperties(convertedProperties);
      console.log('✅ Propiedades cargadas exitosamente');
    } catch (error) {
      console.error('❌ Error cargando propiedades:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios de filtros desde el sidebar
  const handleFilterChange = (filters: SearchFilters) => {
    setCurrentFilters(filters);
    loadProperties(filters);
  };

  useEffect(() => {
    // Cargar filtros iniciales desde URL
    const params = router.query;
    const initialFilters: SearchFilters = {
      location: params.location as string,
      propertyType: params.propertyType as string,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      bedrooms: params.bedrooms ? Number(params.bedrooms) : undefined,
      bathrooms: params.bathrooms ? Number(params.bathrooms) : undefined,
    };
    
    setCurrentFilters(initialFilters);
    loadProperties(initialFilters);
  }, [router.query]);

  // Efecto para drag handle
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const container = dragRef.current?.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const sidebarWidth = 56; // Ancho del sidebar colapsado (puede ser 56 o 320)
      const dragHandleWidth = 8; // Ancho de la barra de drag
      const availableWidth = containerRect.width - sidebarWidth - dragHandleWidth;
      
      const newWidth = ((e.clientX - containerRect.left - sidebarWidth) / availableWidth) * 100;

      // Límites: mínimo 30%, máximo 70%
      if (newWidth >= 30 && newWidth <= 70) {
        setMapWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  return (
    <>
      <Head>
        <title>Resultados de Búsqueda - RENTA fácil</title>
        <meta name="description" content="Encuentra tu propiedad ideal en RENTA fácil" />
      </Head>
      
      {/* Renderizado condicional: Vista móvil o desktop */}
      {isMobile ? (
        // Vista Móvil con Bottom Sheet
        <SearchMobileView
          properties={properties}
          apiProperties={apiProperties}
          loading={loading}
          onPropertyClick={openPropertyModal}
          onFilterChange={handleFilterChange}
          currentFilters={currentFilters}
        />
      ) : (
        // Vista Desktop (existente)
        <>
          {/* Header Fixed */}
          <Header />
          
          {/* Main Layout - Sin scroll general */}
          <div 
            className="flex overflow-hidden bg-gray-50"
            style={{ height: 'calc(100vh - 96px)' }}
          >
        {/* Sidebar de Filtros - Colapsable */}
        <SearchSidebar 
          onFilterChange={handleFilterChange}
          isLoading={loading}
          initialFilters={currentFilters}
        />

        {/* Mapa - Lado Izquierdo (ancho dinámico) */}
        <div 
          className="bg-white border-r border-gray-200 relative transition-all duration-150"
          style={{ width: `${mapWidth}%` }}
        >
          <MapView 
            listings={apiProperties} 
            onMarkerClick={openPropertyModal}
            hoveredPropertyId={hoveredPropertyId}
            onMarkerHover={setHoveredPropertyId}
          />
        </div>

        {/* Drag Handle - Barra divisoria */}
        <div
          ref={dragRef}
          onMouseDown={() => setIsDragging(true)}
          className={`
            w-2 bg-gray-200 hover:bg-blue-100 cursor-col-resize 
            transition-all duration-200 relative group flex-shrink-0
            border-l border-r border-gray-300
            ${isDragging ? 'bg-blue-200 w-3' : ''}
          `}
        >
          {/* Indicador visual del drag handle - Siempre visible */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
            {/* Ícono de flechas */}
            <svg 
              className={`w-4 h-4 transition-colors ${isDragging ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
            {/* Puntos decorativos (grip dots) */}
            <div className={`flex gap-0.5 mt-1 ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
              <div className="w-1 h-1 rounded-full bg-gray-400"></div>
              <div className="w-1 h-1 rounded-full bg-gray-400"></div>
            </div>
          </div>
        </div>

        {/* Lista de Propiedades - Lado Derecho (ancho dinámico) */}
        <div 
          className="flex flex-col bg-white"
          style={{ width: `${100 - mapWidth}%` }}
        >
          {/* Header de Resultados - Fixed */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">
              {loading ? 'Buscando propiedades...' : `${properties.length} propiedades encontradas`}
            </h2>
            {properties.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Ordenadas por más recientes
              </p>
            )}
          </div>

          {/* Lista Scrollable - ÚNICO SCROLL */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : properties.length > 0 ? (
              <div className="space-y-4">
                {properties
                  .sort((a, b) => b.rating - a.rating)
                  .map((property) => (
                    <div 
                      key={property.id} 
                      className={`
                        transform transition-all duration-200 rounded-xl
                        hover:scale-[1.02] hover:shadow-xl
                        ${hoveredPropertyId === property.id 
                          ? 'scale-[1.02] shadow-xl outline outline-2 outline-blue-500 outline-offset-0' 
                          : ''
                        }
                      `}
                      onMouseEnter={() => setHoveredPropertyId(property.id)}
                      onMouseLeave={() => setHoveredPropertyId(null)}
                    >
                      <PropertyCardHorizontal 
                        property={property}
                        onClick={openPropertyModal}
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center py-12 px-4">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No se encontraron propiedades
                  </h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Intenta ajustar tus filtros de búsqueda o expandir tu área de búsqueda para ver más resultados
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}

      {/* Property Modal - Compartido entre ambas vistas */}
      {selectedPropertyId && (
        <PropertyModal
          propertyId={selectedPropertyId}
          isOpen={isModalOpen}
          onClose={closePropertyModal}
        />
      )}
    </>
  );
};

export default SearchPage;