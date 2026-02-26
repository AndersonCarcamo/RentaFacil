import React, { useState, useEffect } from 'react'
import { SearchFilters } from './SearchSidebar'
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  CurrencyDollarIcon,
  HomeIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'

interface SearchFiltersMobileProps {
  onFilterChange: (filters: SearchFilters) => void
  isLoading: boolean
  initialFilters?: SearchFilters
  onClose: () => void
  propertiesCount: number
}

const SearchFiltersMobile: React.FC<SearchFiltersMobileProps> = ({
  onFilterChange,
  isLoading,
  initialFilters = {},
  onClose,
  propertiesCount
}) => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['price']))

  // Sincronizar con initialFilters cuando cambien (ej: desde URL params)
  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setFilters(initialFilters)
    }
  }, [initialFilters])

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleFilterUpdate = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    onFilterChange(filters)
    onClose()
  }

  const handleClearFilters = () => {
    const clearedFilters: SearchFilters = {}
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const countActiveFilters = () => {
    return Object.keys(filters).filter(key => {
      const value = filters[key as keyof SearchFilters]
      return value !== undefined && value !== '' && value !== null
    }).length
  }

  return (
    <div className="fixed inset-0 z-40 bg-white flex flex-col">
      {/* Header Sticky */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between p-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Filtros</h2>
            {countActiveFilters() > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">
                {countActiveFilters()} filtro{countActiveFilters() !== 1 ? 's' : ''} aplicado{countActiveFilters() !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {/* Ubicación */}
        <div className="py-4 border-b border-gray-200">
          <button
            onClick={() => toggleSection('location')}
            className="w-full flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">Ubicación</span>
            </div>
            {expandedSections.has('location') ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.has('location') && (
            <div className="mt-3 space-y-3">
              <input
                type="text"
                placeholder="Ciudad, distrito, dirección..."
                value={filters.location || ''}
                onChange={(e) => handleFilterUpdate('location', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Precio */}
        <div className="py-4 border-b border-gray-200">
          <button
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">Precio</span>
            </div>
            {expandedSections.has('price') ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.has('price') && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Mínimo</label>
                  <input
                    type="number"
                    placeholder="S/ 0"
                    value={filters.minPrice || ''}
                    onChange={(e) => handleFilterUpdate('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Máximo</label>
                  <input
                    type="number"
                    placeholder="S/ 10000"
                    value={filters.maxPrice || ''}
                    onChange={(e) => handleFilterUpdate('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Rangos rápidos */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '< S/ 500', max: 500 },
                  { label: 'S/ 500-1000', min: 500, max: 1000 },
                  { label: 'S/ 1000-2000', min: 1000, max: 2000 },
                  { label: '> S/ 2000', min: 2000 }
                ].map((range) => (
                  <button
                    key={range.label}
                    onClick={() => {
                      handleFilterUpdate('minPrice', range.min || undefined)
                      handleFilterUpdate('maxPrice', range.max || undefined)
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filters.minPrice === range.min && filters.maxPrice === range.max
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tipo de propiedad */}
        <div className="py-4 border-b border-gray-200">
          <button
            onClick={() => toggleSection('type')}
            className="w-full flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-2">
              <HomeIcon className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">Tipo de propiedad</span>
            </div>
            {expandedSections.has('type') ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.has('type') && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { value: 'departamento', label: 'Departamento', emoji: '🏢' },
                { value: 'casa', label: 'Casa', emoji: '🏠' },
                { value: 'habitacion', label: 'Habitación', emoji: '🚪' },
                { value: 'estudio', label: 'Estudio', emoji: '🛋️' }
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleFilterUpdate('propertyType', type.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    filters.propertyType === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.emoji}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Habitaciones */}
        <div className="py-4 border-b border-gray-200">
          <button
            onClick={() => toggleSection('rooms')}
            className="w-full flex items-center justify-between py-2"
          >
            <span className="font-semibold text-gray-900">Habitaciones y Baños</span>
            {expandedSections.has('rooms') ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.has('rooms') && (
            <div className="mt-3 space-y-4">
              {/* Dormitorios */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dormitorios
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, '5+'].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleFilterUpdate('bedrooms', typeof num === 'number' ? num : 5)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.bedrooms === (typeof num === 'number' ? num : 5)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Baños */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Baños
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, '4+'].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleFilterUpdate('bathrooms', typeof num === 'number' ? num : 4)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.bathrooms === (typeof num === 'number' ? num : 4)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Amenities */}
        <div className="py-4">
          <button
            onClick={() => toggleSection('amenities')}
            className="w-full flex items-center justify-between py-2"
          >
            <span className="font-semibold text-gray-900">Comodidades</span>
            {expandedSections.has('amenities') ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.has('amenities') && (
            <div className="mt-3 space-y-2">
              {[
                { key: 'parking', label: 'Estacionamiento', emoji: '🅿️' },
                { key: 'petFriendly', label: 'Acepta mascotas', emoji: '🐕' },
                { key: 'furnished', label: 'Amoblado', emoji: '🛋️' },
                { key: 'wifi', label: 'WiFi', emoji: '📶' },
                { key: 'gym', label: 'Gimnasio', emoji: '💪' },
                { key: 'pool', label: 'Piscina', emoji: '🏊' }
              ].map((amenity) => (
                <label
                  key={amenity.key}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={!!(filters as any)[amenity.key]}
                    onChange={(e) => handleFilterUpdate(amenity.key as keyof SearchFilters, e.target.checked || undefined)}
                    className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xl">{amenity.emoji}</span>
                  <span className="text-gray-700 font-medium">{amenity.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Sticky */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 space-y-2">
        <button
          onClick={handleApplyFilters}
          disabled={isLoading}
          className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors text-base"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Buscando...
            </span>
          ) : (
            `Ver ${propertiesCount} propiedad${propertiesCount !== 1 ? 'es' : ''}`
          )}
        </button>
        
        {countActiveFilters() > 0 && (
          <button
            onClick={handleClearFilters}
            className="w-full py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  )
}

export default SearchFiltersMobile
