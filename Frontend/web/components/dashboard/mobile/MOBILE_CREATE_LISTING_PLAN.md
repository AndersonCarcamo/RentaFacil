# 📱 Planificación: Vista Móvil de Crear/Editar Propiedad

## 📋 Resumen
Crear componentes móviles optimizados para la página de creación/edición de propiedades (`/dashboard/create-listing`), transformando el formulario largo de desktop en un flujo multi-paso intuitivo para móviles.

---

## 🎯 Objetivos

1. **Dividir formulario largo** en pasos pequeños y manejables
2. **Reducir fricción** con inputs optimizados para táctil
3. **Preview en tiempo real** de cómo se verá la propiedad
4. **Validación progresiva** con feedback inmediato
5. **Guardar progreso** automático (drafts)
6. **Navegación intuitiva** entre pasos

---

## 📐 Estructura de Componentes

```
components/dashboard/mobile/listing/
├── MobileListingLayout.tsx       # Layout con stepper
├── StepIndicator.tsx             # Barra de progreso visual
├── NavigationButtons.tsx         # Prev/Next/Save buttons
│
├── steps/
│   ├── Step1Basic.tsx            # Info básica (tipo, título, operación)
│   ├── Step2Location.tsx         # Ubicación + mapa
│   ├── Step3Details.tsx          # Detalles (m², habitaciones, etc)
│   ├── Step4Price.tsx            # Precio y condiciones
│   ├── Step5Features.tsx         # Amenidades y características
│   ├── Step6Images.tsx           # Fotos de la propiedad
│   ├── Step7Contact.tsx          # Info de contacto (opcional)
│   └── Step8Review.tsx           # Revisión final
│
├── widgets/
│   ├── PropertyTypeSelector.tsx  # Cards para tipo de propiedad
│   ├── LocationPicker.tsx        # Mapa + autocomplete móvil
│   ├── PriceInput.tsx            # Input de precio con formato
│   ├── AmenityGrid.tsx           # Grid de amenidades seleccionables
│   ├── ImageUploader.tsx         # Upload optimizado móvil
│   ├── RoomCounter.tsx           # +/- counters para habitaciones
│   └── PreviewCard.tsx           # Vista previa de la prop
│
├── modals/
│   ├── SaveDraftModal.tsx        # Confirmar guardar borrador
│   ├── ExitConfirmModal.tsx      # Confirmar salir sin guardar
│   └── PublishSuccessModal.tsx   # Éxito al publicar
│
└── index.ts                      # Exports
```

---

## 🎨 Flujo Multi-Paso (8 Pasos)

### **Paso 1: Información Básica** 📝
```
┌─────────────────────────────────┐
│ Paso 1 de 8                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━   │ ← Progress bar
├─────────────────────────────────┤
│                                 │
│ ¿Qué tipo de propiedad es?      │
│                                 │
│ ┌───────┐ ┌───────┐ ┌───────┐  │
│ │  🏢   │ │  🏠   │ │  🏘️   │  │
│ │ Depto │ │ Casa  │ │Studio │  │
│ └───────┘ └───────┘ └───────┘  │
│                                 │
│ ┌───────┐ ┌───────┐ ┌───────┐  │
│ │  🛏️   │ │  🏢   │ │   ➕  │  │
│ │ Hab.  │ │ Ofic. │ │ Otro │  │
│ └───────┘ └───────┘ └───────┘  │
│                                 │
│ Título de la publicación        │
│ ┌───────────────────────────┐  │
│ │ Ej: Depto moderno en...   │  │
│ └───────────────────────────┘  │
│                                 │
│ ¿Qué tipo de operación?         │
│ ○ Alquiler                      │
│ ○ Venta                         │
│ ○ Alquiler Temporal             │
│                                 │
│         [ Siguiente → ]         │
└─────────────────────────────────┘
```

