/**
 * Página de gestión de reservas
 * Para huéspedes: Ver sus reservas
 * Para anfitriones: Gestionar solicitudes y reservas confirmadas
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import {
  CalendarIcon,
  UserIcon,
  HomeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'
import { bookingService, bookingUtils } from '../services/bookingService'
import { Booking, BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '../types/booking'
import toast from 'react-hot-toast'

export default function BookingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'guest' | 'host'>('guest')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadBookings()
  }, [activeTab, filter])

  async function loadBookings() {
    try {
      setLoading(true)
      const params = filter !== 'all' ? { status: [filter] } : undefined
      
      const response = activeTab === 'guest'
        ? await bookingService.getMyBookings(params)
        : await bookingService.getHostBookings(params)
      
      setBookings(response.bookings)
    } catch (error) {
      console.error('Error loading bookings:', error)
      toast.error('Error al cargar las reservas')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmBooking(bookingId: string) {
    try {
      await bookingService.confirmBooking({ bookingId })
      toast.success('Reserva confirmada')
      loadBookings()
    } catch (error: any) {
      toast.error(error.message || 'Error al confirmar reserva')
    }
  }

  async function handleCancelBooking(bookingId: string, reason: string) {
    try {
      await bookingService.cancelBooking({ bookingId, cancellationReason: reason })
      toast.success('Reserva cancelada')
      loadBookings()
    } catch (error: any) {
      toast.error(error.message || 'Error al cancelar reserva')
    }
  }

  function getStatusBadgeClass(status: string): string {
    const color = BOOKING_STATUS_COLORS[status as keyof typeof BOOKING_STATUS_COLORS]
    return `status-badge status-${color}`
  }

  return (
    <Layout>
      <div className="bookings-page">
        <div className="container">
          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">Mis Reservas</h1>
            <p className="page-subtitle">
              Gestiona tus reservas como {activeTab === 'guest' ? 'huésped' : 'anfitrión'}
            </p>
          </div>

          {/* Tabs */}
          <div className="tabs-container">
            <button
              onClick={() => setActiveTab('guest')}
              className={`tab ${activeTab === 'guest' ? 'active' : ''}`}
            >
              <UserIcon className="h-5 w-5" />
              Como Huésped
            </button>
            <button
              onClick={() => setActiveTab('host')}
              className={`tab ${activeTab === 'host' ? 'active' : ''}`}
            >
              <HomeIcon className="h-5 w-5" />
              Como Anfitrión
            </button>
          </div>

          {/* Filtros */}
          <div className="filters-container">
            <button
              onClick={() => setFilter('all')}
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('pending_confirmation')}
              className={`filter-btn ${filter === 'pending_confirmation' ? 'active' : ''}`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`}
            >
              Confirmadas
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            >
              Completadas
            </button>
          </div>

          {/* Lista de reservas */}
          <div className="bookings-list">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Cargando reservas...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="empty-state">
                <CalendarIcon className="h-16 w-16 text-gray-300" />
                <h3>No hay reservas</h3>
                <p>
                  {activeTab === 'guest'
                    ? 'Aún no has realizado ninguna reserva'
                    : 'No tienes solicitudes de reserva pendientes'}
                </p>
              </div>
            ) : (
              bookings.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  isHost={activeTab === 'host'}
                  onConfirm={handleConfirmBooking}
                  onCancel={handleCancelBooking}
                  onViewDetails={() => router.push(`/bookings/${booking.id}`)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .bookings-page {
          min-height: 100vh;
          background: #f9fafb;
          padding: 40px 0;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .page-title {
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .page-subtitle {
          font-size: 16px;
          color: #6b7280;
          margin: 0;
        }

        .tabs-container {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          border-bottom: 2px solid #e5e7eb;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          color: #6b7280;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: -2px;
        }

        .tab:hover {
          color: #3b82f6;
        }

        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .filters-container {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .filter-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .bookings-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          color: #6b7280;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state h3 {
          font-size: 20px;
          font-weight: 600;
          color: #374151;
          margin: 16px 0 8px 0;
        }

        @media (max-width: 768px) {
          .bookings-page {
            padding: 20px 0;
          }

          .page-title {
            font-size: 24px;
          }

          .tabs-container {
            overflow-x: auto;
          }

          .tab {
            padding: 10px 16px;
            font-size: 14px;
          }
        }
      `}</style>
    </Layout>
  )
}

