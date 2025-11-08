# 📱 Vista Móvil - Bottom Sheet Architecture

## 📦 Componentes Creados

### 1. PropertyCardMini.tsx
**Propósito:** Cards compactas optimizadas para móvil

**Props:**
- `property: Property` - Datos de la propiedad
- `onClick: (id: string) => void` - Handler de click
- `isHighlighted?: boolean` - Si está resaltada (hover sincronizado)

**Características:**
- Diseño horizontal: Imagen (24x24) + Info
- Badge de verificado
- Rating con estrella
- Características: habitaciones, baños, área
- Precio destacado
- Efecto de active: `scale-[0.98]`
- Altura fija: 96px (24 en Tailwind)

---

### 2. MapFullscreen.tsx
**Propósito:** Mapa interactivo de fondo fullscreen

**Props:**
- `listings: PropertyResponse[]` - Propiedades a mostrar
- `onMarkerClick?: (propertyId: string) => void` - Click en marcador
- `hoveredPropertyId?: string | null` - ID de propiedad hover
- `centerOnProperty?: string | null` - Centrar mapa en propiedad
- `className?: string` - Clases adicionales

**Características:**
- Leaflet + OpenStreetMap
- Marcadores azules (hover → amarillo)
- Geolocalización con botón flotante
- Círculo de 10km
- Sin attribution (optimizado para móvil)
- Auto-centrado en propiedad seleccionada
- Popups simplificados

---

### 3. PropertyBottomSheet.tsx
**Propósito:** Sheet arrastrable con 3 estados

**Props:**
- `properties: Property[]` - Lista de propiedades
- `loading: boolean` - Estado de carga
- `onPropertyClick: (id: string) => void` - Click en propiedad
- `onPropertyHover: (id: string | null) => void` - Hover en propiedad
- `hoveredPropertyId: string | null` - ID hover actual
- `onFilterClick: () => void` - Abrir filtros
- `activeFiltersCount: number` - Contador de filtros activos

**Estados:**
- `peek` - 15vh - Solo header visible
- `half` - 50vh - Header + 2-3 cards
- `full` - 90vh - Casi fullscreen

**Gestos soportados:**
- **Touch drag** (móvil): Arrastrar para cambiar estado
- **Mouse drag** (testing desktop): Mismo comportamiento
- **Threshold:** 50px mínimo para cambiar estado

**Características:**
- Handle visual para arrastrar (barra gris)
- Transiciones suaves: `duration-300 ease-out`
- Header fijo con contador y botón filtros
- Lista scrollable independiente
- Badge de filtros activos
- Estados vacío y loading

---

### 4. SearchMobileView.tsx
**Propósito:** Orquestador principal de la vista móvil

**Props:**
- `properties: Property[]` - Propiedades convertidas
- `apiProperties: PropertyResponse[]` - Propiedades API (para mapa)
- `loading: boolean` - Estado de carga
- `onPropertyClick: (id: string) => void` - Click en propiedad
- `onFilterChange: (filters: SearchFilters) => void` - Cambio de filtros
- `currentFilters: SearchFilters` - Filtros activos

**Estados internos:**
- `hoveredPropertyId` - Sincronización hover
- `centerOnProperty` - Centrar mapa
- `showFilters` - Modal de filtros
- `sheetState` - Estado del bottom sheet ('peek' | 'half' | 'full')

**Flujo:**
1. Click en card → Centra mapa + Abre modal
2. Click en marcador → Resalta card + Auto-scroll
3. Click en filtros → Abre modal fullscreen
4. Aplicar filtros → Cierra modal + Actualiza
5. Cambio de estado sheet → Oculta/muestra controles del mapa

**Layout:**
```
┌─────────────────────────┐
│                         │
│   MapFullscreen         │ ← z-index: 0
│   (absolute inset-0)    │
│                         │
├─────────────────────────┤
│ PropertyBottomSheet     │ ← z-index: 900
│ (fixed bottom)          │
└─────────────────────────┘

Modal de filtros (cuando activo):
┌─────────────────────────┐
│ [X] Filtros             │ ← z-index: 1000
│ ─────────────────────── │
│                         │
│ SearchSidebar content   │
│                         │
│ ─────────────────────── │
│ [Ver N propiedades]     │
└─────────────────────────┘
```

---

### 5. SearchFiltersMobile.tsx ✨ NUEVO
**Propósito:** Filtros optimizados para móvil con UX táctil

**Props:**
- `onFilterChange: (filters: SearchFilters) => void` - Callback al aplicar
- `isLoading: boolean` - Estado de búsqueda
- `initialFilters?: SearchFilters` - Filtros iniciales
- `onClose: () => void` - Cerrar modal
- `propertiesCount: number` - Contador para botón