### **Paso 2: Ubicación** 📍
```
┌─────────────────────────────────┐
│ ← Paso 2 de 8                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
├─────────────────────────────────┤
│                                 │
│ ¿Dónde está ubicada?            │
│                                 │
│ Departamento                    │
│ ┌───────────────────────────┐  │
│ │ Lima              ▼       │  │
│ └───────────────────────────┘  │
│                                 │
│ Provincia                       │
│ ┌───────────────────────────┐  │
│ │ Lima              ▼       │  │
│ └───────────────────────────┘  │
│                                 │
│ Distrito                        │
│ ┌───────────────────────────┐  │
│ │ Miraflores        ▼       │  │
│ └───────────────────────────┘  │
│                                 │
│ Dirección específica            │
│ ┌───────────────────────────┐  │
│ │ Av. Larco 123             │  │
│ └───────────────────────────┘  │
│                                 │
│ 📍 Ubicación en el mapa         │
│ ┌─────────────────────────┐   │
│ │                         │   │
│ │      🗺️  MAPA          │   │
│ │         📍              │   │
│ │                         │   │
│ └─────────────────────────┘   │
│ [Tap para ajustar ubicación]  │
│                                 │
│ [ ← Atrás ]  [ Siguiente → ]   │
└─────────────────────────────────┘
```

### **Paso 3: Detalles** 🏠
```
┌─────────────────────────────────┐
│ ← Paso 3 de 8                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
├─────────────────────────────────┤
│                                 │
│ Características principales     │
│                                 │
│ Área construida (m²)            │
│ ┌───────────────────────────┐  │
│ │        [ - ] 80 [ + ]     │  │
│ └───────────────────────────┘  │
│                                 │
│ Dormitorios                     │
│ ┌───────────────────────────┐  │
│ │        [ - ] 2 [ + ]      │  │
│ └───────────────────────────┘  │
│                                 │
│ Baños                           │
│ ┌───────────────────────────┐  │
│ │        [ - ] 1 [ + ]      │  │
│ └───────────────────────────┘  │
│                                 │
│ Estacionamientos                │
│ ┌───────────────────────────┐  │
│ │        [ - ] 1 [ + ]      │  │
│ └───────────────────────────┘  │
│                                 │
│ ☑️ Amoblado                     │
│ ☐ Acepta mascotas               │
│ ☐ Permite fumar                 │
│                                 │
│ [ ← Atrás ]  [ Siguiente → ]   │
└─────────────────────────────────┘
```

### **Paso 4: Precio** 💰
```
┌─────────────────────────────────┐
│ ← Paso 4 de 8                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
├─────────────────────────────────┤
│                                 │
│ Precio de alquiler              │
│                                 │
│ Moneda                          │
│ ○ PEN (Soles)                   │
│ ○ USD (Dólares)                 │
│                                 │
│ Precio mensual                  │
│ ┌──────┬──────────────────┐    │
│ │ PEN  │  1,500           │    │
│ └──────┴──────────────────┘    │
│                                 │
│ Periodo de alquiler             │
│ ┌───────────────────────────┐  │
│ │ Mensual          ▼        │  │
│ └───────────────────────────┘  │
│                                 │
│ ☑️ Requiere depósito            │
│                                 │
│ Monto del depósito              │
│ ┌──────┬──────────────────┐    │
│ │ PEN  │  1,500           │    │
│ └──────┴──────────────────┘    │
│                                 │
│ Servicios incluidos:            │
│ ☑️ Agua                         │
│ ☑️ Luz                          │
│ ☑️ Internet                     │
│ ☐ Limpieza                      │
│                                 │
│ [ ← Atrás ]  [ Siguiente → ]   │
└─────────────────────────────────┘
```

### **Paso 5: Amenidades** ✨
```
┌─────────────────────────────────┐
│ ← Paso 5 de 8                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
├─────────────────────────────────┤
│                                 │
│ ¿Qué amenidades tiene?          │
│                                 │
│ 🔍 Buscar amenidades...         │
│                                 │
│ Más populares                   │
│ ┌──────┐ ┌──────┐ ┌──────┐    │
│ │ ✓📶 │ │  🏊  │ │  💪  │    │
│ │ WiFi │ │Pisc. │ │ Gym  │    │
│ └──────┘ └──────┘ └──────┘    │
│                                 │
│ ┌──────┐ ┌──────┐ ┌──────┐    │
│ │  🛗  │ │ ✓🚗 │ │  🔒  │    │
│ │Ascen.│ │Park. │ │Segur.│    │
│ └──────┘ └──────┘ └──────┘    │
│                                 │
│ Todas las amenidades            │
│ ┌──────┐ ┌──────┐ ┌──────┐    │
│ │  ❄️  │ │  🔥  │ │  🧺  │    │
│ │A/C   │ │Calef.│ │Lavan.│    │
│ └──────┘ └──────┘ └──────┘    │
│                                 │
│ [...más amenidades...]          │
│                                 │
│ 3 seleccionadas                 │
│                                 │
│ [ ← Atrás ]  [ Siguiente → ]   │
└─────────────────────────────────┘
```

