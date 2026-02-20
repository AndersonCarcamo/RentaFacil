# 🔧 Fix: Búsqueda por Voz - Problema Resuelto

**Fecha**: 18 de Noviembre, 2025  
**Issue**: El reconocimiento de voz se detenía inmediatamente sin dar tiempo al usuario para hablar

---

## 🐛 Problema Reportado

El usuario reportó que al presionar el botón de micrófono:
- No le daba ni 1 segundo para hablar
- Se detenía automáticamente
- No buscaba nada (transcript vacío)

---

## 🔍 Diagnóstico

### Causas Identificadas:

1. **`continuous = false`** en el SpeechRecognition
   - Configuración incorrecta que hacía que el reconocimiento se detuviera después de la primera pausa en el habla
   - Chrome interpreta cualquier pausa breve (1-2 segundos) como fin de frase

2. **Closure en el evento `onend`**
   - El evento `onend` usaba `state.transcript` que era una closure del valor anterior
   - El transcript se actualizaba en `onresult` pero no se reflejaba en `onend`

3. **Falta de control manual**
   - No había forma de que el usuario indicara cuándo terminó de hablar
   - El sistema decidía automáticamente cuándo detenerse

---

## ✅ Soluciones Implementadas

### 1. Cambio de `continuous` a `true`

**Archivo**: `hooks/useVoiceSearch.ts`

```typescript
// ANTES
recognition.continuous = continuous; // false por defecto

// DESPUÉS
recognition.continuous = true; // Siempre escucha hasta que se detenga manualmente
```

**Efecto**: El reconocimiento continúa escuchando indefinidamente, permitiendo pausas naturales en el habla.

---

### 2. Uso de `useRef` para el transcript

**Archivo**: `hooks/useVoiceSearch.ts`

```typescript
// NUEVO: Ref para mantener el transcript entre re-renders
const finalTranscriptRef = useRef<string>('');

// En onresult - Acumular transcript
if (finalTranscript) {
  finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + finalTranscript).trim();
}

// En onend - Usar el ref en lugar del state
const finalText = finalTranscriptRef.current;
if (finalText && finalText.trim().length > 0) {
  setStatus('processing');
  processTranscript(finalText);
}
```

**Efecto**: El transcript se mantiene correctamente entre renders y eventos.

---

### 3. Botón "Listo" para control manual

**Archivo**: `components/search/VoiceSearchModal.tsx`

```typescript
// NUEVO: Prop para detener la escucha
interface VoiceSearchModalProps {
  // ... props existentes
  onStop?: () => void;
}

// NUEVO: Dos botones cuando está escuchando
{status === 'listening' && (
  <>
    <button onClick={onCancel}>Cancelar</button>
    <button onClick={onStop}>✓ Listo</button>
  </>
)}
```

**Archivo**: `components/search/VoiceSearchButton.tsx`

```typescript
// NUEVO: Handler para detener
const handleStop = () => {
  stopListening();
  // No cerrar el modal, dejar que el hook procese el resultado
};

// Pasar al modal
<VoiceSearchModal
  onStop={handleStop}
  // ... otras props
/>
```

**Efecto**: El usuario tiene control total sobre cuándo terminar de hablar.

---

### 4. Mejor manejo de transcript vacío

**Archivo**: `hooks/useVoiceSearch.ts`

```typescript
// En onend - Detectar si no hay voz
if (finalText && finalText.trim().length > 0) {
  setStatus('processing');
  processTranscript(finalText);
} else {
  console.warn('⚠️ No transcript to process');
  const errorMsg = 'No se detectó ninguna voz. Por favor, intenta de nuevo.';
  setState(prev => ({ ...prev, error: errorMsg }));
  setStatus('error');
  onError?.(errorMsg);
}
```

**Efecto**: Mensaje claro cuando no se detecta voz.

---

### 5. Limpieza de refs al iniciar/cancelar

**Archivo**: `hooks/useVoiceSearch.ts`

```typescript
// Al iniciar
const startListening = useCallback(() => {
  finalTranscriptRef.current = ''; // Limpiar transcript anterior
  // ...
}, [onError]);

// Al cancelar
const cancelListening = useCallback(() => {
  finalTranscriptRef.current = ''; // Limpiar el ref
  // ...
}, []);
```

**Efecto**: Cada sesión de búsqueda empieza limpia.

---

## 🎯 Flujo de Usuario Actualizado

### Antes (Problemático):
1. Click en micrófono 🎤
2. Modal abierto
3. Usuario empieza a hablar...
4. **Pausa breve (1s)** → ❌ Se detiene automáticamente
5. Transcript vacío o incompleto
6. Búsqueda vacía

### Ahora (Corregido):
1. Click en micrófono 🎤
2. Modal abierto - Permiso solicitado
3. Usuario habla libremente (puede hacer pausas)
4. Transcript se acumula en tiempo real
5. Usuario presiona **"Listo"** cuando termina ✓
6. Sistema procesa y busca
7. Navegación automática a resultados

