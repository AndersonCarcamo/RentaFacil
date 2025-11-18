# 🎤 Sistema de Búsqueda por Voz

Sistema completo de reconocimiento de voz para búsqueda de propiedades usando Web Speech API.

## ✨ Características

- ✅ Reconocimiento de voz en español peruano (`es-PE`)
- ✅ Procesamiento NLP para extraer parámetros
- ✅ Feedback visual en tiempo real
- ✅ Modal con animación de ondas de sonido
- ✅ Manejo de errores y permisos
- ✅ Compatible con Chrome, Edge y Safari
- ✅ Sin costos adicionales (API nativa del navegador)

## 📦 Componentes Creados

### 1. Hook: `useVoiceSearch`
Hook personalizado que maneja toda la lógica del reconocimiento de voz.

```typescript
import { useVoiceSearch } from '@/hooks/useVoiceSearch';

const {
  isSupported,      // ¿El navegador soporta voz?
  isListening,      // ¿Está escuchando ahora?
  transcript,       // Texto final transcrito
  interimTranscript,// Texto provisional
  error,            // Mensaje de error
  status,           // Estado actual
  startListening,   // Iniciar escucha
  stopListening,    // Detener escucha
  cancelListening   // Cancelar escucha
} = useVoiceSearch({
  onResult: (result) => {
    console.log('Transcript:', result.transcript);
    console.log('Params:', result.params);
  },
  onError: (error) => {
    console.error('Error:', error);
  },
  lang: 'es-PE'
});
```

### 2. Componente: `VoiceSearchButton`
Botón que activa la búsqueda por voz.

```tsx
import { VoiceSearchButton } from '@/components/search/VoiceSearchButton';

// Variante ícono (default)
<VoiceSearchButton variant="icon" />

// Variante botón completo
<VoiceSearchButton variant="button" />
```

### 3. Componente: `VoiceSearchModal`
Modal que muestra el estado del reconocimiento.

```tsx
import { VoiceSearchModal } from '@/components/search/VoiceSearchModal';

<VoiceSearchModal
  isOpen={isModalOpen}
  onClose={handleClose}
  status={status}
  transcript={transcript}
  interimTranscript={interimTranscript}
  error={error}
  onCancel={handleCancel}
/>
```

### 4. Componente: `VoiceWaveAnimation`
Animación de ondas de sonido.

```tsx
import { VoiceWaveAnimation } from '@/components/search/VoiceWaveAnimation';

<VoiceWaveAnimation 
  isActive={true}
  color="#5AB0DB"
  bars={5}
/>
```

### 5. Parser NLP: `voiceSearchParser.ts`
Funciones para procesar el texto transcrito.

```typescript
import { parseVoiceQuery, summarizeSearchParams, voiceParamsToQueryString } from '@/utils/voiceSearchParser';

// Extraer parámetros
const params = parseVoiceQuery("Departamento de 2 habitaciones en Miraflores por menos de 2000 soles");
// { property_type: 'departamento', bedrooms: 2, district: 'Miraflores', max_price: 2000, currency: 'PEN' }

// Generar resumen
const summary = summarizeSearchParams(params);
// "Departamento, 2 habitaciones, en Miraflores, hasta S/2000"

// Convertir a query string
const queryString = voiceParamsToQueryString(params);
// "type=departamento&bedrooms=2&district=Miraflores&max_price=2000&currency=PEN"
```

## 🎯 Ejemplos de Uso

### Ejemplo 1: Búsqueda simple
```
Usuario: "Departamento en Miraflores"
Resultado: { property_type: 'departamento', district: 'Miraflores' }
```

### Ejemplo 2: Con habitaciones y precio
```
Usuario: "Casa de 3 habitaciones por menos de 3000 soles"
Resultado: { 
  property_type: 'casa', 
  bedrooms: 3, 
  max_price: 3000, 
  currency: 'PEN' 
}
```

