import React from 'react';
import { Listing } from '../../lib/api/listings';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ChatBubbleLeftEllipsisIcon,
  CameraIcon,
  MapPinIcon,
  FunnelIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';

interface PropertyTableProps {
  properties: Listing[];
  filteredProperties: Listing[];
  onToggleStatus: (propertyId: string) => void;
  onEdit: (property: Listing) => void;
  onDuplicate: (property: Listing) => void;
  onDelete: (propertyId: string) => void;
  onPreview: (property: Listing) => void;
  hasFiltersActive: boolean;
  onCreateNew: () => void;
}

export const PropertyTable: React.FC<PropertyTableProps> = ({
  properties,
  filteredProperties,
  onToggleStatus,
  onEdit,
  onDuplicate,
  onDelete,
  onPreview,
  hasFiltersActive,
  onCreateNew
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'archived': return 'text-red-600 bg-red-100';
      case 'under_review': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Publicado';
      case 'draft': return 'Borrador';
      case 'archived': return 'Archivado';
      case 'under_review': return 'En revisión';
      default: return status || 'Desconocido';
    }
  };

  const getPropertyTypeText = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'apartment': return 'Departamento';
      case 'house': return 'Casa';
      case 'room': return 'Habitación';
      case 'studio': return 'Studio';
      case 'office': return 'Oficina';
      case 'land': return 'Terreno';
      case 'warehouse': return 'Almacén';
      case 'penthouse': return 'Penthouse';
      default: return type || 'Desconocido';
    }
  };

  if (properties.length === 0) {
    return (
      <div className="p-12 text-center">
        <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No tienes propiedades</h3>
        <p className="mt-1 text-sm text-gray-500">Comienza creando tu primera propiedad.</p>
        <div className="mt-6">
          <Button onClick={onCreateNew} variant="primary">
            <PlusIcon className="w-4 h-4 mr-2" />
            Nueva Propiedad
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6">
      {/* Leyenda de estados */}
      <div className="mt-4 mb-4 flex items-center gap-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <span className="font-medium text-gray-700">Estado de publicación:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Activa</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Inactiva</span>
        </div>
      </div>
      
      <div className="overflow-x-auto -mx-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Propiedad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo & Modalidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estadísticas
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProperties.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <FunnelIcon className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron propiedades</h3>
                    <p className="text-gray-500 mb-4">
                      {hasFiltersActive
                        ? 'Intenta ajustar los filtros para ver más resultados.'
                        : 'Aún no tienes propiedades. ¡Crea tu primera propiedad!'}
                    </p>
                    {!hasFiltersActive && (
                      <Button onClick={onCreateNew} variant="primary" className="flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" />
                        Nueva Propiedad
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredProperties.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {property.images && property.images.length > 0 ? (
                          <img
                            src={`http://localhost:8000${
                              property.images.find(img => img.is_main)?.url || 
                              property.images[0]?.url
                            }`}
                            alt={property.title}
                            className="h-12 w-12 rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center ${
                          property.images && property.images.length > 0 ? 'hidden' : ''
                        }`}>
                          <CameraIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-4 max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {property.title}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">
                            {property.district || property.province || property.address || 'Ubicación no especificada'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-900">
                        {getPropertyTypeText(property.property_type)}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          property.operation === 'rent' ? 'bg-blue-100 text-blue-800' :
                          property.operation === 'sale' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {property.operation === 'rent' ? 'Alquiler' :
                           property.operation === 'sale' ? 'Venta' :
                           'Temp'}
                        </span>
                        {(property.rental_model === 'airbnb' || property.is_airbnb_available) && (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                            Airbnb
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {property.currency || 'PEN'} {property.price?.toLocaleString()}
                    </div>
                    {property.rental_term && (
                      <div className="text-xs text-gray-500">
                        /{property.rental_term === 'daily' ? 'día' :
                          property.rental_term === 'weekly' ? 'semana' :
                          property.rental_term === 'monthly' ? 'mes' :
                          property.rental_term === 'yearly' ? 'año' : property.rental_term}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(property.status)}`}>
                        {getStatusText(property.status)}
                      </span>
                      {property.verification_status && property.verification_status !== 'unverified' && (
                        <div className="text-xs text-gray-500">
                          {property.verification_status === 'verified' ? '✓ Verificado' :
                           property.verification_status === 'pending' ? '⏳ Pendiente' :
                           property.verification_status === 'rejected' ? '✗ Rechazado' : ''}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <EyeIcon className="h-3 w-3" />
                      {property.views_count || 0}
                    </div>
                    <div className="flex items-center gap-1">
                      <ChatBubbleLeftEllipsisIcon className="h-3 w-3" />
                      {property.leads_count || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onToggleStatus(property.id)}
                        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                        title={property.status === 'published' 
                          ? 'Activa y visible - Click para archivar' 
                          : property.status === 'draft'
                            ? 'Borrador - Click para publicar'
                            : 'Archivada - Click para publicar'}
                      >
                        <div className={`w-3 h-3 rounded-full ${
                          property.status === 'published' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                      </button>
                      <button
                        onClick={() => onPreview(property)}
                        className="p-1 rounded-full hover:bg-gray-100 text-indigo-600"
                        title="Vista Previa"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEdit(property)}
                        className="p-1 rounded-full hover:bg-gray-100 text-blue-600"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDuplicate(property)}
                        className="p-1 rounded-full hover:bg-gray-100 text-purple-600"
                        title="Duplicar"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(property.id)}
                        className="p-1 rounded-full hover:bg-gray-100 text-red-600"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
