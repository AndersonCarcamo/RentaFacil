import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Header } from '../components/common/Header';
import { useAuth } from '../lib/hooks/useAuth';
import {
  HomeIcon,
  PhotoIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const PublishPage: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Verificar autenticación y permisos
  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        // Si no está autenticado, redirigir al home (que mostrará el modal)
        router.push('/');
      } else if (user.role === 'user') {
        // Si es usuario normal, redirigir al home con modal de upgrade
        router.push('/?showUpgrade=true');
      } else if (user.role === 'landlord' || user.role === 'agent') {
        // Si es propietario o agente, redirigir al formulario de creación
        router.push('/dashboard/create-listing');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Publicar Propiedad - RENTA fácil</title>
        </Head>
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-96px)]">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando permisos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role === 'user') {
    return null; // Se está redirigiendo
  }

  return (
    <>
      <Head>
        <title>Publicar Propiedad - RENTA fácil</title>
        <meta name="description" content="Publica tu propiedad en RENTA fácil" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Publicar Nueva Propiedad
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Completa la información de tu propiedad y llega a miles de interesados
            </p>
          </div>

          {/* Coming Soon */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Banner */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                  <HomeIcon className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold mb-2">
                  Formulario de Publicación en Desarrollo
                </h2>
                <p className="text-lg text-blue-100">
                  Estamos trabajando para ofrecerte la mejor experiencia de publicación
                </p>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Mientras tanto, aquí está lo que podrás hacer:
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <PhotoIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Fotos y Videos
                        </h4>
                        <p className="text-sm text-gray-600">
                          Sube hasta {user.role === 'agent' ? 'ilimitadas' : '10'} fotos de alta calidad y videos de tu propiedad
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPinIcon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Ubicación Precisa
                        </h4>
                        <p className="text-sm text-gray-600">
                          Marca la ubicación exacta en el mapa para mejor visibilidad
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Precios Flexibles
                        </h4>
                        <p className="text-sm text-gray-600">
                          Define precios mensuales, semanales o diarios según tu preferencia
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircleIcon className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Publicación Inmediata
                        </h4>
                        <p className="text-sm text-gray-600">
                          Tu propiedad estará visible para miles de usuarios al instante
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info del Plan Actual */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <CheckCircleIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Tu Plan Actual: {user.role === 'agent' ? 'Inmobiliaria' : 'Propietario'}
                      </h4>
                      <p className="text-sm text-blue-800 mb-3">
                        Estás en el <strong>Plan FREE</strong>. Puedes publicar tu primera propiedad de manera gratuita.
                      </p>
                      <button
                        onClick={() => router.push('/plans')}
                        className="text-sm text-blue-600 hover:text-blue-800 font-semibold underline"
                      >
                        Ver planes y mejorar →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Volver al Dashboard
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Ir al Inicio
                  </button>
                </div>

                {/* Coming Soon Notice */}
                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-500">
                    <strong>Nota:</strong> El formulario de publicación estará disponible próximamente.
                    Te notificaremos cuando esté listo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PublishPage;
