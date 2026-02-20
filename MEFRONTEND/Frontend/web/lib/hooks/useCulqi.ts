/**
 * useCulqi Hook
 * React hook for Culqi Checkout (v2 with 3DS support)
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { getCulqiConfig } from '../config/culqi';

declare global {
  interface Window {
    CulqiCheckout: new (publicKey: string, config: CulqiConfig) => CulqiInstance;
  }
}

interface CulqiInstance {
  token?: { id: string };
  order?: unknown;
  error?: { user_message: string };
  culqi: () => void;
  open: () => void;
  close: () => void;
}

interface CulqiConfig {
  settings: {
    title: string;
    currency: string;
    amount: number;
    order: string;
    xculqirsaid: string;
    rsapublickey: string;
  };
  client: {
    email: string;
  };
  options: {
    lang: string;
    installments: boolean;
    modal: boolean;
    container?: string;
    paymentMethods: {
      tarjeta?: boolean;
      yape?: boolean;
      billetera?: boolean;
      bancaMovil?: boolean;
      agente?: boolean;
      cuotealo?: boolean;
    };
    paymentMethodsSort: string[];
  };
}

interface CulqiOptions {
  onSuccess?: (token: any) => void;
  onError?: (error: any) => void;
}

export const useCulqi = ({ onSuccess, onError }: CulqiOptions = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scriptsLoadedRef = useRef(false);
  const culqiInstanceRef = useRef<CulqiInstance | null>(null);
  const config = getCulqiConfig();

  // Cargar scripts de Culqi Checkout Custom
  useEffect(() => {
    if (scriptsLoadedRef.current) return;

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const loadScripts = async () => {
      try {
        console.log('Cargando Culqi Checkout Custom...');
        await loadScript('https://3ds.culqi.com');
        await loadScript('https://js.culqi.com/checkout-js');
        console.log('Scripts de Culqi cargados exitosamente');
        scriptsLoadedRef.current = true;
        setIsLoaded(true);
      } catch (err) {
        console.error('Error cargando scripts de Culqi:', err);
        onError?.(err);
      }
    };

    loadScripts();
  }, [onError]);

  const openCheckout = useCallback((options: {
    title: string;
    description?: string;
    amount: number; // in cents
    email: string;
    modal?: boolean;
    containerId?: string;
    paymentMethods?: {
      tarjeta?: boolean;
      yape?: boolean;
      billetera?: boolean;
      bancaMovil?: boolean;
      agente?: boolean;
      cuotealo?: boolean;
    };
  }) => {
    if (!isLoaded || !window.CulqiCheckout) {
      console.error('CulqiCheckout no está cargado aún');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Iniciando Culqi Checkout Custom...');
      console.log('Public Key:', config.publicKey);
      console.log('RSA ID:', config.rsaId);
      console.log('Order ID:', config.orderId);
      console.log('Amount:', options.amount);
      
      const paymentMethods = options.paymentMethods || {
        tarjeta: true,
        yape: true,
      };

      const settings: any = {
        title: options.title,
        currency: 'PEN',
        amount: options.amount,
        xculqirsaid: config.rsaId,
        rsapublickey: config.rsaPublicKey,
      };

      // Order es opcional
      if (config.orderId) {
        settings.order = config.orderId;
      }

      const culqiConfig: CulqiConfig = {
        settings,
        client: {
          email: options.email,
        },
        options: {
          lang: 'auto',
          installments: false,
          modal: options.modal !== undefined ? options.modal : true,
          container: options.containerId,
          paymentMethods,
          paymentMethodsSort: Object.keys(paymentMethods),
        },
      };

      console.log('Culqi Config:', culqiConfig);

      const instance = new window.CulqiCheckout(config.publicKey, culqiConfig);

      instance.culqi = function () {
        if (instance.token) {
          console.log('Token creado:', instance.token.id);
          setIsProcessing(false);
          onSuccess?.(instance.token);
        } else if (instance.order) {
          console.log('Order creada:', instance.order);
        } else {
          console.log('Error:', instance.error);
          setIsProcessing(false);
          onError?.(instance.error);
        }
      };

      culqiInstanceRef.current = instance;
      instance.open();
      console.log('Checkout abierto exitosamente');
      
    } catch (error) {
      console.error('Error al abrir Culqi Checkout:', error);
      onError?.(error);
      setIsProcessing(false);
    }
  }, [isLoaded, config, onSuccess, onError]);

  const closeCheckout = useCallback(() => {
    if (culqiInstanceRef.current) {
      culqiInstanceRef.current.close();
      setIsProcessing(false);
    }
  }, []);

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
    closeCheckout,
    createCharge,
  };
};
