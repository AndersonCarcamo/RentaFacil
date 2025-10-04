import React, { useEffect, useState } from 'react';
import { XMarkIcon, MapPinIcon, HomeIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { fetchProperty, PropertyResponse } from '../lib/api/properties';

interface PropertyModalProps {
  propertyId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PropertyModal: React.FC<PropertyModalProps> = ({ propertyId, isOpen, onClose }) => {
  const [property, setProperty] = useState<PropertyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && propertyId) {
      loadProperty();
    }
  }, [isOpen, propertyId]);

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

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
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
                {/* Header Image */}
                <div className="relative h-96 bg-gray-200">
                  <img
                    src="/images/properties/property-placeholder.svg"
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  {property.verification_status === 'verified' && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full">
                      ✓ Verificado
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
                        {property.latitude && property.longitude && (
                          <p className="text-sm text-gray-500 mt-2">
                            Coordenadas: {property.latitude}, {property.longitude}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  <div className="border-t pt-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Información de contacto</h2>
                    <div className="flex gap-4">
                      <button className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        Contactar
                      </button>
                      <button className="px-6 py-3 border-2 border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors">
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
    </>
  );
};

export default PropertyModal;
