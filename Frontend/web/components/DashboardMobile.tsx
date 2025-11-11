import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  HomeIcon,
  BuildingOfficeIcon,
  PresentationChartBarIcon,
  UserCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  EllipsisVerticalIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Header } from './/Header';

interface Property {
  id: string;
  title: string;
  slug: string;
  property_type: string;
  rental_type: string;
  status: string;
  price: number;
  images: string[];
  address: string;
  district: string;
  created_at: string;
  views_count?: number;
  leads_count?: number;
  rating?: number;
}

interface DashboardMobileProps {
  properties: Property[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onCreateProperty: () => void;
  onEditProperty: (property: Property) => void;
  onDeleteProperty: (property: Property) => void;
  filters: {
    search: string;
    type: string;
    rentalType: string;
    status: string;
    minPrice: string;
    maxPrice: string;
    sortBy: string;
    sortOrder: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  activeProperties: number;
  planLimits: {
    name: string;
    maxActiveListings: number;
  };
  showSuccessMessage?: boolean;
  successMessageType?: 'created' | 'updated';
  onCloseSuccessMessage?: () => void;
}

export default function DashboardMobile({
  properties,
  activeTab,
  setActiveTab,
  onCreateProperty,
  onEditProperty,
  onDeleteProperty,
  filters,
  onFilterChange,
  onClearFilters,
  activeProperties,
  planLimits,
  showSuccessMessage = false,
  successMessageType = 'created',
  onCloseSuccessMessage,
}: DashboardMobileProps) {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Calcular estadísticas
  const totalProperties = properties.length;
  const totalViews = properties.reduce((sum, p) => sum + (p.views_count || 0), 0);
  const totalContacts = properties.reduce((sum, p) => sum + (p.leads_count || 0), 0);
  const activePropertiesCount = properties.filter(p => p.status === 'active').length;

  // Filtrar propiedades Airbnb
  const airbnbProperties = properties.filter(p => p.rental_type === 'airbnb');
  const activeAirbnbProperties = airbnbProperties.filter(p => p.status === 'active');

  // Función para formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Función para obtener etiqueta de estado
  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      active: 'Activa',
      inactive: 'Inactiva',
      pending: 'Pendiente',
      rejected: 'Rechazada',
    };
    return labels[status] || status;
  };

