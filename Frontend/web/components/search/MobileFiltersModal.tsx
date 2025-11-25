import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon, ChevronRightIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import Button from '../ui/Button'

interface MobileFiltersModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: FilterValues) => void
  initialFilters: FilterValues
  propertyType: string
  autoStart?: boolean // Auto-iniciar wizard al abrir
}

export interface FilterValues {
  minPrice?: string
  maxPrice?: string
  bedrooms?: string
  bathrooms?: string
  minArea?: string
  maxArea?: string
  furnished?: boolean
  verified?: boolean
  rentalMode?: string
  petFriendly?: boolean
}

type FilterStep = 'welcome' | 'price' | 'rooms' | 'area' | 'features' | 'complete'

export default function MobileFiltersModal({ 
  isOpen, 
  onClose, 
  onApply, 
  initialFilters,
  propertyType,
  autoStart = false 
}: MobileFiltersModalProps) {
  const [currentStep, setCurrentStep] = useState<FilterStep>('welcome')
  const [filters, setFilters] = useState<FilterValues>(initialFilters)

  // Auto-iniciar wizard cuando se abre el modal (solo cuando cambia isOpen)
  useEffect(() => {
    if (isOpen && autoStart) {
      setCurrentStep('welcome')
      setFilters(initialFilters)
    }
  }, [isOpen]) // Solo depender de isOpen, no de initialFilters

  if (!isOpen) return null

  const handleSkipAll = () => {
    // Ejecutar búsqueda sin filtros adicionales
    onApply({})
    onClose()
  }

  const handleNext = () => {
    // Si estamos en welcome y presionamos "Empezar", NO ejecutar búsqueda
    // Solo avanzar al siguiente paso
    
    const steps: FilterStep[] = ['welcome', 'price', 'rooms', 'area', 'features', 'complete']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const handleFinish = () => {
    onApply(filters)
    onClose()
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.minPrice) count++
    if (filters.maxPrice) count++
    if (filters.bedrooms) count++
    if (filters.bathrooms) count++
    if (filters.minArea) count++
    if (filters.maxArea) count++
    if (filters.furnished) count++
    if (filters.verified) count++
    if (filters.rentalMode) count++
    if (filters.petFriendly) count++
    return count
  }

  const renderWelcome = () => (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center">
        <span className="text-4xl">🔍</span>
      </div>
      <div>
        <h3 className="text-xl font-bold text-brand-navy mb-2">
          ¡Listo para buscar!
        </h3>
        <p className="text-sm text-brand-navy/60">
          Puedes buscar ahora o personalizar tu búsqueda con algunos filtros.
          <br />
          Te tomarán solo unos segundos.
        </p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <Button
          onClick={handleNext}
          variant="primary"
          className="w-full"
          rightIcon={<ArrowRightIcon className="h-5 w-5" />}
        >
          Empezar
        </Button>
        <button
          onClick={handleSkipAll}
          className="w-full text-sm text-brand-navy/60 hover:text-brand-navy transition-colors"
        >
          Buscar sin filtros
        </button>
      </div>
    </div>
  )

  const renderMenu = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-3">
      <button
        onClick={() => setCurrentStep('price')}
        className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-brand-navy/20 hover:bg-secondary-50 transition-colors"
      >
        <div className="text-left">
          <div className="font-semibold text-brand-navy">💰 Precio</div>
          <div className="text-xs text-brand-navy/60 mt-1">
            {filters.minPrice || filters.maxPrice 
              ? `S/ ${filters.minPrice || '0'} - S/ ${filters.maxPrice || '∞'}`
              : 'Todos los precios'}
          </div>
        </div>
        <ChevronRightIcon className="h-5 w-5 text-brand-navy/40" />
      </button>

      <button
        onClick={() => setCurrentStep('rooms')}
        className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-brand-navy/20 hover:bg-secondary-50 transition-colors"
      >
        <div className="text-left">
          <div className="font-semibold text-brand-navy">🛏️ Habitaciones y Baños</div>
          <div className="text-xs text-brand-navy/60 mt-1">
            {filters.bedrooms || filters.bathrooms
              ? `${filters.bedrooms ? filters.bedrooms + '+ hab' : ''} ${filters.bathrooms ? filters.bathrooms + '+ baños' : ''}`.trim()
              : 'Sin restricciones'}
          </div>
        </div>
        <ChevronRightIcon className="h-5 w-5 text-brand-navy/40" />
      </button>

      <button
        onClick={() => setCurrentStep('area')}
        className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-brand-navy/20 hover:bg-secondary-50 transition-colors"
      >
        <div className="text-left">
          <div className="font-semibold text-brand-navy">📏 Área</div>
          <div className="text-xs text-brand-navy/60 mt-1">
            {filters.minArea || filters.maxArea
              ? `${filters.minArea || '0'} - ${filters.maxArea || '∞'} m²`
              : 'Cualquier tamaño'}
          </div>
        </div>
        <ChevronRightIcon className="h-5 w-5 text-brand-navy/40" />
      </button>

      <button
        onClick={() => setCurrentStep('features')}
        className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-brand-navy/20 hover:bg-secondary-50 transition-colors"
      >
        <div className="text-left">
          <div className="font-semibold text-brand-navy">✨ Características</div>
          <div className="text-xs text-brand-navy/60 mt-1">
            {filters.furnished || filters.verified || filters.petFriendly
              ? [
                  filters.furnished && 'Amoblado',
                  filters.verified && 'Verificado',
                  filters.petFriendly && 'Pet Friendly'
                ].filter(Boolean).join(', ')
              : 'Ninguna seleccionada'}
          </div>
        </div>
        <ChevronRightIcon className="h-5 w-5 text-brand-navy/40" />
      </button>
    </div>
  )

  const renderPriceStep = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="text-center mb-4">
        <div className="text-4xl mb-3">💰</div>
        <h3 className="text-lg font-bold text-brand-navy mb-1">
          ¿Cuál es tu presupuesto?
        </h3>
        <p className="text-sm text-brand-navy/60">
          Paso 1 de 4
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-navy mb-2">
          Precio Mínimo
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={filters.minPrice}
          onChange={(e) => setFilters({ ...filters, minPrice: e.target.value.replace(/[^0-9]/g, '') })}
          placeholder="S/ 0"
          className="w-full rounded-lg border border-brand-navy/20 bg-white py-3 px-4 text-base text-brand-navy placeholder:text-brand-navy/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-navy mb-2">
          Precio Máximo
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={filters.maxPrice}
          onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value.replace(/[^0-9]/g, '') })}
          placeholder="S/ 10,000"
          className="w-full rounded-lg border border-brand-navy/20 bg-white py-3 px-4 text-base text-brand-navy placeholder:text-brand-navy/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
        />
      </div>

      <div className="pt-4 space-y-2">
        <Button
          onClick={handleNext}
          variant="primary"
          className="w-full"
          rightIcon={<ArrowRightIcon className="h-5 w-5" />}
        >
          Siguiente
        </Button>
        <button
          onClick={handleNext}
          className="w-full text-sm text-brand-navy/60 hover:text-brand-navy transition-colors py-2"
        >
          Omitir este paso
        </button>
      </div>
    </div>
  )

  const renderRoomsStep = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="text-center mb-4">
        <div className="text-4xl mb-3">🛏️</div>
        <h3 className="text-lg font-bold text-brand-navy mb-1">
          ¿Cuántas habitaciones necesitas?
        </h3>
        <p className="text-sm text-brand-navy/60">
          Paso 2 de 4
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-navy mb-3">
          Habitaciones
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['', '1', '2', '3', '4', '5'].map((value) => (
            <button
              key={value}
              onClick={() => setFilters({ ...filters, bedrooms: value })}
              className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                filters.bedrooms === value
                  ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                  : 'border-brand-navy/20 bg-white text-brand-navy hover:border-brand-navy/40'
              }`}
            >
              {value ? `${value}+` : 'Todas'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-navy mb-3">
          Baños
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['', '1', '2', '3', '4'].map((value) => (
            <button
              key={value}
              onClick={() => setFilters({ ...filters, bathrooms: value })}
              className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                filters.bathrooms === value
                  ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                  : 'border-brand-navy/20 bg-white text-brand-navy hover:border-brand-navy/40'
              }`}
            >
              {value ? `${value}+` : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 space-y-2">
        <Button
          onClick={handleNext}
          variant="primary"
          className="w-full"
          rightIcon={<ArrowRightIcon className="h-5 w-5" />}
        >
          Siguiente
        </Button>
        <button
          onClick={handleNext}
          className="w-full text-sm text-brand-navy/60 hover:text-brand-navy transition-colors py-2"
        >
          Omitir este paso
        </button>
      </div>
    </div>
  )

  const renderAreaStep = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="text-center mb-4">
        <div className="text-4xl mb-3">📏</div>
        <h3 className="text-lg font-bold text-brand-navy mb-1">
          ¿Qué tamaño buscas?
        </h3>
        <p className="text-sm text-brand-navy/60">
          Paso 3 de 4
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-navy mb-2">
          Área Mínima (m²)
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={filters.minArea}
          onChange={(e) => setFilters({ ...filters, minArea: e.target.value.replace(/[^0-9]/g, '') })}
          placeholder="50"
          className="w-full rounded-lg border border-brand-navy/20 bg-white py-3 px-4 text-base text-brand-navy placeholder:text-brand-navy/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-navy mb-2">
          Área Máxima (m²)
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={filters.maxArea}
          onChange={(e) => setFilters({ ...filters, maxArea: e.target.value.replace(/[^0-9]/g, '') })}
          placeholder="200"
          className="w-full rounded-lg border border-brand-navy/20 bg-white py-3 px-4 text-base text-brand-navy placeholder:text-brand-navy/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
        />
      </div>

      <div className="pt-4 space-y-2">
        <Button
          onClick={handleNext}
          variant="primary"
          className="w-full"
          rightIcon={<ArrowRightIcon className="h-5 w-5" />}
        >
          Siguiente
        </Button>
        <button
          onClick={handleNext}
          className="w-full text-sm text-brand-navy/60 hover:text-brand-navy transition-colors py-2"
        >
          Omitir este paso
        </button>
      </div>
    </div>
  )

  const renderFeaturesStep = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="text-center mb-4">
        <div className="text-4xl mb-3">✨</div>
        <h3 className="text-lg font-bold text-brand-navy mb-1">
          ¿Alguna característica especial?
        </h3>
        <p className="text-sm text-brand-navy/60">
          Paso 4 de 4
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-navy mb-3">
          Modalidad de Alquiler
        </label>
        <select
          value={filters.rentalMode}
          onChange={(e) => setFilters({ ...filters, rentalMode: e.target.value })}
          className="w-full rounded-lg border border-brand-navy/20 bg-white py-3 px-4 text-base text-brand-navy focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
        >
          <option value="">Todas</option>
          <option value="traditional">Tradicional</option>
          <option value="airbnb">Airbnb</option>
          <option value="shared">Compartido</option>
          <option value="coliving">Coliving</option>
        </select>
      </div>

      <div className="space-y-3 pt-2">
        <label className="flex items-center gap-3 p-4 bg-white rounded-lg border border-brand-navy/20 cursor-pointer hover:bg-secondary-50 transition-colors">
          <input
            type="checkbox"
            checked={filters.furnished === true}
            onChange={(e) => setFilters({ ...filters, furnished: e.target.checked ? true : undefined })}
            className="w-5 h-5 rounded border-brand-navy/20 text-secondary-500 focus:ring-secondary-500/60"
          />
          <div className="flex-1">
            <div className="font-medium text-brand-navy">🛋️ Amoblado</div>
            <div className="text-xs text-brand-navy/60 mt-0.5">Propiedad con muebles incluidos</div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-4 bg-white rounded-lg border border-brand-navy/20 cursor-pointer hover:bg-secondary-50 transition-colors">
          <input
            type="checkbox"
            checked={filters.verified === true}
            onChange={(e) => setFilters({ ...filters, verified: e.target.checked ? true : undefined })}
            className="w-5 h-5 rounded border-brand-navy/20 text-secondary-500 focus:ring-secondary-500/60"
          />
          <div className="flex-1">
            <div className="font-medium text-brand-navy">✅ Verificado</div>
            <div className="text-xs text-brand-navy/60 mt-0.5">Solo propiedades verificadas</div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-4 bg-white rounded-lg border border-brand-navy/20 cursor-pointer hover:bg-secondary-50 transition-colors">
          <input
            type="checkbox"
            checked={filters.petFriendly === true}
            onChange={(e) => setFilters({ ...filters, petFriendly: e.target.checked ? true : undefined })}
            className="w-5 h-5 rounded border-brand-navy/20 text-secondary-500 focus:ring-secondary-500/60"
          />
          <div className="flex-1">
            <div className="font-medium text-brand-navy">🐕 Pet Friendly</div>
            <div className="text-xs text-brand-navy/60 mt-0.5">Acepta mascotas</div>
          </div>
        </label>
      </div>

      <div className="pt-4 space-y-2">
        <Button
          onClick={handleNext}
          variant="primary"
          className="w-full"
          rightIcon={<ArrowRightIcon className="h-5 w-5" />}
        >
          Finalizar
        </Button>
        <button
          onClick={handleNext}
          className="w-full text-sm text-brand-navy/60 hover:text-brand-navy transition-colors py-2"
        >
          Omitir este paso
        </button>
      </div>
    </div>
  )

  const renderComplete = () => (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <span className="text-4xl">✅</span>
      </div>
      <div>
        <h3 className="text-xl font-bold text-brand-navy mb-2">
          ¡Listo! Filtros aplicados
        </h3>
        <p className="text-sm text-brand-navy/60">
          Actualizaremos tu búsqueda con los filtros seleccionados.
        </p>
      </div>
      <div className="w-full max-w-xs">
        <Button
          onClick={handleFinish}
          variant="primary"
          className="w-full"
        >
          Ver Resultados
        </Button>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcome()
      case 'price':
        return renderPriceStep()
      case 'rooms':
        return renderRoomsStep()
      case 'area':
        return renderAreaStep()
      case 'features':
        return renderFeaturesStep()
      case 'complete':
        return renderComplete()
      default:
        return renderMenu()
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'welcome':
        return 'Personaliza tu Búsqueda'
      case 'price':
        return '💰 Presupuesto'
      case 'rooms':
        return '🛏️ Habitaciones'
      case 'area':
        return '📏 Área'
      case 'features':
        return '✨ Características'
      case 'complete':
        return '✅ Completado'
      default:
        return 'Filtros'
    }
  }

  const isWizardMode = ['welcome', 'price', 'rooms', 'area', 'features', 'complete'].includes(currentStep)
  const activeFiltersCount = getActiveFiltersCount()

  if (!isOpen) return null

  // Renderizar modal usando portal para que salga del contexto del SearchForm
  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[380] animate-fade-in"
      />

      {/* Modal */}
      <div className="fixed left-0 right-0 bottom-0 z-[390] bg-gray-50 rounded-t-3xl shadow-2xl animate-slide-up-mobile max-h-[85vh] flex flex-col w-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-brand-navy/10 bg-white rounded-t-3xl flex-shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-lg font-bold text-brand-navy">
              {getStepTitle()}
            </h2>
          </div>
          <button
            onClick={currentStep === 'welcome' ? handleSkipAll : onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-brand-navy" />
          </button>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </>
  )

  // Renderizar en el body usando portal
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null
}
