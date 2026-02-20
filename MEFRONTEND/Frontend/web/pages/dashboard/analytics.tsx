import { NextPage } from 'next'
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

// Componentes
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/hooks/useAuth'

// Types y Services
import { analyticsService } from '../../services/analyticsService'
import { getMyListings, Listing } from '../../lib/api/listings'

interface ListingStats {
  listing_id: string
  title: string
  total_views: number
  total_leads: number
  total_favorites: number
  last_30_days: {
    views: number
    contacts: number
    unique_visitors: number
  }
  last_7_days: {
    views: number
  }
  daily_stats: Array<{
    date: string
    views: number
    contacts: number
  }>
}

const AnalyticsPage: NextPage = () => {
  const [listings, setListings] = useState<Listing[]>([])
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [stats, setStats] = useState<ListingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    loadListings()
  }, [user, router])

  const loadListings = async () => {
    try {
      setLoading(true)
      const data = await getMyListings()
      setListings(data)
      
      // Seleccionar el primer listing por defecto
      if (data.length > 0 && !selectedListingId) {
        setSelectedListingId(data[0].id)
        loadStats(data[0].id)
      }
    } catch (err) {
      console.error('Error loading listings:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (listingId: string) => {
    try {
      setLoadingStats(true)
      const data = await analyticsService.getListingStats(listingId)
      const listing = listings.find(l => l.id === listingId)
      setStats({
        ...data,
        title: listing?.title || 'Propiedad'
      })
    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleListingChange = (listingId: string) => {
    setSelectedListingId(listingId)
    loadStats(listingId)
  }

  const conversionRate = stats && stats.total_views > 0
    ? ((stats.total_leads / stats.total_views) * 100).toFixed(1)
    : '0.0'

  if (loading) {
    return (
      <Layout>
        <Head>
          <title>Estadísticas - RentaFacil</title>
        </Head>
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando estadísticas...</p>
          </div>
        </main>
      </Layout>
    )
  }

  if (listings.length === 0) {
    return (
      <Layout>
        <Head>
          <title>Estadísticas - RentaFacil</title>
        </Head>
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              No tienes propiedades publicadas
            </h1>
            <p className="text-gray-600 mb-6">
              Publica tu primera propiedad para ver estadísticas de rendimiento.
            </p>
            <Button as={Link} href="/dashboard/create-listing" variant="primary">
              Publicar Propiedad
            </Button>
          </div>
        </main>
      </Layout>
    )
  }

  return (
    <Layout>
      <Head>
        <title>Estadísticas - RentaFacil</title>
      </Head>
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
            <p className="text-gray-600 mt-2">
              Monitorea el rendimiento de tus propiedades publicadas
            </p>
          </div>

          {/* Selector de propiedad */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Propiedad
            </label>
            <select
              value={selectedListingId || ''}
              onChange={(e) => handleListingChange(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {listings.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.title}
                </option>
              ))}
            </select>
          </div>

          {loadingStats ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : stats ? (
            <>
              {/* Tarjetas de métricas principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Vistas Totales</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stats.total_views.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {stats.last_30_days.views} en los últimos 30 días
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Contactos</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stats.total_leads.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {stats.last_30_days.contacts} en los últimos 30 días
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Visitantes Únicos</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stats.last_30_days.unique_visitors.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Últimos 30 días
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {conversionRate}%
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Contactos / Vistas
                  </p>
                </div>
              </div>

              {/* Gráfico de vistas diarias */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Vistas de los últimos 7 días
                </h2>
                <div className="space-y-4">
                  {stats.daily_stats.map((day) => {
                    const maxViews = Math.max(...stats.daily_stats.map(d => d.views))
                    const percentage = maxViews > 0 ? (day.views / maxViews) * 100 : 0
                    const date = new Date(day.date)
                    const formattedDate = date.toLocaleDateString('es-PE', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })
                    
                    return (
                      <div key={day.date} className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 w-24 capitalize">
                          {formattedDate}
                        </span>
                        <div className="flex-1">
                          <div className="bg-gray-200 rounded-full h-8 overflow-hidden">
                            <div 
                              className="bg-blue-500 h-full flex items-center justify-end px-3 transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            >
                              {day.views > 0 && (
                                <span className="text-white text-sm font-medium">
                                  {day.views}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </Layout>
  )
}

export default AnalyticsPage