interface BookingCardProps {
  booking: Booking
  isHost: boolean
  onConfirm: (bookingId: string) => void
  onCancel: (bookingId: string, reason: string) => void
  onViewDetails: () => void
}

function BookingCard({ booking, isHost, onConfirm, onCancel, onViewDetails }: BookingCardProps) {
  const [showCancelModal, setShowCancelModal] = useState(false)

  const otherUser = isHost ? booking.guest : booking.host
  const statusLabel = BOOKING_STATUS_LABELS[booking.status]
  const statusColor = BOOKING_STATUS_COLORS[booking.status]

  return (
    <div className="booking-card">
      <div className="booking-image">
        {booking.listing?.images?.[0] ? (
          <img src={booking.listing.images[0]} alt={booking.listing.title} />
        ) : (
          <div className="image-placeholder">
            <HomeIcon className="h-12 w-12" />
          </div>
        )}
      </div>

      <div className="booking-info">
        <div className="booking-header">
          <div>
            <h3 className="booking-title">{booking.listing?.title || 'Propiedad'}</h3>
            <p className="booking-location">
              {booking.listing?.district}, {booking.listing?.address}
            </p>
          </div>
          <span className={`status-badge status-${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        <div className="booking-details">
          <div className="detail-item">
            <CalendarIcon className="h-5 w-5" />
            <div>
              <div className="detail-label">Check-in</div>
              <div className="detail-value">{bookingUtils.formatDate(booking.checkInDate)}</div>
            </div>
          </div>

          <div className="detail-item">
            <CalendarIcon className="h-5 w-5" />
            <div>
              <div className="detail-label">Check-out</div>
              <div className="detail-value">{bookingUtils.formatDate(booking.checkOutDate)}</div>
            </div>
          </div>

          <div className="detail-item">
            <ClockIcon className="h-5 w-5" />
            <div>
              <div className="detail-label">Noches</div>
              <div className="detail-value">{booking.nights}</div>
            </div>
          </div>

          <div className="detail-item">
            <UserIcon className="h-5 w-5" />
            <div>
              <div className="detail-label">{isHost ? 'Huésped' : 'Anfitrión'}</div>
              <div className="detail-value">
                {otherUser?.firstName} {otherUser?.lastName}
              </div>
            </div>
          </div>

          <div className="detail-item">
            <CreditCardIcon className="h-5 w-5" />
            <div>
              <div className="detail-label">Total</div>
              <div className="detail-value">{bookingUtils.formatPrice(booking.totalPrice)}</div>
            </div>
          </div>
        </div>

        <div className="booking-actions">
          <button onClick={onViewDetails} className="btn-secondary">
            Ver detalles
          </button>

          {isHost && booking.status === 'pending_confirmation' && (
            <>
              <button
                onClick={() => onConfirm(booking.id)}
                className="btn-success"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Confirmar
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="btn-danger"
              >
                <XCircleIcon className="h-5 w-5" />
                Rechazar
              </button>
            </>
          )}

          {!isHost && booking.status === 'confirmed' && (
            <button className="btn-primary">
              <CreditCardIcon className="h-5 w-5" />
              Pagar reserva (50%)
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .booking-card {
          display: flex;
          gap: 20px;
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.2s;
        }

        .booking-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .booking-image {
          width: 200px;
          height: 150px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .booking-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
        }

        .booking-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
        }

        .booking-title {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .booking-location {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-yellow { background: #fef3c7; color: #92400e; }
        .status-blue { background: #dbeafe; color: #1e40af; }
        .status-indigo { background: #e0e7ff; color: #3730a3; }
        .status-green { background: #d1fae5; color: #065f46; }
        .status-gray { background: #f3f4f6; color: #374151; }
        .status-red { background: #fee2e2; color: #991b1b; }
        .status-orange { background: #fed7aa; color: #9a3412; }

        .booking-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }

        .detail-item {
          display: flex;
          gap: 8px;
          align-items: start;
        }

        .detail-item svg {
          color: #6b7280;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .detail-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .detail-value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .booking-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn-primary,
        .btn-secondary,
        .btn-success,
        .btn-danger {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
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
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
          background: #f9fafb;
        }

        .btn-success {
          background: #10b981;
          color: white;
        }

        .btn-success:hover {
          background: #059669;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        @media (max-width: 768px) {
          .booking-card {
            flex-direction: column;
          }

          .booking-image {
            width: 100%;
            height: 200px;
          }

          .booking-details {
            grid-template-columns: repeat(2, 1fr);
          }

          .booking-actions {
            flex-direction: column;
          }

          .booking-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
