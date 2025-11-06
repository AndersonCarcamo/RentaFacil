# 🧩 Components - Arquitectura Organizada

Componentes React organizados por dominio y funcionalidad para mejor mantenibilidad y escalabilidad.

## 📁 Estructura

```
components/
├── common/          # Layout y estructura base
├── forms/           # Formularios y entradas
├── property/        # Componentes de propiedades
├── maps/            # Mapas y ubicación
├── search/          # Búsqueda y filtros
├── ui/              # Componentes UI base
├── profile/         # Perfil de usuario
├── verification/    # Verificación de identidad
└── index.ts         # Exportación central
```

## 📦 Categorías de Componentes

### 🏗️ Common (4 componentes)
**Propósito**: Estructura y layout base de la aplicación

- `Layout.tsx` - Layout principal con header y footer
- `Header.tsx` - Barra de navegación superior
- `Footer.tsx` - Pie de página
- `ErrorBoundary.tsx` - Manejo de errores de React

**Uso**:
```typescript
import { Layout, Header, Footer, ErrorBoundary } from '@/components/common';
// O desde el índice principal:
import { Layout, Header } from '@/components';
```

---

### 📝 Forms (5 componentes)
**Propósito**: Componentes de formulario e inputs

- `AutocompleteInput.tsx` - Input con autocompletado
- `ImageUploader.tsx` - Cargador de imágenes con preview
- `SearchForm.tsx` - Formulario principal de búsqueda (home)
- `SearchFormCompact.tsx` - Versión compacta del formulario
- `SearchFormExtended.tsx` - Versión extendida con más opciones

**Uso**:
```typescript
import { AutocompleteInput, ImageUploader } from '@/components/forms';
```

---

### 🏠 Property (5 componentes)
**Propósito**: Visualización y gestión de propiedades

- `PropertyCard.tsx` - Card de propiedad (vertical, para grid)
- `PropertyCardHorizontal.tsx` - Card horizontal (para listas)
- `PropertyContactButtons.tsx` - Botones de contacto (WhatsApp, Email, Tel)
- `PropertyList.tsx` - Lista de propiedades
- `PropertyModal.tsx` - Modal con detalles completos de propiedad

**Uso**:
```typescript
import { PropertyCard, PropertyModal } from '@/components/property';
```

---

### 🗺️ Maps (4 componentes)
**Propósito**: Visualización de mapas y ubicación

- `MapView.tsx` - Mapa interactivo con marcadores
- `MapPicker.tsx` - Selector de ubicación en mapa
- `MapSearch.tsx` - Búsqueda de ubicación con mapa
- `PropertyMap.tsx` - Mapa específico para detalle de propiedad

**Uso**:
```typescript
import { MapView, MapPicker } from '@/components/maps';
```

---

### 🔍 Search (3 componentes)
**Propósito**: Búsqueda y filtrado de propiedades

- `SearchSidebar.tsx` - Barra lateral con filtros (desktop)
- `SearchFiltersSheet.tsx` - Sheet de filtros (mobile/tablet)
- `MobileFiltersModal.tsx` - Modal wizard de filtros para home (mobile)

**Diferencias**:
- `MobileFiltersModal` → Home page, wizard paso a paso
- `SearchFiltersSheet` → Search results, filtros rápidos

**Uso**:
```typescript
import { SearchSidebar, SearchFiltersSheet } from '@/components/search';
```

---

### 🎨 UI (3 componentes)
**Propósito**: Componentes base reutilizables en toda la app

- `Button.tsx` - Botón con variantes (primary, secondary, outline, ghost)
- `BottomSheet.tsx` - Sheet arrastreable desde abajo (mobile)
- `ImageViewer.tsx` - Visor de imágenes con zoom y navegación

**Uso**:
```typescript
import { Button, BottomSheet } from '@/components/ui';
```

---

### 👤 Profile (1 componente)
**Propósito**: Componentes del perfil de usuario

- `ProfileSidebar.tsx` - Sidebar de navegación del perfil

