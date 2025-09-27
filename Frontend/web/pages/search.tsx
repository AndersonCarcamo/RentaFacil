import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import PropertyCard from '../components/PropertyCard';
import SearchForm from '../components/SearchForm';
import { Property } from '../types/index';

// Importar el Header original
import { Header } from '../components/Header';

// Mock data para las propiedades
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
    
    // Simular carga de datos
    setTimeout(() => {
      setProperties(mockProperties);
      setLoading(false);
    }, 1000);
  }, [router.query]);

  const filteredProperties = properties.filter(property => {
    // Filtrar por parámetros de búsqueda
    if (searchParams.location && !property.location.toLowerCase().includes(searchParams.location.toLowerCase())) {
      return false;
    }
    if (searchParams.propertyType && property.propertyType !== searchParams.propertyType) {
      return false;
    }
    if (searchParams.bedrooms && property.bedrooms < parseInt(searchParams.bedrooms)) {
      return false;
    }
    if (searchParams.bathrooms && property.bathrooms < parseInt(searchParams.bathrooms)) {
      return false;
    }
    if (searchParams.minPrice && property.price < parseInt(searchParams.minPrice)) {
      return false;
    }
    if (searchParams.maxPrice && property.price > parseInt(searchParams.maxPrice)) {
      return false;
    }
    if (searchParams.verified === 'true' && !property.isVerified) {
      return false;
    }
    // Note: furnished y petFriendly no están en el tipo Property actual, 
    // se pueden agregar como amenities o features si es necesario
    return true;
  });

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
            <SearchForm />
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