### Ejemplo 3: Con área
```
Usuario: "Departamento de 80 metros cuadrados en San Isidro"
Resultado: { 
  property_type: 'departamento', 
  min_area: 80, 
  district: 'San Isidro' 
}
```

### Ejemplo 4: Rango de precios
```
Usuario: "Cuarto entre 500 y 1000 soles"
Resultado: { 
  property_type: 'cuarto', 
  min_price: 500, 
  max_price: 1000, 
  currency: 'PEN' 
}
```

## 🚀 Integración

El botón de búsqueda por voz ya está integrado en:

1. **SearchForm** - Junto al campo de ubicación
2. Puedes agregarlo en cualquier parte:

```tsx
import { VoiceSearchButton } from '@/components/search';

<VoiceSearchButton 
  variant="button"
  onSearchComplete={(result) => {
    console.log('Búsqueda completada:', result);
  }}
/>
```

## ⚙️ Configuración

### Permisos requeridos:
- **Micrófono**: El usuario debe dar permiso explícito la primera vez
- **HTTPS**: Requerido en producción (localhost funciona sin HTTPS)

La aplicación ya está configurada para solicitar estos permisos:
- ✅ `next.config.js`: Permissions-Policy habilitado para `microphone=(self)`
- ✅ `_document.tsx`: Meta tags de permisos agregados
- ✅ `manifest.json`: Permisos declarados para PWA
- ✅ `utils/permissions.ts`: Utilidades para gestionar permisos

### Cómo funcionan los permisos:
1. El usuario hace clic en el botón de micrófono
2. El navegador muestra un popup solicitando permiso
3. Si el usuario acepta, se inicia el reconocimiento de voz
4. Si el usuario rechaza, se muestra un mensaje de error con instrucciones

### Navegadores soportados:
- ✅ Chrome 25+
- ✅ Edge 79+
- ✅ Safari 14.1+
- ❌ Firefox (no soportado)

## 🔧 Personalización

### Cambiar idioma:
```typescript
useVoiceSearch({
  lang: 'es-ES'  // Español de España
  // lang: 'en-US' // Inglés de EE.UU.
})
```

### Agregar más distritos:
Edita `utils/voiceSearchParser.ts`:

```typescript
const DISTRICTS = [
  'Miraflores', 
  'San Isidro',
  // Agregar más aquí...
];
```

### Personalizar colores:
Edita los componentes y cambia las clases de Tailwind o los estilos inline.

## 📊 Monitoreo

El sistema incluye logs para debugging:

```
🎤 Voice recognition started
📝 Interim: departamento...
✅ Final: departamento de 2 habitaciones
🔍 Parsed params: { property_type: 'departamento', bedrooms: 2 }
```

## ⚠️ Limitaciones

1. **Precisión**: Depende de la claridad del audio y acento
2. **Ruido**: El ruido ambiental puede afectar el reconocimiento
3. **Conexión**: Requiere conexión a internet en algunos navegadores
4. **Privacy**: Chrome envía audio a servidores de Google

## 🐛 Troubleshooting

### Error: "Permiso denegado"
- Usuario rechazó permiso de micrófono
- En Chrome: Settings > Privacy > Site Settings > Microphone

### Error: "No se detectó voz"
- Hablar más fuerte y claro
- Verificar que el micrófono funciona
- Revisar configuración de audio del sistema

### No aparece el botón
- El navegador no soporta Web Speech API
- Usar Chrome, Edge o Safari

## 📝 Tipos TypeScript

```typescript
interface VoiceSearchParams {
  property_type?: 'departamento' | 'casa' | 'cuarto' | 'airbnb';
  bedrooms?: number;
  bathrooms?: number;
  district?: string;
  min_price?: number;
  max_price?: number;
  currency?: 'PEN' | 'USD';
  min_area?: number;
  max_area?: number;
}

interface VoiceSearchResult {
  transcript: string;
  params: VoiceSearchParams;
  confidence: number;
}
```

## 🎓 Referencias

- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [Can I Use - Speech Recognition](https://caniuse.com/speech-recognition)
