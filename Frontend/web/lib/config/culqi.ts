/**
 * Culqi Configuration
 * Payment gateway integration for RentaFácil
 */

export const CULQI_CONFIG = {
  // Test environment
  test: {
    publicKey: 'pk_test_SsNSbc4aceAySSp3',
    privateKey: 'sk_test_yrsjDrloVOls3E62',
    rsaId: process.env.NEXT_PUBLIC_CULQI_RSA_ID || '',
    rsaPublicKey: process.env.NEXT_PUBLIC_CULQI_RSA_PUBLIC_KEY || '',
    orderId: process.env.NEXT_PUBLIC_CULQI_ORDER_ID || '', // Opcional
    baseUrl: 'https://api.culqi.com',
  },
  
  // Production environment (to be configured)
  production: {
    publicKey: process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY || '',
    privateKey: process.env.CULQI_PRIVATE_KEY || '',
    rsaId: process.env.NEXT_PUBLIC_CULQI_RSA_ID || '',
    rsaPublicKey: process.env.NEXT_PUBLIC_CULQI_RSA_PUBLIC_KEY || '',
    orderId: process.env.NEXT_PUBLIC_CULQI_ORDER_ID || '', // Opcional
    baseUrl: 'https://api.culqi.com',
  },
};

// Use test keys by default (change to production in .env)
export const getCulqiConfig = () => {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'test';
  return CULQI_CONFIG[env];
};

// Payment settings
export const PAYMENT_SETTINGS = {
  currency: 'PEN',
  description: 'Plan EasyRent',
  
  plans: {
    basico: {
      name: 'Plan Básico',
      price: 0,
      priceInCents: 0,
      features: [
        '5 propiedades activas',
        'Publicación básica',
        'Soporte por email',
      ],
    },
    premium: {
      name: 'Plan Premium',
      price: 29.90,
      priceInCents: 2990,
      features: [
        '20 propiedades activas',
        'Publicación destacada',
        'Soporte prioritario',
        'Estadísticas avanzadas',
      ],
    },
    profesional: {
      name: 'Plan Profesional',
      price: 99.90,
      priceInCents: 9990,
      features: [
        'Propiedades ilimitadas',
        'Publicación premium',
        'Soporte 24/7',
        'Analytics completo',
        'API access',
      ],
    },
  },
};

export default getCulqiConfig;
