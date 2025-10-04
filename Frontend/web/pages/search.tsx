import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import PropertyCard from '../components/PropertyCard';
import SearchForm from '../components/SearchFormExtended';
import { Property } from '../types/index';
import { fetchProperties, PropertyFilters, PropertyResponse } from '../lib/api/properties';

// Importar el Header original
import { Header } from '../components/Header';

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

// Componente del Mapa (Mock)
const MapComponent = () => {
  return (
    <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23374151' stroke-width='1'%3E%3Cpath d='M10 10h40M10 20h40M10 30h40M10 40h40M10 50h40'/%3E%3Cpath d='M10 10v40M20 10v40M30 10v40M40 10v40M50 10v40'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Mock Map Content */}
      <div className="text-center z-10">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Mapa Interactivo</h3>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          Aquí se mostrará el mapa con las ubicaciones de las propiedades encontradas
        </p>
        
        {/* Mock Map Pins */}
        <div className="absolute top-20 left-16 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
        <div className="absolute top-32 right-24 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
        <div className="absolute bottom-32 left-32 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
        <div className="absolute bottom-20 right-16 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
      </div>
    </div>
  );
};

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
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<SearchParams>({});

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
        const apiProperties = await fetchProperties(filters);
        console.log('✅ API RESPONSE - Propiedades recibidas:', apiProperties?.length || 0);
        console.log('✅ API RESPONSE - Datos completos:', apiProperties);
        
        if (!apiProperties || apiProperties.length === 0) {
          console.warn('⚠️ API retornó datos vacíos');
          setProperties([]);
          return;
        }
        
        // Convertir a formato compatible
        console.log('🔄 Convirtiendo propiedades...');
        const convertedProperties = apiProperties.map(convertToProperty);
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
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Search Form Sticky */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <SearchForm 
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
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-6 h-[calc(100vh-200px)]">
            {/* Mapa - Lado Izquierdo */}
            <div className="w-1/2 bg-white rounded-lg shadow-lg p-4">
              <div className="h-full">
                <MapComponent />
              </div>
            </div>

            {/* Resultados - Lado Derecho */}
            <div className="w-1/2">
              <div className="bg-white rounded-lg shadow-lg p-6 h-full overflow-hidden flex flex-col">
                {/* Header de Resultados */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Resultados de Búsqueda
                  </h2>
                  <p className="text-gray-600">
                    {loading ? 'Cargando...' : `${filteredProperties.length} propiedades encontradas`}
                  </p>
                  
                  {/* Filtros Activos */}
                  {Object.keys(searchParams).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.entries(searchParams).map(([key, value]) => (
                        value && (
                          <span 
                            key={key}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                          >
                            {key}: {value.toString()}
                            <button
                              onClick={() => {
                                const newQuery = { ...router.query };
                                delete newQuery[key];
                                router.push({ pathname: '/search', query: newQuery });
                              }}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        )
                      ))}
                    </div>
                  )}
                </div>

                {/* Lista de Propiedades */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-32 bg-gray-200 rounded-lg mb-3"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredProperties.length > 0 ? (
                    filteredProperties
                      .sort((a, b) => b.rating - a.rating)
                      .map((property) => (
                        <div key={property.id} className="transform transition-transform hover:scale-105">
                          <PropertyCard property={property} />
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
    </>
  );
};

export default SearchPage;