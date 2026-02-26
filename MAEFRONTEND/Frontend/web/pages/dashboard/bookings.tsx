import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../lib/hooks/useAuth'
import { Header } from '../../components/common/Header'
import { bookingService } from '../../services/bookingService'
import { Booking, BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '../../types/booking'
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  UserIcon,
  HomeIcon,
  BanknotesIcon,
  ChatBubbleLeftIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { formatCurrency } from '../../lib/utils/currency'

export default function BookingsManagementPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('pending')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user) {
      loadBookings()
    }
  }, [user, filter])

  const loadBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const statusFilter = filter === 'all' ? undefined : [filter === 'pending' ? 'pending_confirmation' : filter]
      const response = await bookingService.getHostBookings({ status: statusFilter })
      
      setBookings(response.bookings || [])
    } catch (err) {
      console.error('Error loading bookings:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar las reservas')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusBadge = (status: string) => {
    const color = BOOKING_STATUS_COLORS[status as keyof typeof BOOKING_STATUS_COLORS] || 'gray'
    const label = BOOKING_STATUS_LABELS[status as keyof typeof BOOKING_STATUS_LABELS] || status

    const colorClasses = {
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800',
      purple: 'bg-purple-100 text-purple-800'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClasses[color as keyof typeof colorClasses] || colorClasses.gray}`}>
        {label}
      </span>
    )
  }

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true
    if (filter === 'pending') return booking.status === 'pending_confirmation'
    if (filter === 'confirmed') return ['confirmed', 'reservation_paid'].includes(booking.status)
    if (filter === 'completed') return ['checked_in', 'checked_out', 'completed'].includes(booking.status)
    return true
  })

  const stats = {
    pending: bookings.filter(b => b.status === 'pending_confirmation').length,
    confirmed: bookings.filter(b => ['confirmed', 'reservation_paid'].includes(b.status)).length,
    completed: bookings.filter(b => ['checked_in', 'checked_out', 'completed'].includes(b.status)).length,
    total: bookings.length
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Gestión de Reservas - Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Reservas</h1>
                <p className="mt-2 text-gray-600">Administra las solicitudes de reserva de tus propiedades Airbnb</p>
              </div>
              <button
                onClick={loadBookings}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Actualizar
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Pendientes</div>
                    <div className="mt-2 text-3xl font-bold text-yellow-600">{stats.pending}</div>
                  </div>
                  <ClockIcon className="w-10 h-10 text-yellow-500 opacity-50" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Confirmadas</div>
                    <div className="mt-2 text-3xl font-bold text-green-600">{stats.confirmed}</div>
                  </div>
                  <CheckCircleIcon className="w-10 h-10 text-green-500 opacity-50" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Completadas</div>
                    <div className="mt-2 text-3xl font-bold text-blue-600">{stats.completed}</div>
                  </div>
                  <CheckCircleIcon className="w-10 h-10 text-blue-500 opacity-50" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Total</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</div>
                  </div>
                  <HomeIcon className="w-10 h-10 text-gray-400 opacity-50" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setFilter('pending')}
                className={`px-6 py-3 font-medium transition-colors ${
                  filter === 'pending'
                    ? 'border-b-2 border-yellow-500 text-yellow-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pendientes ({stats.pending})
              </button>
              <button
                onClick={() => setFilter('confirmed')}
                className={`px-6 py-3 font-medium transition-colors ${
                  filter === 'confirmed'
                    ? 'border-b-2 border-green-500 text-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Confirmadas ({stats.confirmed})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-6 py-3 font-medium transition-colors ${
                  filter === 'completed'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Completadas ({stats.completed})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-3 font-medium transition-colors ${
                  filter === 'all'
                    ? 'border-b-2 border-gray-500 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Todas ({stats.total})
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Bookings List */}
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 md:p-12 text-center">
                <HomeIcon className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                  No hay reservas {filter !== 'all' && `en estado "${filter}"`}
                </h3>
                <p className="text-sm md:text-base text-gray-600">
                  {filter === 'pending'
                    ? 'Las nuevas solicitudes de reserva aparecerán aquí'
                    : 'No tienes reservas en este estado actualmente'}
                </p>
              </div>
            ) : (
              filteredBookings.map(booking => (
                <div key={booking.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-4 md:p-6">
                    {/* Header - Móvil optimizado */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base md:text-lg font-semibold text-gray-900">
                            Reserva #{booking.id.substring(0, 8)}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                          <HomeIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">Propiedad ID: {booking.listing_id.substring(0, 8)}</span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-xl md:text-2xl font-bold text-gray-900">
                          {formatCurrency(booking.total_amount, booking.currency)}
                        </div>
                        <div className="text-xs md:text-sm text-gray-500">Total</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4">
                      {/* Huésped */}
                      <div className="flex items-start gap-2 md:gap-3 p-3 bg-gray-50 rounded-lg sm:bg-transparent sm:p-0">
                        <UserIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs md:text-sm font-medium text-gray-700 mb-1">Huésped</div>
                          <div className="text-sm md:text-base text-gray-900 font-medium truncate">{booking.guest_name}</div>
                          <div className="text-xs text-gray-500 truncate">{booking.guest_email}</div>
                          {booking.guest_phone && (
                            <div className="text-xs text-gray-500">{booking.guest_phone}</div>
                          )}
                          <div className="text-xs text-gray-600 mt-1">
                            👥 {booking.number_of_guests} {booking.number_of_guests === 1 ? 'persona' : 'personas'}
                          </div>
                        </div>
                      </div>

                      {/* Fechas */}
                      <div className="flex items-start gap-2 md:gap-3 p-3 bg-gray-50 rounded-lg sm:bg-transparent sm:p-0">
                        <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs md:text-sm font-medium text-gray-700 mb-1">Fechas</div>
                          <div className="text-xs md:text-sm text-gray-900">
                            <span className="font-medium">Check-in:</span> {formatDate(booking.check_in_date)}
                          </div>
                          <div className="text-xs md:text-sm text-gray-900">
                            <span className="font-medium">Check-out:</span> {formatDate(booking.check_out_date)}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 font-medium">
                            🌙 {calculateNights(booking.check_in_date, booking.check_out_date)} {calculateNights(booking.check_in_date, booking.check_out_date) === 1 ? 'noche' : 'noches'}
                          </div>
                        </div>
                      </div>

                      {/* Pagos */}
                      <div className="flex items-start gap-2 md:gap-3 p-3 bg-gray-50 rounded-lg sm:bg-transparent sm:p-0 sm:col-span-2 md:col-span-1">
                        <BanknotesIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs md:text-sm font-medium text-gray-700 mb-1">Estado de Pago</div>
                          <div className="text-xs md:text-sm text-gray-900">
                            <span className="font-medium">Reserva:</span> {formatCurrency(booking.reservation_amount, booking.currency)}
                          </div>
                          <div className="text-xs md:text-sm text-gray-900">
                            <span className="font-medium">Check-in:</span> {formatCurrency(booking.checkin_amount, booking.currency)}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 font-semibold">
                            💰 Total: {formatCurrency(booking.total_amount, booking.currency)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Guest Message */}
                    {booking.guest_message && (
                      <div className="mb-3 md:mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="flex items-start gap-2">
                          <ChatBubbleLeftIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-blue-900 mb-1">💬 Mensaje del huésped:</div>
                            <div className="text-xs md:text-sm text-gray-800 leading-relaxed line-clamp-3">
                              {booking.guest_message}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* View Details Button */}
                    <div className="pt-3 md:pt-4 border-t">
                      <Link
                        href={`/dashboard/bookings/${booking.id}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 font-medium transition-colors text-sm md:text-base shadow-sm"
                      >
                        <EyeIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Ver Detalles y Gestionar</span>
                        <span className="sm:hidden">Ver Detalles</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </>
  )
}
