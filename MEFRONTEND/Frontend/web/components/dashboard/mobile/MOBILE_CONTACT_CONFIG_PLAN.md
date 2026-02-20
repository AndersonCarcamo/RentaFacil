# 📱 Planificación: Vista Móvil de Configuración de Contacto

## 📋 Resumen
Crear componentes móviles optimizados para la página de configuración de contacto (`/dashboard/contacto`), adaptando la interfaz de tabs horizontales a un diseño vertical más apropiado para móviles.

---

## 🎯 Objetivos

1. **Simplificar la navegación** entre métodos de contacto (WhatsApp, Email, Teléfono)
2. **Optimizar formularios** para entrada táctil
3. **Mejorar preview** de mensajes en tiempo real
4. **Validación inmediata** con feedback visual claro
5. **Acciones rápidas** con botones FAB o fixed

---

## 📐 Estructura de Componentes

```
components/dashboard/mobile/contact/
├── MobileContactLayout.tsx       # Layout principal con fixed header
├── ContactMethodCard.tsx         # Card expandible para cada método
├── WhatsAppConfig.tsx            # Configuración específica WhatsApp
├── EmailConfig.tsx               # Configuración específica Email
├── PhoneConfig.tsx               # Configuración específica Teléfono
├── MessagePreview.tsx            # Preview de mensaje con variables
├── CountryCodePicker.tsx         # Selector de código de país (bottom sheet)
├── VariableChips.tsx             # Chips para insertar variables
├── SaveFloatingButton.tsx        # FAB para guardar
├── SuccessFeedback.tsx           # Modal/Toast de éxito
└── index.ts                      # Exports
```

---

## 🎨 Diseño Visual

### 1. **Header Fijo**
```
┌─────────────────────────────────┐
│ ← Configurar Contacto      💾  │ ← Back + Save button
├─────────────────────────────────┤
│ Configura cómo te contactarán   │
│ los interesados en tus props    │
└─────────────────────────────────┘
```

### 2. **Lista de Métodos (Accordion Style)**
```
┌─────────────────────────────────┐
│ 📱 WhatsApp Business      [ON]  │ ← Toggle
│ ┌─────────────────────────────┐ │
│ │ Contacto directo y rápido   │ │
│ │                             │ │
│ │ [ Configurar → ]            │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ✉️ Correo Electrónico    [OFF] │
│ ┌─────────────────────────────┐ │
│ │ Contacto formal             │ │
│ │ [ Configurar → ]            │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 📞 Teléfono              [OFF] │
│ ┌─────────────────────────────┐ │
│ │ Llamada directa             │ │
│ │ [ Configurar → ]            │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 3. **Pantalla de Configuración (WhatsApp)**
```
┌─────────────────────────────────┐
│ ← WhatsApp Business             │
├─────────────────────────────────┤
│                                 │
│ 📱 Número de WhatsApp           │
│ ┌──────┬────────────────────┐  │
│ │ +51 ▾│ 987 654 321        │  │
│ └──────┴────────────────────┘  │
│                                 │
│ 🏢 Nombre del negocio           │
│ ┌───────────────────────────┐  │
│ │ RENTA fácil               │  │
│ └───────────────────────────┘  │
│                                 │
│ 💬 Mensaje personalizado        │
│ ┌───────────────────────────┐  │
│ │ Hola! Me interesa...      │  │
│ │                           │  │
│ │ Variables disponibles:    │  │
│ │ [TITULO] [DIRECCION] ...  │  │
│ └───────────────────────────┘  │
│                                 │
│ 👁️ Vista previa                │
│ ┌───────────────────────────┐  │
│ │ 📱 WhatsApp                │  │
│ │ ┌─────────────────────┐  │  │
│ │ │ Hola! Me interesa   │  │  │
│ │ │ la propiedad...     │  │  │
│ │ └─────────────────────┘  │  │
│ └───────────────────────────┘  │
│                                 │
│ [ 💾 Guardar Cambios ]          │
└─────────────────────────────────┘
```

---

## 🔧 Componentes Detallados

### 1. **MobileContactLayout.tsx**
```tsx
interface MobileContactLayoutProps {
  children: React.ReactNode;
  onSave: () => void;
  isSaving: boolean;
  hasChanges: boolean;
}