### **Paso 6: Fotos** 📸
```
┌─────────────────────────────────┐
│ ← Paso 6 de 8                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
├─────────────────────────────────┤
│                                 │
│ Agrega fotos de tu propiedad    │
│                                 │
│ ┌─────────────────────────┐    │
│ │                         │    │
│ │    [Foto Principal]     │    │
│ │         ⭐              │    │
│ │    [imagen.jpg]         │    │
│ │                         │    │
│ └─────────────────────────┘    │
│                                 │
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │[img]│ │[img]│ │[img]│        │
│ │ [×] │ │ [×] │ │ [×] │        │
│ └─────┘ └─────┘ └─────┘        │
│                                 │
│ ┌─────┐ ┌─────────────┐        │
│ │  +  │ │ Agregar más │        │
│ │foto │ │   fotos     │        │
│ └─────┘ └─────────────┘        │
│                                 │
│ 💡 Tips:                        │
│ • Mínimo 3 fotos                │
│ • Máximo 20 fotos               │
│ • Primera foto es la principal  │
│ • Buena iluminación             │
│                                 │
│ 4 / 20 fotos                    │
│                                 │
│ [ ← Atrás ]  [ Siguiente → ]   │
└─────────────────────────────────┘
```

### **Paso 7: Contacto (Opcional)** 📞
```
┌─────────────────────────────────┐
│ ← Paso 7 de 8                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
├─────────────────────────────────┤
│                                 │
│ Información de contacto         │
│                                 │
│ 💡 Esta propiedad usará tu      │
│    configuración global de      │
│    contacto por defecto.        │
│                                 │
│ ☐ Usar contacto personalizado   │
│   para esta propiedad           │
│                                 │
│ ┌─────────────────────────┐    │
│ │ [Expandido solo si ☑️]  │    │
│ │                         │    │
│ │ Nombre del contacto     │    │
│ │ ┌───────────────────┐   │    │
│ │ │ Juan Pérez        │   │    │
│ │ └───────────────────┘   │    │
│ │                         │    │
│ │ WhatsApp                │    │
│ │ ┌──────┬────────────┐   │    │
│ │ │ +51 ▾│ 987654321  │   │    │
│ │ └──────┴────────────┘   │    │
│ │                         │    │
│ │ Teléfono (opcional)     │    │
│ │ ┌──────┬────────────┐   │    │
│ │ │ +51 ▾│ 987654321  │   │    │
│ │ └──────┴────────────┘   │    │
│ └─────────────────────────┘    │
│                                 │
│ [ ← Atrás ]  [ Siguiente → ]   │
└─────────────────────────────────┘
```

### **Paso 8: Revisión Final** ✅
```
┌─────────────────────────────────┐
│ ← Paso 8 de 8                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
├─────────────────────────────────┤
│                                 │
│ Revisa tu publicación           │
│                                 │
│ ┌─────────────────────────┐    │
│ │ [Vista previa]          │    │
│ │ ┌─────────────────────┐ │    │
│ │ │     [Imagen]        │ │    │
│ │ └─────────────────────┘ │    │
│ │                         │    │
│ │ Depto moderno en...     │    │
│ │ 📍 Miraflores, Lima     │    │
│ │                         │    │
│ │ PEN 1,500/mes           │    │
│ │                         │    │
│ │ 🛏️ 2  🛁 1  🚗 1       │    │
│ │                         │    │
│ │ ✓ Amoblado              │    │
│ │ ✓ WiFi                  │    │
│ │ ✓ Piscina               │    │
│ └─────────────────────────┘    │
│                                 │
│ [ 👁️ Ver preview completo ]     │
│                                 │
│ Todo listo para publicar:       │
│ ✓ Información básica            │
│ ✓ Ubicación                     │
│ ✓ Detalles y precio             │
│ ✓ 4 fotos agregadas             │
│                                 │
│ [ ← Editar ]  [ 💾 Guardar ]   │
│            [ 🚀 Publicar ]      │
└─────────────────────────────────┘
```

---

## 🧩 Componentes Clave

### 1. **StepIndicator.tsx**
```tsx
interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    number: number;
    title: string;
    completed: boolean;
  }>;
}

// Design:
- Progress bar visual (filled/unfilled)
- Current step highlighted
- Completed steps with checkmark
- Can tap to jump (if previous steps valid)
```

