import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Header } from '../components/Header';
import Button from '../components/ui/Button';
import {
  CheckCircleIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  HomeIcon,
  ChartBarIcon,
  UserGroupIcon,
  BoltIcon,
  ShieldCheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const PlansPage: React.FC = () => {
  const router = useRouter();
  const { newUser, userType } = router.query; // Para detectar si viene del registro y el tipo de usuario
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'basic' | 'pro' | 'enterprise'>('free');
  
  // Determinar si es agente o propietario
  const isAgent = userType === 'AGENT';
  const isLandlord = userType === 'LANDLORD';

  // Planes para PROPIETARIOS
  const landlordPlans = [
    {
      id: 'free',
      name: 'Plan FREE',
      price: 'S/ 0',
      period: '/mes',
      description: 'Perfecto para empezar y probar la plataforma',
      color: 'bg-gray-50 border-gray-300',
      highlightColor: 'text-gray-900',
      buttonVariant: 'secondary' as const,
      features: [
        { text: '1 publicación activa', included: true },
        { text: 'Hasta 5 fotos por propiedad', included: true },
        { text: 'Visibilidad básica', included: true },
        { text: 'Estadísticas básicas', included: true },
        { text: 'Soporte por email', included: true },
        { text: 'Publicaciones destacadas', included: false },
        { text: 'Análisis avanzado', included: false }
      ]
    },
    {
      id: 'basic',
      name: 'Plan BÁSICO',
      price: 'S/ 49',
      period: '/mes',
      description: 'Ideal para propietarios con pocas propiedades',
      color: 'bg-blue-50 border-blue-300',
      highlightColor: 'text-blue-600',
      buttonVariant: 'primary' as const,
      popular: true,
      features: [
        { text: '5 publicaciones activas', included: true },
        { text: 'Hasta 10 fotos por propiedad', included: true },
        { text: 'Visibilidad mejorada', included: true },
        { text: 'Estadísticas detalladas', included: true },
        { text: '1 publicación destacada/mes', included: true },
        { text: 'Soporte prioritario', included: true },
        { text: 'Badge de verificado', included: true }
      ]
    },
    {
      id: 'pro',
      name: 'Plan PRO',
      price: 'S/ 149',
      period: '/mes',
      description: 'Para propietarios con múltiples propiedades',
      color: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-400',
      highlightColor: 'text-blue-600',
      buttonVariant: 'primary' as const,
      features: [
        { text: '20 publicaciones activas', included: true },
        { text: 'Fotos ilimitadas', included: true },
        { text: 'Máxima visibilidad', included: true },
        { text: 'Estadísticas detalladas', included: true },
        { text: '5 publicaciones destacadas/mes', included: true },
        { text: 'Prioridad en resultados', included: true },
        { text: 'Soporte 24/7', included: true },
        { text: 'Tour virtual 360°', included: true }
      ]
    }
  ];

  // Planes para AGENTES/INMOBILIARIAS
  const agentPlans = [
    {
      id: 'free',
      name: 'Plan FREE',
      price: 'S/ 0',
      period: '/mes',
      description: 'Prueba la plataforma sin compromiso',
      color: 'bg-gray-50 border-gray-300',
      highlightColor: 'text-gray-900',
      buttonVariant: 'secondary' as const,
      features: [
        { text: '1 publicación activa', included: true },
        { text: 'Hasta 5 fotos por propiedad', included: true },
        { text: 'Visibilidad básica', included: true },
        { text: 'Estadísticas básicas', included: true },
        { text: 'Soporte por email', included: true },
        { text: 'Gestión de múltiples propiedades', included: false },
        { text: 'API access', included: false },
        { text: 'Gestor de cuenta dedicado', included: false }
      ]
    },
    {
      id: 'enterprise',
      name: 'Plan ENTERPRISE',
      price: 'Desde S/ 499',
      period: '/mes',
      description: 'Solución completa para inmobiliarias profesionales',
      color: 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-400',
      highlightColor: 'text-amber-600',
      buttonVariant: 'primary' as const,
      popular: true,
      features: [
        { text: 'Publicaciones ilimitadas', included: true },
        { text: 'Fotos y videos ilimitados', included: true },
        { text: 'Máxima visibilidad y prioridad', included: true },
        { text: 'API personalizada', included: true },
        { text: 'Gestor de cuenta dedicado', included: true },
        { text: 'Dashboard de gestión avanzado', included: true },
        { text: 'Múltiples usuarios en la cuenta', included: true },
        { text: 'Integraciones personalizadas', included: true },
        { text: 'Reportes y análisis empresariales', included: true },
        { text: 'Capacitación del equipo', included: true },
        { text: 'Soporte prioritario 24/7', included: true },
        { text: 'SLA garantizado', included: true }
      ]
    }
  ];

  const plans = isAgent ? agentPlans : landlordPlans;

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  const handleContinue = () => {
    if (newUser) {
      // Si es usuario nuevo, llevarlo al dashboard
      router.push('/dashboard');
    } else {
      // Si está explorando planes, llevarlo a página de pago
      router.push(`/checkout?plan=${selectedPlan}`);
    }
  };

  return (
    <>
      <Head>
        <title>Planes y Precios - RENTA fácil</title>
        <meta name="description" content="Elige el plan perfecto para tu inmobiliaria" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header />

        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header con mensaje de bienvenida si es nuevo usuario */}
          {newUser && (
            <div className="mb-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                ¡Bienvenido a RENTA fácil! 🎉
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {isAgent 
                  ? 'Tu cuenta de inmobiliaria ha sido creada exitosamente. Conoce los planes disponibles para escalar tu negocio.'
                  : isLandlord
                  ? 'Tu cuenta ha sido creada exitosamente. Comienza publicando tus propiedades con nuestro plan gratuito.'
                  : 'Tu cuenta ha sido creada exitosamente. Elige el plan que mejor se adapte a tus necesidades.'
                }
              </p>
            </div>
          )}

          {/* Header normal si no es nuevo usuario */}
          {!newUser && (
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Planes y Precios
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Elige el plan perfecto para impulsar tu negocio inmobiliario
              </p>
            </div>
          )}

          {/* Plan FREE destacado - Solo si es nuevo usuario */}
          {newUser && (
            <div className="mb-8 max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-8 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <SparklesIcon className="w-8 h-8" />
                    <h2 className="text-3xl font-bold">
                      {isAgent 
                        ? '¡Tu inmobiliaria está lista para crecer!'
                        : '¡Comenzamos con el Plan FREE!'
                      }
                    </h2>
                  </div>
                  <p className="text-lg text-blue-100 mb-6">
                    {isAgent 
                      ? 'Tu cuenta está activa con el Plan FREE. Prueba la plataforma y cuando estés listo, actualiza al Plan ENTERPRISE para desbloquear todo el potencial de tu inmobiliaria.'
                      : 'Tu cuenta está activa con el Plan FREE. Puedes empezar a publicar inmediatamente y actualizar cuando lo necesites.'
                    }
                  </p>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h3 className="text-xl font-semibold mb-4">
                      {isAgent ? 'Tu plan actual incluye:' : 'Tu plan actual incluye:'}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {plans[0].features.filter(f => f.included).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-300 flex-shrink-0" />
                          <span className="text-sm">{feature.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isAgent && (
                    <div className="mt-6 bg-amber-500/20 backdrop-blur-sm rounded-xl p-4 border border-amber-300/30">
                      <div className="flex items-start gap-3">
                        <BuildingOfficeIcon className="w-6 h-6 text-amber-200 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-lg mb-1">¿Necesitas más capacidad?</h4>
                          <p className="text-sm text-blue-100">
                            El Plan ENTERPRISE te ofrece publicaciones ilimitadas, API personalizada, gestor de cuenta dedicado y todas las herramientas para hacer crecer tu inmobiliaria.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-4">
                    <Button
                      onClick={() => router.push('/dashboard')}
                      variant="primary"
                      className="bg-white text-blue-600 hover:bg-blue-50 font-semibold border-2 border-white"
                    >
                      Ir al Dashboard
                    </Button>
                    {isAgent && (
                      <Button
                        onClick={() => {
                          const element = document.getElementById('enterprise-plan');
                          element?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        variant="secondary"
                        className="bg-amber-500 text-white border-amber-400 hover:bg-amber-600"
                      >
                        Ver Plan ENTERPRISE
                      </Button>
                    )}
                    {!isAgent && (
                      <Button
                        onClick={() => {
                          const element = document.getElementById('compare-plans');
                          element?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        variant="secondary"
                        className="bg-white/20 text-white border-white/40 hover:bg-white/30"
                      >
                        Ver otros planes
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comparación de planes */}
          <div id="compare-plans" className="mb-12">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
              {isAgent 
                ? 'Compara: Plan FREE vs ENTERPRISE'
                : isLandlord
                ? 'Encuentra el plan perfecto para tus propiedades'
                : 'Compara todos los planes'
              }
            </h2>
            
            <div className={`grid gap-6 ${isAgent ? 'md:grid-cols-2 max-w-5xl mx-auto' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
              {plans.map((plan, index) => (
                <div
                  key={plan.id}
                  id={plan.id === 'enterprise' ? 'enterprise-plan' : undefined}
                  className={`relative rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${plan.color} border-2 ${
                    selectedPlan === plan.id ? 'ring-4 ring-blue-500 ring-opacity-50 scale-105' : ''
                  } ${isAgent && plan.id === 'enterprise' ? 'md:col-span-1' : ''}`}
                  onClick={() => setSelectedPlan(plan.id as any)}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-1 text-xs font-bold rounded-bl-lg">
                      MÁS POPULAR
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h3 className={`text-xl font-bold mb-2 ${plan.highlightColor}`}>
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      {plan.period && <span className="text-gray-600">{plan.period}</span>}
                    </div>
                    <p className="text-sm text-gray-600 mb-6 min-h-[40px]">
                      {plan.description}
                    </p>

                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          {feature.included ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XMarkIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={`text-sm ${feature.included ? 'text-gray-900' : 'text-gray-400'}`}>
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={() => {
                        setSelectedPlan(plan.id as any);
                        if (plan.id === 'enterprise') {
                          router.push('/contact?reason=enterprise');
                        } else if (plan.id === 'free' && newUser) {
                          router.push('/dashboard');
                        } else {
                          router.push(`/checkout?plan=${plan.id}`);
                        }
                      }}
                      variant={plan.buttonVariant}
                      className="w-full"
                    >
                      {plan.id === 'free' 
                        ? (newUser ? 'Ya estás en FREE' : 'Comenzar Gratis')
                        : plan.id === 'enterprise'
                        ? 'Contactar Ventas'
                        : 'Seleccionar Plan'
                      }
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Características destacadas */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
              ¿Por qué elegir RENTA fácil?
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <HomeIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Múltiples Modalidades
                </h3>
                <p className="text-sm text-gray-600">
                  Publica alquileres tradicionales, por habitación, coliving y tipo Airbnb
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <ChartBarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Gestión Intuitiva
                </h3>
                <p className="text-sm text-gray-600">
                  Dashboard sencillo con estadísticas claras para gestionar tus propiedades
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <UserGroupIcon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Audiencia Creciente
                </h3>
                <p className="text-sm text-gray-600">
                  Conectamos propietarios con inquilinos de manera efectiva y directa
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Seguridad Garantizada
                </h3>
                <p className="text-sm text-gray-600">
                  Verificación de usuarios y propiedades para tu tranquilidad
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
              Preguntas Frecuentes
            </h2>
            
            <div className="space-y-4">
              <details className="bg-white rounded-lg shadow-md border border-gray-100">
                <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-900 hover:text-blue-600">
                  ¿Puedo cambiar de plan en cualquier momento?
                </summary>
                <div className="px-6 pb-4 text-gray-600">
                  Sí, puedes actualizar o cambiar tu plan en cualquier momento desde tu panel de control. Los cambios se aplicarán inmediatamente.
                </div>
              </details>

              <details className="bg-white rounded-lg shadow-md border border-gray-100">
                <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-900 hover:text-blue-600">
                  ¿Qué métodos de pago aceptan?
                </summary>
                <div className="px-6 pb-4 text-gray-600">
                  Aceptamos tarjetas de crédito/débito Visa, Mastercard, American Express, y transferencias bancarias. Para planes Enterprise también ofrecemos facturación personalizada.
                </div>
              </details>

              <details className="bg-white rounded-lg shadow-md border border-gray-100">
                <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-900 hover:text-blue-600">
                  ¿Hay permanencia mínima?
                </summary>
                <div className="px-6 pb-4 text-gray-600">
                  No, todos nuestros planes son mensuales sin permanencia. Puedes cancelar cuando quieras sin penalizaciones.
                </div>
              </details>

              <details className="bg-white rounded-lg shadow-md border border-gray-100">
                <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-900 hover:text-blue-600">
                  ¿Qué incluyen las publicaciones destacadas?
                </summary>
                <div className="px-6 pb-4 text-gray-600">
                  Las publicaciones destacadas aparecen en las primeras posiciones de los resultados de búsqueda con una etiqueta especial, recibiendo hasta 5x más visitas que las publicaciones normales.
                </div>
              </details>

              <details className="bg-white rounded-lg shadow-md border border-gray-100">
                <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-900 hover:text-blue-600">
                  ¿Ofrecen soporte técnico?
                </summary>
                <div className="px-6 pb-4 text-gray-600">
                  Sí, todos los planes incluyen soporte. El plan FREE tiene soporte por email, los planes pagados tienen soporte prioritario, y el plan PRO incluye soporte 24/7.
                </div>
              </details>
            </div>
          </div>

          {/* CTA final */}
          {!newUser && (
            <div className="text-center bg-gradient-to-r from-blue-600 to-amber-500 rounded-2xl shadow-xl p-12 text-white">
              <h2 className="text-3xl font-bold mb-4">
                ¿Listo para empezar?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Sé parte de la nueva forma de gestionar propiedades en alquiler. Simple, efectivo y sin complicaciones.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  onClick={() => router.push('/register')}
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  Crear Cuenta Gratis
                </Button>
                <Button
                  onClick={() => router.push('/contact')}
                  variant="secondary"
                  className="bg-white/20 text-white border-white/40 hover:bg-white/30"
                >
                  Hablar con Ventas
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PlansPage;