**Uso**:
```typescript
import { ProfileSidebar } from '@/components/profile';
```

---

### ✅ Verification (2 componentes)
**Propósito**: Verificación de identidad y propiedades

- `VerificationModal.tsx` - Modal del flujo de verificación
- `DNICameraCapture.tsx` - Captura de DNI con cámara

**Uso**:
```typescript
import { VerificationModal, DNICameraCapture } from '@/components/verification';
```

---

## 🎯 Guías de Uso

### Importación Recomendada

**Opción 1 - Importación específica (recomendada)**:
```typescript
import { PropertyCard } from '@/components/property';
import { Button } from '@/components/ui';
import { MapView } from '@/components/maps';
```

**Opción 2 - Importación desde índice principal**:
```typescript
import { PropertyCard, Button, MapView } from '@/components';
```

**Opción 3 - Importación directa (evitar en producción)**:
```typescript
import PropertyCard from '@/components/property/PropertyCard';
```

### Crear Nuevos Componentes

1. **Identifica la categoría correcta**:
   - ¿Es reutilizable en toda la app? → `ui/`
   - ¿Es específico de una funcionalidad? → Carpeta correspondiente
   - ¿Es nuevo dominio? → Crea nueva carpeta

2. **Crea el componente**:
   ```typescript
   // components/property/PropertyBadge.tsx
   export default function PropertyBadge({ ... }) {
     return <div>...</div>;
   }
   ```

3. **Agrégalo al index de la categoría**:
   ```typescript
   // components/property/index.ts
   export { default as PropertyBadge } from './PropertyBadge';
   ```

4. **Documenta en este README**

### Buenas Prácticas

✅ **DO**:
- Usa TypeScript con interfaces tipadas
- Exporta como `default` desde el archivo
- Re-exporta con nombre desde `index.ts`
- Documenta props complejas con JSDoc
- Mantén componentes enfocados (Single Responsibility)

❌ **DON'T**:
- No mezcles lógica de diferentes dominios
- No hagas componentes gigantes (>300 líneas)
- No importes entre categorías innecesariamente
- No hagas componentes demasiado acoplados

---

## 📊 Estadísticas

- **Total de componentes**: 27
- **Categorías**: 8
- **Componentes con index**: 8
- **Promedio por categoría**: ~3.4 componentes

### Distribución

| Categoría | Componentes | Porcentaje |
|-----------|-------------|------------|
| Forms | 5 | 18.5% |
| Property | 5 | 18.5% |
| Common | 4 | 14.8% |
| Maps | 4 | 14.8% |
| Search | 3 | 11.1% |
| UI | 3 | 11.1% |
| Verification | 2 | 7.4% |
| Profile | 1 | 3.7% |

---

## 🔄 Migración de Imports

Si tienes código existente con imports antiguos, actualízalos así:

### Antes (estructura plana):
```typescript
import Layout from '../components/Layout';
import Header from '../components/Header';
import PropertyCard from '../components/PropertyCard';
import Button from '../components/ui/Button';
import MapView from '../components/MapView';
```

### Después (estructura organizada):
```typescript
import { Layout, Header } from '@/components/common';
import { PropertyCard } from '@/components/property';
import { Button } from '@/components/ui';
import { MapView } from '@/components/maps';

// O más simple:
import { Layout, Header, PropertyCard, Button, MapView } from '@/components';
```

---

## 🚀 Próximas Mejoras

- [ ] Agregar Storybook para documentación visual
- [ ] Tests unitarios para cada componente
- [ ] Agregar carpeta `layouts/` para layouts específicos
- [ ] Crear carpeta `charts/` para componentes de gráficos
- [ ] Documentar props con TypeDoc

---

## 📚 Recursos

- [React Component Patterns](https://reactpatterns.com/)
- [Component Folder Structure](https://react-file-structure.surge.sh/)
- [Atomic Design](https://atomicdesign.bradfrost.com/)

---

**Última actualización**: Noviembre 2, 2025
**Mantenido por**: Equipo de Desarrollo RENTA fácil