### 2. **PropertyTypeSelector.tsx**
```tsx
interface PropertyTypeSelectorProps {
  selected: string;
  onChange: (type: string) => void;
}

// Design:
- Grid of cards (2-3 columns)
- Each card: Icon + Label
- Selected state with border/background
- Smooth animations
```

### 3. **LocationPicker.tsx**
```tsx
interface LocationPickerProps {
  department: string;
  province: string;
  district: string;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  onChange: (location: LocationData) => void;
}

// Features:
- Cascading dropdowns (dept → prov → dist)
- Address autocomplete
- Interactive map (tap to adjust pin)
- Current location button
- Geocoding on address change
```

### 4. **RoomCounter.tsx**
```tsx
interface RoomCounterProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

// Design:
- Large +/- buttons for easy tapping
- Number display in center
- Disable - at min, + at max
- Haptic feedback on tap
```

### 5. **AmenityGrid.tsx**
```tsx
interface AmenityGridProps {
  amenities: Array<{
    id: number;
    name: string;
    icon: string;
    category?: string;
  }>;
  selected: number[];
  onChange: (selected: number[]) => void;
}

// Features:
- Search bar
- Category filters
- Grid layout (3 columns)
- Selected with checkmark
- Show count of selected
```

### 6. **ImageUploader.tsx**
```tsx
interface ImageUploaderProps {
  images: Array<{ url: string; isMain: boolean }>;
  maxImages?: number;
  onChange: (images: ImageData[]) => void;
}

// Features:
- Camera or gallery selection
- Drag to reorder
- Set main image (star icon)
- Delete with confirmation
- Image preview
- Compress before upload
- Progress indicator
```

### 7. **PreviewCard.tsx**
```tsx
interface PreviewCardProps {
  listing: Partial<Listing>;
  onViewFull: () => void;
}

// Design:
- Compact card view
- Shows: image, title, location, price, key details
- Tap to expand full preview modal
- Matches actual PropertyCard design
```

---

## 🎭 Flujo de Navegación

```
┌─────────────────────────────────┐
│ Flujo de Creación de Propiedad  │
└─────────────────────────────────┘
           │
           ├─→ [Paso 1: Básico]
           │       │
           │       ├─ Seleccionar tipo
           │       ├─ Escribir título
           │       └─ Seleccionar operación
           │
           ├─→ [Paso 2: Ubicación]
           │       │
           │       ├─ Seleccionar depto/prov/dist
           │       ├─ Escribir dirección
           │       └─ Ajustar pin en mapa
           │
           ├─→ [Paso 3: Detalles]
           │       │
           │       ├─ Área (m²)
           │       ├─ Habitaciones
           │       ├─ Baños
           │       └─ Checkboxes
           │
           ├─→ [Paso 4: Precio]
           │       │
           │       ├─ Moneda
           │       ├─ Precio
           │       ├─ Depósito
           │       └─ Servicios incluidos
           │
           ├─→ [Paso 5: Amenidades]
           │       │
           │       ├─ Buscar
           │       └─ Seleccionar múltiples
           │
           ├─→ [Paso 6: Fotos]
           │       │
           │       ├─ Subir imágenes
           │       ├─ Marcar principal
           │       └─ Reordenar
           │
           ├─→ [Paso 7: Contacto]
           │       │
           │       ├─ Usar global (default)
           │       └─ O personalizar
           │
           └─→ [Paso 8: Revisión]
                   │
                   ├─ Preview
                   ├─ Guardar borrador
                   └─ Publicar
```

---

## ⚡ Características Especiales

### 1. **Auto-save (Drafts)**
```tsx
// Auto-save cada 30 segundos o al cambiar de paso
useEffect(() => {
  const timer = setInterval(() => {
    if (hasChanges) {
      saveDraft();
    }
  }, 30000);
  
  return () => clearInterval(timer);
}, [formData, hasChanges]);

// Save on step change
const handleNextStep = () => {
  saveDraft();
  setCurrentStep(prev => prev + 1);
};
```

### 2. **Validación Progresiva**
```tsx
// Validar cada paso antes de avanzar
const stepValidations = {
  1: () => formData.title && formData.property_type,
  2: () => formData.district && formData.address,
  3: () => formData.bedrooms && formData.bathrooms,
  4: () => formData.price > 0,
  5: () => true, // Amenidades opcionales
  6: () => formData.images.length >= 3,
  7: () => true, // Contacto opcional
  8: () => true, // Solo revisión
};

const canProceed = stepValidations[currentStep]();
```

