# Dashboard Components

Componentes organizados jerárquicamente para el Dashboard de RENTA fácil.

## 📁 Estructura de Archivos

```
components/dashboard/
├── index.ts                  # Exportaciones centralizadas
├── README.md                 # Esta documentación
│
├── DashboardHeader.tsx       # Header principal con título y acciones
├── DashboardTabs.tsx         # Navegación por pestañas
├── DashboardStats.tsx        # Grid de estadísticas principales
├── StatsCard.tsx             # Card individual de estadística
│
├── PropertyFilters.tsx       # Filtros y búsqueda de propiedades
├── PropertyTable.tsx         # Tabla completa de propiedades
├── PropertySummary.tsx       # Resumen de estados de propiedades
│
├── PlanInfo.tsx              # Información del plan de suscripción
├── AlertBanner.tsx           # Banners de alertas (success, warning, error)
├── LimitModal.tsx            # Modal de límite de propiedades
└── TabsContent.tsx           # Contenido de tabs (Analytics, Verification)
```

## 🎯 Jerarquía de Componentes

```
DashboardPage
├── DashboardHeader
│   ├── Título
│   ├── Descripción
│   └── Botones de acción
│       ├── Configurar Contacto
│       └── Nueva Propiedad
│
├── AlertBanner (condicional)
│   └── Mensajes de éxito/warning/error
│
├── DashboardTabs
│   └── Navegación entre secciones
│
├── TAB: Overview
│   ├── DashboardStats
│   │   ├── StatsCard (Propiedades Activas)
│   │   ├── StatsCard (Airbnb)
│   │   ├── StatsCard (Vistas)
│   │   └── StatsCard (Contactos)
│   │
│   ├── AlertBanner (límite de plan)
│   ├── PropertySummary
│   └── PlanInfo
│
├── TAB: Properties
│   ├── PropertyFilters
│   │   ├── Búsqueda
│   │   ├── Filtros (tipo, modalidad, estado, precio)
│   │   └── Ordenamiento
│   │
│   └── PropertyTable
│       └── Lista de propiedades con acciones
│
├── TAB: Analytics
│   └── AnalyticsTab
│       └── Placeholder "Próximamente"
│
├── TAB: Verification
│   └── VerificationTab
│       └── Link a página de verificación
│
└── Modals
    └── LimitModal
        └── Aviso de límite alcanzado
```

## 📦 Componentes Disponibles

### Core Components

#### `DashboardHeader`
Header principal del dashboard con título y botones de acción.

**Props:**
- `userName?: string` - Nombre del usuario (opcional)

**Uso:**
```tsx
<DashboardHeader userName="Juan Pérez" />
```

---

#### `DashboardTabs`
Navegación por pestañas del dashboard.

**Props:**
- `activeTab: DashboardTab` - Tab actualmente activo
- `onTabChange: (tab: DashboardTab) => void` - Callback al cambiar de tab

**Tabs disponibles:**
- `overview` - Vista general
- `properties` - Mis propiedades
- `analytics` - Analíticas
- `verification` - Verificación

**Uso:**
```tsx
<DashboardTabs 
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

---

### Statistics Components

#### `DashboardStats`
Grid de 4 estadísticas principales del dashboard.

**Props:**
- `activeProperties: number` - Propiedades activas
- `totalProperties: number` - Total de propiedades
- `activeAirbnbProperties: number` - Propiedades Airbnb activas
- `airbnbProperties: number` - Total propiedades Airbnb
- `totalViews: number` - Total de vistas
- `totalContacts: number` - Total de contactos
- `planName: string` - Nombre del plan actual
- `maxActiveListings: number` - Límite de propiedades activas (-1 = ilimitado)

**Uso:**
```tsx
<DashboardStats
  activeProperties={5}
  totalProperties={10}
  activeAirbnbProperties={2}
  airbnbProperties={3}
  totalViews={150}
  totalContacts={25}
  planName="Premium"
  maxActiveListings={10}
/>
```

---

#### `StatsCard`
Card individual de estadística con icono, valor y progreso opcional.

**Props:**
- `label: string` - Etiqueta de la estadística
- `value: string | number` - Valor principal
- `sublabel?: string` - Texto secundario
- `icon: React.ReactNode` - Icono a mostrar
- `iconBgColor: string` - Color de fondo del icono
- `progress?: { current: number, max: number, showBar?: boolean }` - Datos de progreso

**Uso:**
```tsx
<StatsCard
  label="Propiedades Activas"
  value={5}
  sublabel="Plan Premium"
  icon={<HomeIcon className="w-6 h-6 text-blue-600" />}
  iconBgColor="bg-blue-100"
  progress={{ current: 5, max: 10, showBar: true }}
/>
```

---

### Filter & Table Components

#### `PropertyFilters`
Barra completa de filtros y búsqueda de propiedades.

**Props:**
- `filters: FilterState` - Estado actual de filtros
- `onFilterChange: (key, value) => void` - Callback al cambiar filtro
- `onSortChange: (sortBy) => void` - Callback al cambiar ordenamiento
- `onClearFilters: () => void` - Callback para limpiar filtros
- `totalProperties: number` - Total de propiedades
- `filteredCount: number` - Propiedades filtradas

**Uso:**
```tsx
<PropertyFilters
  filters={filters}
  onFilterChange={handleFilterChange}
  onSortChange={handleSortChange}
  onClearFilters={clearFilters}
  totalProperties={10}
  filteredCount={5}
