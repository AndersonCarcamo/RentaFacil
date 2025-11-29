# Guía Rápida: Integración de Culqi para Suscripciones

## 🎉 ¡Integración Completada!

La pasarela de pagos Culqi ha sido integrada exitosamente en EasyRent para procesar suscripciones de pago.

## 📦 ¿Qué se ha implementado?

### Componentes Frontend
✅ **CulqiCheckout** - Componente de checkout reutilizable  
✅ **MobilePlanesView** - Vista mobile optimizada para planes  
✅ **Planes Page** - Actualizada con flujo de pago completo  

### Backend
✅ **API Endpoint** - `/api/payments/charge` para procesar pagos  
✅ **Metadata** - Soporte para metadata de pago en suscripciones  

### Documentación
✅ **CULQI_INTEGRATION.md** - Guía completa de integración  
✅ **CULQI_IMPLEMENTATION_SUMMARY.md** - Resumen de implementación  

## 🚀 Cómo Probar

### 1. Iniciar el Servidor

```bash
cd Frontend/web
npm run dev
```

### 2. Acceder a la Página de Planes

Navega a: `http://localhost:3000/dashboard/planes`

### 3. Probar con Tarjetas de Test

**Tarjeta Exitosa:**
```
Número: 4111 1111 1111 1111
CVV: 123
Fecha: 09/2025
Email: test@example.com
```

**Tarjeta Rechazada:**
```
Número: 4000 0000 0000 0002
CVV: 123
Fecha: 09/2025
Email: test@example.com
```

### 4. Flujo de Prueba

1. Selecciona el **Plan Premium** o **Plan Profesional**
2. Haz clic en **"Suscribirse"**
3. Se abrirá el modal de Culqi
4. Ingresa los datos de la tarjeta de prueba
5. Haz clic en **"Pagar"**
6. Verás el mensaje de éxito
7. Serás redirigido al dashboard

## 🔧 Configuración (Ambiente de Prueba)

El sistema ya está configurado con las siguientes keys de prueba:

```typescript
// lib/config/culqi.ts
publicKey: 'pk_test_SsNSbc4aceAySSp3'
privateKey: 'sk_test_yrsjDrloVOls3E62'
```

**⚠️ IMPORTANTE:** Estas keys son solo para testing. No se procesa dinero real.

## 📱 Responsive

La página funciona en:
- ✅ Desktop (>768px) - Grid de 3 columnas
- ✅ Tablet (768px) - Grid de 2 columnas
- ✅ Mobile (<768px) - Vista vertical optimizada

## 💰 Planes Configurados

| Plan | Mensual | Anual | Descuento |
|------|---------|-------|-----------|
| Básico | Gratis | Gratis | - |
| Premium | S/29.90 | S/287.52 | 20% |
| Profesional | S/99.90 | S/959.04 | 20% |

## 🎨 Métodos de Pago

- ✅ Tarjetas de Crédito/Débito (Visa, Mastercard, Amex)
- ✅ Yape (billetera digital)

## ⚙️ Variables de Entorno (Producción)

Cuando estés listo para producción, crea un archivo `.env.local`:

```env
# Culqi Production Keys
NEXT_PUBLIC_CULQI_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxx
CULQI_PRIVATE_KEY=sk_live_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_CULQI_ENV=production
```

## 🔍 Verificar Pagos en Culqi

1. Accede al dashboard de pruebas: https://integ-panel.culqi.com/
2. Usa las credenciales de tu cuenta Culqi
3. Ve a **Transacciones** → **Cargos**
4. Verás los pagos de prueba que hayas realizado

## 📋 Checklist Pre-Producción

Antes de lanzar a producción:

- [ ] Cambiar a keys de producción en variables de entorno
- [ ] Hacer una transacción real de prueba (mínimo)
- [ ] Configurar webhooks de Culqi
- [ ] Actualizar endpoint de suscripción en backend
- [ ] Configurar monitoreo de transacciones
- [ ] Probar en diferentes navegadores
- [ ] Probar en dispositivos móviles reales
- [ ] Revisar manejo de errores
- [ ] Configurar alertas de pagos fallidos
- [ ] Documentar proceso de soporte para usuarios

## 🐛 Troubleshooting

### El modal de Culqi no se abre
```
Problema: isLoaded es false
Solución: Espera a que el script de Culqi se cargue completamente
```

### Error "Invalid token"
```
Problema: Token expirado o inválido
Solución: Vuelve a abrir el checkout para generar un nuevo token
```

### Pago exitoso pero suscripción no se crea
```
Problema: Error en la API de suscripciones
Solución: Verifica que el endpoint /v1/subscriptions acepte metadata
```

### Vista mobile no se muestra
```
Problema: useMediaQuery no está funcionando
Solución: Verifica que el hook esté correctamente importado
```

## 📚 Documentación Adicional

- **Integración Completa:** `docs/CULQI_INTEGRATION.md`
- **Resumen de Implementación:** `docs/CULQI_IMPLEMENTATION_SUMMARY.md`
- **API de Culqi:** https://docs.culqi.com/

## 🤝 Soporte

Si encuentras algún problema:

1. Revisa la documentación en `docs/`
2. Verifica los logs del navegador (F12)
3. Verifica los logs del servidor
4. Consulta la documentación de Culqi
5. Contacta al equipo de desarrollo

## 🎯 Próximas Features

- Historial de pagos para usuarios
- Facturas descargables en PDF
- Webhooks para renovación automática
- Cambio de plan (upgrade/downgrade)
- Cupones de descuento
- Método de pago guardado

## ✨ ¡Todo listo!

El sistema de pagos está completamente integrado y listo para probar. Solo necesitas:

1. Iniciar el servidor: `npm run dev`
2. Ir a `/dashboard/planes`
3. Seleccionar un plan de pago
4. Probar con las tarjetas de test

**¡Disfruta de la integración de Culqi!** 🚀
