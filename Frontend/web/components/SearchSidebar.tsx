import React, { useState, useEffect } from 'react'
import { 
  FunnelIcon, 
  XMarkIcon,
  HomeModernIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  Squares2X2Icon,
  SparklesIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'

interface SearchSidebarProps {
  onFilterChange: (filters: SearchFilters) => void
  isLoading?: boolean
  initialFilters?: Partial<SearchFilters>
}

export interface SearchFilters {
  location?: string
  propertyType?: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  minArea?: number
  maxArea?: number
  furnished?: boolean
  petFriendly?: boolean
  verified?: boolean
  rentalMode?: string
  amenities?: string[]
}

const FILTERS_STORAGE_KEY = 'rentafacil_search_filters'

const SearchSidebar: React.FC<SearchSidebarProps> = ({ 
  onFilterChange, 
  isLoading = false,
  initialFilters = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>(() => {
    // Cargar filtros guardados al inicializar
    if (typeof window !== 'undefined') {
      try {
        const savedFilters = localStorage.getItem(FILTERS_STORAGE_KEY)
        if (savedFilters) {
          const parsed = JSON.parse(savedFilters)
          return { ...parsed, ...initialFilters } // initialFilters tiene prioridad
        }
      } catch (error) {
        console.error('Error loading saved filters:', error)
      }
    }
    return initialFilters
  })

  // Iconos de navegación rápida
  const quickFilters = [
    { id: 'type', icon: HomeModernIcon, label: 'Tipo', tooltip: 'Tipo de propiedad' },
    { id: 'price', icon: CurrencyDollarIcon, label: 'Precio', tooltip: 'Rango de precio' },
    { id: 'location', icon: MapPinIcon, label: 'Ubicación', tooltip: 'Distrito o ciudad' },
    { id: 'size', icon: Squares2X2Icon, label: 'Tamaño', tooltip: 'Habitaciones y área' },
    { id: 'amenities', icon: SparklesIcon, label: 'Extras', tooltip: 'Amenidades' },
    { id: 'advanced', icon: AdjustmentsHorizontalIcon, label: 'Avanzado', tooltip: 'Más filtros' },
  ]

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Guardar en localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(newFilters))
      } catch (error) {
        console.error('Error saving filters:', error)
      }
    }
    
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    setFilters({})
    
    // Limpiar localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(FILTERS_STORAGE_KEY)
    }
    
    onFilterChange({})
  }

  const countActiveFilters = () => {
    return Object.keys(filters).filter(key => {
      const value = filters[key as keyof SearchFilters]
      return value !== undefined && value !== '' && value !== null
    }).length
  }

  return (
    <>
      {/* Sidebar Colapsada */}
      <div 
        className={`
          bg-white border-r border-gray-200 shadow-lg
          transition-all duration-300 ease-in-out
          flex-shrink-0 relative z-30
          ${isExpanded ? 'w-80' : 'w-14'}
        `}
        style={{ height: 'calc(100vh - 96px)' }}
      >
        {/* Vista Colapsada - Solo Iconos */}
        {!isExpanded && (
          <div className="flex flex-col items-center py-4 space-y-4">
            {/* Toggle Button */}
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors group relative"
              title="Expandir filtros"
            >
              <FunnelIcon className="w-6 h-6 text-gray-700" />
              {countActiveFilters() > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {countActiveFilters()}
                </span>
              )}
            </button>

            {/* Separador */}
            <div className="w-8 h-px bg-gray-200" />

            {/* Quick Filter Icons */}
            {quickFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setIsExpanded(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors group relative"
                title={filter.tooltip}
              >
                <filter.icon className="w-5 h-5 text-gray-600" />
              </button>
            ))}
          </div>
        )}

        {/* Vista Expandida - Formulario Completo */}
        {isExpanded && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-5 h-5 text-gray-700" />
                <h2 className="font-semibold text-gray-900">Filtros</h2>
                {countActiveFilters() > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {countActiveFilters()}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
                title="Colapsar"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Formulario de Filtros - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Ubicación */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MapPinIcon className="w-4 h-4" />
                  Ubicación
                </label>
                <input
                  type="text"
                  placeholder="Distrito, ciudad..."
                  value={filters.location || ''}
                  onChange={(e) => updateFilter('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Tipo de Propiedad */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <HomeModernIcon className="w-4 h-4" />
                  Tipo de Propiedad
                </label>
                <select
                  value={filters.propertyType || ''}
                  onChange={(e) => updateFilter('propertyType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Todos los tipos</option>
                  <option value="apartment">Departamento</option>
                  <option value="house">Casa</option>
                  <option value="studio">Estudio</option>
                  <option value="office">Oficina</option>
                  <option value="room">Habitación</option>
                </select>
              </div>

              {/* Rango de Precio */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <CurrencyDollarIcon className="w-4 h-4" />
                  Precio (PEN)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Mín"
                    value={filters.minPrice || ''}
                    onChange={(e) => updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Máx"
                    value={filters.maxPrice || ''}
                    onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Habitaciones y Baños */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Squares2X2Icon className="w-4 h-4" />
                  Habitaciones
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => updateFilter('bedrooms', filters.bedrooms === num ? undefined : num)}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${filters.bedrooms === num 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {num}+
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Baños
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => updateFilter('bathrooms', filters.bathrooms === num ? undefined : num)}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${filters.bathrooms === num 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {num}+
                    </button>
                  ))}
                </div>
              </div>

              {/* Área */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Área (m²)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Mín m²"
                    value={filters.minArea || ''}
                    onChange={(e) => updateFilter('minArea', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Máx m²"
                    value={filters.maxArea || ''}
                    onChange={(e) => updateFilter('maxArea', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Características */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <SparklesIcon className="w-4 h-4" />
                  Características
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.furnished || false}
                      onChange={(e) => updateFilter('furnished', e.target.checked || undefined)}
                      className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Amoblado</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.petFriendly || false}
                      onChange={(e) => updateFilter('petFriendly', e.target.checked || undefined)}
                      className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Pet Friendly</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.verified || false}
                      onChange={(e) => updateFilter('verified', e.target.checked || undefined)}
                      className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Verificado</span>
                  </label>
                </div>
              </div>

              {/* Modo de Alquiler */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Modo de Alquiler
                </label>
                <select
                  value={filters.rentalMode || ''}
                  onChange={(e) => updateFilter('rentalMode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Todos</option>
                  <option value="traditional">Tradicional</option>
                  <option value="shared">Compartido</option>
                  <option value="coliving">Coliving</option>
                  <option value="airbnb">Tipo Airbnb</option>
                </select>
              </div>
            </div>

            {/* Footer - Botones */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
              <button
                onClick={clearFilters}
                disabled={countActiveFilters() === 0 || isLoading}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Limpiar filtros
              </button>
              <div className="text-xs text-center text-gray-500">
                {countActiveFilters()} filtro{countActiveFilters() !== 1 ? 's' : ''} activo{countActiveFilters() !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default SearchSidebar
