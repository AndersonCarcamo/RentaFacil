import React, { memo, useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Header } from '../components/common/Header';
import Button from '../components/ui/Button';
import { useAuth } from '../lib/hooks/useAuth';
import { uploadAvatar } from '../lib/api/users';
import { 
  EnvelopeIcon, 
  KeyIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const RIGHT_PANEL_PATTERN_STYLE: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cg id='house'%3E%3Cpath d='M6 20L12 14L18 20V26H6V20Z' fill='none' stroke='%23000000' stroke-width='1.5' stroke-opacity='0.3'/%3E%3Crect x='8.5' y='22' width='2' height='3' fill='none' stroke='%23000000' stroke-width='1.2' stroke-opacity='0.25'/%3E%3Crect x='13' y='18' width='2' height='2' fill='none' stroke='%23000000' stroke-width='1' stroke-opacity='0.2'/%3E%3C/g%3E%3Cg id='building'%3E%3Crect x='2' y='12' width='10' height='14' fill='none' stroke='%23000000' stroke-width='1.5' stroke-opacity='0.25'/%3E%3Crect x='4' y='15' width='2' height='2' fill='none' stroke='%23000000' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='7' y='15' width='2' height='2' fill='none' stroke='%23000000' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='4' y='18' width='2' height='2' fill='none' stroke='%23000000' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='7' y='18' width='2' height='2' fill='none' stroke='%23000000' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='4' y='21' width='2' height='2' fill='none' stroke='%23000000' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='7' y='21' width='2' height='2' fill='none' stroke='%23000000' stroke-width='1' stroke-opacity='0.2'/%3E%3C/g%3E%3Cg id='key'%3E%3Ccircle cx='4' cy='18' r='2' fill='none' stroke='%23000000' stroke-width='1.4' stroke-opacity='0.25'/%3E%3Cpath d='M6 18H12M9.5 16V20M10.5 16.5V19.5' stroke='%23000000' stroke-width='1.2' stroke-opacity='0.25' fill='none'/%3E%3C/g%3E%3Cg id='apartment'%3E%3Crect x='1' y='10' width='14' height='16' fill='none' stroke='%23000000' stroke-width='1.5' stroke-opacity='0.2'/%3E%3Crect x='3' y='13' width='2.5' height='2.5' fill='none' stroke='%23000000' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='7' y='13' width='2.5' height='2.5' fill='none' stroke='%23000000' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='11' y='13' width='2.5' height='2.5' fill='none' stroke='%23000000' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='3' y='17' width='2.5' height='2.5' fill='none' stroke='%23000000' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='7' y='17' width='2.5' height='2.5' fill='none' stroke='%23000000' stroke-widt='1' stroke-opacity='0.15'/%3E%3Crect x='11' y='17' width='2.5' height='2.5' fill='none' stroke='%23000000' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='3' y='21' width='2.5' height='2.5' fill='none' stroke='%23000000' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='7' y='21' width='2.5' height='2.5' fill='none' stroke='%23000000' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='11' y='21' width='2.5' height='2.5' fill='none' stroke='%23000000' stroke-width='1' stroke-opacity='0.15'/%3E%3C/g%3E%3Cg id='door'%3E%3Crect x='2' y='14' width='5' height='12' rx='2.5' fill='none' stroke='%23000000' stroke-width='1.4' stroke-opacity='0.25'/%3E%3Ccircle cx='5.5' cy='20' r='0.4' fill='%23000000' fill-opacity='0.2'/%3E%3C/g%3E%3C/defs%3E%3Cuse href='%23house' x='8' y='8'/%3E%3Cuse href='%23building' x='40' y='20'/%3E%3Cuse href='%23key' x='75' y='6' transform='rotate(45 79 24)'/%3E%3Cuse href='%23apartment' x='20' y='50'/%3E%3Cuse href='%23door' x='80' y='38' transform='rotate(-15 82.5 50)'/%3E%3Cuse href='%23key' x='12' y='80' transform='rotate(-30 16 98)'/%3E%3Cuse href='%23building' x='90' y='70'/%3E%3Cuse href='%23house' x='60' y='80'/%3E%3Cuse href='%23key' x='50' y='25' transform='rotate(60 54 43)'/%3E%3Cuse href='%23door' x='4' y='40'/%3E%3Cuse href='%23apartment' x='85' y='5'/%3E%3Cuse href='%23building' x='65' y='12'/%3E%3C/svg%3E")`,
  backgroundSize: '120px 120px'
};