---

## 📊 Cambios Técnicos Detallados

### `hooks/useVoiceSearch.ts`

| Línea | Cambio | Razón |
|-------|--------|-------|
| 66 | `const finalTranscriptRef = useRef<string>('')` | Mantener transcript entre renders |
| 75 | `recognition.continuous = true` | Escucha continua |
| 102-105 | Acumulación en ref | Evitar pérdida de transcript |
| 113-124 | Usar ref en `onend` | Acceder al valor correcto |
| 219 | Limpiar ref en start | Reset en cada sesión |
| 237 | Limpiar ref en cancel | Evitar residuos |

### `components/search/VoiceSearchModal.tsx`

| Línea | Cambio | Razón |
|-------|--------|-------|
| 8 | Import `CheckIcon` | Ícono para botón "Listo" |
| 24 | Prop `onStop?: () => void` | Callback para detener |
| 35 | Recibir `onStop` | Pasar al handler |
| 52 | Actualizar subtitle | Indicar que debe presionar "Listo" |
| 167-178 | Dos botones | Cancelar y Listo |

### `components/search/VoiceSearchButton.tsx`

| Línea | Cambio | Razón |
|-------|--------|-------|
| 41 | Extraer `stopListening` | Usar en handler |
| 106-109 | Handler `handleStop` | Detener reconocimiento |
| 141, 169 | Pasar `onStop` al modal | Conectar botón con lógica |

---

## 🧪 Testing Sugerido

### Escenarios a Probar:

1. **Habla corta**
   - "Departamento en Miraflores"
   - Presionar "Listo" inmediatamente
   - ✅ Debe buscar correctamente

2. **Habla con pausas**
   - "Departamento... de dos habitaciones... en San Isidro"
   - ✅ Debe acumular todo el texto

3. **Cancelar antes de hablar**
   - Abrir modal → Cancelar
   - ✅ No debe buscar nada

4. **Sin hablar + Listo**
   - Abrir modal → Esperar sin hablar → "Listo"
   - ✅ Debe mostrar error "No se detectó voz"

5. **Habla larga (>30 segundos)**
   - Verificar que sigue escuchando
   - ✅ Debe acumular todo

---

## 📝 Notas de Implementación

### Comportamiento de `continuous: true`

- **Ventaja**: Permite hablar con pausas naturales
- **Desventaja**: Debe detenerse manualmente (por eso el botón "Listo")
- **Alternativa no viable**: `continuous: false` + reinicio automático → complejo y propenso a errores

### Por qué `useRef` en lugar de `useState`

```typescript
// ❌ PROBLEMA con useState
recognition.onend = () => {
  // state.transcript es una closure del valor ANTERIOR
  if (state.transcript) { ... } // Siempre vacío o viejo
}

// ✅ SOLUCIÓN con useRef
recognition.onend = () => {
  // finalTranscriptRef.current es siempre el valor ACTUAL
  if (finalTranscriptRef.current) { ... } // Valor correcto
}
```

### Timing de eventos en Web Speech API

```
onstart → onresult (interim) → onresult (final) → onend
   ↓           ↓                       ↓              ↓
  0ms        ~500ms                  ~1s          ~1.5s (con continuous:false)
                                                   ∞   (con continuous:true, hasta stop())
```

---

## 🚀 Próximas Mejoras Posibles

1. **Auto-detección de silencio prolongado**
   - Si el usuario no habla por >10 segundos, preguntar si terminó
   - Mostrar popup: "¿Terminaste?" [Sí] [Seguir escuchando]

2. **Atajos de teclado**
   - `Ctrl+M` o `Cmd+M`: Activar micrófono
   - `Enter`: Equivalente a "Listo"
   - `Esc`: Cancelar

3. **Indicador visual de volumen**
   - Mostrar barras que reaccionan al volumen del micrófono
   - Ayuda al usuario a saber si está hablando lo suficientemente fuerte

4. **Historial de búsquedas por voz**
   - Guardar transcripts recientes
   - Permitir repetir búsquedas anteriores

---

## ✅ Checklist de Verificación

- [x] `continuous: true` configurado
- [x] `useRef` para transcript implementado
- [x] Botón "Listo" agregado al modal
- [x] Handler `handleStop` implementado
- [x] Props `onStop` pasadas correctamente
- [x] Limpieza de refs en start/cancel
- [x] Manejo de transcript vacío
- [x] Mensajes de error claros
- [x] No hay errores de TypeScript
- [ ] Testing en navegador (pendiente)
- [ ] Testing con diferentes frases
- [ ] Testing de casos extremos

---

## 📚 Referencias

- [Web Speech API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [SpeechRecognition.continuous](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/continuous)
- [React useRef Hook](https://react.dev/reference/react/useRef)
- [Closure en JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)

---

**Status**: ✅ Corregido y listo para testing  
**Próximo paso**: Probar en el navegador con diferentes casos de uso
