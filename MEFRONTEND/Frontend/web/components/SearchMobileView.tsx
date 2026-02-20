import React, { useState } from 'react'
import { Property } from '../types'
import { PropertyResponse } from '../lib/api/properties'
import { Header } from './common/Header'
import MapFullscreen from './MapFullscreen'
import PropertyBottomSheet from './PropertyBottomSheet'
import SearchFiltersMobile from './SearchFiltersMobile'
import { SearchFilters } from './SearchSidebar'

interface SearchMobileViewProps {
  properties: Property[]
  apiProperties: PropertyResponse[]
  loading: boolean
  onPropertyClick: (id: string) => void
  onFilterChange: (filters: SearchFilters) => void
  currentFilters: SearchFilters
}

const SearchMobileView: React.FC<SearchMobileViewProps> = ({
  properties,
  apiProperties,
  loading,
  onPropertyClick,
  onFilterChange,
  currentFilters
}) => {
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null)
  const [centerOnProperty, setCenterOnProperty] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [sheetState, setSheetState] = useState<'peek' | 'half' | 'full'>('half')
  const [viewMode, setViewMode] = useState<'properties' | 'filters'>('properties')

  const handlePropertyClick = (id: string) => {
    setCenterOnProperty(id)
    onPropertyClick(id)
  }

  const handleMarkerClick = (id: string) => {
    setHoveredPropertyId(id)
    setCenterOnProperty(id)
    
    // Auto-scroll a la card en el bottom sheet
    setTimeout(() => {
      const cardElement = document.getElementById(`property-card-${id}`)
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const handleViewChange = (view: 'properties' | 'filters') => {
    setViewMode(view)
    if (view === 'filters') {
      setShowFilters(true)
      // Expandir a full cuando se abren filtros
      setSheetState('full')
    } else {
      setShowFilters(false)
      // Volver a half cuando se cierra filtros
      setSheetState('half')
    }
  }

  const countActiveFilters = () => {
    return Object.keys(currentFilters).filter(key => {
      const value = currentFilters[key as keyof SearchFilters]
      return value !== undefined && value !== '' && value !== null
    }).length
  }

  return (
    <>
      {/* Header Fixed - Compartido con desktop */}
      <Header />
      
      {/* Container principal con altura ajustada */}
      <div className="relative w-full overflow-hidden" style={{ height: 'calc(100vh - 96px)' }}>
        {/* Mapa de fondo - Fullscreen */}
        <MapFullscreen
          listings={apiProperties}
          onMarkerClick={handleMarkerClick}
          hoveredPropertyId={hoveredPropertyId}
          centerOnProperty={centerOnProperty}
          className="absolute inset-0"
          hideControls={sheetState === 'full'} // Ocultar controles cuando está full
        />

        {/* Bottom Sheet con propiedades - Solo visible cuando NO está en modo filtros */}
        {!showFilters && (
          <PropertyBottomSheet
            properties={properties}
            loading={loading}
            onPropertyClick={handlePropertyClick}
            onPropertyHover={setHoveredPropertyId}
            hoveredPropertyId={hoveredPropertyId}
            onFilterClick={() => handleViewChange('filters')}
            activeFiltersCount={countActiveFilters()}
            onStateChange={setSheetState}
            onViewChange={handleViewChange}
          />
        )}

      {/* Modal de Filtros Móvil - Fixed desde debajo del Header */}
      {showFilters && (
        <>
          {/* Header de toggle flotante - Fixed debajo del Header principal */}
          <div className="fixed left-0 right-0 z-[960] bg-white shadow-md" style={{ top: '96px' }}>
            <div className="px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewChange('properties')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span>Propiedades</span>
                  {properties.length > 0 && (
                    <span className="ml-1 bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                      {properties.length}
                    </span>
                  )}
                </button>
                
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all bg-blue-500 text-white shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Filtros</span>
                  {countActiveFilters() > 0 && (
                    <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                      {countActiveFilters()}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Contenido de filtros - Fixed debajo del toggle */}
          <div className="fixed left-0 right-0 bottom-0 z-[950] bg-white overflow-y-auto" style={{ top: '160px' }}>
            <SearchFiltersMobile
              onFilterChange={(filters) => {
                onFilterChange(filters)
                handleViewChange('properties') // Volver a vista de propiedades
              }}
              isLoading={loading}
              initialFilters={currentFilters}
              onClose={() => handleViewChange('properties')}
              propertiesCount={properties.length}
            />
          </div>
        </>
      )}
      </div>
    </>
  )
}

export default SearchMobileView

