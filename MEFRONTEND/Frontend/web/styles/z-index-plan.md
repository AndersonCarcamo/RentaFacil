# Plan de Z-Index - EasyRent Frontend

## Estructura de Capas (Z-Index System)

### Base Layer (0-99)
- `0` - Contenido base de página
- `10` - Elementos decorativos
- `20` - Cards y componentes normales

### Content Layer (100-199)
- `100` - Sidebars y paneles laterales
- `110` - Filtros de búsqueda (SearchSidebar)
- `120` - MapView (cuando visible)
- `130` - Property cards hover effects

### Navigation Layer (200-299)
- `200` - Sticky headers secundarios
- `250` - Mobile bottom navigation

### Overlay Layer (300-399)
- `300` - Dropdown menus
- `350` - Tooltips
- `380` - Mobile filters modal

### Modal Layer (400-499)
- `400` - Modal backdrop/overlay
- `450` - Modal content (PropertyModal)
- `460` - Nested modals (BookingModal)
- `470` - ImageViewer

### Header Layer (500-599)
- `500` - Header principal (fijo)
- `550` - Search bar en header

### Critical Notifications (600-699)
- `600` - Toasts/Notifications
- `650` - Loading spinners globales

### Emergency Layer (700+)
- `999` - Error boundaries
- `9999` - Developer tools (solo en dev)

## Implementación por Componente

### Search Page
- MapView: `z-120`
- SearchSidebar: `z-110`
- PropertyCards: `z-20` (hover: `z-130`)
- Mobile filters: `z-380`

### Modals
- PropertyModal backdrop: `z-400`
- PropertyModal content: `z-450`
- BookingModal backdrop: `z-410` (over PropertyModal backdrop)
- BookingModal content: `z-460`
- ImageViewer: `z-470`

### Header
- Header: `z-500`
- Header dropdowns: `z-300`

### Notifications
- Toast notifications: `z-600`
