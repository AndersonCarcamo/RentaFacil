import { useState, useEffect } from 'react'
import { fetchProperties, PropertyResponse, PropertyFilters, formatPrice, getPropertyTypeLabel, getOperationLabel } from '@/lib/api/properties'

interface PropertyListProps {
  filters?: PropertyFilters
}

export function PropertyList({ filters }: PropertyListProps) {
  const [properties, setProperties] = useState<PropertyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const data = await fetchProperties(filters)
        setProperties(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando propiedades')
        console.error('Failed to load properties:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProperties()
  }, [filters])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No se encontraron propiedades
        </h3>
        <p className="text-gray-500">
          Intenta ajustar tus filtros de búsqueda
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <div 
          key={property.id} 
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Property Image Placeholder */}
          <div className="h-48 bg-gray-200 flex items-center justify-center">
            {property.has_media ? (
              <span className="text-gray-500">📸 Fotos disponibles</span>
            ) : (
              <span className="text-gray-400">Sin fotos</span>
            )}
          </div>

          {/* Property Details */}
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                {property.title}
              </h3>
              {property.verification_status === 'verified' && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  ✓ Verificado
                </span>
              )}
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{getOperationLabel(property.operation)}</span>
                <span>{getPropertyTypeLabel(property.property_type)}</span>
              </div>

              <div className="text-2xl font-bold text-primary-600">
                {formatPrice(Number(property.price), property.currency)}
                {property.operation === 'rent' && <span className="text-sm font-normal">/mes</span>}
              </div>

              {property.address && (
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {property.district}, {property.department}
                </div>
              )}

              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {property.bedrooms && (
                  <div className="flex items-center">
                    <span>🛏️ {property.bedrooms}</span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center">
                    <span>🚿 {property.bathrooms}</span>
                  </div>
                )}
                {property.area_built && (
                  <div className="flex items-center">
                    <span>📐 {property.area_built}m²</span>
                  </div>
                )}
              </div>

              {property.furnished !== null && (
                <div className="text-sm text-gray-600">
                  {property.furnished ? '🪑 Amoblado' : '🏗️ Sin amoblar'}
                </div>
              )}

              {property.is_airbnb_available && (
                <div className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  🏠 Apto para Airbnb
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
              <span>👁️ {property.views_count} vistas</span>
              <span>❤️ {property.favorites_count} favoritos</span>
              <span>📞 {property.leads_count} consultas</span>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button 
                onClick={() => window.open(`/property/${property.id}`, '_blank')}
                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                Ver detalles
              </button>
              <button 
                className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-sm"
                onClick={() => {
                  // Add to favorites logic here
                  console.log('Add to favorites:', property.id)
                }}
              >
                ❤️
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Example usage in a page:
// <PropertyList filters={{ operation_type: 'rent', city: 'Lima', limit: 12 }} />