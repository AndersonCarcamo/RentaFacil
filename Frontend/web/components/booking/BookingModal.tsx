/**
 * Modal de reserva para propiedades Airbnb
 * Permite a los huéspedes crear una nueva reserva
 */

import React, { useState } from 'react'
import { XMarkIcon, CalendarIcon, UsersIcon } from '@heroicons/react/24/outline'
import BookingCalendar from './BookingCalendar'
import { bookingService, bookingUtils } from '../../services/bookingService'
import { CreateBookingDto } from '../../types/booking'
import toast from 'react-hot-toast'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  listing: {
    id: string
    title: string
    images: string[]
    pricePerNight: number
    minimumNights?: number
    maxGuests?: number
    hostName: string
  }
  onSuccess?: () => void
}

export default function BookingModal({
  isOpen,
  onClose,
  listing,
  onSuccess
}: BookingModalProps) {
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [numberOfGuests, setNumberOfGuests] = useState(1)
  const [guestMessage, setGuestMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'dates' | 'details' | 'confirm'>('dates')

  // 🔍 DEBUG: Verificar renderizado del BookingModal
  React.useEffect(() => {
    if (isOpen) {
      console.log('📅 BookingModal renderizado:', {
        listingId: listing.id,
        listingTitle: listing.title,
        pricePerNight: listing.pricePerNight,
        maxGuests: listing.maxGuests,
        minimumNights: listing.minimumNights,
        component: 'components/booking/BookingModal.tsx'
      });
    }
  }, [isOpen, listing]);

  const nights = checkIn && checkOut ? bookingUtils.calculateNights(checkIn, checkOut) : 0
  const prices = nights > 0 
    ? bookingUtils.calculatePrices(listing.pricePerNight, nights)
    : { totalPrice: 0, reservationAmount: 0, checkinAmount: 0 }

  function handleDateSelect(newCheckIn: string, newCheckOut: string) {
    console.log('📆 Fechas seleccionadas:', { checkIn: newCheckIn, checkOut: newCheckOut });
    setCheckIn(newCheckIn)
    setCheckOut(newCheckOut)
    
    if (newCheckIn && newCheckOut) {
      // Auto-avanzar al siguiente paso
      setTimeout(() => setStep('details'), 300)
    }
  }

  async function handleSubmit() {
    try {
      setLoading(true)

      // Validar
      if (!checkIn || !checkOut) {
        toast.error('Por favor selecciona las fechas')
        return
      }

      const validation = bookingUtils.validateDates(checkIn, checkOut)
      if (!validation.valid) {
        toast.error(validation.error || 'Fechas inválidas')
        return
      }

      if (numberOfGuests < 1) {
        toast.error('Debes especificar al menos 1 huésped')
        return
      }

      if (listing.maxGuests && numberOfGuests > listing.maxGuests) {
        toast.error(`Máximo ${listing.maxGuests} huéspedes permitidos`)
        return
      }

      // Crear reserva
      const bookingData: CreateBookingDto = {
        listingId: listing.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests,
        guestMessage: guestMessage || undefined
      }

      console.log('📝 Creando reserva:', {
        bookingData,
        prices,
        nights
      });

      const booking = await bookingService.createBooking(bookingData)
      
      console.log('✅ Reserva creada exitosamente:', booking);
      
      toast.success('¡Solicitud de reserva enviada!')
      toast.success(`Esperando confirmación de ${listing.hostName}`)
      
      onSuccess?.()
      onClose()
      
      // Redirigir al detalle de la reserva
      setTimeout(() => {
        window.location.href = `/bookings/${booking.id}`
      }, 1500)

    } catch (error: any) {
      console.error('❌ Error creating booking:', error)
      toast.error(error.message || 'Error al crear la reserva')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Solicitar Reserva</h2>
            <p className="modal-subtitle">{listing.title}</p>
          </div>
          <button onClick={onClose} className="modal-close-button">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Steps */}
        <div className="steps-container">
          <div className={`step ${step === 'dates' ? 'active' : step === 'details' || step === 'confirm' ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Fechas</span>
          </div>
          <div className={`step ${step === 'details' ? 'active' : step === 'confirm' ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Detalles</span>
          </div>
          <div className={`step ${step === 'confirm' ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Confirmar</span>
          </div>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Step 1: Seleccionar fechas */}
          {step === 'dates' && (
            <div className="step-content">
              <BookingCalendar
                listingId={listing.id}
                pricePerNight={listing.pricePerNight}
                minimumNights={listing.minimumNights}
                onDateSelect={handleDateSelect}
                selectedCheckIn={checkIn}
                selectedCheckOut={checkOut}
              />
              {checkIn && checkOut && (
                <button
                  onClick={() => setStep('details')}
                  className="btn-primary w-full mt-4"
                >
                  Continuar
                </button>
              )}
            </div>
          )}

          {/* Step 2: Detalles */}
          {step === 'details' && (
            <div className="step-content">
              <div className="form-group">
                <label className="form-label">
                  <UsersIcon className="h-5 w-5" />
                  Número de huéspedes
                </label>
                <select
                  value={numberOfGuests}
                  onChange={(e) => setNumberOfGuests(parseInt(e.target.value))}
                  className="form-select"
                >
                  {Array.from({ length: listing.maxGuests || 10 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'huésped' : 'huéspedes'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Mensaje para el anfitrión (opcional)
                </label>
                <textarea
                  value={guestMessage}
                  onChange={(e) => setGuestMessage(e.target.value)}
                  placeholder="Cuéntale al anfitrión por qué viajas y cuándo llegarás..."
                  className="form-textarea"
                  rows={4}
                />
              </div>

              <div className="button-group">
                <button
                  onClick={() => setStep('dates')}
                  className="btn-secondary"
                >
                  Atrás
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="btn-primary"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmar */}
          {step === 'confirm' && (
            <div className="step-content">
              {/* Resumen de fechas */}
              <div className="summary-card">
                <h3 className="summary-title">Tu viaje</h3>
                <div className="summary-row">
                  <div>
                    <div className="summary-label">Fechas</div>
                    <div className="summary-value">
                      {bookingUtils.formatDate(checkIn)} - {bookingUtils.formatDate(checkOut)}
                    </div>
                  </div>
                  <button onClick={() => setStep('dates')} className="btn-text">
                    Editar
                  </button>
                </div>
                <div className="summary-row">
                  <div>
                    <div className="summary-label">Huéspedes</div>
                    <div className="summary-value">
                      {numberOfGuests} {numberOfGuests === 1 ? 'huésped' : 'huéspedes'}
                    </div>
                  </div>
                  <button onClick={() => setStep('details')} className="btn-text">
                    Editar
                  </button>
                </div>
              </div>

              {/* Desglose de precios */}
              <div className="summary-card">
                <h3 className="summary-title">Desglose de precios</h3>
                <div className="price-row">
                  <span>S/ {listing.pricePerNight} x {nights} noches</span>
                  <span>S/ {prices.totalPrice.toFixed(2)}</span>
                </div>
                <div className="price-row total">
                  <span>Total</span>
                  <span>S/ {prices.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Información de pago */}
              <div className="info-card">
                <h4 className="info-title">💳 Pago fraccionado</h4>
                <ul className="info-list">
                  <li>
                    <strong>Paso 1:</strong> El anfitrión debe confirmar tu reserva
                  </li>
                  <li>
                    <strong>Paso 2:</strong> Pagarás <strong>S/ {prices.reservationAmount.toFixed(2)}</strong> (50%) para asegurar la reserva
                  </li>
                  <li>
                    <strong>Paso 3:</strong> Pagarás <strong>S/ {prices.checkinAmount.toFixed(2)}</strong> (50%) al hacer check-in
                  </li>
                </ul>
              </div>

              {/* Botón de confirmación */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Enviando solicitud...' : 'Solicitar reserva'}
              </button>

              <button
                onClick={() => setStep('details')}
                className="btn-secondary w-full mt-2"
              >
                Atrás
              </button>

              <p className="disclaimer">
                Al hacer clic en "Solicitar reserva", acepto las reglas de la casa, 
                las políticas de cancelación y la política de privacidad.
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 460;
          padding: 20px;
        }

        .modal-container {
          background: white;
          border-radius: 16px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-title {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .modal-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }

        .modal-close-button {
          padding: 8px;
          border-radius: 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background 0.2s;
        }

        .modal-close-button:hover {
          background: #f3f4f6;
        }

        .steps-container {
          display: flex;
          justify-content: space-between;
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          position: relative;
        }

        .step:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 100%;
          top: 50%;
          width: calc(100% - 60px);
          height: 2px;
          background: #e5e7eb;
          transform: translateY(-50%);
        }

        .step.completed:not(:last-child)::after {
          background: #3b82f6;
        }

        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f3f4f6;
          color: #9ca3af;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .step.active .step-number {
          background: #3b82f6;
          color: white;
        }

        .step.completed .step-number {
          background: #10b981;
          color: white;
        }

        .step-label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .step.active .step-label {
          color: #1f2937;
          font-weight: 600;
        }

        .modal-content {
          padding: 24px;
        }

        .step-content {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .form-select,
        .form-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-primary,
        .btn-secondary,
        .btn-text {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
          flex: 1;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
          flex: 1;
        }

        .btn-secondary:hover {
          background: #f9fafb;
        }

        .btn-text {
          background: transparent;
          color: #3b82f6;
          padding: 4px 8px;
        }

        .btn-text:hover {
          text-decoration: underline;
        }

        .w-full {
          width: 100%;
        }

        .mt-2 {
          margin-top: 8px;
        }

        .mt-4 {
          margin-top: 16px;
        }

        .summary-card,
        .info-card {
          background: #f9fafb;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .summary-title,
        .info-title {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 16px 0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: start;
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .summary-row:last-child {
          border-bottom: none;
        }

        .summary-label {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .summary-value {
          font-size: 14px;
          color: #1f2937;
          font-weight: 500;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
          color: #374151;
        }

        .price-row.total {
          border-top: 1px solid #d1d5db;
          margin-top: 8px;
          padding-top: 12px;
          font-size: 16px;
          font-weight: 700;
        }

        .info-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .info-list li {
          padding: 8px 0;
          font-size: 14px;
          color: #374151;
          line-height: 1.6;
        }

        .disclaimer {
          font-size: 12px;
          color: #6b7280;
          text-align: center;
          margin-top: 16px;
          line-height: 1.5;
        }

        @media (max-width: 640px) {
          .modal-container {
            max-height: 100vh;
            border-radius: 0;
          }

          .steps-container {
            padding: 16px;
          }

          .step-label {
            display: none;
          }

          .modal-content {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  )
}
