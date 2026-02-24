import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/lib/hooks/useAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface Booking {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_image: string | null;
  host_name: string;
  host_email: string | null;
  host_phone: string | null;
  host_profile_picture: string | null;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  number_of_guests: number;
  total_price: number;
  reservation_amount: number;
  status: string;
  payment_deadline: string | null;
  hours_remaining: number | null;
  payment_status: string | null;
  payment_proof_url: string | null;
  payment_proof_uploaded_at: string | null;
  created_at: string;
}

const statusTranslations: Record<string, string> = {
  pending_confirmation: 'Pendiente de Confirmación',
  confirmed: 'Confirmada - Pago Pendiente',
  reservation_paid: 'Reserva Pagada',
  checked_in: 'Check-in Realizado',
  completed: 'Completada',
  cancelled_by_guest: 'Cancelada por Ti',
  cancelled_by_host: 'Cancelada por Anfitrión',
  cancelled_payment_expired: 'Cancelada - Pago Expirado',
  refunded: 'Reembolsada'
};

const statusColors: Record<string, string> = {
  pending_confirmation: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  reservation_paid: 'bg-green-100 text-green-800',
  checked_in: 'bg-purple-100 text-purple-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled_by_guest: 'bg-red-100 text-red-800',
  cancelled_by_host: 'bg-red-100 text-red-800',
  cancelled_payment_expired: 'bg-red-100 text-red-800',
  refunded: 'bg-orange-100 text-orange-800'
};

export default function MyBookings() {
  const router = useRouter();
  const { user, loading: authLoading, isLoggedIn } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('MyBookings useEffect - authLoading:', authLoading, 'isLoggedIn:', isLoggedIn);
    if (!authLoading) {
      if (!isLoggedIn) {
        console.log('No está logueado, redirigiendo a login...');
        router.push('/login');
        return;
      }
      console.log('Fetching bookings...');
      fetchBookings();
      // Actualizar cada minuto para mostrar tiempo restante actualizado
      const interval = setInterval(fetchBookings, 60000);
      return () => clearInterval(interval);
    }
  }, [authLoading, isLoggedIn]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('Token:', token ? 'existe' : 'NO EXISTE');
      if (!token) {
        return;
      }

      console.log('Llamando a API:', `${API_BASE_URL}/v1/bookings/my-bookings`);
      const response = await fetch(`${API_BASE_URL}/v1/bookings/my-bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Bookings recibidas:', data);
        setBookings(data.bookings);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setError('Error al cargar tus reservas');
      }
    } catch (err) {
      console.error('Error en fetchBookings:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras verifica autenticación
  if (authLoading || loading) {
    return (
      <Layout title="Mis Reservas - RentaFacil">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22ACF5] mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando tus reservas...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.floor(hours * 60)} minutos`;
    }
    return `${Math.floor(hours)} horas ${Math.floor((hours % 1) * 60)} minutos`;
  };

  return (
    <Layout title="Mis Reservas - RentaFacil">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Mis Reservas</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No tienes reservas aún</p>
            <button
              onClick={() => router.push('/search')}
              className="bg-[#22ACF5] text-white px-6 py-2 rounded-lg hover:bg-[#1a8acc]"
            >
              Buscar Propiedades
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Imagen de la propiedad */}
                  <div className="md:w-48 h-32 flex-shrink-0">
                    {booking.listing_image ? (
                      <img
                        src={booking.listing_image}
                        alt={booking.listing_title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400">Sin imagen</span>
                      </div>
                    )}
                  </div>

                  {/* Detalles de la reserva */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h2 className="text-xl font-semibold mb-1">{booking.listing_title}</h2>
                        <p className="text-gray-600">Anfitrión: {booking.host_name}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[booking.status]}`}>
                        {statusTranslations[booking.status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-500">Check-in</p>
                        <p className="font-medium">{formatDate(booking.check_in_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Check-out</p>
                        <p className="font-medium">{formatDate(booking.check_out_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Noches</p>
                        <p className="font-medium">{booking.nights}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Huéspedes</p>
                        <p className="font-medium">{booking.number_of_guests}</p>
                      </div>
                    </div>

                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="text-2xl font-bold text-[#22ACF5]">
                            S/ {booking.total_price.toFixed(2)}
                          </p>
                        </div>
                        {booking.status === 'confirmed' && (
                          <div className="text-right">
                            <p className="text-sm text-gray-500">A pagar ahora (50%)</p>
                            <p className="text-xl font-bold text-green-600">
                              S/ {booking.reservation_amount.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Alerta de pago pendiente */}
                    {booking.status === 'confirmed' && booking.payment_status === 'pending' && (
                      <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-yellow-800">⏰ Pago Pendiente</p>
                            {booking.hours_remaining && (
                              <p className="text-sm text-yellow-700">
                                Tiempo restante: <strong>{formatTime(booking.hours_remaining)}</strong>
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => router.push(`/my-bookings/${booking.id}`)}
                            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 font-medium"
                          >
                            Pagar Ahora
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Comprobante subido */}
                    {booking.payment_proof_url && !booking.payment_proof_uploaded_at && (
                      <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4">
                        <p className="text-sm text-blue-700">
                          ✅ Comprobante subido. En revisión.
                        </p>
                      </div>
                    )}

                    {/* Pago expirado */}
                    {booking.payment_status === 'expired' && (
                      <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                        <p className="text-sm text-red-700">
                          ❌ El plazo de pago ha expirado. Esta reserva será cancelada automáticamente.
                        </p>
                      </div>
                    )}

                    {/* Botón ver detalles */}
                    {booking.status !== 'confirmed' && (
                      <div className="mt-4">
                        <button
                          onClick={() => router.push(`/my-bookings/${booking.id}`)}
                          className="text-[#22ACF5] hover:underline text-sm font-medium"
                        >
                          Ver detalles →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
