/**
 * CurrentPlanCard Component
 * Muestra el plan actual del usuario en su perfil
 */

'use client';

import React from 'react';
import {
  SparklesIcon,
  CalendarIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface CurrentPlanProps {
  planName: string;
  planType: 'basico' | 'premium' | 'profesional';
  startDate: string;
  endDate?: string;
  isActive: boolean;
  autoRenew: boolean;
  price: number;
  features: PlanFeature[];
  listingsUsed: number;
  listingsLimit: number;
  onUpgrade?: () => void;
  onManageSubscription?: () => void;
}

export default function CurrentPlanCard({
  planName,
  planType,
  startDate,
  endDate,
  isActive,
  autoRenew,
  price,
  features,
  listingsUsed,
  listingsLimit,
  onUpgrade,
  onManageSubscription,
}: CurrentPlanProps) {
  const planColors = {
    basico: {
      gradient: 'from-gray-500 to-gray-600',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      badge: 'bg-gray-100 text-gray-700',
    },
    premium: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-700',
    },
    profesional: {
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      badge: 'bg-purple-100 text-purple-700',
    },
  };

  const colors = planColors[planType];
  const usagePercentage = (listingsUsed / listingsLimit) * 100;
  const daysRemaining = endDate 
    ? Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
      {/* Header con gradiente */}
      <div className={`bg-gradient-to-r ${colors.gradient} p-6 text-white`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="w-6 h-6" />
              <h3 className="text-2xl font-bold">{planName}</h3>
            </div>
            <p className="text-white/80 text-sm">
              {planType === 'basico' && 'Plan gratuito con funciones básicas'}
              {planType === 'premium' && 'Destacado en búsquedas y más visibilidad'}
              {planType === 'profesional' && 'Máxima exposición y herramientas avanzadas'}
            </p>
          </div>
          {isActive ? (
            <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">
              ✓ Activo
            </span>
          ) : (
            <span className="px-3 py-1.5 bg-red-500/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-red-500/30">
              Inactivo
            </span>
          )}
        </div>

        {/* Precio */}
        {price > 0 && (
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold">S/ {price}</span>
            <span className="text-white/70">/mes</span>
          </div>
        )}
      </div>

      {/* Información del plan */}
      <div className="p-6 space-y-6">
        {/* Fechas */}
        <div className={`${colors.bg} ${colors.border} border rounded-xl p-4`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <CalendarIcon className="w-4 h-4" />
                Fecha de inicio
              </div>
              <div className="font-semibold text-gray-900">
                {new Date(startDate).toLocaleDateString('es-PE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
            {endDate && (
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <CalendarIcon className="w-4 h-4" />
                  {daysRemaining && daysRemaining > 0 ? 'Renovación' : 'Venció'}
                </div>
                <div className="font-semibold text-gray-900">
                  {new Date(endDate).toLocaleDateString('es-PE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  {daysRemaining && daysRemaining > 0 && (
                    <span className={`ml-2 text-xs ${colors.badge} px-2 py-0.5 rounded-full`}>
                      {daysRemaining} días
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {autoRenew && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">
                  Renovación automática activada
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Uso de publicaciones */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Publicaciones
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {listingsUsed} / {listingsLimit === -1 ? '∞' : listingsLimit}
            </span>
          </div>
          {listingsLimit !== -1 && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${colors.gradient} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
              {usagePercentage >= 80 && (
                <p className="text-xs text-orange-600 mt-1.5">
                  {usagePercentage >= 100
                    ? '⚠️ Has alcanzado tu límite de publicaciones'
                    : '⚠️ Te estás acercando al límite de publicaciones'}
                </p>
              )}
            </>
          )}
        </div>

        {/* Características */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">
            Características de tu plan
          </h4>
          <div className="space-y-2">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-2"
              >
                {feature.included ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                )}
                <span className={`text-sm ${feature.included ? 'text-gray-900' : 'text-gray-400'}`}>
                  {feature.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          {planType !== 'profesional' && onUpgrade && (
            <button
              onClick={onUpgrade}
              className={`flex-1 bg-gradient-to-r ${colors.gradient} text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-2`}
            >
              <ArrowUpIcon className="w-5 h-5" />
              Mejorar Plan
            </button>
          )}
          {price > 0 && onManageSubscription && (
            <button
              onClick={onManageSubscription}
              className="flex-1 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <CreditCardIcon className="w-5 h-5" />
              Gestionar Suscripción
            </button>
          )}
        </div>

        {/* Aviso de próxima renovación */}
        {daysRemaining && daysRemaining > 0 && daysRemaining <= 7 && autoRenew && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>💳 Próxima renovación:</strong> Tu plan se renovará automáticamente
              en {daysRemaining} día{daysRemaining !== 1 ? 's' : ''} por <strong>S/ {price}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
