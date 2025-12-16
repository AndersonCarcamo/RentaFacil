import { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useAuth } from '../lib/hooks/useAuth';

interface PendingPayment {
  id: string;
  listing_title: string;
  hours_remaining: number;
}

export function BookingNotifications() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      fetchPendingPayments();
      // Actualizar cada minuto
      const interval = setInterval(fetchPendingPayments, 60000);
      return () => clearInterval(interval);
    }
  }, [authLoading, isLoggedIn]);

  const fetchPendingPayments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:8000/v1/bookings/my-bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const pending = data.bookings.filter((b: any) => 
          b.status === 'confirmed' && 
          b.payment_status === 'pending' && 
          b.hours_remaining !== null
        );
        setPendingPayments(pending);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // No mostrar nada si no está autenticado o está cargando
  if (authLoading || !isLoggedIn) return null;

  const count = pendingPayments.length;

  if (count === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        {count > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {count}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Pagos Pendientes</h3>
              <p className="text-sm text-gray-600">Reservas que requieren tu pago</p>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {pendingPayments.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/my-bookings/${booking.id}`}
                  className="block p-4 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-red-500 rounded-full animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {booking.listing_title}
                      </p>
                      <p className="text-sm text-red-600 font-medium mt-1">
                        ⏰ {Math.floor(booking.hours_remaining)}h {Math.floor((booking.hours_remaining % 1) * 60)}min restantes
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Click para completar el pago
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="p-3 bg-gray-50 rounded-b-lg">
              <Link
                href="/my-bookings"
                className="block text-center text-sm font-medium text-[#22ACF5] hover:text-[#1a8acc]"
                onClick={() => setShowDropdown(false)}
              >
                Ver todas mis reservas →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
