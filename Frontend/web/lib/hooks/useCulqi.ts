/**
 * useCulqi Hook
 * React hook for Culqi payment integration
 */

import { useEffect, useState } from 'react';
import { getCulqiConfig, CULQI_SCRIPT_URL } from '../config/culqi';

declare global {
  interface Window {
    Culqi: any;
    culqi: () => void;
  }
}

interface CulqiOptions {
  onSuccess?: (token: any) => void;
  onError?: (error: any) => void;
}

export const useCulqi = ({ onSuccess, onError }: CulqiOptions = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const config = getCulqiConfig();

  useEffect(() => {
    // Load Culqi script
    const script = document.createElement('script');
    script.src = CULQI_SCRIPT_URL;
    script.async = true;
    
    script.onload = () => {
      setIsLoaded(true);
      
      // Configure Culqi
      if (window.Culqi) {
        window.Culqi.publicKey = config.publicKey;
        
        // Set up callback
        window.culqi = function() {
          if (window.Culqi.token) {
            onSuccess?.(window.Culqi.token);
          } else if (window.Culqi.error) {
            onError?.(window.Culqi.error);
          }
        };
      }
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const openCheckout = (options: {
    title: string;
    description: string;
    amount: number; // in cents
    email?: string;
  }) => {
    if (!isLoaded || !window.Culqi) {
      console.error('Culqi not loaded yet');
      return;
    }

    setIsProcessing(true);

    window.Culqi.settings({
      title: options.title,
      currency: 'PEN',
      description: options.description,
      amount: options.amount,
    });

    window.Culqi.options({
      lang: 'es',
      installments: false,
      paymentMethods: {
        tarjeta: true,
        yape: true,
        billetera: false,
        bancaMovil: false,
        agente: false,
        cuotealo: false,
      },
      style: {
        logo: '/logo.png',
        maincolor: '#2CA7E1',
        buttontext: '#ffffff',
        maintext: '#0C2D55',
        desctext: '#6b7280',
      },
    });

    window.Culqi.open();
    setIsProcessing(false);
  };

  const createCharge = async (tokenId: string, amount: number, email: string) => {
    try {
      const response = await fetch('/api/payments/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_id: tokenId,
          amount,
          email,
        }),
      });

      if (!response.ok) {
        throw new Error('Payment failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Charge error:', error);
      throw error;
    }
  };

  return {
    isLoaded,
    isProcessing,
    openCheckout,
    createCharge,
  };
};
