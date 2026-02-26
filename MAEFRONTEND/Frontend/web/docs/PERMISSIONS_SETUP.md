# 🔒 Configuración de Permisos del Navegador

## Resumen de Cambios

Se ha configurado la aplicación RentaFacil para solicitar y gestionar los siguientes permisos del navegador:

- ✅ **Micrófono**: Para búsqueda por voz
- ✅ **Geolocalización**: Para "Mi ubicación" en búsquedas

---

## 📋 Archivos Modificados

### 1. `next.config.js`
**Cambio**: Actualización de Permissions-Policy

```javascript
// ANTES
value: 'camera=(), microphone=(), geolocation=()',

// DESPUÉS
value: 'camera=(), microphone=(self), geolocation=(self)',
```

**Explicación**: 
- `microphone=(self)`: Permite que la aplicación solicite acceso al micrófono
- `geolocation=(self)`: Permite que la aplicación solicite acceso a la ubicación
- `camera=()`: Mantiene la cámara bloqueada (no se necesita)

---

### 2. `pages/_document.tsx`
**Cambio**: Agregado meta tag de permisos

```tsx
{/* Permisos de características del navegador */}
<meta httpEquiv="Permissions-Policy" content="microphone=(self), geolocation=(self)" />
```

**Explicación**: Declara explícitamente qué permisos solicita la aplicación en el HTML.

---

### 3. `public/manifest.json`
**Cambio**: Agregado array de permisos para PWA

```json
"permissions": [
  "geolocation",
  "microphone"
],
```

**Explicación**: Declara permisos en el manifest de Progressive Web App.

---

## 📁 Archivos Nuevos

### 4. `utils/permissions.ts`
**Nuevo archivo**: Utilidades centralizadas para gestión de permisos

**Funciones principales**:

```typescript
// Verificar soporte
isPermissionSupported('microphone') // true/false
isPermissionSupported('geolocation') // true/false

// Solicitar permisos
await requestMicrophonePermission()
await requestGeolocationPermission()

// Verificar estado
await checkPermissionState('microphone') // 'granted' | 'denied' | 'prompt'

// Obtener ubicación
await getCurrentPosition() // GeolocationPosition

// Verificar contexto seguro (HTTPS)
isSecureContext() // true/false

// Obtener guía de configuración
getPermissionGuide('microphone', 'chrome')
detectBrowser() // 'chrome' | 'firefox' | 'safari' | 'edge'
```

**Casos de uso**:

```typescript
import { 
  requestMicrophonePermission, 
  isPermissionSupported,
  getPermissionGuide,
  detectBrowser
} from '@/utils/permissions';

// Verificar soporte antes de mostrar botón
if (isPermissionSupported('microphone')) {
  // Mostrar botón de voz
}

// Solicitar permiso
const result = await requestMicrophonePermission();
if (result.granted) {
  // Permiso concedido
} else {
  // Mostrar error y guía
  const browser = detectBrowser();
  const guide = getPermissionGuide('microphone', browser);
  console.log(guide);
}
```

---

## 🔄 Componentes Actualizados

### 5. `components/search/VoiceSearchButton.tsx`
**Cambios**: 
- Importa utilidades de permisos
- Verifica contexto seguro (HTTPS)
- Verifica soporte de micrófono antes de iniciar

```typescript
import { isPermissionSupported, isSecureContext } from '@/utils/permissions';

const handleClick = () => {
  // Verificaciones de seguridad
  if (!isSecureContext()) {
    toast.error('La búsqueda por voz requiere HTTPS');
    return;
  }
  
  if (!isPermissionSupported('microphone')) {
    toast.error('Micrófono no disponible');
    return;
  }
  
  // Continuar con búsqueda por voz...
};
```

---

## 🌐 Comportamiento por Navegador

### Chrome / Edge (Chromium)
1. Primera vez: Popup automático solicitando permiso
2. Si se acepta: Se guarda la preferencia
3. Si se rechaza: Icono de micrófono tachado en barra de direcciones
4. Para cambiar: Click en candado → Permisos → Micrófono/Ubicación

### Firefox
1. Primera vez: Popup con opción de "Recordar decisión"
2. Para cambiar: Click en ícono (i) → Más información → Permisos

### Safari
1. Primera vez: Popup solicitando permiso
2. Para cambiar: Safari → Preferencias → Sitios web → Micrófono/Ubicación

---

## 🔐 Seguridad

### Requisitos de Contexto Seguro

**¿Qué es un contexto seguro?**
- HTTPS en producción
- `localhost` en desarrollo
- `127.0.0.1` en desarrollo

