# Mobile Listing Components - Vista de Crear/Editar Propiedad

## 📱 Descripción General

Sistema completo de wizard de 8 pasos para crear y editar propiedades en vista móvil, con auto-guardado, validación progresiva y experiencia de usuario optimizada.

## 🏗️ Arquitectura

### Estructura de Archivos

```
components/dashboard/mobile/listing/
├── MobileListingPage.tsx       # Controlador principal del wizard
├── MobileListingLayout.tsx     # Layout con header y progreso
├── StepIndicator.tsx           # Indicador visual de pasos
├── NavigationButtons.tsx       # Botones Anterior/Siguiente
├── index.ts                    # Barrel exports
│
├── steps/                      # 8 pasos del wizard
│   ├── Step1Basic.tsx          # Tipo de propiedad y operación
│   ├── Step2Location.tsx       # Dirección y ubicación
│   ├── Step3Details.tsx        # Título, descripción, habitaciones
│   ├── Step4Price.tsx          # Precio y moneda
│   ├── Step5Features.tsx       # Amenidades y características
│   ├── Step6Images.tsx         # Carga de fotos
│   ├── Step7Contact.tsx        # Información de contacto
│   └── Step8Review.tsx         # Revisión y publicación
│
└── widgets/                    # Componentes reutilizables
    ├── PropertyTypeSelector.tsx
    ├── RoomCounter.tsx
    ├── PriceInput.tsx
    ├── AmenityGrid.tsx
    └── ImageUploader.tsx
```

## 🔄 Flujo del Wizard

### Paso 1: Información Básica
- **Tipo de propiedad**: Departamento, Casa, Cuarto, Local
- **Tipo de operación**: Alquiler o Venta
- **Validación**: Ambos campos requeridos

### Paso 2: Ubicación
- **Dirección completa**
- **Distrito y Ciudad**
- **Mapa interactivo** (MapPicker - próximamente)
- **Coordenadas** (opcional)
- **Validación**: Dirección, distrito y ciudad requeridos

### Paso 3: Detalles
- **Título del anuncio** (max 100 caracteres)
- **Descripción** (max 500 caracteres)
- **Número de dormitorios** (0-10)
- **Número de baños** (1-10)
- **Área en m²**
- **Validación**: Título mínimo 10 caracteres

### Paso 4: Precio
- **Precio** (formato moneda)
- **Moneda**: S/ Soles o $ Dólares
- **Incluye servicios** (checkbox)
- **Validación**: Precio > 0

### Paso 5: Características
- **Amenidades**: WiFi, TV, Calefacción, Amoblado
- **Amoblado** (toggle)
- **Estacionamiento** (toggle)
- **Mascotas permitidas** (toggle)
- **Validación**: Opcional

### Paso 6: Fotos
- **Carga de imágenes** (máx 10)
- **Primera imagen = portada**
- **Botón eliminar por imagen**
- **Tips de fotografía**
- **Validación**: Mínimo 1 foto

### Paso 7: Contacto
- **Nombre de contacto**
- **Teléfono/WhatsApp**
- **Email**
- **Método preferido**: WhatsApp, Llamada o Email
- **Validación**: Al menos teléfono o email

### Paso 8: Revisión
- **Preview de la publicación**
- **Validación completa**
- **Términos y condiciones**
- **Botón "Publicar propiedad"**

## 🎨 Componentes Principales

### MobileListingPage

Controlador principal que maneja:

```typescript
interface ListingData {
  // Step 1
  propertyType: string;
  operationType: 'alquiler' | 'venta';
  
  // Step 2
  address: string;
  district: string;
  city: string;
  coordinates?: { lat: number; lng: number };
  
  // Step 3
  title: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  
  // Step 4
  price: number;
  currency: string;
  includesUtilities: boolean;
  
  // Step 5
  amenities: string[];
  furnished: boolean;
  parking: boolean;
  pets: boolean;
  
  // Step 6
  images: File[];
  
  // Step 7
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  preferredContact: 'whatsapp' | 'phone' | 'email';
}
```

