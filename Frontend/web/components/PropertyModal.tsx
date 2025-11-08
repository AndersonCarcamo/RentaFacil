import React, { useEffect, useState } from 'react';
import { XMarkIcon, MapPinIcon, HomeIcon, CurrencyDollarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { fetchProperty, PropertyResponse } from '../lib/api/properties';
import dynamic from 'next/dynamic';
import ImageViewer from './ImageViewer';

// Importar mapa dinámicamente para evitar problemas con SSR
const PropertyMap = dynamic(() => import('./PropertyMap'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">Cargando mapa...</div>
});

interface PropertyModalProps {
  propertyId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PropertyModal: React.FC<PropertyModalProps> = ({ propertyId, isOpen, onClose }) => {
  const [property, setProperty] = useState<PropertyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    if (isOpen && propertyId) {
      loadProperty();
      setCarouselIndex(0); // Reset carousel when opening
    }
  }, [isOpen, propertyId]);

  // Auto-advance carousel
  useEffect(() => {
    if (!property || !isOpen) return;
    
    const images = getPropertyImages(property);
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % images.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [property, isOpen]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProperty(propertyId);
      setProperty(data);
    } catch (err) {
      console.error('Error loading property:', err);
      setError('Error al cargar la propiedad');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para el visor de imágenes
  const openImageViewer = (index: number = 0) => {
    setCurrentImageIndex(index);
    setIsImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setIsImageViewerOpen(false);
  };

  const nextImage = () => {
    if (property && currentImageIndex < getPropertyImages(property).length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const previousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  // Funciones para el carrusel
  const nextCarouselImage = () => {
    if (property) {
      const images = getPropertyImages(property);
      setCarouselIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevCarouselImage = () => {
    if (property) {
      const images = getPropertyImages(property);
      setCarouselIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Función auxiliar para obtener las imágenes de la propiedad
  const getPropertyImages = (property: PropertyResponse): string[] => {
    // Por ahora retornamos múltiples placeholders para simular el carrusel
    // Cuando tengas la API de media, puedes reemplazar esto con property.media_urls o similar
    return [
      '/images/properties/property-placeholder.svg',
      '/images/properties/property-placeholder.svg',
      '/images/properties/property-placeholder.svg'
    ];
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay - z-index muy alto para estar sobre bottom sheet y filtros */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998] transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[9999] overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-700" />
            </button>

            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : property ? (
              <div className="overflow-y-auto max-h-[90vh]">
                {/* Header Image Carousel */}
                <div className="relative h-96 bg-gray-200 group">
                  {/* Imagen actual */}
                  <div 
                    className="w-full h-full cursor-pointer"
                    onClick={() => openImageViewer(carouselIndex)}
                  >
                    <img
                      src={getPropertyImages(property)[carouselIndex]}
                      alt={`${property.title} - Imagen ${carouselIndex + 1}`}
                      className="w-full h-full object-cover transition-opacity duration-500"
                    />
                  </div>

                  {/* Overlay para indicar que es clickeable */}
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center pointer-events-none"
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-3">
                      <svg 
                        className="w-8 h-8 text-gray-800" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>

                  {/* Botones de navegación */}
                  {getPropertyImages(property).length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          prevCarouselImage();
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center text-gray-800 shadow-lg transition-all z-10"
                      >
                        <ChevronLeftIcon className="w-6 h-6" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          nextCarouselImage();
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center text-gray-800 shadow-lg transition-all z-10"
                      >
                        <ChevronRightIcon className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Indicadores de posición (dots) */}
                  {getPropertyImages(property).length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {getPropertyImages(property).map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCarouselIndex(index);
                          }}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === carouselIndex
                              ? 'bg-white w-6'
                              : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                          }`}
                          aria-label={`Ir a imagen ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Badge de verificación */}
                  {property.verification_status === 'verified' && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full shadow-lg">
                      ✓ Verificado
                    </div>
                  )}

                  {/* Contador de imágenes */}
                  {getPropertyImages(property).length > 1 && (
                    <div className={`absolute left-4 px-3 py-1 bg-black bg-opacity-60 text-white text-sm font-medium rounded-full shadow-lg ${
                      property.verification_status === 'verified' ? 'top-16' : 'top-4'
                    }`}>
                      {carouselIndex + 1} / {getPropertyImages(property).length}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-8">
                  {/* Title and Price */}
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {property.title}
                    </h1>
                    <div className="flex items-center gap-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5" />
                        <span>{property.district}, {property.department}</span>
                      </div>
                      {property.views_count && (
                        <span className="text-sm">
                          {property.views_count} vistas
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-8 p-6 bg-blue-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Precio</p>
                        <p className="text-4xl font-bold text-blue-600">
                          {property.currency} {property.price.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {property.operation === 'rent' ? 'por mes' : 'total'}
                        </p>
                      </div>
                      <CurrencyDollarIcon className="w-16 h-16 text-blue-600/20" />
                    </div>
                  </div>

                  {/* Property Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{property.bedrooms || 0}</p>
                      <p className="text-sm text-gray-600">Dormitorios</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{property.bathrooms || 0}</p>
                      <p className="text-sm text-gray-600">Baños</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{property.area_built || property.area_total || 0}</p>
                      <p className="text-sm text-gray-600">m² construidos</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{property.parking_spots || 0}</p>
                      <p className="text-sm text-gray-600">Estacionamiento</p>
                    </div>
                  </div>

                  {/* Description */}
                  {property.description && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción</h2>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {property.description}
                      </p>
                    </div>
                  )}

                  {/* Characteristics */}
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Características</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${property.furnished ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-gray-700">
                          {property.furnished ? 'Amoblado' : 'Sin amoblar'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${property.pet_friendly ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-gray-700">
                          {property.pet_friendly ? 'Acepta mascotas' : 'No acepta mascotas'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${property.is_airbnb_available ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-gray-700">
                          {property.is_airbnb_available ? 'Apto Airbnb' : 'No Airbnb'}
                        </span>
                      </div>
                      {property.rental_mode && (
                        <div className="flex items-center gap-2">
                          <HomeIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700 capitalize">
                            {property.rental_mode.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}
                      {property.airbnb_score && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">Score Airbnb: {property.airbnb_score}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location Details */}
                  {(property.address || property.latitude) && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Ubicación</h2>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        {property.address && (
                          <p className="text-gray-700 mb-2">{property.address}</p>
                        )}
                        <p className="text-gray-600">
                          {property.district}, {property.province}, {property.department}
                        </p>
                        
                        {/* Mapa de ubicación */}
                        {property.latitude && property.longitude && (
                          <div className="mt-4 h-64 rounded-lg overflow-hidden border border-gray-200">
                            <PropertyMap 
                              latitude={property.latitude} 
                              longitude={property.longitude}
                              address={property.address || `${property.district}, ${property.province}`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  <div className="border-t pt-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Información de contacto</h2>
                    <div className="flex gap-4">
                      <button className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Contactar
                      </button>
                      <button className="px-6 py-3 bg-[#25D366] text-white font-medium rounded-lg hover:bg-[#20BA5A] transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Image Viewer */}
      {property && (
        <ImageViewer
          images={getPropertyImages(property)}
          currentIndex={currentImageIndex}
          isOpen={isImageViewerOpen}
          onClose={closeImageViewer}
          onNext={nextImage}
          onPrevious={previousImage}
        />
      )}
    </>
  );
};

export default PropertyModal;