// Features:
- Fixed header con botón back
- Botón save en header (solo si hay cambios)
- Scroll area para contenido
- Safe area padding
```

### 2. **ContactMethodCard.tsx**
```tsx
interface ContactMethodCardProps {
  method: 'whatsapp' | 'email' | 'phone';
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onConfigure: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  configured: boolean; // Si ya tiene datos
}

// States:
- Enabled + Configured: Verde, checkmark
- Enabled + Not Configured: Amarillo, warning
- Disabled: Gris, inactive
```

### 3. **WhatsAppConfig.tsx**
```tsx
interface WhatsAppConfigProps {
  settings: WhatsAppSettings;
  onChange: (settings: WhatsAppSettings) => void;
  onBack: () => void;
}

// Fields:
- Country code + phone number
- Business name
- Custom message with variables
- Preview in real-time
```

### 4. **MessagePreview.tsx**
```tsx
interface MessagePreviewProps {
  message: string;
  type: 'whatsapp' | 'email';
  variables: Record<string, string>;
}

// Features:
- Replace variables with example data
- Show WhatsApp-style bubble or email format
- Responsive to message changes
```

### 5. **CountryCodePicker.tsx**
```tsx
interface CountryCodePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  selected: string;
}

// Design:
- Bottom sheet modal
- Search bar
- Flag + country + code
- Popular countries at top
```

### 6. **VariableChips.tsx**
```tsx
interface VariableChipsProps {
  variables: Array<{ key: string; label: string; example: string }>;
  onSelect: (variable: string) => void;
}

// Variables:
- {TITULO} → Nombre de la propiedad
- {DIRECCION} → Dirección completa
- {LINK} → Link a la propiedad
- {PRECIO} → Precio de alquiler

// Design:
- Horizontal scrollable chips
- Tap to insert at cursor
- Show example on long press
```

### 7. **SaveFloatingButton.tsx**
```tsx
interface SaveFloatingButtonProps {
  onSave: () => void;
  isSaving: boolean;
  visible: boolean; // Solo visible si hay cambios
}

// Design:
- Fixed bottom-right
- Animate in/out based on changes
- Loading state with spinner
- Success animation
```

---

## 🎭 Flujo de Usuario

### Flujo Principal:
```
1. Usuario entra a /dashboard/contacto
   ↓
2. Ve lista de métodos (WhatsApp, Email, Tel)
   ↓
3. Activa toggle de un método
   ↓
4. Tap en "Configurar"
   ↓
5. Llena formulario específico
   ↓
6. Ve preview en tiempo real
   ↓
7. Guarda (FAB o header button)
   ↓
8. Vuelve a lista principal
   ↓
9. Repite para otros métodos
```

### Flujo Alternativo (Ya configurado):
```
1. Usuario ve método YA configurado
   ↓
2. Ve badge verde "Configurado ✓"
   ↓
3. Puede editar directamente
   ↓
4. O desactivar con toggle
```

---

## 📊 Estados y Validación

### Estados de Método:
| Estado | Color | Icono | Acción |
|--------|-------|-------|--------|
| Enabled + Valid | Verde | ✓ | Listo para usar |
| Enabled + Invalid | Amarillo | ⚠️ | Necesita completar |
| Disabled | Gris | - | Inactivo |

### Validaciones:
**WhatsApp:**
- ✅ Número válido (E.164)
- ✅ Mensaje no vacío
- ✅ Business name opcional

**Email:**
- ✅ Email válido
- ✅ Subject no vacío
- ✅ Mensaje no vacío

**Phone:**
- ✅ Número válido (E.164)
- ✅ Schedule opcional

---

## 🎨 Estilos y Animaciones

### Transiciones:
```css
/* Card expansion */
.contact-card {
  transition: all 0.3s ease-out;
}

