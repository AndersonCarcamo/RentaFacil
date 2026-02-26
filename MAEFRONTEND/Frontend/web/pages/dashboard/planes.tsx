import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/hooks/useAuth';
import { Header } from '../../components/common/Header';
import Button from '../../components/ui/Button';
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  RocketLaunchIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { getSubscriptionPlans, getCurrentSubscription, createSubscription, SubscriptionPlan, UserSubscription } from '../../lib/api/subscriptions';
import CulqiCheckout from '../../components/dashboard/CulqiCheckout';
import MobilePlanesView from '../../components/mobile/MobilePlanesView';
import { PAYMENT_SETTINGS } from '../../lib/config/culqi';
import { useMediaQuery } from '../../lib/hooks/useMediaQuery';

export default function PlanesPage() {
  const router = useRouter();
  const { plan: planQuery, planName: planNameQuery, autocheckout } = router.query;
  const { user, loading: authLoading } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState<string | null>(null); // planId being checked out
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [checkoutAutoOpened, setCheckoutAutoOpened] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadPlansAndSubscription();
    }
  }, [user, authLoading, router]);

  const loadPlansAndSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const [plansData, subscriptionData] = await Promise.all([
        getSubscriptionPlans(),
        getCurrentSubscription().catch(() => null), // Si no tiene suscripción, devuelve null
      ]);

      // Filtrar planes activos y excluir empresariales/enterprise
      const filteredPlans = plansData
        .filter(plan => plan.active)
        .filter(plan => {
          const name = plan.name.toLowerCase();
          return !name.includes('enterprise') && 
                 !name.includes('empresarial') && 
                 !name.includes('empresa');
        })
        .sort((a, b) => a.sort_order - b.sort_order);

      setPlans(filteredPlans);
      setCurrentSubscription(subscriptionData);
    } catch (err) {
      console.error('Error loading plans:', err);
      setError('Error al cargar los planes de suscripción');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string, plan: SubscriptionPlan) => {
    if (!user) return;

    const planPrice = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;

    // Si el plan es gratis, crear suscripción directamente
    if (planPrice === 0) {
      try {
        setProcessingPlanId(planId);
        const newSubscription = await createSubscription(planId, billingCycle);
        setCurrentSubscription(newSubscription);
        setSuccessMessage('¡Suscripción activada exitosamente!');
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } catch (err) {
        console.error('Error creating subscription:', err);
        alert('Error al activar la suscripción. Por favor intenta nuevamente.');
      } finally {
        setProcessingPlanId(null);
      }
      return;
    }

    // Para planes de pago, mostrar checkout de Culqi
    setShowCheckout(planId);
  };

  const handlePaymentSuccess = async (chargeId: string, planId: string) => {
    if (!user) return;

    try {
      setProcessingPlanId(planId);
      
      // Crear la suscripción después del pago exitoso
      const newSubscription = await createSubscription(planId, billingCycle, {
        payment_method: 'culqi',
        charge_id: chargeId,
      });
      
      setCurrentSubscription(newSubscription);
      setSuccessMessage('¡Pago procesado y suscripción activada exitosamente!');
      setShowCheckout(null);
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err) {
      console.error('Error creating subscription after payment:', err);
      alert('El pago fue exitoso pero hubo un error al activar la suscripción. Por favor contacta a soporte.');
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    setShowCheckout(null);
    // El error ya se muestra en el componente CulqiCheckout
  };

  const handleCancelCheckout = () => {
    setShowCheckout(null);
  };

  useEffect(() => {
    if (checkoutAutoOpened || plans.length === 0 || !router.isReady) {
      return;
    }

    if (autocheckout !== '1') {
      return;
    }

    const normalizedPlanIdQuery = typeof planQuery === 'string' ? planQuery.trim().toLowerCase() : '';
    const normalizedPlanNameQuery = typeof planNameQuery === 'string' ? planNameQuery.trim().toLowerCase() : '';
    const matchedPlan = plans.find((plan) => {
      const idMatch = normalizedPlanIdQuery ? plan.id.toLowerCase() === normalizedPlanIdQuery : false;
      const nameMatch = normalizedPlanNameQuery ? plan.name.toLowerCase() === normalizedPlanNameQuery : false;
      return idMatch || nameMatch;
    });

    if (!matchedPlan) {
      return;
    }

    const planPrice = billingCycle === 'monthly' ? matchedPlan.price_monthly : matchedPlan.price_yearly;
    if (planPrice > 0) {
      setShowCheckout(matchedPlan.id);
      setCheckoutAutoOpened(true);
      return;
    }

    setCheckoutAutoOpened(true);
  }, [autocheckout, billingCycle, checkoutAutoOpened, planNameQuery, planQuery, plans, router.isReady]);

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('basic') || name.includes('básico') || name.includes('gratis') || name.includes('free')) {
      return BuildingOfficeIcon;
    } else if (name.includes('pro') || name.includes('profesional')) {
      return SparklesIcon;
    } else if (name.includes('premium') || name.includes('enterprise') || name.includes('empresarial')) {
      return RocketLaunchIcon;
    }
    return StarIcon;
  };

  const getPlanColor = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('basic') || name.includes('básico') || name.includes('gratis') || name.includes('free')) {
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-900',
        button: 'bg-gray-600 hover:bg-gray-700',
        icon: 'text-gray-600',
        badge: 'bg-gray-100 text-gray-800',
      };
    } else if (name.includes('pro') || name.includes('profesional')) {
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        button: 'bg-blue-600 hover:bg-blue-700',
        icon: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-800',
      };
    } else if (name.includes('premium') || name.includes('enterprise') || name.includes('empresarial')) {
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-900',
        button: 'bg-purple-600 hover:bg-purple-700',
        icon: 'text-purple-600',
        badge: 'bg-purple-100 text-purple-800',
      };
    }
    return {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      button: 'bg-green-600 hover:bg-green-700',
      icon: 'text-green-600',
      badge: 'bg-green-100 text-green-800',
    };
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan_id === planId;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Planes de Suscripción - EasyRent Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Volver al Dashboard
            </button>

            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Elige el Plan Perfecto para tu Negocio
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Aumenta tus ventas con más propiedades publicadas y características avanzadas
              </p>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-8 p-4 bg-green-50 border-2 border-green-500 rounded-lg flex items-center gap-3 animate-pulse">
              <CheckIcon className="w-6 h-6 text-green-600" />
              <div className="flex-1">
                <p className="text-green-800 font-medium">{successMessage}</p>
                <p className="text-sm text-green-700 mt-1">Serás redirigido al dashboard...</p>
              </div>
            </div>
          )}

          {/* Toggle de ciclo de facturación */}
          <div className="flex justify-center mb-12">
            <div className="bg-white rounded-xl shadow-md p-2 inline-flex gap-2">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-3 rounded-lg font-medium transition-all relative ${
                  billingCycle === 'yearly'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Anual
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  20% OFF
                </span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <XMarkIcon className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Planes - Mobile or Desktop View */}
          {isMobile ? (
            <MobilePlanesView
              plans={plans}
              currentSubscription={currentSubscription}
              billingCycle={billingCycle}
              onSelectPlan={handleSelectPlan}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              processingPlanId={processingPlanId}
              showCheckout={showCheckout}
              onCancelCheckout={handleCancelCheckout}
              userEmail={user?.email || ''}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {plans.map((plan) => {
              const Icon = getPlanIcon(plan.name);
              const colors = getPlanColor(plan.name);
              const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
              const isPopular = plan.name.toLowerCase().includes('pro');
              const isCurrent = isCurrentPlan(plan.id);

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl ${
                    isPopular ? 'border-blue-500 scale-105' : colors.border
                  }`}
                >
                  {/* Badge Popular */}
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-md flex items-center gap-1">
                        <StarSolidIcon className="w-4 h-4" />
                        Más Popular
                      </span>
                    </div>
                  )}

                  {/* Badge Plan Actual */}
                  {isCurrent && (
                    <div className="absolute -top-4 right-4">
                      <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-md flex items-center gap-1">
                        <CheckIcon className="w-4 h-4" />
                        Plan Actual
                      </span>
                    </div>
                  )}

                  <div className="p-8">
                    {/* Icono y nombre del plan */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${colors.icon}`} />
                      </div>
                      <div>
                        <h3 className={`text-2xl font-bold ${colors.text}`}>{plan.name}</h3>
                      </div>
                    </div>

                    {/* Descripción */}
                    <p className="text-gray-600 mb-6">{plan.description}</p>

                    {/* Precio */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-gray-900">S/ {price}</span>
                        <span className="text-gray-600">
                          /{billingCycle === 'monthly' ? 'mes' : 'año'}
                        </span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <p className="text-sm text-green-600 mt-1">
                          Ahorras S/ {(plan.price_monthly * 12 - plan.price_yearly).toFixed(2)} al año
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-8">
                      <p className="font-medium text-gray-900 text-sm">Incluye:</p>
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Límites destacados */}
                    {plan.limits && (
                      <div className={`p-4 ${colors.bg} rounded-lg mb-6`}>
                        <div className="space-y-2 text-sm">
                          {plan.limits.max_listings && (
                            <div className="flex justify-between">
                              <span className="text-gray-700">Propiedades activas:</span>
                              <span className={`font-bold ${colors.text}`}>
                                {plan.limits.max_listings === 999999 ? 'Ilimitadas' : plan.limits.max_listings}
                              </span>
                            </div>
                          )}
                          {plan.limits.max_images && (
                            <div className="flex justify-between">
                              <span className="text-gray-700">Imágenes por propiedad:</span>
                              <span className={`font-bold ${colors.text}`}>
                                {plan.limits.max_images === 999999 ? 'Ilimitadas' : plan.limits.max_images}
                              </span>
                            </div>
                          )}
                          {plan.limits.max_videos && (
                            <div className="flex justify-between">
                              <span className="text-gray-700">Videos por propiedad:</span>
                              <span className={`font-bold ${colors.text}`}>
                                {plan.limits.max_videos === 999999 ? 'Ilimitados' : plan.limits.max_videos}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Botón de acción o Checkout */}
                    {showCheckout === plan.id ? (
                      <div className="space-y-3">
                        <CulqiCheckout
                          planName={plan.name}
                          amount={price * 100} // Convertir a centavos
                          billingCycle={billingCycle}
                          onSuccess={(chargeId) => handlePaymentSuccess(chargeId, plan.id)}
                          onError={handlePaymentError}
                          userEmail={user?.email || ''}
                          disabled={processingPlanId === plan.id}
                        />
                        <button
                          onClick={handleCancelCheckout}
                          className="w-full py-2 px-4 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => !isCurrent && handleSelectPlan(plan.id, plan)}
                        disabled={isCurrent || processingPlanId === plan.id}
                        className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                          isCurrent
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : processingPlanId === plan.id
                            ? 'bg-gray-400 text-white cursor-wait'
                            : `${colors.button} text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5`
                        }`}
                      >
                        {isCurrent
                          ? 'Plan Actual'
                          : processingPlanId === plan.id
                          ? 'Procesando...'
                          : price === 0
                          ? 'Seleccionar Plan'
                          : 'Suscribirse'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          )}

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <h3 className="text-xl font-bold text-blue-900 mb-3">¿Necesitas ayuda para elegir?</h3>
            <p className="text-blue-700 mb-4">
              Nuestro equipo puede ayudarte a seleccionar el plan perfecto para tu negocio
            </p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Contactar con Ventas
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
