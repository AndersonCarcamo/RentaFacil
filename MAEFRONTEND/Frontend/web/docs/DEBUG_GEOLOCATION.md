# 🔍 DEBUG: Geolocalización no funciona

## Problema Actual
Has habilitado los permisos pero sigue diciendo que está denegado.

---

## ✅ SOLUCIÓN PASO A PASO

### 1️⃣ **Abre la Consola del Navegador**
- Presiona **F12** (o botón derecho → Inspeccionar)
- Ve a la pestaña **"Console"** (Consola)

### 2️⃣ **Ejecuta este Script de Diagnóstico**

Copia y pega este código en la consola:

```javascript
console.log('=== DIAGNÓSTICO DE GEOLOCALIZACIÓN ===\n');

// 1. Verificar si existe API
console.log('1️⃣ ¿Navegador soporta geolocalización?', !!navigator.geolocation);

// 2. Verificar contexto seguro
console.log('2️⃣ ¿Contexto seguro (HTTPS)?', window.isSecureContext);
console.log('   Protocolo:', window.location.protocol);
console.log('   Hostname:', window.location.hostname);

// 3. Verificar permisos
if (navigator.permissions) {
  navigator.permissions.query({ name: 'geolocation' }).then(result => {
    console.log('3️⃣ Estado de permisos:', result.state);
    console.log('   ✅ granted = Permitido');
    console.log('   ⚠️ prompt = Preguntará');
    console.log('   ❌ denied = Bloqueado');
    
    if (result.state === 'denied') {
      console.error('\n🔴 PROBLEMA DETECTADO: Permisos bloqueados');
      console.log('\n📋 SOLUCIÓN:');
      console.log('1. Mira la barra de direcciones');
      console.log('2. Haz click en el icono 🔒 o ℹ️');
      console.log('3. Busca "Ubicación" → cambia a "Permitir"');
      console.log('4. Presiona Ctrl+Shift+R para recargar');
    }
  });
} else {
  console.log('3️⃣ API de permisos no disponible');
}

// 4. Intentar obtener ubicación
console.log('\n4️⃣ Intentando obtener ubicación...');
navigator.geolocation.getCurrentPosition(
  (position) => {
    console.log('✅ ¡ÉXITO! Ubicación obtenida:');
    console.log('   Latitud:', position.coords.latitude);
    console.log('   Longitud:', position.coords.longitude);
    console.log('   Precisión:', position.coords.accuracy, 'metros');
  },
  (error) => {
    console.error('❌ ERROR al obtener ubicación:');
    console.error('   Código:', error.code);
    console.error('   Mensaje:', error.message);
    
    switch (error.code) {
      case 1:
        console.error('\n🔴 PERMISSION_DENIED (código 1)');
        console.error('El navegador tiene los permisos BLOQUEADOS');
        break;
      case 2:
        console.error('\n🟡 POSITION_UNAVAILABLE (código 2)');
        console.error('No se puede determinar la ubicación');
        break;
      case 3:
        console.error('\n🟠 TIMEOUT (código 3)');
        console.error('Tardó demasiado en responder');
        break;
    }
  },
  { 
    enableHighAccuracy: true, 
    timeout: 10000, 
    maximumAge: 0 
  }
);

console.log('\n⏳ Esperando respuesta del GPS...');
```

### 3️⃣ **Lee los Resultados**

Después de ejecutar el script, verás algo como:

```
=== DIAGNÓSTICO DE GEOLOCALIZACIÓN ===

1️⃣ ¿Navegador soporta geolocalización? true
2️⃣ ¿Contexto seguro (HTTPS)? false
   Protocolo: http:
   Hostname: localhost
3️⃣ Estado de permisos: denied  ← ⚠️ AQUÍ ESTÁ EL PROBLEMA
   ✅ granted = Permitido
   ⚠️ prompt = Preguntará
   ❌ denied = Bloqueado

🔴 PROBLEMA DETECTADO: Permisos bloqueados

4️⃣ Intentando obtener ubicación...
❌ ERROR al obtener ubicación:
   Código: 1
   Mensaje: User denied Geolocation

🔴 PERMISSION_DENIED (código 1)
El navegador tiene los permisos BLOQUEADOS
```

---

## 🛠️ SOLUCIONES según el error

### Si dice `denied` (código 1):

#### **Chrome/Edge:**
1. Mira la **barra de direcciones** (donde está la URL)
2. Verás un icono **🔒** o **ℹ️** a la IZQUIERDA
3. **Haz click** en ese icono
4. Busca **"Ubicación"** en la lista
5. **Cámbialo** de "Bloquear" a **"Permitir"**
6. **IMPORTANTE**: Recarga con **Ctrl + Shift + R**
7. **Cierra** todas las pestañas del sitio
8. **Abre de nuevo** y prueba

#### **Firefox:**
1. Click en el **🔒** a la izquierda de la URL
2. Click en **">"** junto a "Permisos"
3. Busca **"Acceder a tu ubicación"**
4. **Desmarca** "Bloquear"
5. **Marca** "Permitir temporalmente" o "Recordar decisión"
6. Recarga con **Ctrl + Shift + R**

---

### Si dice `prompt` pero no pregunta:

Esto significa que el navegador DEBERÍA preguntar pero está cacheando la respuesta anterior.

**SOLUCIÓN:**
```javascript
// Ejecuta esto en la consola para limpiar el estado:
localStorage.clear()
sessionStorage.clear()
```

Luego **cierra TODO el navegador** y ábrelo de nuevo.

---

### Si dice `granted` pero aún falla:

El problema podría ser:
1. **GPS del sistema desactivado**
   - Windows: Configuración → Privacidad → Ubicación → Activar
   - Mac: Preferencias → Seguridad y Privacidad → Servicios de ubicación

2. **Servicios de ubicación de Google deshabilitados**
   - Chrome usa los servicios de ubicación de Google
   - Verifica en: chrome://settings/content/location

---

## 🔄 RESET COMPLETO (última opción)

Si nada funciona, resetea completamente los permisos del sitio:

### Chrome:
1. Ve a: `chrome://settings/content/siteDetails?site=http://localhost:3000`
2. Click en **"Borrar datos"** o **"Restablecer permisos"**
3. Cierra TODO Chrome (Task Manager para asegurar)
4. Abre de nuevo y prueba

### Firefox:
1. Click derecho en la pestaña → **"Ver información de la página"**
2. Pestaña **"Permisos"**
3. Busca **"Acceder a tu ubicación"**
4. Click en **"Borrar permisos personalizados"**
5. Recarga

---

## 🧪 TEST RÁPIDO

Después de seguir los pasos, ejecuta esto en la consola:

```javascript
navigator.geolocation.getCurrentPosition(
  pos => console.log('✅ FUNCIONA:', pos.coords.latitude, pos.coords.longitude),
  err => console.error('❌ FALLA:', err.code, err.message)
)
```

Si ves **"✅ FUNCIONA"** con coordenadas → El botón de la página funcionará.

---

## 📸 Envíame el resultado

Ejecuta el script de diagnóstico y mándame una captura de la consola. 
Así puedo ver exactamente qué está fallando.

---

## 🚨 SI NADA FUNCIONA

Prueba este **workaround temporal** en SearchForm.tsx:

Reemplaza `enableHighAccuracy: true` por `false`:

```typescript
{
  enableHighAccuracy: false, // ← Cambiar a false
  timeout: 15000,
  maximumAge: 0
}
```

Esto usa ubicación aproximada por IP en vez de GPS, menos preciso pero más confiable.
