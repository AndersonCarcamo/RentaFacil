/**
 * ListingsManager Component
 * Gestión de propiedades para administradores
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  HomeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  TrashIcon,
  StarIcon,
  PhotoIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

type OperationType = 'rent' | 'sale';
type PropertyType = 'apartment' | 'house' | 'room' | 'office' | 'commercial' | 'land' | 'warehouse';
type ListingStatus = 'draft' | 'published' | 'archived';

interface Listing {
  id: string;
  title: string;
  operation: OperationType;  // Backend usa 'operation' no 'operation_type'
  property_type: PropertyType;
  status: ListingStatus;
  price: number;
  currency: string;
  district: string;  // Backend no devuelve city separado
  address: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_built: number | null;  // Backend usa area_built no area_sqm
  is_verified: boolean;
  is_featured: boolean;
  owner_user_id: string;  // Backend usa owner_user_id
  created_at: string;
  published_at: string | null;
  views_count: number;
}

const OPERATION_LABELS = {
  rent: 'Alquiler',
  sale: 'Venta'
};

const PROPERTY_LABELS = {
  apartment: 'Departamento',
  house: 'Casa',
  room: 'Habitación',
  office: 'Oficina',
  commercial: 'Local Comercial',
  land: 'Terreno',
  warehouse: 'Almacén'
};

const STATUS_LABELS = {
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado'
};

export default function ListingsManager() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [operationFilter, setOperationFilter] = useState<OperationType | null>(null);
  const [statusFilter, setStatusFilter] = useState<ListingStatus | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalListings, setTotalListings] = useState(0);
  const limit = 20;

  // Modal
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
  }, [currentPage, operationFilter, statusFilter]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', limit.toString());
      
      if (operationFilter) {
        params.append('operation_type', operationFilter);
      }
      
      // Note: El endpoint actual no filtra por status, pero lo incluimos para futura implementación
      
      const response = await fetch(`http://localhost:8000/v1/listings/?${params}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No autorizado. Por favor, inicia sesión nuevamente.');
        }
        throw new Error('Error al cargar las propiedades');
      }
      
      const data = await response.json();
      
      // El endpoint devuelve un array directo de listings
      if (Array.isArray(data)) {
        setListings(data);
        setTotalListings(data.length);
      } else if (data.data) {
        // Por si en el futuro devuelve {data: [], total: 0}
        setListings(data.data);
        setTotalListings(data.total || data.data.length);
      } else {
        setListings([]);
        setTotalListings(0);
      }
      
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Error al cargar las propiedades');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (listingId: string, currentFeatured: boolean) => {
    try {
      setLoading(true);
      
      // Nota: Este endpoint necesita ser implementado en el backend
      const response = await fetch(`http://localhost:8000/v1/listings/${listingId}/featured`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          is_featured: !currentFeatured
        }),
      });

      if (!response.ok) {
        throw new Error('Error al cambiar estado destacado');
      }

      setSuccess(`Propiedad ${!currentFeatured ? 'marcada como destacada' : 'desmarcada'}`);
      setTimeout(() => setSuccess(null), 3000);
      await fetchListings();
      
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error al cambiar estado destacado');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerified = async (listingId: string, currentVerified: boolean) => {
    try {
      setLoading(true);
      
      // Nota: Este endpoint necesita ser implementado en el backend
      const response = await fetch(`http://localhost:8000/v1/listings/${listingId}/verify`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          is_verified: !currentVerified
        }),
      });

      if (!response.ok) {
        throw new Error('Error al verificar propiedad');
      }

      setSuccess(`Propiedad ${!currentVerified ? 'verificada' : 'desverificada'} correctamente`);
      setTimeout(() => setSuccess(null), 3000);
      await fetchListings();
      
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error al verificar propiedad');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:8000/v1/listings/${listingId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error al eliminar propiedad');
      }

      setSuccess('Propiedad eliminada correctamente');
      setTimeout(() => setSuccess(null), 3000);
      setShowDeleteConfirm(null);
      await fetchListings();
      
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar propiedad');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return `${currency} ${price.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No publicado';
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Gestión de Propiedades</h3>
          <p className="text-sm text-gray-600 mt-1">
            {totalListings} propiedad{totalListings !== 1 ? 'es' : ''} en el sistema
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          <FunnelIcon className="w-5 h-5" />
          <span>Filtros</span>
        </button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro por operación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de operación
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setOperationFilter(null);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    operationFilter === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => {
                    setOperationFilter('rent');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    operationFilter === 'rent'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Alquiler
                </button>
                <button
                  onClick={() => {
                    setOperationFilter('sale');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    operationFilter === 'sale'
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Venta
                </button>
              </div>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de publicación
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setStatusFilter(null);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('published');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === 'published'
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Publicados
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('draft');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === 'draft'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Borradores
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensajes */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <XMarkIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <CheckIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 font-medium">{success}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Listings Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className={`bg-white border-2 rounded-xl p-4 hover:shadow-lg transition-all ${
                listing.is_featured ? 'border-yellow-400' : 'border-gray-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900 truncate">{listing.title}</h4>
                    {listing.is_featured && (
                      <StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className={`px-2 py-1 rounded ${
                      listing.operation === 'rent'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {OPERATION_LABELS[listing.operation]}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {PROPERTY_LABELS[listing.property_type]}
                    </span>
                    {listing.is_verified && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded flex items-center gap-1">
                        <CheckIcon className="w-3 h-3" />
                        Verificado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{listing.district}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <CurrencyDollarIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{formatPrice(listing.price, listing.currency)}</span>
                </div>
                {(listing.bedrooms || listing.bathrooms || listing.area_built) && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    {listing.bedrooms && <span>{listing.bedrooms} dorm.</span>}
                    {listing.bathrooms && <span>{listing.bathrooms} baños</span>}
                    {listing.area_built && <span>{listing.area_built} m²</span>}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 pb-3 border-b">
                <div className="flex items-center gap-1">
                  <EyeIcon className="w-4 h-4" />
                  <span>{listing.views_count || 0} vistas</span>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatDate(listing.published_at)}</span>
                </div>
              </div>

              {/* Owner */}
              <div className="text-xs text-gray-500 mb-3">
                ID Propietario: <span className="text-gray-700 font-mono text-[10px]">{listing.owner_user_id.substring(0, 8)}...</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(`/listing/${listing.id}`, '_blank')}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <EyeIcon className="w-4 h-4" />
                  Ver
                </button>
                <button
                  onClick={() => handleToggleFeatured(listing.id, listing.is_featured)}
                  className={`p-2 rounded-lg transition-colors ${
                    listing.is_featured
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={listing.is_featured ? 'Quitar destacado' : 'Marcar como destacado'}
                >
                  <StarIcon className={`w-5 h-5 ${listing.is_featured ? 'fill-yellow-500' : ''}`} />
                </button>
                <button
                  onClick={() => handleToggleVerified(listing.id, listing.is_verified)}
                  className={`p-2 rounded-lg transition-colors ${
                    listing.is_verified
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={listing.is_verified ? 'Desverificar' : 'Verificar'}
                >
                  <CheckIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(listing.id)}
                  className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && listings.length === 0 && (
        <div className="text-center py-12">
          <HomeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No se encontraron propiedades</p>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar Eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar esta propiedad? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => showDeleteConfirm && handleDeleteListing(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