**¿Por qué es necesario?**
Los navegadores modernos requieren HTTPS para acceder a:
- Micrófono
- Cámara
- Geolocalización
- Notificaciones push
- Service Workers

**Verificación en el código**:
```typescript
if (!isSecureContext()) {
  console.error('Se requiere HTTPS para esta función');
}
```

---

## 🧪 Testing de Permisos

### Desarrollo Local
```bash
# La aplicación corre en localhost, contexto seguro ✅
npm run dev
# http://localhost:3000 - Permisos funcionarán
```

### Producción
```bash
# DEBE usar HTTPS
https://rentafacil.com ✅
http://rentafacil.com  ❌ (permisos bloqueados)
```

### Testing Manual

1. **Primera visita** - Verificar popup de permisos
2. **Permiso concedido** - Verificar funcionalidad
3. **Permiso denegado** - Verificar mensajes de error
4. **Cambio de permiso** - Revocar y volver a conceder

---

## 🐛 Troubleshooting

### Problema: "Permiso denegado"
**Solución**:
1. Revisar configuración del navegador
2. Usar guía automática: `getPermissionGuide('microphone', detectBrowser())`
3. En Chrome: chrome://settings/content/microphone
4. En Firefox: about:preferences#privacy

### Problema: "Micrófono no disponible"
**Causas posibles**:
- No hay micrófono físico conectado
- Otra aplicación está usando el micrófono
- Drivers de audio no funcionan
- Micrófono bloqueado a nivel de sistema operativo

**Solución**:
1. Verificar hardware
2. Cerrar otras apps (Zoom, Teams, etc.)
3. Verificar configuración de audio del SO

### Problema: "Se requiere HTTPS"
**Causa**: La aplicación no está en contexto seguro

**Solución en desarrollo**:
```bash
# Usar localhost en lugar de IP
http://localhost:3000  ✅
http://192.168.1.100:3000  ❌
```

**Solución en producción**:
- Configurar certificado SSL
- Usar servicios como Let's Encrypt
- Deployar en plataformas con HTTPS automático (Vercel, Netlify)

---

## 📊 Monitoreo de Permisos

### Logs del Sistema

```typescript
// Los permisos generan logs automáticos
console.log('🎤 Solicitando permiso de micrófono...');
console.log('✅ Permiso concedido');
console.log('❌ Permiso denegado:', error.message);
```

### Analytics Recomendado

Trackear eventos importantes:
```typescript
// Ejemplo con Google Analytics
gtag('event', 'permission_request', {
  permission_type: 'microphone',
  result: 'granted' // o 'denied'
});
```

---

## 🚀 Próximos Pasos

### Mejoras Futuras

1. **Prompt educativo**: Mostrar un modal explicando por qué se necesita el permiso antes de solicitarlo
2. **Persistencia**: Guardar estado de permisos en localStorage
3. **Fallback**: Ofrecer alternativas si el permiso es denegado
4. **Testing**: Unit tests para cada función de permisos
5. **Analytics**: Monitorear tasas de aceptación/rechazo

### Implementación en Otros Componentes

Para usar permisos en otros componentes:

```typescript
import { requestGeolocationPermission, getCurrentPosition } from '@/utils/permissions';

// En un componente de ubicación
const handleGetLocation = async () => {
  const permission = await requestGeolocationPermission();
  
  if (permission.granted) {
    const position = await getCurrentPosition();
    console.log('Lat:', position.coords.latitude);
    console.log('Lng:', position.coords.longitude);
  } else {
    toast.error(permission.error);
  }
};
```

---

## 📚 Referencias

- [MDN: Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)
- [MDN: MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [MDN: Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Can I Use: Permissions API](https://caniuse.com/permissions-api)
- [Web.dev: Secure Contexts](https://web.dev/when-to-use-local-https/)

---

## ✅ Checklist de Implementación

- [x] Actualizar `next.config.js` con Permissions-Policy
- [x] Agregar meta tags en `_document.tsx`
- [x] Actualizar `manifest.json` con permisos
- [x] Crear `utils/permissions.ts` con utilidades
- [x] Actualizar `VoiceSearchButton.tsx` con verificaciones
- [x] Actualizar documentación en README
- [ ] Testing en Chrome
- [ ] Testing en Firefox
- [ ] Testing en Safari
- [ ] Testing en Edge
- [ ] Testing en mobile (iOS Safari, Chrome Android)
- [ ] Configurar HTTPS en producción
- [ ] Agregar analytics de permisos

---

**Última actualización**: 18 de Noviembre, 2025
**Versión**: 1.0.0
