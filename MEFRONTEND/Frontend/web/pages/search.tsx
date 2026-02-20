import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { PropertyCardHorizontal } from '../components/property';
import SearchSidebar, { SearchFilters } from '../components/SearchSidebar';
import SearchMobileView from '../components/SearchMobileView';
import { Property, Currency, PropertyType } from '../types/index';
import { fetchProperties, PropertyFilters, PropertyResponse } from '../lib/api/properties';

// Importar el Header original
import { Header } from '../components/common/Header';

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
      ...(apiProperty.rental_model === 'airbnb' ? ['🏖️ Tipo Airbnb'] : [])
    ].slice(0, 3), // Máximo 3 amenities
    rating: parseFloat((4.5 + (Math.random() * 0.5)).toFixed(2)), // Rating simulado entre 4.5-5.0
    reviews: Math.floor(Math.random() * 50) + 10, // Reviews simuladas 10-60
    isVerified: apiProperty.verification_status === 'verified',
    isFavorite: false,
    views: apiProperty.views_count,
    rental_term: apiProperty.rental_term || 'monthly', // Usar el rental_term del API
    furnished: apiProperty.furnished
  }
}

// Función para mapear SearchFilters a PropertyFilters
const mapSearchFiltersToPropertyFilters = (filters: SearchFilters): PropertyFilters => {
  const propertyFilters: PropertyFilters = {}
  
  // Procesar búsqueda inteligente
  if (filters.location) {
    const searchText = filters.location.toLowerCase()
    
    // Detectar tipo de propiedad en la búsqueda
    const propertyTypeMap: Record<string, string> = {
      'departamento': 'apartment',
      'departamentos': 'apartment',
      'casa': 'house',
      'casas': 'house',
      'oficina': 'office',
      'oficinas': 'office',
      'local': 'commercial',
      'terreno': 'land',
      'estudio': 'studio',
      'loft': 'apartment',
    }
    
    // Detectar amenidades en la búsqueda
    const amenityMap: Record<string, string> = {
      'piscina': 'Piscina',
      'gimnasio': 'Gimnasio',
      'jardin': 'Jardín',
      'jardín': 'Jardín',
      'garaje': 'Garaje',
      'terraza': 'Terraza',
      'ascensor': 'Ascensor',
      'balcon': 'Balcón',
      'balcón': 'Balcón',
      'seguridad': 'Seguridad 24h',
      'wifi': 'Internet/WiFi',
      'internet': 'Internet/WiFi',
      'lavanderia': 'Lavandería',
      'lavandería': 'Lavandería',
      'aire acondicionado': 'Aire acondicionado',
      'calefaccion': 'Calefacción',
      'calefacción': 'Calefacción',
      'mascotas': 'Mascotas Permitidas',
    }
    
    // Detectar palabras de características
    const featureKeywords = ['con', 'amoblado', 'amueblado', 'moderno', 'nuevo', 'vista']
    const hasFeatures = featureKeywords.some(keyword => searchText.includes(keyword))
    
    // Detectar amenidades
    let detectedAmenities: string[] = []
    for (const [keyword, amenity] of Object.entries(amenityMap)) {
      if (searchText.includes(keyword)) {
        detectedAmenities.push(amenity)
      }
    }
    
    // Buscar si hay un tipo de propiedad en el texto
    let detectedPropertyType: string | undefined
    for (const [spanish, english] of Object.entries(propertyTypeMap)) {
      if (searchText.includes(spanish)) {
        detectedPropertyType = english
        break
      }
    }
    
    const words = searchText.split(' ')
    const enIndex = words.indexOf('en')
    
    if (detectedAmenities.length > 0) {
      // Hay amenidades detectadas: agregar al filtro
      propertyFilters.amenities = detectedAmenities
      
      if (detectedPropertyType && !filters.propertyType) {
        propertyFilters.property_type = detectedPropertyType
      }
      
      // Si hay ubicación después de "en", también agregarla
      if (enIndex !== -1 && words.length > enIndex + 1) {
        const locationPart = words.slice(enIndex + 1).join(' ')
        propertyFilters.location = locationPart
      }
    } else if (hasFeatures) {
      // Búsqueda por características: usar búsqueda de texto completo
      propertyFilters.q = filters.location
      
      if (detectedPropertyType && !filters.propertyType) {
        propertyFilters.property_type = detectedPropertyType
      }
    } else if (enIndex !== -1 && words.length > enIndex + 1) {
      // Hay "en" seguido de ubicación: "departamento en barranco" -> location=barranco
      const locationPart = words.slice(enIndex + 1).join(' ')
      propertyFilters.location = locationPart
      
      if (detectedPropertyType && !filters.propertyType) {
        propertyFilters.property_type = detectedPropertyType
      }
    } else if (detectedPropertyType) {
      // Hay tipo de propiedad sin "en": "departamento barranco"
      const locationPart = words.filter(w => !Object.keys(propertyTypeMap).includes(w)).join(' ').trim()
      if (locationPart.length > 2) {
        propertyFilters.location = locationPart
        propertyFilters.property_type = detectedPropertyType
      } else {
        // Solo tipo de propiedad sin ubicación clara
        propertyFilters.property_type = detectedPropertyType
      }
    } else {
      // Solo ubicación: "barranco" -> location=barranco
      propertyFilters.location = filters.location
    }
  }
  
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
  
  // Filtro Airbnb: usar rental_model = 'airbnb' para propiedades tipo Airbnb
  if (filters.airbnbEligible === true) {
    propertyFilters.rental_model = 'airbnb'
  }
  
  // Filtro por inmobiliaria
  if (filters.agencyId) {
    propertyFilters.agency_id = filters.agencyId
  }
  
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
    }
  }
  
  // Agregar amenities
  if (filters.amenities && filters.amenities.length > 0) {
    propertyFilters.amenities = filters.amenities
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
    // Caso especial: si el mode es "tipo_Airbnb", aplicar filtro de rental_model
    if (params.mode === 'tipo_Airbnb') {
      filters.rental_model = 'airbnb'
    } else {
      filters.operation = params.mode === 'alquiler' ? 'rent' : 
                        params.mode === 'comprar' ? 'sale' : 
                        params.mode === 'vender' ? 'sale' : 'rent'
    }
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
  
  // Filtro Airbnb: usar rental_model = 'airbnb' para propiedades tipo Airbnb
  if (params.airbnbEligible === true) {
    filters.rental_model = 'airbnb'
  }
  
  // Mapear agency_id (inmobiliaria)
  if (params.agency_id) {
    filters.agency_id = params.agency_id
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
    }
  }
  
  // Agregar paginación por defecto
  filters.page = 1
  filters.limit = 20
  filters.sort_by = 'published_at'
  filters.sort_order = 'desc'
  
  return filters
}

