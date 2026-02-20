import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export interface SearchFilters {
  minPrice?: string
  maxPrice?: string
  bedrooms?: string
  bathrooms?: string
  minArea?: string
  maxArea?: string
  furnished?: boolean
  verified?: boolean
  petFriendly?: boolean
}

interface SearchFiltersSheetProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: SearchFilters) => void
  initialFilters?: SearchFilters
}

export default function SearchFiltersSheet({
  isOpen,
  onClose,
  onApply,
  initialFilters = {}
}: SearchFiltersSheetProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)

  useEffect(() => {
    if (isOpen) {
      setFilters(initialFilters)
    }
  }, [isOpen, initialFilters])

  if (!isOpen) return null

  const handleApply = () => {
    onApply(filters)
  }

  const handleReset = () => {
    const emptyFilters: SearchFilters = {
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      minArea: '',
      maxArea: '',
      furnished: false,
      verified: false,
      petFriendly: false,
    }
    setFilters(emptyFilters)
  }

  return (
    <div className="fixed inset-0 z-[9999] md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute inset-x-0 bottom-0 max-h-[90vh] bg-white rounded-t-3xl shadow-2xl flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-brand-navy">Filtros</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-6">
            {/* Precio */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                💰 Precio Mensual (S/)
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Mínimo"
                    value={filters.minPrice || ''}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Máximo"
                    value={filters.maxPrice || ''}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Habitaciones y Baños */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  🛏️ Habitaciones
                </label>
                <select
                  value={filters.bedrooms || ''}
                  onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="">Cualquiera</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  🚿 Baños
                </label>
                <select
                  value={filters.bathrooms || ''}
                  onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="">Cualquiera</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                </select>
              </div>
            </div>

            {/* Área */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                📏 Área (m²)
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Mínimo"
                    value={filters.minArea || ''}
                    onChange={(e) => setFilters({ ...filters, minArea: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Máximo"
                    value={filters.maxArea || ''}
                    onChange={(e) => setFilters({ ...filters, maxArea: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Características */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                ✨ Características
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={filters.furnished || false}
                    onChange={(e) => setFilters({ ...filters, furnished: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">🛋️ Amoblado</div>
                    <div className="text-sm text-gray-500">Incluye muebles</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={filters.petFriendly || false}
                    onChange={(e) => setFilters({ ...filters, petFriendly: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">🐕 Pet Friendly</div>
                    <div className="text-sm text-gray-500">Acepta mascotas</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={filters.verified || false}
                    onChange={(e) => setFilters({ ...filters, verified: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">✓ Verificado</div>
                    <div className="text-sm text-gray-500">Propiedad verificada</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed Buttons */}
        <div className="flex-shrink-0 p-5 border-t border-gray-200 bg-white space-y-3">
          <button
            onClick={handleApply}
            className="w-full py-4 px-6 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition shadow-lg shadow-primary-500/30"
          >
            Aplicar Filtros
          </button>
          <button
            onClick={handleReset}
            className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
