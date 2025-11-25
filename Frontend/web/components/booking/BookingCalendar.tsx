/**
 * Componente de calendario de reservas para propiedades Airbnb
 * Muestra disponibilidad, precios y permite seleccionar fechas
 */

import React, { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { bookingService, bookingUtils } from '../../services/bookingService'
import { DateAvailability } from '../../types/booking'

interface BookingCalendarProps {
  listingId: string
  pricePerNight: number
  minimumNights?: number
  onDateSelect?: (checkIn: string, checkOut: string) => void
  selectedCheckIn?: string
  selectedCheckOut?: string
  className?: string
}

export default function BookingCalendar({
  listingId,
  pricePerNight,
  minimumNights = 1,
  onDateSelect,
  selectedCheckIn,
  selectedCheckOut,
  className = ''
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [availability, setAvailability] = useState<DateAvailability[]>([])
  const [loading, setLoading] = useState(false)
  const [selectingCheckIn, setSelectingCheckIn] = useState(true)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  // Cargar disponibilidad del mes actual
  useEffect(() => {
    loadAvailability()
  }, [listingId, currentYear, currentMonth])

  async function loadAvailability() {
    try {
      setLoading(true)
      const data = await bookingService.getCalendar(
        listingId,
        currentYear,
        currentMonth + 1 // JS months are 0-indexed
      )
      setAvailability(data)
    } catch (error) {
      console.error('Error loading availability:', error)
    } finally {
      setLoading(false)
    }
  }

  // Navegación de meses
  function goToPreviousMonth() {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  function goToNextMonth() {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  // Obtener días del mes
  function getDaysInMonth(): Date[] {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const days: Date[] = []

    // Agregar días vacíos del mes anterior
    const firstDayOfWeek = firstDay.getDay()
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(new Date(currentYear, currentMonth, -firstDayOfWeek + i + 1))
    }

    // Agregar días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(currentYear, currentMonth, day))
    }

    return days
  }

  // Verificar si una fecha está disponible
  function isDateAvailable(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0]
    const dateData = availability.find(d => d.date === dateStr)
    return dateData?.isAvailable ?? true
  }

  // Verificar si una fecha está en el pasado
  function isPastDate(date: Date): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  // Verificar si una fecha está seleccionada
  function isDateSelected(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0]
    return dateStr === selectedCheckIn || dateStr === selectedCheckOut
  }

  // Verificar si una fecha está en el rango seleccionado
  function isDateInRange(date: Date): boolean {
    if (!selectedCheckIn || !selectedCheckOut) return false
    const dateStr = date.toISOString().split('T')[0]
    return dateStr > selectedCheckIn && dateStr < selectedCheckOut
  }

  // Verificar si una fecha está en el rango hover
  function isDateInHoverRange(date: Date): boolean {
    if (!selectedCheckIn || !hoveredDate || selectingCheckIn) return false
    const dateStr = date.toISOString().split('T')[0]
    return dateStr > selectedCheckIn && dateStr < hoveredDate
  }

  // Manejar click en fecha
  function handleDateClick(date: Date) {
    if (isPastDate(date) || !isDateAvailable(date)) return

    const dateStr = date.toISOString().split('T')[0]

    if (selectingCheckIn) {
      // Seleccionar check-in
      onDateSelect?.(dateStr, '')
      setSelectingCheckIn(false)
    } else {
      // Seleccionar check-out
      if (selectedCheckIn && dateStr > selectedCheckIn) {
        const nights = bookingUtils.calculateNights(selectedCheckIn, dateStr)
        if (nights >= minimumNights) {
          onDateSelect?.(selectedCheckIn, dateStr)
          setSelectingCheckIn(true)
        }
      } else {
        // Si selecciona antes del check-in, reiniciar
        onDateSelect?.(dateStr, '')
      }
    }
  }

  // Obtener precio para una fecha
  function getDatePrice(date: Date): number | null {
    const dateStr = date.toISOString().split('T')[0]
    const dateData = availability.find(d => d.date === dateStr)
    return dateData?.price ?? pricePerNight
  }

  // Obtener clase CSS para una fecha
  function getDateClassName(date: Date): string {
    const classes = ['calendar-day']
    
    const isCurrentMonth = date.getMonth() === currentMonth
    const isPast = isPastDate(date)
    const isAvailable = isDateAvailable(date)
    const isSelected = isDateSelected(date)
    const isInRange = isDateInRange(date)
    const isInHover = isDateInHoverRange(date)

    if (!isCurrentMonth) classes.push('other-month')
    if (isPast || !isAvailable) classes.push('unavailable')
    if (isSelected) classes.push('selected')
    if (isInRange) classes.push('in-range')
    if (isInHover) classes.push('hover-range')

    return classes.join(' ')
  }

  const monthName = currentDate.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
  const days = getDaysInMonth()
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return (
    <div className={`booking-calendar ${className}`}>
      {/* Header del calendario */}
      <div className="calendar-header">
        <button
          onClick={goToPreviousMonth}
          className="calendar-nav-button"
          aria-label="Mes anterior"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        
        <h3 className="calendar-month-title">
          {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
        </h3>
        
        <button
          onClick={goToNextMonth}
          className="calendar-nav-button"
          aria-label="Mes siguiente"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="calendar-weekdays">
        {weekDays.map(day => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="calendar-grid">
        {loading ? (
          <div className="calendar-loading">
            <div className="spinner"></div>
            <p>Cargando disponibilidad...</p>
          </div>
        ) : (
          days.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0]
            const price = getDatePrice(date)
            const isCurrentMonth = date.getMonth() === currentMonth

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                onMouseEnter={() => setHoveredDate(dateStr)}
                onMouseLeave={() => setHoveredDate(null)}
                className={getDateClassName(date)}
                disabled={isPastDate(date) || !isDateAvailable(date)}
                title={price ? `S/ ${price}` : undefined}
              >
                <span className="date-number">{date.getDate()}</span>
                {isCurrentMonth && price && (
                  <span className="date-price">S/ {price}</span>
                )}
              </button>
            )
          })
        )}
      </div>

      {/* Leyenda */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-box available"></div>
          <span>Disponible</span>
        </div>
        <div className="legend-item">
          <div className="legend-box selected"></div>
          <span>Seleccionado</span>
        </div>
        <div className="legend-item">
          <div className="legend-box unavailable"></div>
          <span>No disponible</span>
        </div>
      </div>

      {/* Información de selección */}
      {selectedCheckIn && selectedCheckOut && (
        <div className="calendar-selection-info">
          <div className="selection-dates">
            <div>
              <span className="label">Check-in:</span>
              <span className="date">{bookingUtils.formatDate(selectedCheckIn)}</span>
            </div>
            <div>
              <span className="label">Check-out:</span>
              <span className="date">{bookingUtils.formatDate(selectedCheckOut)}</span>
            </div>
          </div>
          <div className="selection-summary">
            <span className="nights">
              {bookingUtils.calculateNights(selectedCheckIn, selectedCheckOut)} noches
            </span>
            <span className="total-price">
              {bookingUtils.formatPrice(
                pricePerNight * bookingUtils.calculateNights(selectedCheckIn, selectedCheckOut)
              )}
            </span>
          </div>
        </div>
      )}

      <style jsx>{`
        .booking-calendar {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .calendar-month-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .calendar-nav-button {
          padding: 8px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .calendar-nav-button:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 8px;
        }

        .calendar-weekday {
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          padding: 8px 0;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          min-height: 300px;
        }

        .calendar-day {
          aspect-ratio: 1;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          transition: all 0.2s;
          position: relative;
        }

        .calendar-day:hover:not(:disabled) {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .calendar-day.other-month {
          color: #d1d5db;
        }

        .calendar-day.unavailable {
          background: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
          text-decoration: line-through;
        }

        .calendar-day.selected {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .calendar-day.in-range,
        .calendar-day.hover-range {
          background: #dbeafe;
          border-color: #93c5fd;
        }

        .date-number {
          font-weight: 500;
          font-size: 14px;
        }

        .date-price {
          font-size: 11px;
          color: #6b7280;
        }

        .calendar-day.selected .date-price {
          color: rgba(255, 255, 255, 0.8);
        }

        .calendar-loading {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: #6b7280;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .calendar-legend {
          display: flex;
          gap: 16px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6b7280;
        }

        .legend-box {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid #d1d5db;
        }

        .legend-box.available {
          background: white;
        }

        .legend-box.selected {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .legend-box.unavailable {
          background: #f3f4f6;
        }

        .calendar-selection-info {
          margin-top: 20px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .selection-dates {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .selection-dates > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .selection-dates .label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
        }

        .selection-dates .date {
          font-size: 14px;
          color: #1f2937;
          font-weight: 500;
        }

        .selection-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        .nights {
          font-size: 14px;
          color: #6b7280;
        }

        .total-price {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }

        @media (max-width: 640px) {
          .booking-calendar {
            padding: 16px;
          }

          .calendar-month-title {
            font-size: 16px;
          }

          .calendar-weekday {
            font-size: 12px;
            padding: 6px 0;
          }

          .date-number {
            font-size: 13px;
          }

          .date-price {
            font-size: 10px;
          }

          .calendar-legend {
            flex-wrap: wrap;
            gap: 12px;
          }

          .legend-item {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  )
}