**Características:**
- **Secciones colapsables** con chevron icons
- **Rangos rápidos de precio** (< S/ 500, S/ 500-1000, etc.)
- **Grid de tipos** con emojis visuales (🏢 🏠 🚪 🛋️)
- **Botones de números** para habitaciones/baños (1, 2, 3, 4, 5+)
- **Checkboxes grandes** para amenities con emojis
- **Header sticky** con contador de filtros activos
- **Footer sticky** con botón "Ver X propiedades"
- **Botón "Limpiar filtros"** solo si hay filtros activos

**Secciones:**
1. **Ubicación** - Input de texto con placeholder
2. **Precio** - Min/Max + Rangos rápidos
3. **Tipo de propiedad** - Grid 2x2 con emojis
4. **Habitaciones y Baños** - Botones numéricos
5. **Comodidades** - Lista de checkboxes con emojis

**UX Mobile:**
- Touch-friendly targets (min 44x44px)
- Espaciado generoso (padding 12-16px)
- Feedback visual inmediato (bg-blue-50 en selección)
- Sin scrolling horizontal
- Transiciones suaves

---

## 🔄 Flujo de Integración

### search.tsx - Punto de entrada

```typescript
// 1. Detecta si es móvil
const [isMobile, setIsMobile] = useState(false)

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768)
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)
}, [])

// 2. Renderizado condicional
{isMobile ? (
  <SearchMobileView {...props} />
) : (
  // Vista desktop existente
)}
```

### Breakpoint: 768px
- **< 768px** → Vista móvil (Bottom Sheet)
- **≥ 768px** → Vista desktop (Sidebar + Mapa + Lista)

---

## 🎯 Sincronización de Estados

### Hover sincronizado (Mapa ↔ Lista)

**Lista → Mapa:**
```typescript
// PropertyBottomSheet
<div onMouseEnter={() => onPropertyHover(property.id)}>
  <PropertyCardMini isHighlighted={hoveredPropertyId === property.id} />
</div>

// SearchMobileView
setHoveredPropertyId(id)

// MapFullscreen
hoveredPropertyId={hoveredPropertyId}
// Actualiza ícono del marcador
```

**Mapa → Lista:**
```typescript
// MapFullscreen
marker.on('click', () => onMarkerClick(listing.id))

// SearchMobileView
const handleMarkerClick = (id: string) => {
  setHoveredPropertyId(id)
  setCenterOnProperty(id)
  
  // Auto-scroll a la card
  const cardElement = document.getElementById(`property-card-${id}`)
  cardElement?.scrollIntoView({ behavior: 'smooth' })
}
```

---

## 📐 Dimensiones y Espaciado

### PropertyCardMini
- Altura: 96px (24 en Tailwind)
- Imagen: 96x96px (1:1 ratio)
- Gap entre cards: 12px (space-y-3)
- Padding interno: 12px (p-3)

### PropertyBottomSheet
- **Peek:** 15vh (~120px en iPhone)
- **Half:** 50vh (~400px)
- **Full:** 90vh (~720px)
- Handle: 48px x 6px
- Header: ~60px
- Content: `calc(100% - 80px)`

### MapFullscreen
- Geolocation button: 48x48px
- Position: `top-4 right-4`
- Circle radius: 10km (10000 metros)

---

## 🎨 Transiciones y Animaciones

### Bottom Sheet
```css
transition-all duration-300 ease-out
```
- Cambio de altura al arrastrar
- Suavidad en transiciones de estado

### PropertyCardMini
```css
active:scale-[0.98]
transition-all duration-150
```
- Feedback táctil inmediato

### Marcadores del mapa
```css
transition-transform duration-200
scale-125 (hover)
```
- Hover: Azul → Amarillo + Escala

---

## 🔧 Optimizaciones Implementadas

### 1. **Z-Index Hierarchy (Actualizado)**
```
Base layer:         z-0   (Mapa de fondo)
Bottom Sheet:       z-10  (PropertyBottomSheet)
Filter Modal:       z-40  (Modal de filtros móvil)
Property Modal:     z-9999 (Modal de información de propiedad)
Property Backdrop:  z-9998 (Overlay oscuro del modal)
```
**Razón:** PropertyModal debe estar siempre por encima de todos los elementos móviles para evitar que se tape

### 2. **Header Compartido**
```typescript
// SearchMobileView ahora incluye Header
<>
  <Header />
  <div style={{ height: 'calc(100vh - 96px)' }}>
    {/* Contenido móvil */}
  </div>
</>
```
**Razón:** Mantener consistencia visual entre desktop y móvil

### 3. **Lazy Loading**
- Mapa se carga solo cuando `isMapReady = true`
- Marcadores se actualizan con `useEffect` optimizado

### 4. **Touch Performance**
```typescript
style={{ touchAction: 'none' }}
```
- Previene scroll del body mientras se arrastra el sheet

### 5. **Debouncing implícito**
- Threshold de 50px para cambiar estados
- Evita cambios accidentales

### 6. **Memory Management**
```typescript
return () => {
  if (mapInstanceRef.current) {
    mapInstanceRef.current.remove()
  }
}
```
- Limpieza de mapa en unmount

