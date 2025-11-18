# Componentes Móviles del Dashboard

Esta carpeta contiene los componentes optimizados para la vista móvil del dashboard de EasyRent.

## 🏗️ Arquitectura

Los componentes móviles están diseñados con un enfoque **mobile-first** y utilizan patrones de UX específicos para dispositivos móviles:

- **Bottom Navigation**: Navegación inferior fija más accesible en móviles
- **Cards**: Tarjetas en lugar de tablas para mejor visualización
- **Drawers**: Paneles deslizables para filtros y acciones
- **FAB**: Floating Action Button para acciones principales
- **Modales nativos**: Modales optimizados para pantallas pequeñas

## 📱 Componentes

### Layout (`MobileLayout.tsx`)

Componente contenedor principal que estructura la vista móvil.

```tsx
import { MobileLayout } from '@/components/dashboard/mobile';

<MobileLayout 
  activeTab="overview"
  onTabChange={(tab) => setActiveTab(tab)}
  userName="John Doe"
>
  {/* Contenido del dashboard */}
</MobileLayout>
```

**Props:**
- `activeTab`: Tab activo actual ('overview' | 'properties' | 'analytics' | 'verification')
- `onTabChange`: Callback cuando cambia el tab
- `userName`: Nombre del usuario para el header
- `children`: Contenido del dashboard

**Estructura:**
- Header fijo en la parte superior (z-40)
- Área de contenido con padding (pt-16 pb-20)
- Bottom navigation fija en la parte inferior

---

### Header (`MobileHeader.tsx`)

Header compacto con acciones principales.

```tsx
import { MobileHeader } from '@/components/dashboard/mobile';

<MobileHeader userName="John Doe" />
```

**Props:**
- `userName`: Nombre del usuario

**Características:**
- Botón de menú (hamburguesa)
- Avatar del usuario
- Notificaciones con badge
- Botón de agregar publicación
- Fixed position top con z-40

---

### Bottom Navigation (`BottomNavigation.tsx`)

Navegación inferior con 4 tabs principales.

```tsx
import { BottomNavigation } from '@/components/dashboard/mobile';

<BottomNavigation 
  activeTab="overview"
  onTabChange={(tab) => handleTabChange(tab)}
/>
```

**Props:**
- `activeTab`: Tab activo
- `onTabChange`: Callback de cambio de tab

**Tabs:**
- **Overview**: Vista general con estadísticas
- **Properties**: Lista de propiedades
- **Analytics**: Analíticas y reportes
- **Verification**: Estado de verificación

**Estados:**
- Icono outline cuando inactivo
- Icono solid + color + dot indicator cuando activo
- Transiciones suaves

---

### Stats Card (`MobileStatsCard.tsx`)

Tarjeta compacta para mostrar estadísticas.

```tsx
import { MobileStatsCard } from '@/components/dashboard/mobile';

<MobileStatsCard
  icon={<HomeIcon />}
  label="Propiedades Activas"
  value="8"
  sublabel="de 10 disponibles"
  progress={80}
  color="blue"
  onClick={() => navigate('/properties')}
/>
```

**Props:**
- `icon`: Icono de Heroicons
- `label`: Etiqueta principal
- `value`: Valor numérico o texto
- `sublabel`: Texto secundario (opcional)
- `progress`: Porcentaje de progreso 0-100 (opcional)
- `color`: Variante de color
- `onClick`: Callback al hacer clic (opcional)

**Colores disponibles:**
- `blue`, `orange`, `yellow`, `purple`, `green`, `red`

---

### Stats Grid (`MobileStatsGrid.tsx`)

Layout responsivo para las tarjetas de estadísticas.

```tsx
import { MobileStatsGrid } from '@/components/dashboard/mobile';

<MobileStatsGrid
  activeProperties={8}
  maxProperties={10}
  airbnbListings={3}
  totalViews={127}
  totalContacts={23}
  onViewAll={() => navigate('/properties')}
/>
```

**Layout:**
```
┌─────────────────────────────┐
│  Propiedades Activas        │ ← Full width
└─────────────────────────────┘
┌──────────────┬──────────────┐
│  Airbnb      │  Vistas      │ ← 2 columns
└──────────────┴──────────────┘
┌─────────────────────────────┐
│  Total Contactos            │ ← Full width
└─────────────────────────────┘
```

---

### Property Card (`PropertyCard.tsx`)

Tarjeta de propiedad con imagen, info y acciones.

```tsx
import { PropertyCard } from '@/components/dashboard/mobile';

<PropertyCard
  property={listing}
  onToggleStatus={(id) => handleToggle(id)}
  onEdit={(property) => navigate(`/edit/${property.id}`)}
  onPreview={(property) => setPreviewModal(property)}
  onMoreActions={(property) => setActionMenu(property)}
/>
```

