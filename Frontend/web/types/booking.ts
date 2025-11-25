/**
 * Tipos TypeScript para el sistema de reservas Airbnb
 */

export type BookingStatus =
  | 'pending_confirmation'    // Esperando confirmación del propietario
  | 'confirmed'               // Confirmada, esperando pago de reserva
  | 'reservation_paid'        // 50% pagado (reserva confirmada)
  | 'checked_in'              // Check-in realizado
  | 'completed'               // Reserva completada (100% pagado)
  | 'cancelled_by_guest'      // Cancelada por huésped
  | 'cancelled_by_host'       // Cancelada por propietario
  | 'cancelled_no_payment'    // Cancelada por falta de pago
  | 'refunded'                // Reembolsada

export type BookingPaymentStatus =
  | 'pending'              // Pendiente de pago
  | 'processing'           // Procesando pago
  | 'completed'            // Pago exitoso
  | 'failed'               // Pago fallido
  | 'refunded'             // Reembolsado
  | 'partially_refunded'   // Parcialmente reembolsado

export type PaymentType =
  | 'reservation'  // Pago de reserva (50%)
  | 'checkin'      // Pago al check-in (50%)
  | 'full'         // Pago completo (100%)
  | 'refund'       // Reembolso

export interface Booking {
  id: string
  listingId: string
  listingCreatedAt: string
  guestUserId: string
  hostUserId: string
  
  // Fechas de la reserva
  checkInDate: string  // ISO date string
  checkOutDate: string // ISO date string
  nights: number
  
  // Precios (en PEN)
  pricePerNight: number
  totalPrice: number
  reservationAmount: number  // 50% del total
  checkinAmount: number      // 50% del total
  serviceFee: number
  cleaningFee: number
  
  // Estado
  status: BookingStatus
  
  // Información de huéspedes
  numberOfGuests: number
  
  // Comunicación
  guestMessage?: string
  hostResponse?: string
  cancellationReason?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
  confirmedAt?: string
  reservationPaidAt?: string
  checkedInAt?: string
  completedAt?: string
  cancelledAt?: string
  
  // Metadata
  metadata?: Record<string, any>
  
  // Relaciones (populadas)
  listing?: {
    id: string
    title: string
    images: string[]
    address: string
    district: string
  }
  guest?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    profilePicture?: string
  }
  host?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    profilePicture?: string
  }
}

export interface BookingPayment {
  id: string
  bookingId: string
  
  // Información del pago
  paymentType: PaymentType
  amount: number
  currency: string
  
  // Estado
  status: BookingPaymentStatus
  
  // Stripe
  paymentMethod?: string
  stripePaymentIntentId?: string
  stripeChargeId?: string
  stripeRefundId?: string
  cardLast4?: string
  cardBrand?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
  completedAt?: string
  refundedAt?: string
  
  // Errores
  errorMessage?: string
  errorCode?: string
  
  metadata?: Record<string, any>
}

export interface BookingCalendar {
  id: string
  listingId: string
  listingCreatedAt: string
  date: string  // ISO date string
  
  // Disponibilidad
  isAvailable: boolean
  
  // Precios dinámicos
  priceOverride?: number
  minimumNights?: number
  
  // Referencia a reserva
  bookingId?: string
  
  notes?: string
  createdAt: string
  updatedAt: string
}

// DTOs para crear/actualizar bookings
export interface CreateBookingDto {
  listingId: string
  checkInDate: string
  checkOutDate: string
  numberOfGuests: number
  guestMessage?: string
}

export interface ConfirmBookingDto {
  bookingId: string
  hostResponse?: string
}

export interface ProcessPaymentDto {
  bookingId: string
  paymentType: PaymentType
  paymentMethodId: string  // Stripe payment method
}

export interface CancelBookingDto {
  bookingId: string
  cancellationReason?: string
}

// Respuestas enriquecidas
export interface BookingWithPayments extends Booking {
  payments: BookingPayment[]
  totalPaid: number
  pendingAmount: number
}

export interface BookingSummary {
  bookingId: string
  totalPrice: number
  expectedReservationPayment: number
  expectedCheckinPayment: number
  totalPaid: number
  reservationPaid: number
  checkinPaid: number
  pendingAmount: number
}

// Para el calendario de disponibilidad
export interface DateAvailability {
  date: string
  isAvailable: boolean
  price?: number
  minimumNights?: number
  bookingId?: string
}

export interface AvailabilityCheckResult {
  available: boolean
  dates: DateAvailability[]
  totalPrice: number
  nights: number
}

// Traducciones de estados
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending_confirmation: 'Esperando confirmación',
  confirmed: 'Confirmada',
  reservation_paid: 'Reserva pagada (50%)',
  checked_in: 'Check-in realizado',
  completed: 'Completada',
  cancelled_by_guest: 'Cancelada por huésped',
  cancelled_by_host: 'Cancelada por propietario',
  cancelled_no_payment: 'Cancelada por falta de pago',
  refunded: 'Reembolsada'
}

export const PAYMENT_STATUS_LABELS: Record<BookingPaymentStatus, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido',
  refunded: 'Reembolsado',
  partially_refunded: 'Parcialmente reembolsado'
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  reservation: 'Pago de reserva (50%)',
  checkin: 'Pago al check-in (50%)',
  full: 'Pago completo (100%)',
  refund: 'Reembolso'
}

// Colores para estados
export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  pending_confirmation: 'yellow',
  confirmed: 'blue',
  reservation_paid: 'indigo',
  checked_in: 'green',
  completed: 'gray',
  cancelled_by_guest: 'red',
  cancelled_by_host: 'red',
  cancelled_no_payment: 'red',
  refunded: 'orange'
}