.contact-card.expanded {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

/* Toggle switch */
.toggle-switch {
  transition: background-color 0.2s ease;
}

/* Save button */
.save-fab {
  animation: slideInUp 0.3s ease-out;
}

/* Success feedback */
.success-toast {
  animation: slideDown 0.3s ease-out;
}
```

### Color Scheme:
- **WhatsApp**: Green (#25D366)
- **Email**: Blue (#1E88E5)
- **Phone**: Purple (#9C27B0)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)

---

## 🧩 Interacciones Móviles

### Touch Gestures:
1. **Tap**: Abrir/cerrar card, seleccionar
2. **Long Press**: Ver tooltip de variable
3. **Swipe**: Descartar modal (opcional)
4. **Pull to Refresh**: No aplica

### Keyboard:
- Auto-focus en primer campo al abrir config
- Enter para siguiente campo
- Done para cerrar teclado

### Feedback Táctil:
- Haptic feedback en toggle (si disponible)
- Active states en todos los botones
- Loading states claros

---

## 📱 Responsive Breakpoints

```tsx
// Detectar móvil
const isMobile = useIsMobile(768);

// Layout adaptativo
return isMobile ? (
  <MobileContactConfig />
) : (
  <DesktopContactConfig />
);
```

---

## 🔄 Sincronización de Estado

### Local Storage:
```tsx
// Save to localStorage on every change
useEffect(() => {
  localStorage.setItem('contactSettings', JSON.stringify(settings));
}, [settings]);

// Load on mount
useEffect(() => {
  const saved = localStorage.getItem('contactSettings');
  if (saved) setSettings(JSON.parse(saved));
}, []);
```

### Unsaved Changes Warning:
```tsx
// Warn before leaving with unsaved changes
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges]);
```

---

## ✅ Lista de Tareas

### Fase 1: Estructura Base
- [ ] Crear carpeta `components/dashboard/mobile/contact/`
- [ ] MobileContactLayout component
- [ ] ContactMethodCard component
- [ ] Routing y detección móvil

### Fase 2: Configuración WhatsApp
- [ ] WhatsAppConfig component
- [ ] CountryCodePicker component
- [ ] MessagePreview component
- [ ] VariableChips component

### Fase 3: Configuración Email
- [ ] EmailConfig component
- [ ] Email preview
- [ ] Subject + body validation

### Fase 4: Configuración Teléfono
- [ ] PhoneConfig component
- [ ] Schedule input
- [ ] Phone validation

### Fase 5: Funcionalidades
- [ ] SaveFloatingButton component
- [ ] SuccessFeedback component
- [ ] Validación completa
- [ ] LocalStorage sync

### Fase 6: Testing
- [ ] Probar en dispositivos iOS
- [ ] Probar en dispositivos Android
- [ ] Probar diferentes tamaños de pantalla
- [ ] Validar accesibilidad

---

## 🎯 Métricas de Éxito

1. **Tiempo de configuración** < 2 minutos por método
2. **Tasa de error** < 5% en validación
3. **Completitud** > 80% de usuarios configuran al menos 1 método
4. **Mobile-first** 100% funcional en pantallas < 768px
5. **Performance** < 2s tiempo de carga

---

## 📝 Notas de Implementación

### Prioridades:
1. **Must Have**: WhatsApp config (más usado en Perú)
2. **Should Have**: Email y Phone config
3. **Nice to Have**: Prueba de envío, templates predefinidos

### Consideraciones:
- WhatsApp API oficial requiere Facebook Business
- Por ahora usar `wa.me` links (no requiere API)
- Email puede usar `mailto:` (no requiere backend)
- Phone usa `tel:` protocol

### Optimizaciones Futuras:
- Templates de mensajes predefinidos
- Múltiples idiomas
- Analytics de contactos
- A/B testing de mensajes
- Integración con WhatsApp Business API
