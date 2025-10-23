import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import PropertyCardHorizontal from '../components/PropertyCardHorizontal';
import SearchFormCompact from '../components/SearchFormCompact';
import PropertyModal from '../components/PropertyModal';
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

interface SearchParams {
  [key: string]: string | string[] | undefined;
  location?: string;
  propertyType?: string;
  bedrooms?: string;
  bathrooms?: string;
  minPrice?: string;
  maxPrice?: string;
  furnished?: string;
  verified?: string;
  petFriendly?: string;
}

const SearchPage = () => {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [apiProperties, setApiProperties] = useState<PropertyResponse[]>([]); // Para el mapa
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openPropertyModal = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setIsModalOpen(true);
  };

  const closePropertyModal = () => {
    setIsModalOpen(false);
    setSelectedPropertyId(null);
  };

  useEffect(() => {
    // Obtener parámetros de búsqueda de la URL
    const params = router.query;
    setSearchParams(params);
    
    // Cargar datos reales desde la API
    const loadProperties = async () => {
      try {
        setLoading(true);
        console.log('🔍 === INICIO DE CARGA DE PROPIEDADES ===');
        console.log('🔍 Parámetros de URL recibidos:', params);
        console.log('🔍 API_BASE_URL configurada:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
        
        // Convertir parámetros de URL a filtros de API
        const filters = mapSearchParamsToFilters(params);
        console.log('🔍 Filtros API convertidos:', filters);
        console.log('🔍 Número de filtros aplicados:', Object.keys(filters).length);
        
        // Intentar llamar a la API
        console.log('🚀 Iniciando llamada a fetchProperties...');
        const apiPropertiesResponse = await fetchProperties(filters);
        console.log('✅ API RESPONSE - Propiedades recibidas:', apiPropertiesResponse?.length || 0);
        console.log('✅ API RESPONSE - Datos completos:', apiPropertiesResponse);
        
        if (!apiPropertiesResponse || apiPropertiesResponse.length === 0) {
          console.warn('⚠️ API retornó datos vacíos');
          setProperties([]);
          setApiProperties([]);
          return;
        }
        
        // Guardar las propiedades originales de la API (para el mapa)
        setApiProperties(apiPropertiesResponse);
        
        // Convertir a formato compatible
        console.log('🔄 Convirtiendo propiedades...');
        const convertedProperties = apiPropertiesResponse.map(convertToProperty);
        console.log('✅ Propiedades convertidas exitosamente:', convertedProperties.length);
        console.log('✅ Primera propiedad convertida:', convertedProperties[0]);
        
        setProperties(convertedProperties);
        console.log('🎉 Propiedades cargadas y establecidas en el estado');
      } catch (error) {
        console.error('❌ ERROR COMPLETO:', error);
        console.error('❌ Error tipo:', error?.constructor?.name);
        console.error('❌ Error mensaje:', (error as Error)?.message || 'Sin mensaje');
        console.error('❌ Error stack:', (error as Error)?.stack || 'Sin stack trace');
        
        // En caso de error, mostrar array vacío
        console.log('🔄 ERROR: No se pudieron cargar las propiedades');
        setProperties([]);
      } finally {
        setLoading(false);
        console.log('🏁 === FIN DE CARGA DE PROPIEDADES ===');
      }
    };
    
    loadProperties();
  }, [router.query]);

  // Ya no necesitamos filtrado local porque la API retorna resultados filtrados
  const filteredProperties = properties;

  return (
    <>
      <Head>
        <title>Resultados de Búsqueda - RENTA fácil</title>
        <meta name="description" content="Encuentra tu propiedad ideal en RENTA fácil" />
      </Head>
      
      <div className="min-h-screen bg-[#F5C842] relative">
        {/* Textura de fondo con iconos */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="property-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                {/* Casa */}
                <path d="M50 80 L50 100 L30 100 L30 80 L40 70 L50 80 Z M35 85 L35 95 L38 95 L38 85 Z M42 85 L42 95 L45 95 L45 85 Z" fill="currentColor"/>
                
                {/* Llave */}
                <path d="M120 30 C120 27 122 25 125 25 C128 25 130 27 130 30 C130 33 128 35 125 35 L125 50 L122 50 L122 35 C119 35 117 33 117 30 Z M125 40 L127 40 L127 42 L125 42 Z M125 44 L127 44 L127 46 L125 46 Z" fill="currentColor"/>
                
                {/* Edificio/Departamento */}
                <path d="M160 60 L160 100 L140 100 L140 60 Z M145 65 L148 65 L148 70 L145 70 Z M152 65 L155 65 L155 70 L152 70 Z M145 75 L148 75 L148 80 L145 80 Z M152 75 L155 75 L155 80 L152 80 Z M145 85 L148 85 L148 90 L145 90 Z M152 85 L155 85 L155 90 L152 90 Z" fill="currentColor"/>
                
                {/* Casa 2 */}
                <path d="M180 120 L180 140 L160 140 L160 120 L170 110 L180 120 Z M165 125 L165 135 L168 135 L168 125 Z M172 125 L172 135 L175 135 L175 125 Z" fill="currentColor"/>
                
                {/* Llave 2 */}
                <path d="M40 160 C40 157 42 155 45 155 C48 155 50 157 50 160 C50 163 48 165 45 165 L45 180 L42 180 L42 165 C39 165 37 163 37 160 Z M45 170 L47 170 L47 172 L45 172 Z M45 174 L47 174 L47 176 L45 176 Z" fill="currentColor"/>
                
                {/* Edificio 2 */}
                <path d="M90 140 L90 180 L70 180 L70 140 Z M75 145 L78 145 L78 150 L75 150 Z M82 145 L85 145 L85 150 L82 150 Z M75 155 L78 155 L78 160 L75 160 Z M82 155 L85 155 L85 160 L82 160 Z M75 165 L78 165 L78 170 L75 170 Z M82 165 L85 165 L85 170 L82 170 Z" fill="currentColor"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#property-pattern)"/>
          </svg>
        </div>

        <Header />
        
        {/* Search Form Sticky */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <SearchFormCompact 
              onSearch={(params) => {
                // Construir nueva URL con parámetros de búsqueda
                const searchParams = new URLSearchParams();
                
                Object.entries(params).forEach(([key, value]) => {
                  if (value !== undefined && value !== null && value !== '') {
                    searchParams.set(key, value.toString());
                  }
                });
                
                // Navegar a nueva URL con parámetros
                router.push(`/search?${searchParams.toString()}`);
              }}
              isLoading={loading}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
          <div className="flex gap-6 h-[calc(100vh-200px)]">
            {/* Mapa - Lado Izquierdo */}
            <div className="w-2/5 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-4">
              <div className="h-full">
                <MapView 
                  listings={apiProperties} 
                  onMarkerClick={openPropertyModal}
                />
              </div>
            </div>

            {/* Resultados - Lado Derecho */}
            <div className="w-3/5">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-6 h-full overflow-hidden flex flex-col">
                {/* Header de Resultados */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Resultados de Búsqueda
                  </h2>
                  <p className="text-gray-600">
                    {loading ? 'Cargando...' : `${filteredProperties.length} propiedades encontradas`}
                  </p>
                </div>

                {/* Lista de Propiedades */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse h-48 bg-gray-200 rounded-xl"></div>
                      ))}
                    </div>
                  ) : filteredProperties.length > 0 ? (
                    filteredProperties
                      .sort((a, b) => b.rating - a.rating)
                      .map((property) => (
                        <div key={property.id} className="transform transition-transform hover:scale-[1.02]">
                          <PropertyCardHorizontal 
                            property={property}
                            onClick={openPropertyModal}
                          />
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No se encontraron propiedades
                      </h3>
                      <p className="text-gray-500 text-sm">
                        Intenta ajustar tus filtros de búsqueda para ver más resultados
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Property Modal */}
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