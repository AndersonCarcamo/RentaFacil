import React from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

export interface FilterState {
  search: string;
  type: string;
  rentalType: string;
  status: string;
  priceMin: string;
  priceMax: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface PropertyFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onSortChange: (sortBy: string) => void;
  onClearFilters: () => void;
  totalProperties: number;
  filteredCount: number;
}

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({
  filters,
  onFilterChange,
  onSortChange,
  onClearFilters,
  totalProperties,
  filteredCount
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Búsqueda */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título o dirección..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          {/* Tipo de propiedad */}
          <select
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
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

          {/* Modalidad de renta */}
          <select
            value={filters.rentalType}
            onChange={(e) => onFilterChange('rentalType', e.target.value)}
            className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
          >
            <option value="">Todas las modalidades</option>
            <option value="traditional">Tradicional</option>
            <option value="airbnb">Airbnb</option>
          </select>

          {/* Estado */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
          >
            <option value="">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="archived">Archivado</option>
            <option value="under_review">En revisión</option>
          </select>

          {/* Rango de precios */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Precio mín"
              value={filters.priceMin}
              onChange={(e) => onFilterChange('priceMin', e.target.value)}
              className="w-24 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Precio máx"
              value={filters.priceMax}
              onChange={(e) => onFilterChange('priceMax', e.target.value)}
              className="w-24 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Ordenamiento */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-gray-500" />
            <select
              value={filters.sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
            >
              <option value="created_at">Fecha de creación</option>
              <option value="title">Título</option>
              <option value="price">Precio</option>
              <option value="views">Vistas</option>
              <option value="contacts">Contactos</option>
            </select>
            <button
              onClick={() => onSortChange(filters.sortBy)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {filters.sortOrder === 'desc' ? 
                <ArrowDownIcon className="w-4 h-4 text-gray-500" /> : 
                <ArrowUpIcon className="w-4 h-4 text-gray-500" />
              }
            </button>
          </div>

          {/* Limpiar filtros */}
          <button
            onClick={onClearFilters}
            className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Resultados */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>{filteredCount} de {totalProperties} propiedades</span>
        {filters.search && (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            Buscando: "{filters.search}"
          </span>
        )}
      </div>
    </div>
  );
};