**Características**:
- ✅ Auto-guardado cada 1 segundo (debounce)
- ✅ Recuperación de borradores desde localStorage
- ✅ Validación progresiva por paso
- ✅ Navegación condicional (deshabilitada si paso inválido)
- ✅ Modal de éxito con redirección
- ✅ Scroll al top en cambio de paso

### MobileListingLayout

Layout consistente con:
- Header principal (top-16)
- Sub-header con título y paso actual
- Barra de progreso visual
- Botón "X" con confirmación
- Botón "Atrás" condicional

### StepIndicator

Indicador visual de pasos:
- ✅ Verde con check = completado
- 🔵 Azul = actual
- ⚪ Gris = pendiente
- Líneas conectoras entre pasos
- Títulos debajo de cada círculo

### NavigationButtons

Botones de navegación:
- "Anterior" (oculto en paso 1)
- "Siguiente" (pasos 1-7)
- "Publicar propiedad" (paso 8)
- Estados: loading, disabled
- Fixed bottom con pb-safe

## 🔧 Widgets Reutilizables

### PropertyTypeSelector
```tsx
<PropertyTypeSelector
  value={propertyType}
  onChange={(value) => onChange({ propertyType: value })}
/>
```
- Grid 2x2
- Iconos de Heroicons
- Estado seleccionado con checkmark

### RoomCounter
```tsx
<RoomCounter
  label="Dormitorios"
  value={bedrooms}
  onChange={(value) => onChange({ bedrooms: value })}
  icon={<HomeIcon />}
  min={0}
  max={10}
/>
```
- Botones +/- circulares
- Constraints min/max
- Disabled al límite

### PriceInput
```tsx
<PriceInput
  value={price}
  onChange={(value) => onChange({ price: value })}
  currency="S/"
  label="Precio"
/>
```
- Formato de moneda (es-PE)
- Símbolo a la izquierda
- Input mode="decimal"

### AmenityGrid
```tsx
<AmenityGrid
  selectedAmenities={amenities}
  onChange={(amenities) => onChange({ amenities })}
/>
```
- Grid 2 columnas
- Toggle selection
- Highlight azul seleccionado

### ImageUploader
```tsx
<ImageUploader
  images={images}
  onChange={(images) => onChange({ images })}
  maxImages={10}
/>
```
- Grid 3 columnas
- Preview con URL.createObjectURL
- Botón eliminar por imagen
- Límite 10 imágenes

## 💾 Persistencia

### LocalStorage

```typescript
const DRAFT_KEY = 'listing_draft';

// Guardar
const { images, ...dataToSave } = data;
localStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave));

// Recuperar
const savedDraft = localStorage.getItem(DRAFT_KEY);
const parsedData = JSON.parse(savedDraft);
```

**Nota**: Las imágenes (File objects) NO se guardan en localStorage.

### Auto-guardado

```typescript
useEffect(() => {
  const saveTimer = setTimeout(() => {
    // Guardar después de 1s sin cambios
  }, 1000);
  
  return () => clearTimeout(saveTimer);
}, [data]);
```

## ✅ Validación

### Validación por Paso

```typescript
const isStepValid = (step: number): boolean => {
  switch (step) {
    case 1: return !!propertyType && !!operationType;
    case 2: return !!address && !!district && !!city;
    case 3: return !!title && title.length >= 10;
    case 4: return price > 0;
    case 5: return true; // Opcional
    case 6: return images.length > 0;
    case 7: return !!contactPhone || !!contactEmail;
    case 8: return true;
  }
};
```

### Botón "Siguiente" Deshabilitado

```tsx
<NavigationButtons
  isNextDisabled={!isStepValid(currentStep)}
/>
```

## 🎯 Integración

### pages/dashboard/create-listing.tsx

```tsx
import { useIsMobile } from '../../lib/hooks/useIsMobile';
import { MobileListingPage } from '../../components/dashboard/mobile/listing';

export default function CreateListingPage() {
  const isMobile = useIsMobile(768);
  
  // Mobile view
  if (isMobile) {
    return (
      <>
        <Head>
          <title>Crear Propiedad - EasyRent</title>
        </Head>
        <Header />
        <MobileListingPage />
      </>
    );
  }
  
  // Desktop view (formulario largo existente)
  return (/* ... */);
}
```

