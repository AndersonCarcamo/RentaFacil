import React, { useRef, useState, useEffect } from 'react'
import { Property } from '../types'
import PropertyCardMini from './PropertyCardMini'
import { FunnelIcon, AdjustmentsHorizontalIcon, ListBulletIcon, Squares2X2Icon } from '@heroicons/react/24/outline'

interface PropertyBottomSheetProps {
  properties: Property[]
  loading: boolean
  onPropertyClick: (id: string) => void
  onPropertyHover: (id: string | null) => void
  hoveredPropertyId: string | null
  onFilterClick: () => void
  activeFiltersCount: number
  onStateChange?: (state: SheetState) => void // Callback para reportar cambios de estado
  onViewChange?: (view: 'properties' | 'filters') => void // Callback para cambiar vista
}

type SheetState = 'peek' | 'half' | 'full'
type ViewMode = 'properties' | 'filters'

const PropertyBottomSheet: React.FC<PropertyBottomSheetProps> = ({
  properties,
  loading,
  onPropertyClick,
  onPropertyHover,
  hoveredPropertyId,
  onFilterClick,
  activeFiltersCount,
  onStateChange,
  onViewChange
}) => {
  const [sheetState, setSheetState] = useState<SheetState>('half')
  const [viewMode, setViewMode] = useState<ViewMode>('properties')
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode)
    onViewChange?.(mode)
    if (mode === 'filters') {
      onFilterClick()
    }
  }

  // Alturas para cada estado (en vh)
  const heights = {
    peek: 15,  // 15vh - Solo header
    half: 50,  // 50vh - Header + algunas cards
    full: 90   // 90vh - Casi fullscreen
  }

  const getCurrentHeight = () => {
    if (isDragging) {
      const dragDelta = startY - currentY
      const currentHeight = heights[sheetState]
      const newHeight = currentHeight + (dragDelta / window.innerHeight) * 100
      return Math.max(heights.peek, Math.min(heights.full, newHeight))
    }
    return heights[sheetState]
  }

  // Manejo de gestos táctiles
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartY(e.touches[0].clientY)
    setCurrentY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    setCurrentY(e.touches[0].clientY)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    const dragDelta = startY - currentY
    const threshold = 50 // Píxeles mínimos para cambiar de estado

    let newState = sheetState
    if (Math.abs(dragDelta) > threshold) {
      if (dragDelta > 0) {
        // Drag hacia arriba
        if (sheetState === 'peek') newState = 'half'
        else if (sheetState === 'half') newState = 'full'
      } else {
        // Drag hacia abajo
        if (sheetState === 'full') newState = 'half'
        else if (sheetState === 'half') newState = 'peek'
      }
      
      setSheetState(newState)
      onStateChange?.(newState) // Notificar cambio de estado
    }

    setIsDragging(false)
    setStartY(0)
    setCurrentY(0)
  }

  // Manejo con mouse (para testing en desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartY(e.clientY)
    setCurrentY(e.clientY)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      setCurrentY(e.clientY)
    }

    const handleMouseUp = () => {
      const dragDelta = startY - currentY
      const threshold = 50

      let newState = sheetState
      if (Math.abs(dragDelta) > threshold) {
        if (dragDelta > 0) {
          if (sheetState === 'peek') newState = 'half'
          else if (sheetState === 'half') newState = 'full'
        } else {
          if (sheetState === 'full') newState = 'half'
          else if (sheetState === 'half') newState = 'peek'
        }
        
        setSheetState(newState)
        onStateChange?.(newState) // Notificar cambio de estado
      }

      setIsDragging(false)
      setStartY(0)
      setCurrentY(0)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, startY, currentY, sheetState])

  return (
    <div
      ref={sheetRef}
      className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[900] transition-all duration-300 ease-out"
      style={{
        height: `${getCurrentHeight()}vh`,
        touchAction: 'none'
      }}
    >
      {/* Handle para arrastrar */}
      <div
        className="w-full py-3 flex justify-center cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>

      {/* Header */}
      <div className="px-4 pb-3 border-b border-gray-200">
        {/* Toggle de Vista: Propiedades / Filtros */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => handleViewChange('properties')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              viewMode === 'properties'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ListBulletIcon className="w-5 h-5" />
            <span>Propiedades</span>
            {viewMode === 'properties' && properties.length > 0 && (
              <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {properties.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => handleViewChange('filters')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all relative ${
              viewMode === 'filters'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                viewMode === 'filters' 
                  ? 'bg-white/20' 
                  : 'bg-blue-500 text-white'
              }`}>
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Info de propiedades (solo en modo properties) */}
        {viewMode === 'properties' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">
                {loading ? 'Buscando...' : `${properties.length} resultado${properties.length !== 1 ? 's' : ''}`}
              </h2>
              {properties.length > 0 && (
                <button
                  onClick={() => setSheetState(sheetState === 'full' ? 'half' : 'full')}
                  className="text-xs text-blue-600 font-medium hover:underline"
                >
                  {sheetState === 'full' ? 'Ver menos' : 'Ver todas'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Indicador de ordenamiento */}
        {viewMode === 'properties' && properties.length > 0 && sheetState === 'full' && (
          <div className="flex items-center gap-2 mt-2">
            <AdjustmentsHorizontalIcon className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500">Ordenado por más relevantes</span>
          </div>
        )}
      </div>

      {/* Lista de propiedades - Scrollable */}
      <div className="overflow-y-auto h-[calc(100%-80px)] px-4 py-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="space-y-3 pb-4">
            {properties
              .sort((a, b) => b.rating - a.rating)
              .map((property) => (
                <div
                  key={property.id}
                  onMouseEnter={() => onPropertyHover(property.id)}
                  onMouseLeave={() => onPropertyHover(null)}
                >
                  <PropertyCardMini
                    property={property}
                    onClick={onPropertyClick}
                    isHighlighted={hoveredPropertyId === property.id}
                  />
                </div>
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-2">
              No se encontraron propiedades
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-xs">
              Intenta ajustar tus filtros o expandir el área de búsqueda
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PropertyBottomSheet