/>
```

---

#### `PropertyTable`
Tabla completa de propiedades con todas las acciones.

**Props:**
- `properties: Listing[]` - Todas las propiedades
- `filteredProperties: Listing[]` - Propiedades filtradas
- `onToggleStatus: (id) => void` - Toggle publicar/despublicar
- `onEdit: (property) => void` - Editar propiedad
- `onDuplicate: (property) => void` - Duplicar propiedad
- `onDelete: (id) => void` - Eliminar propiedad
- `onPreview: (property) => void` - Vista previa
- `hasFiltersActive: boolean` - Si hay filtros activos
- `onCreateNew: () => void` - Crear nueva propiedad

**Uso:**
```tsx
<PropertyTable
  properties={allProperties}
  filteredProperties={filtered}
  onToggleStatus={handleToggle}
  onEdit={handleEdit}
  onDuplicate={handleDuplicate}
  onDelete={handleDelete}
  onPreview={handlePreview}
  hasFiltersActive={!!filters.search}
  onCreateNew={() => router.push('/create')}
/>
```

---

#### `PropertySummary`
Resumen visual del estado de las propiedades.

**Props:**
- `publishedCount: number` - Propiedades publicadas
- `draftCount: number` - Borradores
- `underReviewCount: number` - En revisión
- `archivedCount: number` - Archivadas

**Uso:**
```tsx
<PropertySummary
  publishedCount={5}
  draftCount={2}
  underReviewCount={1}
  archivedCount={0}
/>
```

---

### Info & Plan Components

#### `PlanInfo`
Información detallada del plan de suscripción actual.

**Props:**
- `planName: string` - Nombre del plan
- `maxActiveListings: number` - Límite de propiedades
- `activeProperties: number` - Propiedades activas actuales
- `totalProperties: number` - Total de propiedades
- `airbnbProperties: number` - Propiedades Airbnb
- `features: string[]` - Lista de características
- `onUpgrade?: () => void` - Callback para mejorar plan

**Uso:**
```tsx
<PlanInfo
  planName="Premium"
  maxActiveListings={10}
  activeProperties={5}
  totalProperties={8}
  airbnbProperties={2}
  features={['Feature 1', 'Feature 2']}
  onUpgrade={() => router.push('/planes')}
/>
```

---

### Alert & Modal Components

#### `AlertBanner`
Banner de alertas con diferentes tipos y estilos.

**Props:**
- `type: 'success' | 'warning' | 'error' | 'info'` - Tipo de alerta
- `title: string` - Título principal
- `message: string` - Mensaje descriptivo
- `onClose?: () => void` - Callback para cerrar
- `action?: { label: string, onClick: () => void }` - Acción opcional

**Uso:**
```tsx
<AlertBanner
  type="warning"
  title="Límite cercano"
  message="Estás cerca del límite de tu plan"
  onClose={() => setShowAlert(false)}
  action={{
    label: 'Mejorar Plan',
    onClick: () => router.push('/planes')
  }}
/>
```

---

#### `LimitModal`
Modal que aparece cuando se alcanza el límite de propiedades.

**Props:**
- `isOpen: boolean` - Si el modal está abierto
- `onClose: () => void` - Callback para cerrar
- `onUpgrade: () => void` - Callback para mejorar plan
- `planName: string` - Nombre del plan actual
- `maxActiveListings: number` - Límite del plan
- `currentActiveCount: number` - Propiedades activas actuales

**Uso:**
```tsx
<LimitModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onUpgrade={() => router.push('/planes')}
  planName="Free"
  maxActiveListings={3}
  currentActiveCount={3}
/>
```

---

### Tab Content Components

#### `AnalyticsTab`
Contenido del tab de analíticas (placeholder).

**Uso:**
```tsx
{activeTab === 'analytics' && <AnalyticsTab />}
```

---

#### `VerificationTab`
Contenido del tab de verificación con link a página dedicada.

**Uso:**
```tsx
{activeTab === 'verification' && <VerificationTab />}
```

---

## 🚀 Uso Completo en Dashboard

```tsx
import {
  DashboardHeader,
  DashboardTabs,
  DashboardStats,
  PropertyFilters,
  PropertyTable,
  PropertySummary,
  PlanInfo,
  AlertBanner,
  LimitModal,
  AnalyticsTab,
  VerificationTab,
  type DashboardTab,
  type FilterState
} from '@/components/dashboard';

function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [filters, setFilters] = useState<FilterState>({...});
  
  return (
    <>
      <DashboardHeader />
      
      <AlertBanner
        type="success"
        title="¡Propiedad creada!"
        message="Tu propiedad ha sido publicada"
        onClose={() => setShowAlert(false)}
      />
      
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === 'overview' && (
        <>
          <DashboardStats {...statsProps} />
          <PropertySummary {...summaryProps} />
          <PlanInfo {...planProps} />
        </>
      )}
      
      {activeTab === 'properties' && (
        <>
          <PropertyFilters {...filterProps} />
          <PropertyTable {...tableProps} />
        </>
      )}
      
      {activeTab === 'analytics' && <AnalyticsTab />}
      {activeTab === 'verification' && <VerificationTab />}
      
      <LimitModal {...limitProps} />
    </>
  );
}
```

## 🎨 Estilos y Temas

Todos los componentes usan:
- **Tailwind CSS** para estilos
- **Heroicons** para iconos
- Colores consistentes del diseño RENTA fácil
- Responsive design por defecto
- Modo oscuro ready (por implementar)

## 🔧 Extensibilidad

Para agregar nuevos componentes:

1. Crear el componente en `components/dashboard/NuevoComponente.tsx`
2. Exportarlo en `components/dashboard/index.ts`
3. Documentarlo en este README
4. Seguir los patrones de props y estructura existentes

## 📝 Notas

- Todos los componentes son **Server Side Rendering (SSR) compatible**
- TypeScript estricto en todas las props
- Props opcionales claramente marcadas
- Callbacks consistentes para eventos
- Componentes puros sin lógica de negocio (excepto presentación)
