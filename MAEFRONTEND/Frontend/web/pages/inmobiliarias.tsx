import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { getAgencies, Agency } from '@/lib/api/agencies'
import { 
  BuildingOfficeIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  GlobeAltIcon,
  MapPinIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

export default function InmobiliariasPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showOnlyVerified, setShowOnlyVerified] = useState(false)

  useEffect(() => {
    loadAgencies()
  }, [])

  const loadAgencies = async () => {
    try {
      setLoading(true)
      setError(null)
      // Obtener todas las inmobiliarias
      const data = await getAgencies()
      setAgencies(data)
    } catch (err) {
      console.error('Error loading agencies:', err)
      setError('No se pudieron cargar las inmobiliarias. Por favor, intenta más tarde.')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar agencias por término de búsqueda y verificación
  const filteredAgencies = agencies.filter(agency => {
    const matchesSearch = 
      agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.address?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesVerification = !showOnlyVerified || agency.is_verified
    
    return matchesSearch && matchesVerification
  })

  const getLogoUrl = (logoUrl: string | null) => {
    if (!logoUrl) return null
    if (logoUrl.startsWith('http')) return logoUrl
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    return `${API_BASE_URL}${logoUrl}`
  }

  return (
    <Layout title="Inmobiliarias - RentaFacil">
      <Head>
        <title>Inmobiliarias Verificadas - RentaFacil</title>
        <meta 
          name="description" 
          content="Encuentra inmobiliarias verificadas en RentaFacil. Profesionales confiables para ayudarte a encontrar tu propiedad ideal."
        />
      </Head>

      <div className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Inmobiliarias Verificadas
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Conecta con profesionales de confianza para encontrar tu propiedad ideal
            </p>
          </div>

          {/* Search Bar & Filters */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar inmobiliaria por nombre, ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Filter Toggle */}
            <div className="flex items-center justify-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyVerified}
                  onChange={(e) => setShowOnlyVerified(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Mostrar solo verificadas
                </span>
              </label>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando inmobiliarias...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadAgencies}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Agencies Grid */}
          {!loading && !error && (
            <>
              {filteredAgencies.length === 0 ? (
                <div className="text-center py-12">
                  <BuildingOfficeIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'No se encontraron resultados' : 'No hay inmobiliarias disponibles'}
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm 
                      ? 'Intenta con otros términos de búsqueda'
                      : 'Vuelve más tarde para ver inmobiliarias verificadas'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6 text-gray-600">
                    Mostrando {filteredAgencies.length} {filteredAgencies.length === 1 ? 'inmobiliaria' : 'inmobiliarias'}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAgencies.map((agency) => (
                      <div
                        key={agency.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
                      >
                        {/* Logo / Header */}
                        <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                          {agency.logo_url ? (
                            <img
                              src={getLogoUrl(agency.logo_url) || undefined}
                              alt={agency.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <BuildingOfficeIcon className="h-16 w-16 text-white opacity-50" />
                            </div>
                          )}
                          {agency.is_verified && (
                            <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                              <CheckBadgeIcon className="h-4 w-4" />
                              Verificada
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {agency.name}
                          </h3>

                          {agency.description && (
                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                              {agency.description}
                            </p>
                          )}

                          {/* Contact Info */}
                          <div className="space-y-2 text-sm">
                            {agency.address && (
                              <div className="flex items-start gap-2 text-gray-600">
                                <MapPinIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <span>{agency.address}</span>
                              </div>
                            )}

                            {agency.phone && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <PhoneIcon className="h-5 w-5 flex-shrink-0" />
                                <a 
                                  href={`tel:${agency.phone}`}
                                  className="hover:text-blue-600 transition-colors"
                                >
                                  {agency.phone}
                                </a>
                              </div>
                            )}

                            {agency.email && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <EnvelopeIcon className="h-5 w-5 flex-shrink-0" />
                                <a 
                                  href={`mailto:${agency.email}`}
                                  className="hover:text-blue-600 transition-colors truncate"
                                >
                                  {agency.email}
                                </a>
                              </div>
                            )}

                            {agency.website && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <GlobeAltIcon className="h-5 w-5 flex-shrink-0" />
                                <a 
                                  href={agency.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-blue-600 transition-colors truncate"
                                >
                                  Sitio web
                                </a>
                              </div>
                            )}
                          </div>

                          {/* CTA Button */}
                          <div className="mt-6">
                            <Link
                              href={`/search?agency_id=${agency.id}`}
                              className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                              Ver propiedades
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Info Section */}
          <div className="mt-16 bg-blue-50 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              ¿Eres una inmobiliaria?
            </h2>
            <p className="text-gray-600 text-center mb-6 max-w-2xl mx-auto">
              Únete a RentaFacil y conecta con miles de personas buscando su próximo hogar.
              Aumenta tu visibilidad y gestiona tus propiedades de manera profesional.
            </p>
            <div className="text-center">
              <Link
                href="/register"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Registrar mi inmobiliaria
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