const SearchPage = () => {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [apiProperties, setApiProperties] = useState<PropertyResponse[]>([]); // Para el mapa
  const [loading, setLoading] = useState(true);
  
  // Inicializar filtros desde URL params
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>(() => {
    const params = router.query;
    return {
      location: params.location as string,
      propertyType: params.propertyType as string,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      bedrooms: params.bedrooms ? Number(params.bedrooms) : undefined,
      bathrooms: params.bathrooms ? Number(params.bathrooms) : undefined,
      minArea: params.minArea ? Number(params.minArea) : undefined,
      maxArea: params.maxArea ? Number(params.maxArea) : undefined,
      furnished: params.furnished === 'true' ? true : params.furnished === 'false' ? false : undefined,
      verified: params.verified === 'true' ? true : params.verified === 'false' ? false : undefined,
      rentalMode: params.rentalMode as string,
      petFriendly: params.petFriendly === 'true' ? true : params.petFriendly === 'false' ? false : undefined,
      // Convertir mode=tipo_Airbnb a airbnbEligible
      airbnbEligible: params.mode === 'tipo_Airbnb' ? true : params.airbnbEligible === 'true' ? true : undefined,
      agencyId: params.agency_id as string,
    };
  });
  
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
    console.log('🏠 ========================================');
    console.log('🏠 ABRIENDO MODAL/PÁGINA DE PROPIEDAD');
    console.log('🏠 ========================================');
    console.log('🏠 Property ID:', propertyId);
    
    // Buscar los datos de la propiedad en apiProperties
    const propertyData = apiProperties.find(p => p.id === propertyId);
    
    if (propertyData) {
      console.log('🏠 Datos de propiedad encontrados:', {
        id: propertyData.id,
        title: propertyData.title,
        slug: propertyData.slug
      });
      
      // Navegar a la página de la propiedad usando slug o ID
      const propertySlug = propertyData.slug || propertyId;
      router.push(`/propiedad/${propertySlug}`, undefined, { shallow: true });
    } else {
      console.log('⚠️ No se encontraron datos precargados, navegando con ID');
      router.push(`/propiedad/${propertyId}`, undefined, { shallow: true });
    }
    console.log('🏠 ========================================');
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
        console.log('⚠️ No se encontraron propiedades en el backend');
        setProperties([]);
        setApiProperties([]);
        return;
      }
      
      setApiProperties(apiPropertiesResponse);
      const convertedProperties = apiPropertiesResponse.map(convertToProperty);
      setProperties(convertedProperties);
      
      // Detectar propiedades tipo Airbnb usando rental_model = 'airbnb'
      const airbnbProperties = apiPropertiesResponse.filter(p => p.rental_model === 'airbnb');
      if (airbnbProperties.length > 0) {
        console.log('🏖️ ========================================')
        console.log('🏖️ PROPIEDADES TIPO AIRBNB ENCONTRADAS:', airbnbProperties.length)
        console.log('🏖️ ========================================')
        airbnbProperties.forEach(prop => {
          console.log('🏖️ ', {
            id: prop.id,
            title: prop.title,
            price: prop.price,
            rental_model: prop.rental_model,
            rental_term: prop.rental_term,
            status: prop.status
          });
        });
        console.log('🏖️ ========================================');
      }
      
      console.log('✅ Propiedades cargadas exitosamente');
    } catch (error) {
      console.error('❌ Error cargando propiedades:', error);
      setProperties([]);
      setApiProperties([]);
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
    // Actualizar filtros cuando cambian los parámetros de URL
    if (!router.isReady) return; // Esperar a que router esté listo
    
    const params = router.query;
    const urlFilters: SearchFilters = {
      location: params.location as string,
      propertyType: params.propertyType as string,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      bedrooms: params.bedrooms ? Number(params.bedrooms) : undefined,
      bathrooms: params.bathrooms ? Number(params.bathrooms) : undefined,
      minArea: params.minArea ? Number(params.minArea) : undefined,
      maxArea: params.maxArea ? Number(params.maxArea) : undefined,
      furnished: params.furnished === 'true' ? true : params.furnished === 'false' ? false : undefined,
      verified: params.verified === 'true' ? true : params.verified === 'false' ? false : undefined,
      rentalMode: params.rentalMode as string,
      petFriendly: params.petFriendly === 'true' ? true : params.petFriendly === 'false' ? false : undefined,
      // Convertir mode=tipo_Airbnb a airbnbEligible
      airbnbEligible: params.mode === 'tipo_Airbnb' ? true : params.airbnbEligible === 'true' ? true : undefined,
    };
    
    setCurrentFilters(urlFilters);
    
    // Debouncing: esperar 500ms antes de ejecutar la búsqueda
    const timeoutId = setTimeout(() => {
      loadProperties(urlFilters);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [router.isReady, router.query]);

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
    </>
  );
};

export default SearchPage;