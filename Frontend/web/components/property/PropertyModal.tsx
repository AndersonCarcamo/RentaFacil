import React, { useEffect, useState } from 'react';
import { 
  XMarkIcon, 
  MapPinIcon, 
  HomeIcon, 
  CurrencyDollarIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  SparklesIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { fetchProperty, PropertyResponse } from '../../lib/api/properties';
import dynamic from 'next/dynamic';
import ImageViewer from '../ui/ImageViewer';
import { BookingModal } from '../booking';
import toast from 'react-hot-toast';
import { analyticsService } from '../../services/analyticsService';

// Importar mapa dinámicamente para evitar problemas con SSR
const PropertyMap = dynamic(() => import('../maps/PropertyMap'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">Cargando mapa...</div>
});

interface PropertyModalProps {
  propertyId: string;
  isOpen: boolean;
  onClose: () => void;
  propertyData?: PropertyResponse; // Datos opcionales de la propiedad para evitar llamada al backend
}

interface ContactSettings {
  whatsapp?: {
    enabled: boolean;
    number?: string;
  };
  phone?: {
    enabled: boolean;
    number?: string;
  };
  email?: {
    enabled: boolean;
    address?: string;
  };
  contactName?: string;
}

const PropertyModal: React.FC<PropertyModalProps> = ({ propertyId, isOpen, onClose, propertyData }) => {
  const [property, setProperty] = useState<PropertyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [contactSettings, setContactSettings] = useState<ContactSettings | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Manejar clase modal-open en body para z-index de mapa
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // 🔍 DEBUG: Verificar que este modal se está usando
  useEffect(() => {
    if (isOpen && propertyId) {
      console.log('🏠 PropertyModal abierto:', {
        propertyId,
        hasPropertyData: !!propertyData,
        component: 'components/property/PropertyModal.tsx'
      });
    }
  }, [isOpen, propertyId, propertyData]);

  useEffect(() => {
    if (isOpen && propertyId) {
      // Si se pasaron datos de la propiedad, usarlos directamente
      if (propertyData) {
        console.log('📦 PropertyModal - Usando datos precargados:', propertyData.title);
        setProperty(propertyData);
        setLoading(false);
        setError(null);
      } else {
        // Si no, cargar desde el backend
        console.log('🔄 PropertyModal - Cargando desde API:', propertyId);
        loadProperty();
      }
      loadContactSettings();
      setCarouselIndex(0); // Reset carousel when opening
    }
  }, [isOpen, propertyId, propertyData]);

  const loadContactSettings = () => {
    try {
      const stored = localStorage.getItem('contactSettings');
      if (stored) {
        setContactSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading contact settings:', error);
    }
  };

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
    // Si la propiedad tiene imágenes, las usamos
    if (property.images && property.images.length > 0) {
      // Ordenar por is_main primero, luego por display_order
      const sortedImages = [...property.images].sort((a, b) => {
        if (a.is_main && !b.is_main) return -1;
        if (!a.is_main && b.is_main) return 1;
        return (a.display_order || 0) - (b.display_order || 0);
      });
      
      // Retornar las URLs (preferir medium_url si existe, si no original_url)
      return sortedImages.map(img => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const imageUrl = img.medium_url || img.original_url || img.url;
        // Si la URL ya tiene el protocolo, la usamos tal cual, si no, la construimos
        return imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
      });
    }
    
    // Si no hay imágenes, retornar placeholder
    return ['/images/properties/property-placeholder.svg'];
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
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
                  {/* Title and Location */}
                  <div className="mb-6 border-b border-gray-100 pb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
                      {property.title}
                    </h1>
                    <div className="flex items-center gap-4 text-gray-600 flex-wrap">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
                        <MapPinIcon className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium">{property.district}, {property.department}</span>
                      </div>
                      {property.views_count && property.views_count > 0 && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>{property.views_count} vistas</span>
                        </div>
                      )}
                      {property.property_type && (
                        <span className="text-sm px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">
                          {property.property_type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price - Diseño renovado */}
                  <div className="mb-8">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 p-6 shadow-lg">
                      <div className="relative z-10">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-sm text-indigo-100 mb-2 font-medium">
                              {property.operation === 'rent' ? 'Renta mensual' : 'Precio de venta'}
                            </p>
                            <p className="text-5xl font-bold text-white mb-1 tracking-tight">
                              {property.currency} {property.price.toLocaleString()}
                            </p>
                            {property.operation === 'rent' && property.rental_term && property.rental_term !== 'monthly' && (
                              <p className="text-sm text-indigo-100">
                                {property.rental_term === 'daily' && 'por noche'}
                                {property.rental_term === 'weekly' && 'por semana'}
                                {property.rental_term === 'yearly' && 'por año'}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                              <CurrencyDollarIcon className="w-10 h-10 text-white/90" />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Elementos decorativos */}
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-purple-400/10 rounded-full blur-xl"></div>
                    </div>
                  </div>

                  {/* Property Details Grid - Rediseñado */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-md">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-[3rem] transition-all group-hover:bg-indigo-100"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{property.bedrooms || 0}</p>
                        <p className="text-sm text-gray-600 font-medium">Dormitorios</p>
                      </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-[3rem] transition-all group-hover:bg-blue-100"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{property.bathrooms || 0}</p>
                        <p className="text-sm text-gray-600 font-medium">Baños</p>
                      </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-emerald-300 hover:shadow-md">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-[3rem] transition-all group-hover:bg-emerald-100"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{property.area_built || property.area_total || 0}</p>
                        <p className="text-sm text-gray-600 font-medium">m² {property.area_built ? 'construidos' : 'totales'}</p>
                      </div>
                    </div>

                    {property.area_total && property.area_built && property.area_total !== property.area_built ? (
                      <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-amber-300 hover:shadow-md">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-[3rem] transition-all group-hover:bg-amber-100"></div>
                        <div className="relative">
                          <div className="flex items-center justify-between mb-2">
                            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                          </div>
                          <p className="text-3xl font-bold text-gray-900 mb-1">{property.area_total}</p>
                          <p className="text-sm text-gray-600 font-medium">m² totales</p>
                        </div>
                      </div>
                    ) : (
                      <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-purple-300 hover:shadow-md">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-[3rem] transition-all group-hover:bg-purple-100"></div>
                        <div className="relative">
                          <div className="flex items-center justify-between mb-2">
                            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <p className="text-3xl font-bold text-gray-900 mb-1">{property.parking_spots || 0}</p>
                          <p className="text-sm text-gray-600 font-medium">Estacionamiento</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Segunda fila de detalles si hay área total diferente */}
                  {property.area_total && property.area_built && property.area_total !== property.area_built && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{property.parking_spots || 0}</p>
                        <p className="text-sm text-gray-600">Estacionamiento</p>
                      </div>
                      {property.floors && (
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-gray-900">{property.floors}</p>
                          <p className="text-sm text-gray-600">Pisos totales</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description - Rediseñado */}
                  {property.description && (
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-gray-900">Descripción</h2>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {property.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Características Principales - Rediseñado */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                      <h2 className="text-2xl font-bold text-gray-900">Características</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        property.furnished 
                          ? 'border-emerald-200 bg-emerald-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          property.furnished ? 'bg-emerald-100' : 'bg-gray-200'
                        }`}>
                          {property.furnished ? (
                            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {property.furnished ? 'Amoblado' : 'Sin amoblar'}
                          </p>
                          <p className="text-xs text-gray-500">Mobiliario</p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        property.pet_friendly 
                          ? 'border-amber-200 bg-amber-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          property.pet_friendly ? 'bg-amber-100' : 'bg-gray-200'
                        }`}>
                          {property.pet_friendly ? (
                            <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {property.pet_friendly ? 'Acepta mascotas' : 'No acepta mascotas'}
                          </p>
                          <p className="text-xs text-gray-500">Política de mascotas</p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        property.is_airbnb_available 
                          ? 'border-rose-200 bg-rose-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          property.is_airbnb_available ? 'bg-rose-100' : 'bg-gray-200'
                        }`}>
                          {property.is_airbnb_available ? (
                            <svg className="w-5 h-5 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {property.is_airbnb_available ? 'Apto Airbnb' : 'No Airbnb'}
                          </p>
                          <p className="text-xs text-gray-500">Alquiler temporal</p>
                        </div>
                      </div>

                      {property.rental_mode && (
                        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-blue-200 bg-blue-50">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <HomeIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 capitalize">
                              {property.rental_mode.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-gray-500">Modo de alquiler</p>
                          </div>
                        </div>
                      )}

                      {property.age_years !== null && property.age_years !== undefined && (
                        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-white">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {property.age_years === 0 ? 'A estrenar' : `${property.age_years} años`}
                            </p>
                            <p className="text-xs text-gray-500">Antigüedad</p>
                          </div>
                        </div>
                      )}

                      {property.floor_number && (
                        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-white">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Piso {property.floor_number}</p>
                            <p className="text-xs text-gray-500">Nivel</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amenidades - Rediseñado */}
                  {property.amenities && property.amenities.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          <SparklesIcon className="w-6 h-6 text-indigo-600" />
                          Amenidades
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {property.amenities.map((amenity, index) => (
                          <div 
                            key={amenity.id || index} 
                            className="group flex items-center gap-3 p-4 rounded-xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 hover:border-indigo-300 hover:shadow-md transition-all"
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                              <CheckCircleIcon className="w-6 h-6 text-indigo-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{amenity.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Costos Adicionales - Rediseñado */}
                  {(property.maintenance_fee || property.hoa_fee || property.utilities_included !== null || 
                    property.internet_included !== null || property.cleaning_fee || property.deposit_amount) && (
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-gray-900">Costos Adicionales</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {property.maintenance_fee && (
                          <div className="group relative overflow-hidden rounded-xl border-2 border-blue-100 bg-white p-5 hover:border-blue-300 hover:shadow-md transition-all">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-[3rem] opacity-50"></div>
                            <div className="relative">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <p className="text-sm font-medium text-gray-600">Mantenimiento</p>
                              </div>
                              <p className="text-2xl font-bold text-gray-900">
                                {property.currency} {property.maintenance_fee.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">Mensual</p>
                            </div>
                          </div>
                        )}
                        {property.hoa_fee && (
                          <div className="group relative overflow-hidden rounded-xl border-2 border-emerald-100 bg-white p-5 hover:border-emerald-300 hover:shadow-md transition-all">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-[3rem] opacity-50"></div>
                            <div className="relative">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p className="text-sm font-medium text-gray-600">Cuota HOA</p>
                              </div>
                              <p className="text-2xl font-bold text-gray-900">
                                {property.currency} {property.hoa_fee.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">Mensual</p>
                            </div>
                          </div>
                        )}
                        {property.utilities_included !== null && (
                          <div className={`group relative overflow-hidden rounded-xl border-2 p-5 transition-all ${
                            property.utilities_included 
                              ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-300' 
                              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                property.utilities_included ? 'bg-emerald-100' : 'bg-gray-200'
                              }`}>
                                {property.utilities_included ? (
                                  <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Servicios</p>
                                <p className="text-lg font-bold text-gray-900">
                                  {property.utilities_included ? 'Incluidos' : 'No incluidos'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        {property.internet_included !== null && property.internet_included !== undefined && (
                          <div className={`group relative overflow-hidden rounded-xl border-2 p-5 transition-all ${
                            property.internet_included 
                              ? 'border-blue-200 bg-blue-50 hover:border-blue-300' 
                              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                property.internet_included ? 'bg-blue-100' : 'bg-gray-200'
                              }`}>
                                {property.internet_included ? (
                                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                                  </svg>
                                ) : (
                                  <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Internet/WiFi</p>
                                <p className="text-lg font-bold text-gray-900">
                                  {property.internet_included ? 'Incluido' : 'No incluido'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        {property.cleaning_fee && (
                          <div className="group relative overflow-hidden rounded-xl border-2 border-purple-100 bg-white p-5 hover:border-purple-300 hover:shadow-md transition-all">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-[3rem] opacity-50"></div>
                            <div className="relative">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                                <p className="text-sm font-medium text-gray-600">Limpieza</p>
                              </div>
                              <p className="text-2xl font-bold text-gray-900">
                                {property.currency} {property.cleaning_fee.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">Por estadía</p>
                            </div>
                          </div>
                        )}
                        {property.deposit_amount && (
                          <div className="group relative overflow-hidden rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 hover:border-amber-300 hover:shadow-md transition-all">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-100 rounded-bl-[3rem] opacity-50"></div>
                            <div className="relative">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <p className="text-sm font-medium text-amber-700">Depósito de Garantía</p>
                              </div>
                              <p className="text-2xl font-bold text-amber-900">
                                {property.currency} {property.deposit_amount.toLocaleString()}
                              </p>
                              <p className="text-xs text-amber-600 mt-1">Reembolsable</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Información de Alquiler - Solo para Airbnb o propiedades con datos relevantes */}
                  {(property.rental_model === 'airbnb' || 
                    property.check_in_time || 
                    property.check_out_time || 
                    property.house_rules || 
                    property.cancellation_policy || 
                    property.max_guests || 
                    (property.minimum_stay_nights && property.minimum_stay_nights > 1) ||
                    property.maximum_stay_nights) && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        {property.rental_model === 'airbnb' ? (
                          <>
                            <BuildingOfficeIcon className="w-6 h-6 text-purple-600" />
                            <span>Información de Alquiler Tipo Airbnb</span>
                          </>
                        ) : (
                          <>
                            <HomeIcon className="w-6 h-6 text-blue-600" />
                            <span>Información de Alquiler</span>
                          </>
                        )}
                      </h2>
                      
                      <div className={`p-6 rounded-lg border-2 ${property.rental_model === 'airbnb' ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
                        {/* Tipo de alquiler y modalidad */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          {property.rental_model && (
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Modelo</p>
                              <p className="text-lg font-semibold text-gray-900 capitalize">
                                {property.rental_model === 'airbnb' ? '🏠 Airbnb' : '🏘️ Tradicional'}
                              </p>
                            </div>
                          )}
                          {property.rental_term && (
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Periodo</p>
                              <p className="text-lg font-semibold text-gray-900 capitalize">
                                {property.rental_term === 'daily' && '📅 Diario'}
                                {property.rental_term === 'weekly' && '📅 Semanal'}
                                {property.rental_term === 'monthly' && '📅 Mensual'}
                                {property.rental_term === 'yearly' && '📅 Anual'}
                              </p>
                            </div>
                          )}
                          {property.max_guests && (
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Capacidad</p>
                              <p className="text-lg font-semibold text-gray-900">
                                👥 {property.max_guests} {property.max_guests === 1 ? 'huésped' : 'huéspedes'}
                              </p>
                            </div>
                          )}
                          {/* Solo mostrar minimum_stay_nights si es mayor a 1 (no es el valor por defecto) */}
                          {property.minimum_stay_nights && property.minimum_stay_nights > 1 && (
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Estancia Mínima</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {property.minimum_stay_nights} {property.minimum_stay_nights === 1 ? 'noche' : 'noches'}
                              </p>
                            </div>
                          )}
                          {property.maximum_stay_nights && (
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Estancia Máxima</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {property.maximum_stay_nights} noches
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Horarios de check-in/out */}
                        {(property.check_in_time || property.check_out_time) && (
                          <div className="mb-6 p-4 bg-white rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-3">🕐 Horarios</h3>
                            <div className="grid grid-cols-2 gap-4">
                              {property.check_in_time && (
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Check-in</p>
                                  <p className="text-lg font-semibold text-green-700">
                                    ✓ {property.check_in_time}
                                  </p>
                                </div>
                              )}
                              {property.check_out_time && (
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Check-out</p>
                                  <p className="text-lg font-semibold text-red-700">
                                    ✗ {property.check_out_time}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Máximo de huéspedes */}
                        {property.max_guests && (
                          <div className="mb-6 p-4 bg-white rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Capacidad Máxima</p>
                            <p className="text-xl font-bold text-gray-900">
                              👥 {property.max_guests} {property.max_guests === 1 ? 'huésped' : 'huéspedes'}
                            </p>
                          </div>
                        )}

                        {/* Disponible desde */}
                        {property.available_from && (
                          <div className="mb-6 p-4 bg-white rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Disponible desde</p>
                            <p className="text-lg font-semibold text-gray-900">
                              📅 {new Date(property.available_from).toLocaleDateString('es-PE', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        )}

                        {/* Reglas de la casa */}
                        {property.house_rules && (
                          <div className="mb-6 p-4 bg-white rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-3">📋 Reglas de la Casa</h3>
                            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                              {property.house_rules}
                            </p>
                          </div>
                        )}

                        {/* Política de cancelación */}
                        {property.cancellation_policy && (
                          <div className="p-4 bg-white rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-2">🔄 Política de Cancelación</h3>
                            <p className="text-lg font-semibold text-gray-900 capitalize">
                              {property.cancellation_policy === 'flexible' && '✅ Flexible'}
                              {property.cancellation_policy === 'moderate' && '⚠️ Moderada'}
                              {property.cancellation_policy === 'strict' && '❌ Estricta'}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {property.cancellation_policy === 'flexible' && 'Reembolso completo hasta 24 horas antes del check-in'}
                              {property.cancellation_policy === 'moderate' && 'Reembolso completo hasta 5 días antes del check-in'}
                              {property.cancellation_policy === 'strict' && 'Reembolso del 50% hasta 30 días antes del check-in'}
                            </p>
                          </div>
                        )}

                        {/* Servicios incluidos */}
                        {(property.cleaning_included !== null || property.smoking_allowed !== null) && (
                          <div className="mt-6 grid grid-cols-2 gap-3">
                            {property.cleaning_included !== null && property.cleaning_included !== undefined && (
                              <div className={`p-3 rounded-lg flex items-center gap-2 ${property.cleaning_included ? 'bg-green-100' : 'bg-gray-100'}`}>
                                <span className="text-lg">{property.cleaning_included ? '✓' : '✗'}</span>
                                <span className="text-sm font-medium text-gray-700">Limpieza incluida</span>
                              </div>
                            )}
                            {property.smoking_allowed !== null && property.smoking_allowed !== undefined && (
                              <div className={`p-3 rounded-lg flex items-center gap-2 ${property.smoking_allowed ? 'bg-amber-100' : 'bg-green-100'}`}>
                                <span className="text-lg">{property.smoking_allowed ? '🚬' : '🚭'}</span>
                                <span className="text-sm font-medium text-gray-700">
                                  {property.smoking_allowed ? 'Se permite fumar' : 'No se permite fumar'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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

                  {/* Botón de Reserva - Solo para propiedades tipo Airbnb */}
                  {property.rental_term === 'daily' && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">🏠</span>
                            <h3 className="text-xl font-bold text-gray-900">Reserva Ahora</h3>
                          </div>
                          <p className="text-gray-700 mb-1">
                            <span className="text-3xl font-bold text-purple-600">
                              {property.currency} {property.price.toLocaleString()}
                            </span>
                            <span className="text-gray-600 ml-2">por noche</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            💳 Pago dividido: 50% al reservar, 50% al check-in
                          </p>
                          {property.minimum_stay_nights && property.minimum_stay_nights > 1 && (
                            <p className="text-sm text-gray-600 mt-1">
                              📅 Estancia mínima: {property.minimum_stay_nights} {property.minimum_stay_nights === 1 ? 'noche' : 'noches'}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            console.log('🎯 Abriendo BookingModal para propiedad:', {
                              id: property.id,
                              title: property.title,
                              rental_term: property.rental_term,
                              max_guests: property.max_guests,
                              price: property.price
                            });
                            setIsBookingModalOpen(true);
                          }}
                          className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                          <span className="text-xl">📅</span>
                          <span>Reservar Ahora</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  <div className="border-t pt-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Información de contacto</h2>
                    
                    {/* Nombre de contacto */}
                    {(property.contact_name || contactSettings?.contactName) && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Contacto</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {property.contact_name || contactSettings?.contactName}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* WhatsApp */}
                      {(() => {
                        const whatsappNumber = property.contact_whatsapp_phone_e164 || contactSettings?.whatsapp?.number;
                        const hasWhatsApp = contactSettings?.whatsapp?.enabled && whatsappNumber;
                        
                        return hasWhatsApp ? (
                          <a
                            href={`https://wa.me/${whatsappNumber.replace(/\+/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              if (property?.id) {
                                analyticsService.trackContact(property.id, 'whatsapp');
                              }
                            }}
                            className="px-6 py-3 bg-[#25D366] text-white font-medium rounded-lg hover:bg-[#20BA5A] transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                          >
                            <DevicePhoneMobileIcon className="w-5 h-5" />
                            WhatsApp
                          </a>
                        ) : null;
                      })()}

                      {/* Teléfono */}
                      {(() => {
                        const phoneNumber = property.contact_phone_e164 || contactSettings?.phone?.number;
                        const hasPhone = contactSettings?.phone?.enabled && phoneNumber;
                        
                        return hasPhone ? (
                          <a
                            href={`tel:${phoneNumber}`}
                            onClick={() => {
                              if (property?.id) {
                                analyticsService.trackContact(property.id, 'phone');
                              }
                            }}
                            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                          >
                            <PhoneIcon className="w-5 h-5" />
                            Llamar
                          </a>
                        ) : null;
                      })()}

                      {/* Email */}
                      {(() => {
                        const emailAddress = property.contact_email || contactSettings?.email?.address;
                        const hasEmail = contactSettings?.email?.enabled && emailAddress;
                        
                        return hasEmail ? (
                          <a
                            href={`mailto:${emailAddress}`}
                            onClick={() => {
                              if (property?.id) {
                                analyticsService.trackContact(property.id, 'email');
                              }
                            }}
                            className="px-6 py-3 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                          >
                            <EnvelopeIcon className="w-5 h-5" />
                            Email
                          </a>
                        ) : null;
                      })()}
                    </div>

                    {/* Mensaje si no hay métodos de contacto */}
                    {!((contactSettings?.whatsapp?.enabled && (property.contact_whatsapp_phone_e164 || contactSettings?.whatsapp?.number)) ||
                       (contactSettings?.phone?.enabled && (property.contact_phone_e164 || contactSettings?.phone?.number)) ||
                       (contactSettings?.email?.enabled && (property.contact_email || contactSettings?.email?.address))) && (
                      <div className="p-6 bg-gray-50 rounded-lg text-center">
                        <p className="text-gray-500">
                          El propietario no ha configurado métodos de contacto para esta propiedad.
                        </p>
                      </div>
                    )}
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

      {/* Booking Modal - Solo para propiedades Airbnb */}
      {property && property.rental_term === 'daily' && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            console.log('❌ Cerrando BookingModal');
            setIsBookingModalOpen(false);
          }}
          listing={{
            id: property.id,
            title: property.title,
            images: getPropertyImages(property),
            pricePerNight: property.price,
            minimumNights: property.minimum_stay_nights || 1,
            maxGuests: property.max_guests || 2,
            hostName: property.contact_name || property.agency?.name || 'Anfitrión'
          }}
          onSuccess={() => {
            console.log('✅ Reserva creada exitosamente');
            setIsBookingModalOpen(false);
            toast.success('¡Reserva creada exitosamente! El anfitrión debe confirmarla.');
            // Opcional: Redirigir a la página de reservas
            // window.location.href = '/bookings';
          }}
        />
      )}
    </>
  );
};

export default PropertyModal;
