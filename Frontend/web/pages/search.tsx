import { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Link from 'next/link'

// Componentes
import Layout from '@/components/Layout'
import PropertyCard from '@/components/PropertyCard'
import SearchForm from '@/components/SearchForm'
import { Button } from '@/components/ui/Button'

// Types y Services
import { Property } from '@/types'
import { listingsService } from '@/services/listings'

const SearchPage: NextPage = () => {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const performSearch = async () => {
      if (!router.isReady) return

      const { mode, location, minPrice, maxPrice, lat, lng, radius } = router.query

      setLoading(true)
      try {
        let results: Property[] = []

        if (lat && lng) {
          // Búsqueda por geolocalización
          results = await listingsService.searchNearby(
            parseFloat(lat as string), 
            parseFloat(lng as string), 
            parseInt(radius as string) || 5
          )
          setSearchQuery(`Cerca de tu ubicación`)
        } else if (mode && location) {
          // Búsqueda por parámetros del formulario
          results = await listingsService.searchProperties({
            mode: mode as 'alquiler' | 'comprar' | 'proyecto',
            location: location as string,
            minPrice: minPrice ? parseInt(minPrice as string) : undefined,
            maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
          })
          setSearchQuery(`${mode} en ${location}`)
        } else {
          // Búsqueda general
          results = await listingsService.getListings({ limit: 20 })
          setSearchQuery('Todas las propiedades')
        }

        setProperties(results)
      } catch (error) {
        console.error('Error searching properties:', error)
        setProperties([])
      } finally {
        setLoading(false)
      }
    }

    performSearch()
  }, [router.isReady, router.query])

  const handleNewSearch = async (params: { mode: string; location: string; minPrice?: number; maxPrice?: number }) => {
    const urlParams = new URLSearchParams({
      mode: params.mode,
      location: params.location,
      ...(params.minPrice && { minPrice: params.minPrice.toString() }),
      ...(params.maxPrice && { maxPrice: params.maxPrice.toString() }),
    })
    
    router.push(`/search?${urlParams.toString()}`)
  }

  return (
    <Layout>
      <Head>
        <title>Búsqueda de Propiedades - RentaFacil</title>
        <meta name="description" content={`Resultados de búsqueda: ${searchQuery}`} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Header de búsqueda */}
        <section className="bg-white border-b border-gray-200">
          <div className="container-custom py-6">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Resultados de Búsqueda
              </h1>
              <p className="text-gray-600">
                {loading ? 'Buscando propiedades...' : `${properties.length} propiedades encontradas para "${searchQuery}"`}
              </p>
            </div>
            
            {/* Formulario de búsqueda refinada */}
            <SearchForm
              onSearch={handleNewSearch}
              className="bg-gray-50 border border-gray-200"
            />
          </div>
        </section>

        {/* Resultados */}
        <section className="section-padding">
          <div className="container-custom">
            {loading ? (
              // Loading state
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-gray-200 rounded-xl aspect-[4/3] mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length > 0 ? (
              // Resultados
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      className="card-hover"
                    />
                  ))}
                </div>

                {/* Paginación (placeholder para futuro) */}
                <div className="mt-12 text-center">
                  <p className="text-gray-600 mb-4">
                    Mostrando {properties.length} de {properties.length} resultados
                  </p>
                  {/* Botón para cargar más resultados en el futuro */}
                </div>
              </>
            ) : (
              // Sin resultados
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No se encontraron propiedades
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Intenta ajustar tus filtros de búsqueda o explora otras zonas.
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={() => router.push('/search?mode=alquiler&location=Lima')}
                      variant="primary"
                      className="w-full"
                    >
                      Ver propiedades en Lima
                    </Button>
                    <Button
                      as={Link}
                      href="/"
                      variant="outline"
                      className="w-full"
                    >
                      Volver al inicio
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </Layout>
  )
}

export default SearchPage