/**
 * Servicio de API para el sistema de reservas Airbnb
 */

import {
  Booking,
  BookingPayment,
  CreateBookingDto,
  ConfirmBookingDto,
  ProcessPaymentDto,
  CancelBookingDto,
  BookingWithPayments,
  DateAvailability,
  AvailabilityCheckResult
} from '../types/booking'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_VERSION = '/v1'

// Helper para manejar respuestas de la API
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Error en la solicitud'
    }))
    throw new Error(error.message || `Error ${response.status}`)
  }
  return response.json()
}

// Helper para obtener el token de autenticación
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

// Headers con autenticación
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }
  
  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

/**
 * Servicios de Bookings
 */
export const bookingService = {
  /**
   * Crear una nueva reserva (Step 1: Usuario solicita reserva)
   */
  async createBooking(data: CreateBookingDto): Promise<Booking> {
    console.log('📤 Enviando datos de reserva:', JSON.stringify(data, null, 2));
    
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ Error response:', errorData);
      throw new Error(errorData?.detail || errorData?.message || `Error ${response.status}`);
    }
    
    return handleResponse<Booking>(response)
  },

  /**
   * Obtener una reserva por ID
   */
  async getBooking(bookingId: string): Promise<BookingWithPayments> {
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/bookings/${bookingId}`, {
      headers: getAuthHeaders()
    })
    return handleResponse<BookingWithPayments>(response)
  },

  /**
   * Listar reservas del usuario autenticado (como huésped)
   */
  async getMyBookings(params?: {
    status?: string[]
    page?: number
    limit?: number
  }): Promise<{ bookings: Booking[]; total: number }> {
    const queryParams = new URLSearchParams()
    if (params?.status) {
      params.status.forEach(s => queryParams.append('status', s))
    }
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/bookings/my-bookings?${queryParams}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Listar reservas como propietario (anfitrión)
   */
  async getHostBookings(params?: {
    status?: string[]
    page?: number
    limit?: number
  }): Promise<{ bookings: Booking[]; total: number }> {
    const queryParams = new URLSearchParams()
    if (params?.status) {
      params.status.forEach(s => queryParams.append('status', s))
    }
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/bookings/host-bookings?${queryParams}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse(response)
  },

  /**
   * Confirmar reserva (Step 2: Propietario confirma)
   */
  async confirmBooking(data: ConfirmBookingDto): Promise<Booking> {
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/bookings/${data.bookingId}/confirm`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ hostResponse: data.hostResponse })
      }
    )
    return handleResponse<Booking>(response)
  },

  /**
   * Procesar pago de reserva (Step 3: Usuario paga 50%)
   */
  async processReservationPayment(data: ProcessPaymentDto): Promise<{
    booking: Booking
    payment: BookingPayment
    clientSecret: string
  }> {
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/bookings/${data.bookingId}/payment/reservation`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          paymentMethodId: data.paymentMethodId
        })
      }
    )
    return handleResponse(response)
  },

  /**
   * Procesar pago de check-in (Step 4: Usuario paga 50% restante)
   */
  async processCheckinPayment(data: ProcessPaymentDto): Promise<{
    booking: Booking
    payment: BookingPayment
    clientSecret: string
  }> {
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/bookings/${data.bookingId}/payment/checkin`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          paymentMethodId: data.paymentMethodId
        })
      }
    )
    return handleResponse(response)
  },

  /**
   * Cancelar reserva
   */
  async cancelBooking(data: CancelBookingDto): Promise<Booking> {
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/bookings/${data.bookingId}/cancel`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          cancellationReason: data.cancellationReason
        })
      }
    )
    return handleResponse<Booking>(response)
  },

  /**
   * Rechazar reserva (solo para host)
   */
  async rejectBooking(bookingId: string, reason?: string): Promise<Booking> {
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/bookings/${bookingId}/reject`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
      }
    )
    return handleResponse<Booking>(response)
  },

  /**
   * Verificar disponibilidad de fechas
   */
  async checkAvailability(
    listingId: string,
    checkIn: string,
    checkOut: string
  ): Promise<AvailabilityCheckResult> {
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/bookings/availability?` +
      `listingId=${listingId}&checkIn=${checkIn}&checkOut=${checkOut}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse<AvailabilityCheckResult>(response)
  },

  /**
   * Obtener calendario de disponibilidad para un mes
   */
  async getCalendar(
    listingId: string,
    year: number,
    month: number
  ): Promise<DateAvailability[]> {
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/bookings/calendar/${listingId}?year=${year}&month=${month}`,
      { headers: getAuthHeaders() }
    )
    const data = await handleResponse<any[]>(response)
    
    // Transformar snake_case a camelCase
    return data.map(item => ({
      date: item.date,
      isAvailable: item.is_available,
      price: item.price,
      minimumNights: item.minimum_nights,
      bookingId: item.booking_id
    }))
  }
}

/**
 * Servicios de Pagos
 */
export const paymentService = {
  /**
   * Obtener historial de pagos de una reserva
   */
  async getBookingPayments(bookingId: string): Promise<BookingPayment[]> {
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/bookings/${bookingId}/payments`,
      { headers: getAuthHeaders() }
    )
    return handleResponse<BookingPayment[]>(response)
  },

  /**
   * Obtener un pago específico
   */
  async getPaymentDetails(paymentId: string): Promise<BookingPayment> {
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/payments/${paymentId}`,
      { headers: getAuthHeaders() }
    )
    return handleResponse<BookingPayment>(response)
  }
}

/**
 * Utilidades
 */
export const bookingUtils = {
  /**
   * Calcular número de noches entre dos fechas
   */
  calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  },

  /**
   * Calcular precios de una reserva
   */
  calculatePrices(pricePerNight: number, nights: number): {
    totalPrice: number
    reservationAmount: number
    checkinAmount: number
  } {
    const totalPrice = pricePerNight * nights
    const reservationAmount = Math.round(totalPrice * 0.5 * 100) / 100
    const checkinAmount = Math.round((totalPrice - reservationAmount) * 100) / 100
    
    return {
      totalPrice,
      reservationAmount,
      checkinAmount
    }
  },

  /**
   * Validar fechas de reserva
   */
  validateDates(checkIn: string, checkOut: string): {
    valid: boolean
    error?: string
  } {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    
    if (checkInDate < today) {
      return {
        valid: false,
        error: 'La fecha de check-in debe ser hoy o posterior'
      }
    }
    
    if (checkOutDate <= checkInDate) {
      return {
        valid: false,
        error: 'La fecha de check-out debe ser posterior al check-in'
      }
    }
    
    const nights = this.calculateNights(checkIn, checkOut)
    if (nights < 1) {
      return {
        valid: false,
        error: 'La reserva debe ser de al menos 1 noche'
      }
    }
    
    return { valid: true }
  },

  /**
   * Formatear fecha para display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-PE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  },

  /**
   * Formatear precio
   */
  formatPrice(amount: number, currency: string = 'PEN'): string {
    const symbol = currency === 'PEN' ? 'S/' : '$'
    return `${symbol} ${amount.toFixed(2)}`
  }
}
