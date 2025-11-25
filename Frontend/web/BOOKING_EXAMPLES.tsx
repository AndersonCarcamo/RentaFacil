/**
 * EJEMPLO DE USO - Sistema de Reservas Airbnb
 * Cómo integrar los componentes en tu aplicación
 */

// ============================================
// EJEMPLO 1: Agregar botón de reserva en página de propiedad
// ============================================

// pages/property/[id].tsx

import { useState } from 'react'
import { BookingModal } from '@/components/booking'
import { useRouter } from 'next/router'

export default function PropertyPage({ property }) {
  const router = useRouter()
  const [showBookingModal, setShowBookingModal] = useState(false)

  return (
    <div>
      {/* ... resto del contenido de la propiedad ... */}
      
      {/* Botón para abrir modal de reserva */}
      <button 
        onClick={() => setShowBookingModal(true)}
        className="btn-primary"
      >
        Reservar ahora
      </button>

      {/* Modal de reserva */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        listing={{
          id: property.id,
          title: property.title,
          images: property.images,
          pricePerNight: property.price,
          minimumNights: property.minimumNights || 1,
          maxGuests: property.maxGuests || 4,
          hostName: property.owner.name
        }}
        onSuccess={() => {
          // Redirigir a la página de reservas
          router.push('/bookings')
        }}
      />
    </div>
  )
}

// ============================================
// EJEMPLO 2: Calendario standalone en sidebar
// ============================================

// components/PropertySidebar.tsx

import { useState } from 'react'
import { BookingCalendar } from '@/components/booking'
import { bookingUtils } from '@/services/bookingService'

export default function PropertySidebar({ property }) {
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')

  function handleDateSelect(newCheckIn: string, newCheckOut: string) {
    setCheckIn(newCheckIn)
    setCheckOut(newCheckOut)
  }

  const nights = checkIn && checkOut 
    ? bookingUtils.calculateNights(checkIn, checkOut) 
    : 0

  const totalPrice = nights * property.price

  return (
    <div className="sidebar">
      <div className="price-box">
        <span className="price">S/ {property.price}</span>
        <span className="per-night">por noche</span>
      </div>

      <BookingCalendar
        listingId={property.id}
        pricePerNight={property.price}
        minimumNights={property.minimumNights}
        onDateSelect={handleDateSelect}
        selectedCheckIn={checkIn}
        selectedCheckOut={checkOut}
      />

      {nights > 0 && (
        <div className="booking-summary">
          <div className="summary-row">
            <span>S/ {property.price} × {nights} noches</span>
            <span>S/ {totalPrice}</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>S/ {totalPrice}</span>
          </div>
          <button className="btn-primary">
            Solicitar reserva
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================
// EJEMPLO 3: Cargar reservas con filtros
// ============================================

// pages/dashboard/bookings.tsx

import { useEffect, useState } from 'react'
import { bookingService } from '@/services/bookingService'
import { Booking } from '@/types/booking'

export default function BookingsDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadBookings()
  }, [filter])

  async function loadBookings() {
    try {
      setLoading(true)
      
      // Cargar reservas con filtro opcional
      const params = filter !== 'all' 
        ? { status: [filter], page: 1, limit: 20 }
        : { page: 1, limit: 20 }

      const response = await bookingService.getMyBookings(params)
      setBookings(response.bookings)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Filtros */}
      <div className="filters">
        <button onClick={() => setFilter('all')}>Todas</button>
        <button onClick={() => setFilter('pending_confirmation')}>Pendientes</button>
        <button onClick={() => setFilter('confirmed')}>Confirmadas</button>
      </div>

      {/* Lista */}
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <div>
          {bookings.map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// EJEMPLO 4: Confirmar reserva (anfitrión)
// ============================================

import { bookingService } from '@/services/bookingService'
import toast from 'react-hot-toast'

async function handleConfirmBooking(bookingId: string) {
  try {
    const response = window.confirm(
      '¿Deseas confirmar esta reserva? El huésped recibirá un correo para proceder con el pago.'
    )
    
    if (!response) return

    await bookingService.confirmBooking({
      bookingId,
      hostResponse: 'Bienvenido! Te espero en la propiedad.'
    })

    toast.success('Reserva confirmada exitosamente')
    
    // Recargar lista de reservas
    loadBookings()
  } catch (error: any) {
    toast.error(error.message || 'Error al confirmar reserva')
  }
}

// ============================================
// EJEMPLO 5: Procesar pago de reserva (Stripe)
// ============================================

import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function PaymentForm({ booking }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  async function handlePayment(event: React.FormEvent) {
    event.preventDefault()
    
    if (!stripe || !elements) return

    try {
      setLoading(true)

      // 1. Crear PaymentMethod con Stripe
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement
      })

      if (error) throw error

      // 2. Enviar al backend para procesar
      const result = await bookingService.processReservationPayment({
        bookingId: booking.id,
        paymentType: 'reservation',
        paymentMethodId: paymentMethod.id
      })

      // 3. Confirmar pago con Stripe
      if (result.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(
          result.clientSecret
        )

        if (confirmError) throw confirmError
      }

      toast.success('¡Pago procesado exitosamente!')
      toast.success('Reserva confirmada al 50%')
      
      // Redirigir
      router.push(`/bookings/${booking.id}`)
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handlePayment}>
      <div className="payment-info">
        <h3>Pago de Reserva (50%)</h3>
        <p>Monto a pagar: S/ {booking.reservationAmount}</p>
      </div>

      <div className="card-element">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>

      <button type="submit" disabled={loading || !stripe}>
        {loading ? 'Procesando...' : `Pagar S/ ${booking.reservationAmount}`}
      </button>
    </form>
  )
}

// Componente principal con Stripe Elements
export default function PaymentPage({ booking }) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm booking={booking} />
    </Elements>
  )
}

// ============================================
// EJEMPLO 6: Verificar disponibilidad antes de reservar
// ============================================

import { bookingService, bookingUtils } from '@/services/bookingService'

async function checkAvailability(
  listingId: string,
  checkIn: string,
  checkOut: string
) {
  try {
    // Validar fechas primero
    const validation = bookingUtils.validateDates(checkIn, checkOut)
    if (!validation.valid) {
      toast.error(validation.error)
      return false
    }

    // Verificar disponibilidad en el servidor
    const result = await bookingService.checkAvailability(
      listingId,
      checkIn,
      checkOut
    )

    if (!result.available) {
      toast.error('Las fechas seleccionadas no están disponibles')
      return false
    }

    // Mostrar resumen
    toast.success(
      `Disponible! ${result.nights} noches por S/ ${result.totalPrice}`
    )
    
    return true
  } catch (error: any) {
    toast.error(error.message || 'Error al verificar disponibilidad')
    return false
  }
}

// ============================================
// EJEMPLO 7: Cancelar reserva con razón
// ============================================

async function handleCancelBooking(bookingId: string) {
  try {
    const reason = window.prompt(
      'Por favor indica la razón de la cancelación:'
    )
    
    if (!reason) return

    const confirm = window.confirm(
      '¿Estás seguro de cancelar esta reserva? Esta acción no se puede deshacer.'
    )

    if (!confirm) return

    await bookingService.cancelBooking({
      bookingId,
      cancellationReason: reason
    })

    toast.success('Reserva cancelada exitosamente')
    
    // Recargar
    loadBookings()
  } catch (error: any) {
    toast.error(error.message || 'Error al cancelar reserva')
  }
}

// ============================================
// EJEMPLO 8: Hook personalizado para bookings
// ============================================

// hooks/useBookings.ts

import { useState, useEffect } from 'react'
import { bookingService } from '@/services/bookingService'
import { Booking } from '@/types/booking'

export function useBookings(type: 'guest' | 'host', filter?: string) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBookings()
  }, [type, filter])

  async function loadBookings() {
    try {
      setLoading(true)
      setError(null)

      const params = filter ? { status: [filter] } : undefined
      
      const response = type === 'guest'
        ? await bookingService.getMyBookings(params)
        : await bookingService.getHostBookings(params)

      setBookings(response.bookings)
    } catch (err: any) {
      setError(err.message || 'Error loading bookings')
    } finally {
      setLoading(false)
    }
  }

  return {
    bookings,
    loading,
    error,
    reload: loadBookings
  }
}

