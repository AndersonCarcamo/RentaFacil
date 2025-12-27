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
    console.log('Iniciando useCulqi hook...');
    console.log('Llave Pública a usar:', config.publicKey);
    
    // Configurar el callback global de Culqi
    window.culqi = function() {
      console.log('Callback de Culqi ejecutado');
      if (window.Culqi.token) {
        console.log('Token recibido:', window.Culqi.token.id);
        onSuccess?.(window.Culqi.token);
      } else if (window.Culqi.error) {
        console.error('Error de Culqi:', window.Culqi.error);
        onError?.(window.Culqi.error);
      }
    };

    // Verificar si ya está cargado
    if (window.Culqi) {
      console.log('Culqi ya estaba cargado en el DOM');
      window.Culqi.publicKey = config.publicKey;
      console.log('Public Key configurada:', config.publicKey);
      setIsLoaded(true);
      return;
    }

    // Cargar script de Culqi
    console.log('Cargando script de Culqi desde:', CULQI_SCRIPT_URL);
    const script = document.createElement('script');
    script.src = CULQI_SCRIPT_URL;
    script.async = true;
    
    script.onload = () => {
      console.log('Script de Culqi cargado exitosamente');
      
      if (window.Culqi) {
        window.Culqi.publicKey = config.publicKey;
        console.log('Public Key configurada al cargar:', config.publicKey);
        setIsLoaded(true);
      } else {
        console.error('window.Culqi no está disponible después de cargar el script');
      }
    };

    script.onerror = (error) => {
      console.error('Error al cargar script de Culqi:', error);
    };

    document.body.appendChild(script);

    return () => {
      console.log('Limpiando script de Culqi');
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
      console.error('Culqi no está cargado aún');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Iniciando configuración de Culqi Checkout...');
      console.log('Llave Pública:', config.publicKey);
      console.log('Monto:', options.amount, 'centavos');

      // PASO 1: Configurar la llave pública (CRÍTICO - debe ir primero)
      window.Culqi.publicKey = config.publicKey;
      
      // PASO 2: Configurar los ajustes del checkout
      const settingsConfig = {
        title: options.title,
        currency: 'PEN',
        description: options.description,
        amount: options.amount,
      };
      console.log('Settings:', settingsConfig);
      window.Culqi.settings(settingsConfig);

      // PASO 3: Configurar las opciones de visualización
      const optionsConfig = {
        lang: 'es',
        installments: false,
        paymentMethods: {
          tarjeta: true,
          yape: false,
          billetera: false,
          bancaMovil: false,
          agente: false,
          cuotealo: false,
        },
        style: {
          maincolor: '#0F766E',
          buttontext: '#FFFFFF',
          maintext: '#0C2D55',
          desctext: '#6B7280',
        },
      };
      console.log('Options:', optionsConfig);
      window.Culqi.options(optionsConfig);

      // PASO 4: Verificar configuración final antes de abrir
      console.log('Verificación final:');
      console.log('  - publicKey:', window.Culqi.publicKey);
      console.log('  - Configuración completa ✓');

      // PASO 5: Abrir el checkout
      console.log('Abriendo Culqi Checkout...');
      window.Culqi.open();
      console.log('Checkout abierto exitosamente');
      
    } catch (error) {
      console.error('Error al configurar Culqi:', error);
      onError?.(error);
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
