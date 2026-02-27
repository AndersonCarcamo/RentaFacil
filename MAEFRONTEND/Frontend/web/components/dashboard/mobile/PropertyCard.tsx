import React from 'react';
import { Listing } from '../../../lib/api/listings';
import {
  MapPinIcon,
  EyeIcon,
  ChatBubbleLeftEllipsisIcon,
  CameraIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

interface PropertyCardProps {
  property: Listing;
  onToggleStatus: (id: string) => void;
  onEdit: (property: Listing) => void;
  onPreview: (property: Listing) => void;
  onMoreActions: (property: Listing) => void;
}

const resolveMediaUrl = (url?: string) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  if (!baseUrl) return url;

  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
};

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onToggleStatus,
  onEdit,
  onPreview,
  onMoreActions
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'archived': return 'bg-red-100 text-red-700 border-red-200';
      case 'under_review': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Publicado';
      case 'draft': return 'Borrador';
      case 'archived': return 'Archivado';
      case 'under_review': return 'En revisión';
      default: return 'Desconocido';
    }
  };

  const getPropertyTypeText = (type: string) => {
    const types: Record<string, string> = {
      apartment: 'Depto',
      house: 'Casa',
      room: 'Habitación',
      studio: 'Studio',
      office: 'Oficina',
      land: 'Terreno',
      warehouse: 'Almacén',
      penthouse: 'Penthouse'
    };
    return types[type?.toLowerCase()] || type;
  };

  const mainImage = property.images?.find(img => img.is_main)?.url || property.images?.[0]?.url;

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden active:scale-98 transition-transform"
      onClick={() => onPreview(property)}
    >
      {/* Imagen */}
      <div className="relative h-40 bg-gray-200">
        {mainImage ? (
          <img
            src={resolveMediaUrl(mainImage)}
            alt={property.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <CameraIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Badge de estado */}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(property.status)}`}>
            {getStatusText(property.status)}
          </span>
        </div>

        {/* Toggle de publicación */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(property.id);
          }}
          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md"
        >
          <div className={`w-3 h-3 rounded-full ${
            property.status === 'published' ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </button>

        {/* Badge de Airbnb */}
        {(property.rental_model === 'airbnb' || property.is_airbnb_available) && (
          <div className="absolute bottom-2 left-2">
            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800 border border-orange-200">
              Airbnb
            </span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-3">
        {/* Título */}
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
          {property.title}
        </h3>

        {/* Ubicación */}
        <div className="flex items-center gap-1 text-gray-500 mb-2">
          <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs truncate">
            {property.district || property.province || property.address || 'Sin ubicación'}
          </span>
        </div>

        {/* Precio y tipo */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-lg font-bold text-blue-600">
              {property.currency || 'PEN'} {property.price?.toLocaleString()}
            </p>
            {property.rental_term && (
              <p className="text-xs text-gray-500">
                /{property.rental_term === 'monthly' ? 'mes' : 
                  property.rental_term === 'daily' ? 'día' : 
                  property.rental_term === 'yearly' ? 'año' : 
                  property.rental_term}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-700">
              {getPropertyTypeText(property.property_type)}
            </p>
            {property.verification_status === 'verified' && (
              <p className="text-xs text-green-600">✓ Verificado</p>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-1">
              <EyeIcon className="w-4 h-4" />
              <span className="text-xs font-medium">{property.views_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
              <span className="text-xs font-medium">{property.leads_count || 0}</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(property);
              }}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg active:bg-blue-100"
            >
              Editar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoreActions(property);
              }}
              className="p-1.5 text-gray-600 rounded-lg active:bg-gray-100"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
