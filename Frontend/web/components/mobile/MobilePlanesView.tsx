/**
 * MobilePlanesView Component
 * Mobile-optimized view for subscription plans
 */

'use client';

import React from 'react';
import {
  CheckIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  RocketLaunchIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import CulqiCheckout from '../dashboard/CulqiCheckout';
import type { SubscriptionPlan, UserSubscription } from '../../lib/api/subscriptions';

interface MobilePlanesViewProps {
  plans: SubscriptionPlan[];
  currentSubscription: UserSubscription | null;
  billingCycle: 'monthly' | 'yearly';
  onSelectPlan: (planId: string, plan: SubscriptionPlan) => void;
  onPaymentSuccess: (chargeId: string, planId: string) => void;
  onPaymentError: (error: any) => void;
  processingPlanId: string | null;
  showCheckout: string | null;
  onCancelCheckout: () => void;
  userEmail: string;
}

export default function MobilePlanesView({
  plans,
  currentSubscription,
  billingCycle,
  onSelectPlan,
  onPaymentSuccess,
  onPaymentError,
  processingPlanId,
  showCheckout,
  onCancelCheckout,
  userEmail,
}: MobilePlanesViewProps) {
  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('basic') || name.includes('básico')) {
      return BuildingOfficeIcon;
    } else if (name.includes('pro')) {
      return SparklesIcon;
    }
    return RocketLaunchIcon;
  };

  const getPlanColor = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('basic') || name.includes('básico')) {
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-900',
        icon: 'text-gray-700',
        border: 'border-gray-300',
        button: 'bg-gray-700 hover:bg-gray-800',
      };
    } else if (name.includes('pro')) {
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-900',
        icon: 'text-purple-700',
        border: 'border-purple-300',
        button: 'bg-purple-600 hover:bg-purple-700',
      };
    }
    return {
      bg: 'bg-blue-50',
      text: 'text-blue-900',
      icon: 'text-blue-700',
      border: 'border-blue-300',
      button: 'bg-blue-600 hover:bg-blue-700',
    };
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan?.id === planId;
  };

  return (
    <div className="space-y-4 pb-6">
      {plans.map((plan) => {
        const Icon = getPlanIcon(plan.name);
        const colors = getPlanColor(plan.name);
        const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
        const isPopular = plan.name.toLowerCase().includes('pro');
        const isCurrent = isCurrentPlan(plan.id);

        return (
          <div
            key={plan.id}
            className={`relative bg-white rounded-xl shadow-md border-2 ${
              isPopular ? 'border-blue-500' : colors.border
            }`}
          >
            {/* Badges */}
            <div className="flex items-center justify-between px-4 pt-3">
              {isPopular && (
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <StarSolidIcon className="w-3 h-3" />
                  Popular
                </span>
              )}
              {isCurrent && (
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ml-auto">
                  <CheckIcon className="w-3 h-3" />
                  Actual
                </span>
              )}
            </div>

            <div className="p-4">
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-bold ${colors.text} truncate`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">S/ {price}</span>
                    <span className="text-xs text-gray-600">
                      /{billingCycle === 'monthly' ? 'mes' : 'año'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3">{plan.description}</p>

              {/* Yearly Savings */}
              {billingCycle === 'yearly' && plan.price_yearly < plan.price_monthly * 12 && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700 font-medium">
                    💰 Ahorras S/ {(plan.price_monthly * 12 - plan.price_yearly).toFixed(2)} al año
                  </p>
                </div>
              )}

              {/* Limits */}
              {plan.limits && (
                <div className={`p-3 ${colors.bg} rounded-lg mb-3`}>
                  <div className="space-y-1.5 text-xs">
                    {plan.limits.max_listings && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Propiedades:</span>
                        <span className={`font-bold ${colors.text}`}>
                          {plan.limits.max_listings === 999999 ? 'Ilimitadas' : plan.limits.max_listings}
                        </span>
                      </div>
                    )}
                    {plan.limits.max_images && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Imágenes:</span>
                        <span className={`font-bold ${colors.text}`}>
                          {plan.limits.max_images === 999999 ? 'Ilimitadas' : plan.limits.max_images}
                        </span>
                      </div>
                    )}
                    {plan.limits.max_videos && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Videos:</span>
                        <span className={`font-bold ${colors.text}`}>
                          {plan.limits.max_videos === 999999 ? 'Ilimitados' : plan.limits.max_videos}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Features - Collapsible */}
              <details className="mb-3">
                <summary className="text-sm font-medium text-gray-900 cursor-pointer flex items-center justify-between">
                  <span>Ver características ({plan.features.length})</span>
                  <svg className="w-4 h-4 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-2 space-y-2">
                  {plan.features.slice(0, 5).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-700">{feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 5 && (
                    <p className="text-xs text-gray-600 italic">
                      +{plan.features.length - 5} características más
                    </p>
                  )}
                </div>
              </details>

              {/* Action Button or Checkout */}
              {showCheckout === plan.id ? (
                <div className="space-y-2">
                  <CulqiCheckout
                    planName={plan.name}
                    amount={price * 100}
                    billingCycle={billingCycle}
                    onSuccess={(chargeId) => onPaymentSuccess(chargeId, plan.id)}
                    onError={onPaymentError}
                    userEmail={userEmail}
                    disabled={processingPlanId === plan.id}
                  />
                  <button
                    onClick={onCancelCheckout}
                    className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => !isCurrent && onSelectPlan(plan.id, plan)}
                  disabled={isCurrent || processingPlanId === plan.id}
                  className={`w-full py-3 rounded-lg font-medium transition-all text-sm ${
                    isCurrent
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : processingPlanId === plan.id
                      ? 'bg-gray-400 text-white cursor-wait'
                      : `${colors.button} text-white shadow-md active:scale-95`
                  }`}
                >
                  {isCurrent
                    ? 'Plan Actual'
                    : processingPlanId === plan.id
                    ? 'Procesando...'
                    : price === 0
                    ? 'Seleccionar Plan'
                    : 'Suscribirse Ahora'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