**Props:**
- `property`: Objeto Listing completo
- `onToggleStatus`: Toggle publicado/inactivo
- `onEdit`: Editar propiedad
- `onPreview`: Preview al hacer tap en la card
- `onMoreActions`: Abrir menú de acciones

**Características:**
- Imagen principal con fallback
- Badge de estado (publicado, borrador, etc)
- Toggle visual de estado
- Badge de Airbnb si aplica
- Ubicación con icono
- Precio destacado
- Estadísticas (vistas, contactos)
- Botón de editar y menú de acciones

---

### Property List (`PropertyList.tsx`)

Lista scrollable de propiedades.

```tsx
import { PropertyList } from '@/components/dashboard/mobile';

<PropertyList
  properties={listings}
  onToggleStatus={handleToggle}
  onEdit={handleEdit}
  onPreview={handlePreview}
  onMoreActions={handleActions}
  isLoading={isLoading}
  emptyMessage="No hay propiedades"
/>
```

**Estados:**
- **Loading**: Skeleton de 3 cards
- **Empty**: Mensaje con icono
- **Loaded**: Lista de PropertyCard

---

### Filter Drawer (`FilterDrawer.tsx`)

Panel deslizable desde abajo para filtros.

```tsx
import { FilterDrawer, FilterState } from '@/components/dashboard/mobile';

const [filters, setFilters] = useState<FilterState>({
  search: '',
  propertyType: 'all',
  status: 'all',
  priceMin: '',
  priceMax: '',
  sortBy: 'date_desc'
});

<FilterDrawer
  isOpen={showFilters}
  onClose={() => setShowFilters(false)}
  onApply={(newFilters) => {
    setFilters(newFilters);
    applyFilters(newFilters);
  }}
  currentFilters={filters}
/>
```

**Filtros:**
- Búsqueda por texto
- Tipo de propiedad (dropdown)
- Estado (dropdown)
- Rango de precio (min/max)
- Ordenamiento (dropdown)

**Acciones:**
- Aplicar filtros (cierra el drawer)
- Limpiar todo (resetea a defaults)

---

### Quick Actions (`QuickActions.tsx`)

Floating Action Button con acciones rápidas.

```tsx
import { QuickActions } from '@/components/dashboard/mobile';

<QuickActions
  onCreateListing={() => navigate('/create-listing')}
  onOpenFilters={() => setShowFilters(true)}
  onRefresh={() => refetchListings()}
  showFilters={true}
/>
```

**Comportamiento:**
- **Tap corto**: Crear nueva publicación
- **Long press**: Expandir acciones secundarias
- **Acciones secundarias**: Actualizar, Filtros

**Posición:**
- Fixed bottom-right
- z-50 sobre todo el contenido
- Evita el bottom navigation (bottom: 24 = 6rem)

---

### Plan Banner (`MobilePlanBanner.tsx`)

Banner informativo del plan de suscripción.

```tsx
import { MobilePlanBanner } from '@/components/dashboard/mobile';

<MobilePlanBanner
  planName="Basic"
  currentListings={8}
  maxListings={10}
  onUpgrade={() => navigate('/upgrade')}
/>
```

**Estados automáticos:**
- **Normal** (< 80%): Azul, info
- **Cerca del límite** (≥ 80%): Amarillo, warning
- **Límite alcanzado** (100%): Rojo, error

**Características:**
- Barra de progreso visual
- Contador de publicaciones
- Botón de upgrade (si no es premium)
- Mensaje de confirmación (si es premium)

---

### Modales

#### Limit Modal (`MobileLimitModal`)

Modal cuando se alcanza el límite de publicaciones.

```tsx
import { MobileLimitModal } from '@/components/dashboard/mobile';

<MobileLimitModal
  isOpen={showLimitModal}
  onClose={() => setShowLimitModal(false)}
  onUpgrade={() => navigate('/upgrade')}
  planName="Basic"
  currentLimit={10}
/>
```

#### Delete Modal (`MobileDeleteModal`)

Confirmación de eliminación.

```tsx
import { MobileDeleteModal } from '@/components/dashboard/mobile';

<MobileDeleteModal
  isOpen={showDeleteModal}
  onClose={() => setShowDeleteModal(false)}
  onConfirm={() => deleteProperty(propertyId)}
  propertyTitle="Depto en Miraflores"
/>
```

#### Archive Modal (`MobileArchiveModal`)

Confirmación de archivado.

```tsx
import { MobileArchiveModal } from '@/components/dashboard/mobile';

<MobileArchiveModal
  isOpen={showArchiveModal}
  onClose={() => setShowArchiveModal(false)}
  onConfirm={() => archiveProperty(propertyId)}
  propertyTitle="Depto en Miraflores"
/>
```

#### Success Modal (`MobileSuccessModal`)

Mensaje de éxito genérico.

