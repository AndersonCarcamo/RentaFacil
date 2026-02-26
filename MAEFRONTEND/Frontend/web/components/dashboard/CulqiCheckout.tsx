/**
 * CulqiCheckout Component
 * Handles Culqi payment checkout process
 */

'use client';

import React, { useState } from 'react';
import { useCulqi } from '../../lib/hooks/useCulqi';
import { CheckCircleIcon, XCircleIcon, CreditCardIcon } from '@heroicons/react/24/outline';

interface CulqiCheckoutProps {
  planName: string;
  amount: number; // in cents
  billingCycle: 'monthly' | 'yearly';
  onSuccess: (chargeId: string) => void;
  onError?: (error: any) => void;
  userEmail?: string;
  disabled?: boolean;
}

export default function CulqiCheckout({
  planName,
  amount,
  billingCycle,
  onSuccess,
  onError,
  userEmail = '',
  disabled = false,
}: CulqiCheckoutProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { isLoaded, openCheckout, createCharge } = useCulqi({
    onSuccess: async (token) => {
      console.log('Token received:', token);
      await handlePayment(token.id);
    },
    onError: (err) => {
      console.error('Culqi error:', err);
      setError(err.user_message || 'Error en el proceso de pago');
      setProcessing(false);
      onError?.(err);
    },
  });

  const handlePayment = async (tokenId: string) => {
    try {
      setProcessing(true);
      setError(null);

      // Create charge using our API
      const result = await createCharge(tokenId, amount, userEmail);

      if (result.success) {
        setSuccess(true);
        onSuccess(result.charge_id);
      } else {
        throw new Error(result.message || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar el pago');
      onError?.(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenCheckout = () => {
    if (!isLoaded) {
      setError('El sistema de pagos aún se está cargando. Por favor espera un momento.');
      return;
    }

    setError(null);
    setSuccess(false);

    openCheckout({
      title: `Plan ${planName}`,
      description: `Suscripción ${billingCycle === 'monthly' ? 'Mensual' : 'Anual'}`,
      amount,
      email: userEmail,
    });
  };

  return (
    <div className="space-y-3">
      {/* Checkout Button */}
      <button
        onClick={handleOpenCheckout}
        disabled={disabled || !isLoaded || processing}
        className={`w-full py-3 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
          disabled || !isLoaded
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : processing
            ? 'bg-blue-400 text-white cursor-wait'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
        }`}
      >
        {processing ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Procesando...</span>
          </>
        ) : !isLoaded ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Cargando...</span>
          </>
        ) : (
          <>
            <CreditCardIcon className="w-5 h-5" />
            <span>Pagar con Tarjeta</span>
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error en el pago</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">¡Pago exitoso!</p>
            <p className="text-sm text-green-700 mt-1">Tu suscripción ha sido activada.</p>
          </div>
        </div>
      )}

      {/* Payment Methods Info */}
      <div className="text-center">
        <p className="text-xs text-gray-600">
          Aceptamos Visa, Mastercard, American Express y Yape
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <img src="/visa.svg" alt="Visa" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
          <img src="/mastercard.svg" alt="Mastercard" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
          <img src="/amex.svg" alt="Amex" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
        </div>
      </div>

      {/* Security Badge */}
      <div className="text-center pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Pago seguro procesado por Culqi
        </p>
      </div>
    </div>
  );
}
