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
        className="fixed inset-0 bg-black/50 z-[400] transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[450] overflow-y-auto">
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
                      <p className="text-sm text-gray-600">m² {property.area_built ? 'construidos' : 'totales'}</p>
                    </div>
                    {property.area_total && property.area_built && property.area_total !== property.area_built ? (
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{property.area_total}</p>
                        <p className="text-sm text-gray-600">m² totales</p>
                      </div>
                    ) : (
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{property.parking_spots || 0}</p>
                        <p className="text-sm text-gray-600">Estacionamiento</p>
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

                  {/* Description */}
                  {property.description && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción</h2>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {property.description}
                      </p>
                    </div>
                  )}

                  {/* Características Principales */}
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
                      {property.age_years !== null && property.age_years !== undefined && (
                        <div className="flex items-center gap-2">
                          <HomeIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">
                            {property.age_years === 0 ? 'Nueva construcción' : `${property.age_years} años`}
                          </span>
                        </div>
                      )}
                      {property.floor_number && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">Piso {property.floor_number}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amenidades */}
                  {property.amenities && property.amenities.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-blue-600" />
                        Amenidades
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {property.amenities.map((amenity, index) => (
                          <div key={amenity.id || index} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                            <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <span className="text-gray-700">{amenity.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Costos Adicionales */}
                  {(property.maintenance_fee || property.hoa_fee || property.utilities_included !== null) && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Costos Adicionales</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {property.maintenance_fee && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Mantenimiento</p>
                            <p className="text-xl font-bold text-gray-900">
                              {property.currency} {property.maintenance_fee.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {property.hoa_fee && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Cuota HOA</p>
                            <p className="text-xl font-bold text-gray-900">
                              {property.currency} {property.hoa_fee.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {property.utilities_included !== null && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Servicios</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {property.utilities_included ? '✓ Incluidos' : '✗ No incluidos'}
                            </p>
                          </div>
                        )}
                        {property.internet_included !== null && property.internet_included !== undefined && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Internet</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {property.internet_included ? '✓ Incluido' : '✗ No incluido'}
                            </p>
                          </div>
                        )}
                        {property.cleaning_fee && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Tarifa de Limpieza</p>
                            <p className="text-xl font-bold text-gray-900">
                              {property.currency} {property.cleaning_fee.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {property.deposit_amount && (
                          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-sm text-amber-600 mb-1">Depósito de Garantía</p>
                            <p className="text-xl font-bold text-amber-900">
                              {property.currency} {property.deposit_amount.toLocaleString()}
                            </p>
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