  // Función para obtener color de estado
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Función para obtener etiqueta de tipo
  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      apartment: 'Departamento',
      house: 'Casa',
      room: 'Habitación',
      studio: 'Studio',
      office: 'Oficina',
      land: 'Terreno',
      warehouse: 'Almacén',
      penthouse: 'Penthouse',
    };
    return labels[type] || type;
  };

  // Renderizar contenido de Overview
  const renderOverview = () => (
    <div className="px-4 pb-24">
      {/* Success Message */}
      {showSuccessMessage && onCloseSuccessMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <CheckIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 text-sm">
                  {successMessageType === 'created' 
                    ? '¡Propiedad creada!' 
                    : '¡Propiedad actualizada!'}
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  {successMessageType === 'created'
                    ? 'Tu propiedad ahora está visible.'
                    : 'Los cambios han sido guardados.'}
                </p>
              </div>
            </div>
            <button
              onClick={onCloseSuccessMessage}
              className="text-green-600 flex-shrink-0"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Título y Acción */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Gestiona tus propiedades</p>
      </div>

      {/* Estadísticas Cards */}
      <div className="space-y-3 mb-4">
        {/* Propiedades Activas */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600">Propiedades Activas</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-gray-900">{activePropertiesCount}</p>
                {planLimits.maxActiveListings !== -1 && (
                  <p className="text-sm text-gray-500">/ {planLimits.maxActiveListings}</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Plan {planLimits.name}</p>
              {planLimits.maxActiveListings !== -1 && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      activePropertiesCount >= planLimits.maxActiveListings 
                        ? 'bg-red-500' 
                        : activePropertiesCount >= planLimits.maxActiveListings * 0.8 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min((activePropertiesCount / planLimits.maxActiveListings) * 100, 100)}%` 
                    }}
                  />
                </div>
              )}
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <HomeIcon className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Grid de 2 columnas para otras estadísticas */}
        <div className="grid grid-cols-2 gap-3">
          {/* Propiedades Airbnb */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-600">Airbnb</p>
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="w-4 h-4 text-orange-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{activeAirbnbProperties.length}</p>
              <p className="text-xs text-gray-500 mt-1">Activas</p>
            </div>
          </div>

          {/* Total de vistas */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-600">Vistas</p>
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <EyeIcon className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Total</p>
            </div>
          </div>

          {/* Total de contactos */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Contactos Recibidos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalContacts.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">De {totalProperties} propiedades</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ChatBubbleLeftIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="space-y-2">
        <button
          onClick={() => router.push('/dashboard/contacto')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Cog6ToothIcon className="w-5 h-5" />
          Configurar Contacto
        </button>
      </div>
    </div>
  );

  // Renderizar contenido de Propiedades
  const renderProperties = () => (
    <div className="pb-24">
      {/* Búsqueda */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar propiedades..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        
        {/* Botón de filtros */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm"
          >
            <FunnelIcon className="w-4 h-4" />
            Filtros
            {(filters.type || filters.rentalType || filters.status) && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </button>
          <span className="text-sm text-gray-600">{properties.length} propiedades</span>
        </div>

        {/* Panel de filtros desplegable */}
        {showFilters && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
            <select
              value={filters.type}
              onChange={(e) => onFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">Todos los tipos</option>
              <option value="apartment">Departamento</option>
              <option value="house">Casa</option>
              <option value="room">Habitación</option>
              <option value="studio">Studio</option>
              <option value="office">Oficina</option>
              <option value="land">Terreno</option>
              <option value="warehouse">Almacén</option>
              <option value="penthouse">Penthouse</option>
            </select>

            <select
              value={filters.rentalType}
              onChange={(e) => onFilterChange('rentalType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">Tipo de alquiler</option>
              <option value="monthly">Mensual</option>
              <option value="daily">Diario</option>
              <option value="airbnb">Airbnb</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activa</option>
              <option value="inactive">Inactiva</option>
              <option value="pending">Pendiente</option>
              <option value="rejected">Rechazada</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="createdAt">Fecha de creación</option>
              <option value="title">Título</option>
              <option value="price">Precio</option>
              <option value="views">Vistas</option>
              <option value="contacts">Contactos</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={onClearFilters}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm"
              >
                Limpiar
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de propiedades */}
      <div className="px-4 py-4 space-y-3">
        {properties.length === 0 ? (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No tienes propiedades</p>
            <p className="text-sm text-gray-500 mt-1">Crea tu primera propiedad</p>
          </div>
        ) : (
          properties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="flex gap-3 p-3">
                {/* Imagen */}
                <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {property.title}
                    </h3>
                    <button
                      onClick={() => setSelectedProperty(selectedProperty?.id === property.id ? null : property)}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-600 truncate mb-1">
                    {property.district}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(property.status)}`}>
                      {getStatusLabel(property.status)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getTypeLabel(property.property_type)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="font-bold text-blue-600 text-sm">
                      {formatPrice(property.price)}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <EyeIcon className="w-3.5 h-3.5" />
                        {property.views_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ChatBubbleLeftIcon className="w-3.5 h-3.5" />
                        {property.leads_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menú de acciones */}
              {selectedProperty?.id === property.id && (
                <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 flex gap-2">
                  <button
                    onClick={() => {
                      onEditProperty(property);
                      setSelectedProperty(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      onDeleteProperty(property);
                      setSelectedProperty(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Renderizar contenido de Analíticas
  const renderAnalytics = () => (
    <div className="px-4 py-4 pb-24">
      <div className="text-center py-12">
        <PresentationChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">Analíticas en desarrollo</p>
        <p className="text-sm text-gray-500 mt-1">Próximamente podrás ver estadísticas detalladas</p>
      </div>
    </div>
  );

  // Renderizar contenido de Perfil
  const renderProfile = () => (
    <div className="px-4 py-4 pb-24">
      <div className="text-center py-12">
        <UserCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">Perfil</p>
        <p className="text-sm text-gray-500 mt-1">Configuración de tu cuenta</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 pt-16 overflow-y-auto">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'properties' && renderProperties()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'profile' && renderProfile()}
      </div>

      {/* Botón flotante de crear */}
      <button
        onClick={onCreateProperty}
        className="fixed right-4 bottom-20 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors z-40"
      >
        <PlusIcon className="w-6 h-6" />
      </button>

      {/* Navegación inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex flex-col items-center py-3 px-2 ${
              activeTab === 'overview'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Inicio</span>
          </button>
          
          <button
            onClick={() => setActiveTab('properties')}
            className={`flex-1 flex flex-col items-center py-3 px-2 ${
              activeTab === 'properties'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <BuildingOfficeIcon className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Propiedades</span>
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 flex flex-col items-center py-3 px-2 ${
              activeTab === 'analytics'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <PresentationChartBarIcon className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Analíticas</span>
          </button>
          
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex flex-col items-center py-3 px-2 ${
              activeTab === 'profile'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <UserCircleIcon className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  );
}