const TITLE_SHADOW_STYLE: React.CSSProperties = {
  textShadow: '0px 1px 0px rgba(0,0,0,0.1), 0px 2px 4px rgba(0,0,0,0.1)'
};

const SUBTITLE_STYLE: React.CSSProperties = {
  color: '#112331'
};

const LoginForm: React.FC<{ showRegistrationSuccess: boolean }> = ({ showRegistrationSuccess }) => {
  const router = useRouter();
  const { login, refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);

      const pendingAvatar = sessionStorage.getItem('pending_avatar_upload');
      const pendingFilename = sessionStorage.getItem('pending_avatar_filename');

      if (pendingAvatar && pendingFilename) {
        try {
          console.log('📸 Detectado avatar pendiente, subiendo...');

          const response = await fetch(pendingAvatar);
          const blob = await response.blob();
          const file = new File([blob], pendingFilename, { type: blob.type });

          await uploadAvatar(file);

          if (refreshUser) {
            await refreshUser();
          }

          sessionStorage.removeItem('pending_avatar_upload');
          sessionStorage.removeItem('pending_avatar_filename');

          console.log('✅ Avatar subido exitosamente después del registro');
        } catch (uploadError) {
          console.error('⚠️ Error al subir avatar pendiente:', uploadError);
        }
      }

      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Error al iniciar sesión. Por favor, verifica tus credenciales.';

      if (err instanceof Error) {
        if (err.message.includes('401') || err.message.includes('Invalid')) {
          errorMessage = 'Email o contraseña incorrectos.';
        } else if (err.message.includes('404') || err.message.includes('not found')) {
          errorMessage = 'Usuario no encontrado. ¿Necesitas registrarte?';
        } else if (err.message.includes('suspended')) {
          errorMessage = 'Tu cuenta ha sido suspendida. Contacta con soporte.';
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full">
      {showRegistrationSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-green-800">¡Registro exitoso!</h3>
            <p className="text-sm text-green-700 mt-1">
              Tu cuenta ha sido creada. Ahora puedes iniciar sesión.
            </p>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Iniciar Sesión
        </h1>
        <p className="text-gray-600">
          Ingresa a tu cuenta de RENTA fácil
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Correo Electrónico
          </label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="tu@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contraseña
          </label>
          <div className="relative">
            <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Tu contraseña"
            />
          </div>
        </div>

        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full"
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link href="/registro" className="text-blue-600 hover:text-blue-800 font-medium underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

const RightDecorativePanel = memo(function RightDecorativePanel() {
  return (
    <div className="hidden lg:flex lg:col-span-3 items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#EDDD00' }}>
      <div className="absolute inset-0 bg-black/10" />

      <div className="absolute inset-0 opacity-20" style={RIGHT_PANEL_PATTERN_STYLE} />

      <div className="relative text-center z-10 px-8">
        <div className="mb-8">
          <img
            src="/images/logo_sin_fondo.png"
            alt="RENTA fácil Logo"
            className="h-40 w-auto mx-auto drop-shadow-lg"
          />
        </div>
        <h2 className="text-5xl font-bold text-gray-900 mb-6" style={TITLE_SHADOW_STYLE}>
          ¡Bienvenido de vuelta!
        </h2>
        <p className="text-2xl text-gray-800 max-w-2xl leading-relaxed" style={SUBTITLE_STYLE}>
          Encuentra tu hogar ideal con RENTA fácil
        </p>
      </div>
    </div>
  );
});

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);

  useEffect(() => {
    // Redirect if already logged in
    if (isLoggedIn) {
      router.push('/');
      return;
    }

    // Check if user was redirected from registration
    if (router.query.registered === 'true') {
      setShowRegistrationSuccess(true);
      // Remove the query parameter
      router.replace('/login', undefined, { shallow: true });
    }
  }, [router.query, isLoggedIn, router]);

  return (
    <>
      <Head>
        <title>Iniciar Sesión - RENTA fácil</title>
        <meta name="description" content="Inicia sesión en RENTA fácil" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="min-h-[calc(100vh-96px)] grid grid-cols-1 lg:grid-cols-5">
          {/* Formulario - Lado Izquierdo */}
          <div className="lg:col-span-2 flex items-center justify-center p-8 lg:p-12 bg-white">
            <LoginForm showRegistrationSuccess={showRegistrationSuccess} />
          </div>

          <RightDecorativePanel />
        </div>
      </div>
    </>
  );
};

export default LoginPage;
