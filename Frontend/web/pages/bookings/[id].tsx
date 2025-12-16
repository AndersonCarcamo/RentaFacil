import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { bookingService } from '../../services/bookingService'
import { chatService } from '../../services/chatService'
import type { BookingWithPayments } from '../../types/booking'
import toast from 'react-hot-toast'
import { 
  CalendarIcon, 
  UserIcon, 
  HomeIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import ChatButton from '../../components/chat/ChatButton'
import ChatWindow from '../../components/chat/ChatWindow'

export default function BookingDetailsPage() {
  const router = useRouter()
  const { id } = router.query
  const [booking, setBooking] = useState<BookingWithPayments | null>(null)
  const [loading, setLoading] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadBooking(id)
    }
    
    // Obtener current user ID del token
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setCurrentUserId(payload.sub)
      } catch (error) {
        console.error('Error parsing token:', error)
      }
    }
  }, [id])

  const loadBooking = async (bookingId: string) => {
    try {
      setLoading(true)
      const data = await bookingService.getBooking(bookingId)
      setBooking(data)
    } catch (error) {
      console.error('Error loading booking:', error)
      toast.error('Error al cargar la reserva')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_confirmation':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'reservation_paid':
        return 'bg-green-100 text-green-800'
      case 'checked_in':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled_by_guest':
      case 'cancelled_by_host':
      case 'cancelled_no_payment':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_confirmation':
        return 'Pendiente de Confirmación'
      case 'confirmed':
        return 'Confirmada'
      case 'reservation_paid':
        return 'Reserva Pagada (50%)'
      case 'checked_in':
        return 'Check-in Realizado'
      case 'completed':
        return 'Completada'
      case 'cancelled_by_guest':
        return 'Cancelada por Huésped'
      case 'cancelled_by_host':
        return 'Cancelada por Anfitrión'
      case 'cancelled_no_payment':
        return 'Cancelada - Sin Pago'
      default:
        return status
    }
  }

  const canChat = () => {
    if (!booking) return false
    // Permitir chat solo si la reserva está confirmada o en estados posteriores
    return ['confirmed', 'reservation_paid', 'checked_in', 'completed'].includes(booking.status)
  }

  const handleOpenChat = async () => {
    if (!booking || !currentUserId) {
      toast.error('No se pudo abrir el chat')
      return
    }

    try {
      // Crear o obtener conversación
      const conversation = await chatService.getOrCreateConversationForListing(
        booking.listing_id,
        booking.listing?.user_id || '' // Asumiendo que el booking tiene la info del listing
      )
      
      setConversationId(conversation.id)
      setShowChat(true)
    } catch (error) {
      console.error('Error opening chat:', error)
      toast.error('Error al abrir el chat')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    )
  }

  if (!booking) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Reserva no encontrada</h2>
          <button
            onClick={() => router.push('/bookings')}
            className="mt-4 text-purple-600 hover:text-purple-800"
          >
            Volver a Mis Reservas
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/bookings')}
            className="text-purple-600 hover:text-purple-800 mb-4 flex items-center gap-2"
          >
            ← Volver a Mis Reservas
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detalles de Reserva</h1>
              <p className="text-gray-500 mt-1">ID: {booking.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
              {getStatusText(booking.status)}
            </span>
          </div>
        </div>

        {/* Main Info Card */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
          <div className="p-6">
            {/* Fechas */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              <CalendarIcon className="w-8 h-8 text-purple-600" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Fechas de la Reserva</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="text-lg font-medium text-gray-900">
                      {new Date(booking.check_in_date).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="text-lg font-medium text-gray-900">
                      {new Date(booking.check_out_date).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {booking.nights} {booking.nights === 1 ? 'noche' : 'noches'}
                </p>
              </div>
            </div>

            {/* Huéspedes */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              <UserIcon className="w-8 h-8 text-purple-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Huéspedes</h3>
                <p className="text-gray-600">
                  {booking.number_of_guests} {booking.number_of_guests === 1 ? 'huésped' : 'huéspedes'}
                </p>
              </div>
            </div>

            {/* Precio */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              <BanknotesIcon className="w-8 h-8 text-purple-600" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Detalles del Precio</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">S/ {booking.price_per_night} x {booking.nights} noches</span>
                    <span className="font-medium">S/ {booking.total_price}</span>
                  </div>
                  {parseFloat(booking.service_fee.toString()) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tarifa de servicio</span>
                      <span className="font-medium">S/ {booking.service_fee}</span>
                    </div>
                  )}
                  {parseFloat(booking.cleaning_fee.toString()) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tarifa de limpieza</span>
                      <span className="font-medium">S/ {booking.cleaning_fee}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t font-bold text-lg">
                    <span>Total</span>
                    <span>S/ {booking.total_price}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan de Pagos */}
            <div className="flex items-start gap-4 mb-6">
              <ClockIcon className="w-8 h-8 text-purple-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Plan de Pagos</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Pago de Reserva (50%)</p>
                      <p className="text-sm text-gray-500">Al confirmar la reserva</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">S/ {booking.reservation_amount}</p>
                      {booking.reservation_paid_at ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircleIcon className="w-4 h-4" />
                          Pagado
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <XCircleIcon className="w-4 h-4" />
                          Pendiente
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Pago en Check-in (50%)</p>
                      <p className="text-sm text-gray-500">Al momento del check-in</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">S/ {booking.checkin_amount}</p>
                      {booking.checked_in_at ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircleIcon className="w-4 h-4" />
                          Pagado
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <XCircleIcon className="w-4 h-4" />
                          Pendiente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            {booking.guest_message && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Mensaje al Anfitrión</h3>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{booking.guest_message}</p>
              </div>
            )}

            {booking.host_response && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Respuesta del Anfitrión</h3>
                <p className="text-gray-600 bg-blue-50 p-4 rounded-lg">{booking.host_response}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de la Reserva</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Reserva creada</p>
                <p className="text-sm text-gray-500">
                  {new Date(booking.created_at).toLocaleString('es-ES')}
                </p>
              </div>
            </div>

            {booking.confirmed_at && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Confirmada por el anfitrión</p>
                  <p className="text-sm text-gray-500">
                    {new Date(booking.confirmed_at).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            )}

            {booking.reservation_paid_at && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Pago de reserva completado (50%)</p>
                  <p className="text-sm text-gray-500">
                    {new Date(booking.reservation_paid_at).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            )}

            {booking.checked_in_at && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Check-in realizado</p>
                  <p className="text-sm text-gray-500">
                    {new Date(booking.checked_in_at).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            )}

            {booking.completed_at && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Reserva completada</p>
                  <p className="text-sm text-gray-500">
                    {new Date(booking.completed_at).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            )}

            {booking.cancelled_at && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-600 mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Reserva cancelada</p>
                  <p className="text-sm text-gray-500">
                    {new Date(booking.cancelled_at).toLocaleString('es-ES')}
                  </p>
                  {booking.cancellation_reason && (
                    <p className="text-sm text-gray-600 mt-1 bg-red-50 p-2 rounded">
                      Motivo: {booking.cancellation_reason}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Success Message */}
        {booking.status === 'pending_confirmation' && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              <strong>Reserva pendiente:</strong> El anfitrión debe confirmar tu reserva. 
              Te notificaremos cuando sea confirmada para que puedas proceder con el pago.
            </p>
          </div>
        )}

        {/* Botón flotante de chat (solo si puede chatear) */}
        {canChat() && !showChat && (
          <div className="fixed bottom-6 right-6 z-40">
            <ChatButton onClick={handleOpenChat} />
          </div>
        )}

        {/* Modal de chat */}
        {showChat && conversationId && currentUserId && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
              <ChatWindow
                conversationId={conversationId}
                currentUserId={currentUserId}
                onClose={() => setShowChat(false)}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