### 7. **Conditional Rendering**
```typescript
{isMobile ? <MobileView /> : <DesktopView />}
```
- Solo renderiza la vista necesaria

---

## 📱 Compatibilidad de Gestos

| Gesto | Acción | Componente |
|-------|--------|-----------|
| **Drag vertical** | Cambiar estado sheet | PropertyBottomSheet |
| **Tap en card** | Abrir modal + centrar mapa | PropertyCardMini |
| **Tap en marcador** | Resaltar card + scroll | MapFullscreen |
| **Tap fuera** | N/A (sin cerrar sheet) | - |
| **Pinch zoom** | Zoom mapa | MapFullscreen |
| **Pan** | Mover mapa | MapFullscreen |

---

## 🐛 Bugs Corregidos

### ❌ Problema 1: Header eliminado en vista móvil
**Causa:** SearchMobileView no incluía el componente Header
**Solución:** 
```typescript
// SearchMobileView.tsx
return (
  <>
    <Header />
    <div style={{ height: 'calc(100vh - 96px)' }}>
      {/* Contenido */}
    </div>
  </>
)
```

### ❌ Problema 2: Modal de propiedad tapado por otros elementos
**Causa:** PropertyModal tenía `z-50` mientras el modal de filtros tenía `z-[1000]`
**Solución:**
```typescript
// PropertyModal.tsx
<div className="fixed inset-0 bg-black/50 z-[9998]" /> // Backdrop
<div className="fixed inset-0 z-[9999] overflow-y-auto">  // Modal
```

**Jerarquía final de z-index:**
- Base: `z-0` (Mapa)
- Sheet: `z-10` (Bottom sheet)
- Filtros: `z-40` (Modal de filtros)
- Propiedad: `z-9999` (Modal de información)

---

## 🧪 Testing Checklist

### Funcionalidad
- [ ] Sheet se arrastra en móvil (touch)
- [ ] Sheet se arrastra en desktop (mouse)
- [ ] 3 estados funcionan: peek, half, full
- [ ] Threshold de 50px respetado
- [ ] Click en card abre modal
- [ ] Click en marcador resalta card
- [ ] Auto-scroll funciona
- [ ] Geolocalización funciona
- [ ] Hover sincronizado (desktop)
- [ ] Filtros abren modal
- [ ] Contador de filtros actualiza
- [ ] Loading states funcionan
- [ ] Empty state muestra mensaje

### Performance
- [ ] Transiciones son suaves (60fps)
- [ ] No hay lag al arrastrar
- [ ] Mapa no se recarga innecesariamente
- [ ] Scroll en lista es fluido
- [ ] Sin memory leaks

### Responsive
- [ ] Vista móvil en < 768px
- [ ] Vista desktop en ≥ 768px
- [ ] Resize funciona correctamente
- [ ] Orientación portrait/landscape

---

## 🚀 Próximas Mejoras

### Corto plazo
1. Animaciones de entrada/salida del sheet
2. Swipe horizontal entre cards
3. Clusters de marcadores (muchas propiedades)
4. Persistir estado del sheet en localStorage

### Mediano plazo
1. Skeleton loaders más detallados
2. Virtual scrolling para listas grandes
3. Prefetch de imágenes
4. Service Worker para offline

### Largo plazo
1. Gestos avanzados (double tap, long press)
2. Vibración háptica (si es nativo)
3. Dark mode
4. Animaciones personalizadas

---

## 📚 Dependencias

### Existentes
- `leaflet` - Mapa interactivo
- `@heroicons/react` - Iconos
- `next` - Framework
- `react` - UI library

### Posibles futuras
- `react-spring-bottom-sheet` - Bottom sheet nativo más robusto
- `framer-motion` - Animaciones avanzadas
- `react-virtualized` - Virtual scrolling

---

## 💡 Notas de Implementación

### Por qué Bottom Sheet vs Tabs
- ✅ Mejor UX (Google Maps, Uber lo usan)
- ✅ Máxima flexibilidad
- ✅ Aprovecha toda la pantalla
- ✅ Gestos naturales en móvil

### Por qué 3 estados vs 2
- **Peek:** Vista rápida sin interrupción del mapa
- **Half:** Balance entre mapa y lista
- **Full:** Enfoque total en comparar propiedades

### Por qué threshold de 50px
- Balance entre responsividad y accidentes
- Estándar de la industria (iOS, Android)

---

## 🎓 Patrones Usados

1. **Render Props** - Pasando callbacks entre componentes
2. **Controlled Components** - Estados manejados por padre
3. **Compound Components** - Sheet + Handle + List
4. **Conditional Rendering** - Mobile vs Desktop
5. **Custom Hooks (potencial)** - useBottomSheet, useGestures

---

**Autor:** GitHub Copilot
**Fecha:** Noviembre 2025
**Versión:** 1.0
