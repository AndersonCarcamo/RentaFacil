# Integración de Culqi para Pagos de Suscripciones

## Descripción General

Este documento describe la integración completa de la pasarela de pagos Culqi para procesar suscripciones en EasyRent.

## Arquitectura

### Flujo de Pago

```
Usuario → Selecciona Plan → Culqi Checkout → Token → Backend → Charge → Suscripción
```

1. **Selección de Plan**: Usuario elige un plan de pago (Premium o Profesional)
2. **Culqi Checkout**: Se abre el modal de Culqi con los datos del plan
3. **Token**: Culqi genera un token seguro de la tarjeta
4. **Charge**: Backend procesa el cargo con el token
5. **Suscripción**: Si el pago es exitoso, se crea la suscripción

### Componentes

```
pages/dashboard/planes.tsx          → Vista de planes y checkout
components/dashboard/CulqiCheckout.tsx → Componente de checkout
lib/hooks/useCulqi.ts               → React hook de Culqi
lib/config/culqi.ts                 → Configuración
pages/api/payments/charge.ts        → API endpoint para cargos
```

## Configuración

### Variables de Entorno

```env
# Test Mode (Default)
NEXT_PUBLIC_CULQI_PUBLIC_KEY=pk_test_SsNSbc4aceAySSp3
CULQI_PRIVATE_KEY=sk_test_yrsjDrloVOls3E62

# Production Mode
NEXT_PUBLIC_CULQI_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxx
CULQI_PRIVATE_KEY=sk_live_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_CULQI_ENV=production
```

### Planes y Precios

```typescript
const PAYMENT_SETTINGS = {
  currency: 'PEN',
  plans: {
    basico: { price: 0, priceInCents: 0 },
    premium: { 
      price: 29.90, 
      priceInCents: 2990,
      yearlyPrice: 287.52, // 20% descuento
      yearlyPriceInCents: 28752
    },
    profesional: { 
      price: 99.90, 
      priceInCents: 9990,
      yearlyPrice: 959.04, // 20% descuento
      yearlyPriceInCents: 95904
    }
  }
};
```

## Uso

### 1. En la Página de Planes

```typescript
import CulqiCheckout from '../../components/dashboard/CulqiCheckout';

const handlePaymentSuccess = async (chargeId: string, planId: string) => {
  // Crear suscripción con metadata del pago
  const subscription = await createSubscription(planId, billingCycle, {
    payment_method: 'culqi',
    charge_id: chargeId,
  });
  
  // Actualizar estado y redirigir
  setCurrentSubscription(subscription);
  router.push('/dashboard');
};

<CulqiCheckout
  planName="Premium"
  amount={2990} // en centavos
  billingCycle="monthly"
  onSuccess={(chargeId) => handlePaymentSuccess(chargeId, planId)}
  onError={(error) => console.error(error)}
  userEmail={user.email}
/>
```

### 2. Con el Hook useCulqi

```typescript
import { useCulqi } from '../../lib/hooks/useCulqi';

const { isLoaded, openCheckout, createCharge } = useCulqi({
  onSuccess: async (token) => {
    // Token recibido, crear cargo
    const result = await createCharge(token.id, 2990, 'user@example.com');
    
    if (result.success) {
      // Procesar suscripción
      await createSubscription(planId, 'monthly', {
        charge_id: result.charge_id
      });
    }
  },
  onError: (error) => {
    console.error('Payment error:', error);
  }
});

// Abrir checkout
openCheckout({
  title: 'Plan Premium',
  description: 'Suscripción Mensual',
  amount: 2990,
  email: 'user@example.com'
});
```

## API Endpoints

### POST /api/payments/charge

Crea un cargo en Culqi con el token recibido.

**Request:**
```json
{
  "token_id": "tkn_test_xxxxxxxxxxxxxxxx",
  "amount": 2990,
  "email": "user@example.com",
  "description": "Suscripción EasyRent - Plan Premium",
  "metadata": {
    "plan_id": "premium",
    "billing_cycle": "monthly"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "charge_id": "chr_test_xxxxxxxxxxxxxxxx",
  "amount": 2990,
  "currency": "PEN",
  "email": "user@example.com",
  "outcome": {
    "type": "venta_exitosa",
    "merchant_message": "La transacción fue exitosa",
    "user_message": "Su transacción ha sido exitosa"
  }
}
```

**Response (Error):**
```json
{
  "error": "Charge unsuccessful",
  "message": "Tarjeta rechazada",
  "merchant_message": "Insuficientes fondos"
}
```

## Métodos de Pago Habilitados

- ✅ **Tarjeta de Crédito/Débito**: Visa, Mastercard, American Express
- ✅ **Yape**: Billetera digital móvil
- ❌ Billeteras digitales (deshabilitado)
- ❌ Banca móvil (deshabilitado)
- ❌ Agentes y bodegas (deshabilitado)
- ❌ Cuotas (deshabilitado)

## Tarjetas de Prueba (Test Mode)

### Tarjetas Exitosas