### 3. **Smart Defaults**
```tsx
// Pre-llenar con datos inteligentes
const smartDefaults = {
  currency: 'PEN', // Basado en ubicación
  deposit_amount: formData.price, // Igual al precio
  rental_term: 'monthly', // Más común
  check_in_time: '14:00',
  check_out_time: '12:00',
};
```

### 4. **Ayuda Contextual**
```tsx
// Tooltips y ejemplos en cada campo
<InputWithHelp
  label="Título de la publicación"
  placeholder="Ej: Depto moderno en Miraflores"
  help="Escribe un título atractivo y descriptivo"
  examples={[
    "Acogedor depto 2 dorm en Miraflores",
    "Estudio amoblado cerca a universidades",
    "Casa familiar con jardín en Surco"
  ]}
/>
```

---

## 🎨 Estilos y Animaciones

### Step Transitions:
```css
/* Slide entre pasos */
.step-enter {
  transform: translateX(100%);
  opacity: 0;
}

.step-enter-active {
  transform: translateX(0);
  opacity: 1;
  transition: all 0.3s ease-out;
}

.step-exit {
  transform: translateX(0);
  opacity: 1;
}

.step-exit-active {
  transform: translateX(-100%);
  opacity: 0;
  transition: all 0.3s ease-out;
}
```

### Progress Bar:
```css
.progress-bar {
  transition: width 0.3s ease-out;
}

.progress-bar-fill {
  background: linear-gradient(90deg, #3B82F6, #8B5CF6);
  border-radius: 9999px;
}
```

---

## 📱 Consideraciones Móviles

### 1. **Keyboard Management**
- Auto-scroll al campo en focus
- Toolbar sobre teclado con "Siguiente" / "Listo"
- Numeric keyboard para números
- Email keyboard para email
- Phone keyboard para teléfonos

### 2. **Touch Optimization**
- Mínimo 44x44px tap targets
- Spacing adecuado entre elementos
- Swipe para navegar entre pasos
- Pull to refresh para recargar draft

### 3. **Performance**
- Lazy load de pasos
- Image compression antes de upload
- Debounce en autocomplete
- Virtual scrolling para amenidades largas

### 4. **Offline Support**
- Guardar drafts en IndexedDB
- Queue de uploads cuando vuelva online
- Indicador de estado de conexión

---

## ✅ Lista de Tareas

### Fase 1: Estructura
- [ ] Crear carpeta `mobile/listing/`
- [ ] MobileListingLayout
- [ ] StepIndicator
- [ ] NavigationButtons

### Fase 2: Pasos Básicos (1-4)
- [ ] Step1Basic
- [ ] Step2Location
- [ ] Step3Details
- [ ] Step4Price

### Fase 3: Pasos Avanzados (5-8)
- [ ] Step5Features
- [ ] Step6Images
- [ ] Step7Contact
- [ ] Step8Review

### Fase 4: Widgets
- [ ] PropertyTypeSelector
- [ ] LocationPicker con mapa móvil
- [ ] RoomCounter
- [ ] PriceInput
- [ ] AmenityGrid
- [ ] ImageUploader optimizado

### Fase 5: Funcionalidades
- [ ] Auto-save drafts
- [ ] Validación progresiva
- [ ] Preview modal
- [ ] Exit confirmation

### Fase 6: Optimizaciones
- [ ] Image compression
- [ ] Offline support
- [ ] Performance optimization
- [ ] Testing en dispositivos reales

---

## 🎯 Métricas de Éxito

1. **Tiempo de creación** < 5 minutos
2. **Tasa de completitud** > 70%
3. **Abandono por paso** < 10%
4. **Fotos subidas promedio** >= 5
5. **Mobile completion rate** >= Desktop

---

## 📝 Notas de Implementación

### Prioridades:
1. **Must Have**: Pasos 1-6 (básico, ubicación, detalles, precio, amenidades, fotos)
2. **Should Have**: Paso 7 (contacto personalizado)
3. **Nice to Have**: Paso 8 avanzado (preview completo)

### Integraciones:
- Google Maps API para mapa interactivo
- Image compression con `browser-image-compression`
- Geocoding con API propia o Google
- Auto-save con IndexedDB

### Optimizaciones Futuras:
- AI para generar título y descripción
- Sugerencias de precio basadas en ubicación
- Templates de propiedades similares
- Análisis de completitud con tips