```tsx
import { MobileSuccessModal } from '@/components/dashboard/mobile';

<MobileSuccessModal
  isOpen={showSuccess}
  onClose={() => setShowSuccess(false)}
  title="¡Publicación creada!"
  message="Tu propiedad ha sido publicada exitosamente"
/>
```

#### Action Menu (`MobileActionMenu`)

Menú de acciones contextual.

```tsx
import { MobileActionMenu } from '@/components/dashboard/mobile';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

<MobileActionMenu
  isOpen={showMenu}
  onClose={() => setShowMenu(false)}
  propertyTitle="Depto en Miraflores"
  actions={[
    {
      label: 'Editar',
      icon: <PencilIcon className="w-5 h-5" />,
      onClick: () => handleEdit()
    },
    {
      label: 'Ver detalles',
      icon: <EyeIcon className="w-5 h-5" />,
      onClick: () => handleView()
    },
    {
      label: 'Eliminar',
      icon: <TrashIcon className="w-5 h-5" />,
      onClick: () => handleDelete(),
      variant: 'danger'
    }
  ]}
/>
```

---

## 🎨 Estilos y Animaciones

### Animaciones incluidas

Asegúrate de tener estas animaciones en tu `tailwind.config.js`:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-98': 'scale 0.1s ease-out'
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        scale: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' }
        }
      }
    }
  }
}
```

### Safe Areas

Los componentes usan `pb-safe` para respetar el área segura en dispositivos con notch:

```css
/* Añadir a tu CSS global */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 📐 Breakpoints

Los componentes móviles están diseñados para:

- **Móvil**: < 768px (md)
- **Tablet**: 768px - 1024px (opcional, puede usar desktop)
- **Desktop**: ≥ 1024px (usa componentes desktop)

---

## 🔧 Detección de dispositivo

Ejemplo de hook para detectar si es móvil:

```tsx
// hooks/useIsMobile.ts
import { useState, useEffect } from 'react';

export const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
};
```

**Uso en dashboard:**

```tsx
import { useIsMobile } from '@/hooks/useIsMobile';
import { MobileLayout } from '@/components/dashboard/mobile';
import { DashboardLayout } from '@/components/dashboard';

export default function Dashboard() {
  const isMobile = useIsMobile();

  return isMobile ? (
    <MobileDashboard />
  ) : (
    <DesktopDashboard />
  );
}
```

---

## 📦 Ejemplo de Integración Completa

```tsx
import { useState } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  MobileLayout,
  MobileStatsGrid,
  PropertyList,
  FilterDrawer,
  QuickActions,
  MobilePlanBanner,
  MobileLimitModal,
  FilterState
} from '@/components/dashboard/mobile';

export default function MobileDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    propertyType: 'all',
    status: 'all',
    priceMin: '',
    priceMax: '',
    sortBy: 'date_desc'
  });

  return (
    <MobileLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      userName="John Doe"
    >
      {/* Banner de plan */}
      <MobilePlanBanner
        planName="Basic"
        currentListings={8}
        maxListings={10}
        onUpgrade={() => router.push('/upgrade')}
      />

      {/* Estadísticas (solo en tab Overview) */}
      {activeTab === 'overview' && (
        <MobileStatsGrid
          activeProperties={8}
          maxProperties={10}
          airbnbListings={3}
          totalViews={127}
          totalContacts={23}
          onViewAll={() => setActiveTab('properties')}
        />
      )}

      {/* Lista de propiedades */}
      {activeTab === 'properties' && (
        <PropertyList
          properties={listings}
          onToggleStatus={handleToggle}
          onEdit={handleEdit}
          onPreview={handlePreview}
          onMoreActions={handleActions}
          isLoading={isLoading}
        />
      )}

      {/* Drawer de filtros */}
      <FilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={setFilters}
        currentFilters={filters}
      />

      {/* FAB */}
      <QuickActions
        onCreateListing={() => router.push('/create-listing')}
        onOpenFilters={() => setShowFilters(true)}
        onRefresh={refetchListings}
      />

      {/* Modal de límite */}
      <MobileLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onUpgrade={() => router.push('/upgrade')}
        planName="Basic"
        currentLimit={10}
      />
    </MobileLayout>
  );
}
```

---

## 🎯 Best Practices

1. **Touch targets**: Todos los botones tienen mínimo 44x44px
2. **Loading states**: Siempre mostrar skeleton mientras carga
3. **Empty states**: Mensajes claros cuando no hay contenido
4. **Feedback visual**: Animaciones en tap (active:scale-98)
5. **Safe areas**: Usar padding-bottom en elementos fijos
6. **Accesibilidad**: Labels descriptivos, contraste adecuado
7. **Performance**: Lazy load de imágenes, virtualización si >100 items

---

## 🚀 Próximos pasos

- [ ] Implementar pull-to-refresh
- [ ] Añadir gestos swipe en PropertyCard
- [ ] Virtualización de lista larga
- [ ] Modo offline con cache
- [ ] Push notifications para nuevos contactos
