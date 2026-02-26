import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCulqi } from '@/lib/hooks/useCulqi';

interface Booking {
  id: string;
  listing_title: string;
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
}

export default function BookingPayment() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading, isLoggedIn } = useAuth();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'culqi' | 'bank'>('culqi');

  // Culqi integration
  const { openCheckout, isLoaded: culqiLoaded } = useCulqi({
    onSuccess: async (token) => {
      console.log('Culqi token:', token);
      await processPayment(token.id);
    },
    onError: (error) => {
      console.error('Culqi error:', error);
      setError(error.user_message || 'Error en el proceso de pago');
    }
  });

  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push('/login');
        return;
      }
      if (id) {
        fetchBooking();
      }
    }
  }, [id, authLoading, isLoggedIn]);

  const fetchBooking = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return;
      }

      const response = await fetch('http://localhost:8000/v1/bookings/my-bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const foundBooking = data.bookings.find((b: Booking) => b.id === id);
        if (foundBooking) {
          setBooking(foundBooking);
        } else {
          setError('Reserva no encontrada');
        }
      }
    } catch (err) {
      setError('Error al cargar la reserva');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo debe ser menor a 5MB');
        return;
      }

      // Validar tipo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('Solo se permiten archivos JPG, PNG o PDF');
        return;
      }

      setSelectedFile(file);
      setError(null);

      // Crear preview para imágenes
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const processPayment = async (culqiToken: string) => {
    try {
      setUploading(true);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`http://localhost:8000/v1/bookings/${id}/process-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: culqiToken,
          payment_method: 'culqi'
        })
      });

      if (response.ok) {
        setSuccess('¡Pago procesado exitosamente!');
        setTimeout(() => {
          router.push('/my-bookings');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Error al procesar el pago');
      }
    } catch (err) {
      setError('Error de conexión al procesar el pago');
    } finally {
      setUploading(false);
    }
  };

  const handleCulqiPayment = () => {
    if (!booking) return;

    const amountInCents = Math.round(booking.reservation_amount * 100);

    openCheckout({
      title: 'Reserva de Propiedad',
      description: booking.listing_title,
      amount: amountInCents,
      email: user?.email
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || !id) return;

    setUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`http://localhost:8000/v1/bookings/${id}/upload-payment-proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setSuccess('¡Comprobante subido exitosamente! Será verificado pronto.');
        setTimeout(() => {
          router.push('/my-bookings');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Error al subir el comprobante');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.floor(hours * 60)} minutos`;
    }
    const h = Math.floor(hours);
    const m = Math.floor((hours % 1) * 60);
    return `${h} hora${h !== 1 ? 's' : ''} ${m > 0 ? `${m} minutos` : ''}`;
  };

  // Mostrar loading mientras verifica autenticación
  if (authLoading || loading) {
    return (
      <Layout title="Pago de Reserva - RentaFacil">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22ACF5] mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando información de la reserva...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!booking) {
    return (
      <Layout title="Reserva No Encontrada - RentaFacil">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Reserva no encontrada</h2>
          <button
            onClick={() => router.push('/my-bookings')}
            className="bg-[#22ACF5] text-white px-6 py-2 rounded-lg"
          >
            Volver a Mis Reservas
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Pago - ${booking.listing_title} - RentaFacil`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/my-bookings')}
            className="text-[#22ACF5] hover:underline mb-4 flex items-center"
          >
            ← Volver a Mis Reservas
          </button>
          <h1 className="text-3xl font-bold">Completar Pago de Reserva</h1>
        </div>

        {/* Alerta de tiempo restante */}
        {booking.payment_status === 'pending' && booking.hours_remaining && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-3xl">⏰</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-yellow-800">Tiempo Restante para Pagar</h3>
                <p className="text-2xl font-bold text-yellow-900 mt-1">
                  {formatTime(booking.hours_remaining)}
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Si no completas el pago a tiempo, la reserva será cancelada automáticamente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mensajes */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Información del Propietario */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Información de Contacto del Propietario</h2>
          <div className="flex items-start space-x-4">
            {booking.host_profile_picture ? (
              <img
                src={booking.host_profile_picture}
                alt={booking.host_name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold text-white">
                {booking.host_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{booking.host_name}</h3>
              <div className="mt-2 space-y-2">
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${booking.host_email}`} className="hover:text-[#22ACF5]">
                    {booking.host_email}
                  </a>
                </div>
                {booking.host_phone && (
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${booking.host_phone}`} className="hover:text-[#22ACF5]">
                      {booking.host_phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Detalles de la Reserva */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Detalles de la Reserva</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Propiedad</p>
                <p className="font-medium">{booking.listing_title}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Anfitrión</p>
                <p className="font-medium">{booking.host_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Check-in</p>
                  <p className="font-medium">{formatDate(booking.check_in_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Check-out</p>
                  <p className="font-medium">{formatDate(booking.check_out_date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Noches</p>
                  <p className="font-medium">{booking.nights}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Huéspedes</p>
                  <p className="font-medium">{booking.number_of_guests}</p>
                </div>
              </div>

              <div className="border-t pt-3 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-600">Precio Total</p>
                  <p className="font-medium">S/ {booking.total_price.toFixed(2)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Pagar Ahora (50%)</p>
                  <p className="text-2xl font-bold text-green-600">
                    S/ {booking.reservation_amount.toFixed(2)}
                  </p>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  El 50% restante se paga al momento del check-in
                </p>
              </div>
            </div>
          </div>

          {/* Información de Pago */}
          <div className="space-y-6">
            {/* Selector de Método de Pago */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Método de Pago</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setPaymentMethod('culqi')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'culqi'
                      ? 'border-[#22ACF5] bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">💳</div>
                    <p className="font-semibold">Tarjeta/Yape</p>
                    <p className="text-xs text-gray-500 mt-1">Pago online seguro</p>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('bank')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'bank'
                      ? 'border-[#22ACF5] bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🏦</div>
                    <p className="font-semibold">Transferencia</p>
                    <p className="text-xs text-gray-500 mt-1">Banco BCP</p>
                  </div>
                </button>
              </div>

              {/* Pago con Culqi */}
              {paymentMethod === 'culqi' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-3xl">🔒</div>
                      <div>
                        <h3 className="font-bold text-lg">Pago Seguro Online</h3>
                        <p className="text-sm text-gray-600">Procesado por Culqi - Certificado PCI DSS</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600 mb-2">Monto a Pagar:</p>
                      <p className="text-3xl font-bold text-green-600">
                        S/ {booking.reservation_amount.toFixed(2)}
                      </p>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span>✓</span> Tarjetas de crédito y débito
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span>✓</span> Yape
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span>✓</span> Confirmación instantánea
                      </p>
                    </div>

                    <button
                      onClick={handleCulqiPayment}
                      disabled={uploading || !culqiLoaded}
                      className="w-full bg-gradient-to-r from-[#22ACF5] to-[#1a8acc] text-white font-bold py-4 px-6 rounded-lg hover:from-[#1a8acc] hover:to-[#157099] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      {uploading ? 'Procesando...' : culqiLoaded ? '🔐 Pagar Ahora con Culqi' : 'Cargando...'}
                    </button>
                  </div>
                </div>
              )}

              {/* Pago con Transferencia Bancaria */}
              {paymentMethod === 'bank' && (
                <div className="space-y-4">
                  {/* Datos Bancarios */}
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="font-bold mb-4 text-lg">Datos para Transferencia</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Banco</p>
                        <p className="font-bold text-lg">BCP</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Número de Cuenta</p>
                        <p className="font-mono font-bold">194-2583697-0-42</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">CCI</p>
                        <p className="font-mono font-bold">00219400258369704211</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Titular</p>
                        <p className="font-medium">Benites Villar Luiggi Jhan Carlos</p>
                      </div>

                      <div className="bg-white rounded p-3 mt-4">
                        <p className="text-sm text-gray-600">Monto a Transferir</p>
                        <p className="text-3xl font-bold text-green-600">
                          S/ {booking.reservation_amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Subir Comprobante */}
                  <div className="bg-white rounded-lg border border-gray-300 p-6">
                    <h3 className="font-bold mb-4">Subir Comprobante de Pago</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Selecciona tu voucher o captura de pantalla
                        </label>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handleFileSelect}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-semibold
                            file:bg-[#22ACF5] file:text-white
                            hover:file:bg-[#1a8acc] file:cursor-pointer"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Formatos: JPG, PNG, PDF (máx. 5MB)
                        </p>
                      </div>

                      {/* Preview */}
                      {preview && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Vista previa:</p>
                          <img
                            src={preview}
                            alt="Preview"
                            className="max-w-full h-auto rounded-lg border"
                          />
                        </div>
                      )}

                      <button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="w-full bg-[#22ACF5] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#1a8acc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {uploading ? 'Subiendo...' : '📤 Subir Comprobante'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
