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
    // Verificar si ya está cargado
    if (window.Culqi) {
      console.log('✅ Culqi ya estaba cargado');
      window.Culqi.publicKey = config.publicKey;
      console.log('🔑 Public Key configurada:', config.publicKey);
      setIsLoaded(true);
      
      window.culqi = function() {
        if (window.Culqi.token) {
          console.log('✅ Token recibido de Culqi');
          onSuccess?.(window.Culqi.token);
        } else if (window.Culqi.error) {
          console.error('❌ Error de Culqi:', window.Culqi.error);
          onError?.(window.Culqi.error);
        }
      };
      return;
    }

    // Load Culqi script
    console.log('📥 Cargando script de Culqi...');
    const script = document.createElement('script');
    script.src = CULQI_SCRIPT_URL;
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Script de Culqi cargado');
      setIsLoaded(true);
      
      // Configure Culqi
      if (window.Culqi) {
        window.Culqi.publicKey = config.publicKey;
        console.log('🔑 Public Key configurada:', config.publicKey);
        
        // Set up callback
        window.culqi = function() {
          if (window.Culqi.token) {
            console.log('✅ Token recibido de Culqi');
            onSuccess?.(window.Culqi.token);
          } else if (window.Culqi.error) {
            console.error('❌ Error de Culqi:', window.Culqi.error);
            onError?.(window.Culqi.error);
          }
        };
      }
    };

    script.onerror = () => {
      console.error('❌ Error al cargar script de Culqi');
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const openCheckout = (options: {
    title: string;
    description: string;
    amount: number; // in cents
    email?: string;
  }) => {
    if (!isLoaded || !window.Culqi) {
      console.error('❌ Culqi no está cargado aún');
      return;
    }

    if (!isLoaded || !window.Culqi) {
      console.error('❌ Culqi no está cargado aún');
      return;
    }

    setIsProcessing(true);

    try {
      // CRÍTICO: Configurar publicKey PRIMERO, antes que todo
      window.Culqi.publicKey = config.publicKey;
      console.log('🔑 Public Key configurada:', config.publicKey);

      // Luego configurar settings
      window.Culqi.settings({
        title: options.title,
        currency: 'PEN',
        description: options.description,
        amount: options.amount,
      });
      console.log('⚙️ Settings configurados');

      // Después las options
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
          maincolor: '#22ACF5',
          buttontext: '#ffffff',
          maintext: '#0C2D55',
          desctext: '#6b7280',
        },
      });
      console.log('🎨 Options configuradas');

      // Verificar que la llave sigue configurada
      console.log('🔍 Verificando publicKey antes de abrir:', window.Culqi.publicKey);

      // Finalmente abrir el modal
      console.log('🚀 Abriendo checkout...');
      window.Culqi.open();
    } catch (error) {
      console.error('❌ Error al abrir Culqi:', error);
    } finally {
      setIsProcessing(false);
    }
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