// Uso del hook:
function MyBookingsPage() {
  const { bookings, loading, error, reload } = useBookings('guest', 'confirmed')

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {bookings.map(booking => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  )
}

// ============================================
// EJEMPLO 9: Notificaciones en tiempo real (opcional)
// ============================================

// hooks/useBookingNotifications.ts

import { useEffect } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'

export function useBookingNotifications(userId: string) {
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000')

    // Conectar al room del usuario
    socket.emit('join', { userId })

    // Escuchar eventos de bookings
    socket.on('booking:created', (data) => {
      toast.success('Nueva solicitud de reserva recibida')
    })

    socket.on('booking:confirmed', (data) => {
      toast.success('Tu reserva ha sido confirmada! Procede al pago.')
    })

    socket.on('booking:payment_received', (data) => {
      toast.success('Pago recibido exitosamente')
    })

    socket.on('booking:cancelled', (data) => {
      toast.error('Una reserva ha sido cancelada')
    })

    return () => {
      socket.disconnect()
    }
  }, [userId])
}

// ============================================
// EJEMPLO 10: Formulario completo de reserva
// ============================================

import { useState } from 'react'
import { BookingCalendar } from '@/components/booking'
import { bookingService, bookingUtils } from '@/services/bookingService'

export default function QuickBookingForm({ property }) {
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      setLoading(true)

      // Validar
      if (!checkIn || !checkOut) {
        toast.error('Selecciona las fechas')
        return
      }

      const validation = bookingUtils.validateDates(checkIn, checkOut)
      if (!validation.valid) {
        toast.error(validation.error)
        return
      }

      // Crear reserva
      const booking = await bookingService.createBooking({
        listingId: property.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: guests,
        guestMessage: message
      })

      toast.success('Solicitud enviada!')
      
      // Redirigir
      router.push(`/bookings/${booking.id}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <BookingCalendar
        listingId={property.id}
        pricePerNight={property.price}
        onDateSelect={(ci, co) => {
          setCheckIn(ci)
          setCheckOut(co)
        }}
      />

      <select value={guests} onChange={e => setGuests(+e.target.value)}>
        {[1,2,3,4,5].map(n => (
          <option key={n} value={n}>{n} huéspedes</option>
        ))}
      </select>

      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Mensaje opcional para el anfitrión"
      />

      <button type="submit" disabled={loading || !checkIn || !checkOut}>
        {loading ? 'Enviando...' : 'Solicitar Reserva'}
      </button>
    </form>
  )
}
