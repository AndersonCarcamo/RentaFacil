import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../../lib/hooks/useAuth'
import { Header } from '../../../components/common/Header'
import { bookingService } from '../../../services/bookingService'
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '../../../types/booking'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  UserIcon,
  HomeIcon,
  BanknotesIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline'
import { formatCurrency } from '../../../lib/utils/currency'

export default function BookingDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const { user, loading: authLoading } = useAuth()
  const [booking, setBooking] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user && id) {
      loadBooking()
    }
  }, [user, id])

  const loadBooking = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Obtener todas las reservas y filtrar por ID
      const response = await bookingService.getHostBookings({})
      const foundBooking = response.bookings?.find((b: any) => b.id === id)
      
      if (!foundBooking) {
        setError('Reserva no encontrada')
        return
      }
      
      setBooking(foundBooking)
    } catch (err) {
      console.error('Error loading booking:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar la reserva')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmBooking = async () => {
    if (!booking) return
    
    if (!confirm('¿Confirmar esta reserva? El huésped será notificado y podrá proceder con el pago.')) {
      return
    }

    try {
      setProcessing(true)
      setActionMessage(null)
      
      await bookingService.confirmBooking({
        bookingId: booking.id,
        hostResponse: 'Confirmado! Te esperamos en las fechas indicadas.'
      })
      
      setActionMessage({ 
        type: 'success', 
        message: '✅ Reserva confirmada exitosamente. El huésped ha sido notificado.' 
      })
      
      // Recargar la reserva para ver el nuevo estado
      setTimeout(() => {
        loadBooking()
      }, 2000)
    } catch (err) {
      console.error('Error confirming booking:', err)
      setActionMessage({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Error al confirmar la reserva' 
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectBooking = async () => {
    if (!booking) return
    
    const reason = prompt('¿Por qué rechazas esta reserva? (opcional)')
    
    if (reason === null) return // Usuario canceló

    try {
      setProcessing(true)
      setActionMessage(null)
      
      await bookingService.rejectBooking(booking.id, reason || undefined)
      
      setActionMessage({ 
        type: 'success', 
        message: '❌ Reserva rechazada. El huésped ha sido notificado.' 
      })
      
      // Recargar la reserva para ver el nuevo estado
      setTimeout(() => {
        loadBooking()
      }, 2000)
    } catch (err) {
      console.error('Error rejecting booking:', err)
      setActionMessage({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Error al rechazar la reserva' 
      })
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    })
  }

  const formatShortDate = (dateString: string) => {
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
      <span className={`px-4 py-2 rounded-full text-sm font-medium ${colorClasses[color as keyof typeof colorClasses] || colorClasses.gray}`}>
        {label}
      </span>
    )
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

  if (error || !booking) {
    return (
      <>
        <Head>
          <title>Reserva no encontrada - Dashboard</title>
        </Head>

        <div className="min-h-screen bg-gray-50">
          <Header />
          
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <XCircleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {error || 'Reserva no encontrada'}
              </h3>
              <p className="text-gray-600 mb-6">
                La reserva que buscas no existe o no tienes acceso a ella.
              </p>
              <Link href="/dashboard/bookings" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <ArrowLeftIcon className="w-5 h-5" />
                Volver a reservas
              </Link>
            </div>
          </main>
        </div>
      </>
    )
  }

  const nights = calculateNights(booking.check_in_date, booking.check_out_date)

  return (
    <>
      <Head>
        <title>Reserva #{booking.id.substring(0, 8)} - Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
          {/* Back Button */}
          <div className="mb-4 md:mb-6">
            <Link 
              href="/dashboard/bookings"
              className="inline-flex items-center gap-2 text-sm md:text-base text-gray-600 hover:text-gray-900 font-medium"
            >
              <ArrowLeftIcon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Volver a todas las reservas</span>
              <span className="sm:hidden">Volver</span>
            </Link>
          </div>

          {/* Action Message */}
          {actionMessage && (
            <div className={`mb-4 md:mb-6 rounded-lg p-3 md:p-4 ${
              actionMessage.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm md:text-base ${actionMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {actionMessage.message}
              </p>
            </div>
          )}

          {/* Header Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-4 md:mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 text-white">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 md:mb-2 truncate">
                    Reserva #{booking.id.substring(0, 8)}
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-blue-100">
                    Solicitud recibida el {formatShortDate(booking.created_at)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(booking.status)}
                </div>
              </div>
            </div>

            {/* Main Info */}
            <div className="p-4 sm:p-6 md:p-8">
              {/* Dates Section */}
              <div className="mb-6 md:mb-8">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                  Fechas de la Reserva
                </h2>
                <div className="bg-blue-50 rounded-lg p-4 md:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    <div>
                      <div className="text-xs md:text-sm font-medium text-gray-600 mb-1">Check-in</div>
                      <div className="text-sm md:text-base lg:text-lg font-semibold text-gray-900 break-words">{formatDate(booking.check_in_date)}</div>
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-medium text-gray-600 mb-1">Check-out</div>
                      <div className="text-sm md:text-base lg:text-lg font-semibold text-gray-900 break-words">{formatDate(booking.check_out_date)}</div>
                    </div>
                    <div className="sm:col-span-2 md:col-span-1">
                      <div className="text-xs md:text-sm font-medium text-gray-600 mb-1">Duración</div>
                      <div className="text-sm md:text-base lg:text-lg font-semibold text-gray-900">
                        🌙 {nights} {nights === 1 ? 'noche' : 'noches'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest Info */}
              <div className="mb-6 md:mb-8">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                  Información del Huésped
                </h2>
                <div className="bg-gray-50 rounded-lg p-4 md:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <div className="text-xs md:text-sm font-medium text-gray-600 mb-1">Nombre</div>
                      <div className="text-sm md:text-base lg:text-lg font-semibold text-gray-900 break-words">{booking.guest_name}</div>
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-medium text-gray-600 mb-1">Número de Huéspedes</div>
                      <div className="text-sm md:text-base lg:text-lg font-semibold text-gray-900">
                        👥 {booking.number_of_guests} {booking.number_of_guests === 1 ? 'persona' : 'personas'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-medium text-gray-600 mb-1">Email</div>
                      <div className="text-xs md:text-sm lg:text-base text-gray-900 break-all">{booking.guest_email}</div>
                    </div>
                    {booking.guest_phone && (
                      <div>
                        <div className="text-xs md:text-sm font-medium text-gray-600 mb-1">Teléfono</div>
                        <div className="text-xs md:text-sm lg:text-base text-gray-900">{booking.guest_phone}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Guest Message */}
              {booking.guest_message && (
                <div className="mb-6 md:mb-8">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                    <ChatBubbleLeftIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                    Mensaje del Huésped
                  </h2>
                  <div className="bg-blue-50 rounded-lg p-4 md:p-6">
                    <p className="text-sm md:text-base text-gray-800 leading-relaxed break-words">{booking.guest_message}</p>
                  </div>
                </div>
              )}

              {/* Payment Info */}
              <div className="mb-6 md:mb-8">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                  <BanknotesIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                  Desglose de Pagos
                </h2>
                <div className="bg-gray-50 rounded-lg p-4 md:p-6">
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center pb-3 md:pb-4 border-b">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="text-sm md:text-base font-medium text-gray-900">Pago de Reserva (50%)</div>
                        <div className="text-xs md:text-sm text-gray-600">Al confirmar la reserva</div>
                      </div>
                      <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900 whitespace-nowrap">
                        {formatCurrency(booking.reservation_amount, booking.currency)}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pb-3 md:pb-4 border-b">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="text-sm md:text-base font-medium text-gray-900">Pago al Check-in (50%)</div>
                        <div className="text-xs md:text-sm text-gray-600">El día de la llegada</div>
                      </div>
                      <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900 whitespace-nowrap">
                        {formatCurrency(booking.checkin_amount, booking.currency)}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="text-base md:text-lg font-semibold text-gray-900">Total</div>
                        <div className="text-xs md:text-sm text-gray-600">{nights} {nights === 1 ? 'noche' : 'noches'}</div>
                      </div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 whitespace-nowrap">
                        {formatCurrency(booking.total_amount, booking.currency)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Property Info */}
              <div className="mb-6 md:mb-8">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                  <HomeIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                  Propiedad
                </h2>
                <div className="bg-gray-50 rounded-lg p-4 md:p-6">
                  <div className="text-xs md:text-sm font-medium text-gray-600 mb-1">ID de Propiedad</div>
                  <div className="text-xs md:text-sm lg:text-base text-gray-900 font-mono break-all">{booking.listing_id}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {booking.status === 'pending_confirmation' && (
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">
                ¿Qué deseas hacer con esta reserva?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <button
                  onClick={handleConfirmBooking}
                  disabled={processing}
                  className="px-6 md:px-8 py-3 md:py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 font-semibold text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 md:gap-3 shadow-lg hover:shadow-xl transition-all touch-manipulation"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-b-2 border-white"></div>
                      <span className="text-sm md:text-base">Procesando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-6 h-6 md:w-7 md:h-7" />
                      <span className="text-sm md:text-base">Confirmar Reserva</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleRejectBooking}
                  disabled={processing}
                  className="px-6 md:px-8 py-3 md:py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 font-semibold text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 md:gap-3 shadow-lg hover:shadow-xl transition-all touch-manipulation"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-b-2 border-white"></div>
                      <span className="text-sm md:text-base">Procesando...</span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="w-6 h-6 md:w-7 md:h-7" />
                      <span className="text-sm md:text-base">Rechazar Reserva</span>
                    </>
                  )}
                </button>
              </div>
              <p className="mt-4 md:mt-6 text-xs md:text-sm text-gray-600 text-center leading-relaxed">
                Al confirmar, el huésped recibirá un correo de notificación y podrá proceder con el pago del 50% inicial.
              </p>
            </div>
          )}

          {/* Status Messages */}
          {booking.status === 'confirmed' && (
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
              <div className="flex items-start gap-3 md:gap-4 text-green-700 bg-green-50 p-4 md:p-6 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base md:text-lg mb-1 md:mb-2">Reserva Confirmada</h3>
                  <p className="text-sm md:text-base">Esta reserva ha sido confirmada. El huésped debe realizar el pago del 50% inicial para completar la reserva.</p>
                </div>
              </div>
            </div>
          )}

          {booking.status === 'reservation_paid' && (
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
              <div className="flex items-start gap-3 md:gap-4 text-blue-700 bg-blue-50 p-4 md:p-6 rounded-lg">
                <BanknotesIcon className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base md:text-lg mb-1 md:mb-2">Pago Inicial Recibido</h3>
                  <p className="text-sm md:text-base">El huésped ya realizó el pago del 50% inicial. Pagará el 50% restante al momento del check-in.</p>
                </div>
              </div>
            </div>
          )}

          {booking.status === 'rejected' && (
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
              <div className="flex items-start gap-3 md:gap-4 text-red-700 bg-red-50 p-4 md:p-6 rounded-lg">
                <XCircleIcon className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base md:text-lg mb-1 md:mb-2">Reserva Rechazada</h3>
                  <p className="text-sm md:text-base">Esta reserva fue rechazada. El huésped ha sido notificado.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