| Número | CVC | Fecha | Resultado |
|--------|-----|-------|-----------|
| 4111 1111 1111 1111 | 123 | 09/2025 | Venta exitosa |
| 5111 1111 1111 1118 | 123 | 09/2025 | Venta exitosa |

### Tarjetas con Error

| Número | CVC | Fecha | Resultado |
|--------|-----|-------|-----------|
| 4000 0000 0000 0002 | 123 | 09/2025 | Tarjeta rechazada |
| 4000 0000 0000 0127 | 123 | 09/2025 | CVC incorrecto |
| 4000 0000 0000 0119 | 123 | 09/2025 | Tarjeta expirada |

## Manejo de Errores

### Errores Comunes

```typescript
// Error: Culqi no cargado
if (!isLoaded) {
  return 'El sistema de pagos aún se está cargando';
}

// Error: Token inválido
{
  "error": "Invalid token",
  "message": "El token ha expirado o es inválido"
}

// Error: Tarjeta rechazada
{
  "outcome": {
    "type": "tarjeta_rechazada",
    "user_message": "Tu tarjeta fue rechazada",
    "merchant_message": "Insuficientes fondos"
  }
}

// Error: Cargo fallido
{
  "error": "Charge unsuccessful",
  "message": "La transacción no pudo ser procesada"
}
```

### Reintentos

- **Token expirado**: Solicitar nuevo token (abrir checkout nuevamente)
- **Tarjeta rechazada**: Permitir al usuario intentar con otra tarjeta
- **Error de red**: Reintentar automáticamente (máx 3 intentos)
- **Error del servidor**: Mostrar mensaje de error y contactar soporte

## Estados de UI

### Loading States

```typescript
const [processing, setProcessing] = useState(false);

// Durante checkout
<button disabled={!isLoaded}>
  {isLoaded ? 'Pagar' : 'Cargando...'}
</button>

// Durante procesamiento de cargo
<button disabled={processing}>
  {processing ? 'Procesando...' : 'Pagar con Tarjeta'}
</button>
```

### Success/Error Messages

```typescript
// Éxito
{success && (
  <div className="bg-green-50 border-green-200">
    ¡Pago exitoso! Tu suscripción ha sido activada.
  </div>
)}

// Error
{error && (
  <div className="bg-red-50 border-red-200">
    Error en el pago: {error}
  </div>
)}
```

## Seguridad

### PCI Compliance

- ✅ **No almacenamos datos de tarjeta**: Culqi maneja todos los datos sensibles
- ✅ **Tokens de un solo uso**: Cada token solo puede usarse una vez
- ✅ **HTTPS obligatorio**: Todas las comunicaciones son encriptadas
- ✅ **Keys separadas**: Test/Production keys diferentes

### Validaciones

```typescript
// Validar campos requeridos
if (!token_id || !amount || !email) {
  return 400;
}

// Validar monto positivo
if (amount <= 0) {
  return 400;
}

// Validar resultado del cargo
if (charge.outcome.type !== 'venta_exitosa') {
  return 400;
}
```

## Testing

### Test Checklist

- [ ] Plan gratuito se activa sin pago
- [ ] Plan Premium abre checkout con precio correcto
- [ ] Plan Profesional abre checkout con precio correcto
- [ ] Ciclo mensual muestra precio mensual
- [ ] Ciclo anual muestra precio anual (con descuento)
- [ ] Tarjeta de prueba exitosa procesa el pago
- [ ] Tarjeta rechazada muestra error apropiado
- [ ] Suscripción se crea después de pago exitoso
- [ ] Usuario es redirigido al dashboard
- [ ] Badge "Plan Actual" se actualiza
- [ ] Botón "Cancelar" cierra el checkout
- [ ] Loading states se muestran correctamente
- [ ] Mensajes de error son claros y útiles

### Test en Producción

Antes de ir a producción:

1. **Actualizar keys**: Cambiar a keys de producción
2. **Probar con tarjeta real**: Hacer una transacción real (mínimo)
3. **Verificar webhooks**: Configurar y probar webhooks de Culqi
4. **Monitorear logs**: Revisar logs de errores
5. **Backup de data**: Asegurar respaldos de suscripciones

## Próximos Pasos

### Features Pendientes

- [ ] Webhooks de Culqi para pagos automáticos
- [ ] Renovación automática de suscripciones
- [ ] Historial de pagos para usuarios
- [ ] Facturas descargables en PDF
- [ ] Cupones de descuento
- [ ] Cambio de plan (upgrade/downgrade)
- [ ] Reembolsos parciales
- [ ] Notificaciones de pago exitoso/fallido

### Mejoras de UX

- [ ] Vista mobile optimizada para planes
- [ ] Comparador de planes side-by-side
- [ ] Preview de características antes de pagar
- [ ] Calculadora de ahorro anual
- [ ] Testimonios de usuarios premium

## Soporte

### Documentación de Culqi

- API Reference: https://docs.culqi.com/
- Dashboard: https://integ-panel.culqi.com/ (test)
- Dashboard: https://panel.culqi.com/ (production)

### Contacto

- Email: soporte@easyrent.pe
- Slack: #payments-support
- Docs: /docs/CULQI_INTEGRATION.md