## 🚀 Publicación

### handlePublish

```typescript
const handlePublish = async () => {
  try {
    setIsLoading(true);
    
    // Crear FormData
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'images') {
        data.images.forEach(img => formData.append('images', img));
      } else {
        formData.append(key, data[key]);
      }
    });
    
    // API call
    await createListing(formData);
    
    // Limpiar borrador
    localStorage.removeItem(DRAFT_KEY);
    
    // Mostrar éxito
    setShowSuccess(true);
    
    // Redirigir
    setTimeout(() => router.push('/dashboard'), 2000);
  } catch (error) {
    console.error('Error:', error);
    alert('Error al publicar');
  } finally {
    setIsLoading(false);
  }
};
```

## 📐 Diseño Responsive

### Breakpoints

```typescript
const isMobile = useIsMobile(768); // < 768px = mobile
```

### Z-Index Hierarchy

```
z-[70] - Modal de éxito
z-[60] - Modales (ej: confirmaciones)
z-50   - Header principal
z-40   - Sub-header del wizard
z-0    - Contenido normal
```

### Safe Areas

```tsx
<div className="pb-safe"> {/* Bottom safe area */}
```

## 🎨 Estilos

### Paleta de Colores

- **Primario**: Blue-600 (#2563EB)
- **Éxito**: Green-600 (#16A34A)
- **Advertencia**: Yellow-600 (#CA8A04)
- **Gris**: Gray-50 a Gray-900

### Animaciones

```tsx
active:scale-95       // Botones
active:scale-98       // Botones grandes
transition-all        // Transiciones suaves
```

## 📱 UX Móvil

### Principios Aplicados

1. **Progressive Disclosure**: 1 paso a la vez
2. **Visual Feedback**: Animaciones, estados disabled
3. **Error Prevention**: Validación antes de avanzar
4. **Recovery**: Auto-guardado y borradores
5. **Consistency**: Layout y navegación predecible

### Touch Targets

- Botones: min 44x44px
- Input fields: h-12 (48px)
- Toggle switches: 44px de ancho

## 🔜 Mejoras Futuras

### Pendientes

- [ ] Integración real con API de listings
- [ ] MapPicker dinámico en Step2
- [ ] Compresión de imágenes antes de upload
- [ ] Drag-to-reorder en galería de fotos
- [ ] Soporte para modo edición
- [ ] Validación de formatos de email/teléfono
- [ ] Animaciones entre pasos (slide transitions)
- [ ] Progress save indicator
- [ ] Offline support con Service Worker

### Optimizaciones

- [ ] Lazy loading de steps
- [ ] Image optimization (WebP, resize)
- [ ] Bundle splitting
- [ ] Prefetch next step

## 📝 Notas de Desarrollo

### Estado Actual

✅ **Completado**:
- 8 pasos del wizard
- 5 widgets reutilizables
- Layout y navegación
- Auto-guardado y validación
- Integración en create-listing.tsx

⏳ **En Progreso**:
- Testing en dispositivos reales
- Integración con API backend

### Testing

```bash
# Verificar en móvil
1. Abrir navegador en modo responsive
2. Ajustar a 375px de ancho (iPhone SE)
3. Navegar a /dashboard/create-listing
4. Completar wizard paso a paso
5. Verificar auto-guardado
6. Verificar validaciones
7. Probar publicación
```

## 🤝 Contribución

### Guía de Estilo

- TypeScript strict mode
- Functional components con hooks
- Props tipadas con interfaces
- Comentarios JSDoc en componentes públicos
- Nombres descriptivos en español para UI

### Commit Messages

```
feat: nuevo paso de características
fix: validación de precio
refactor: extraer lógica de auto-guardado
docs: actualizar README
```

## 📄 Licencia

Parte del proyecto EasyRent - Todos los derechos reservados
