# 📱 Mobile Contact Configuration Components

## 📋 Descripción

Componentes móviles para la configuración de contacto de EasyRent. Transforma la interfaz de tabs horizontal en cards de acordeón optimizadas para móvil.

---

## 🏗️ Arquitectura

### **Componentes Creados** (10 archivos)

```
components/dashboard/mobile/contact/
├── index.ts                      # Exports
├── MobileContactLayout.tsx       # Layout principal con header
├── ContactMethodCard.tsx         # Card acordeón expandible
├── WhatsAppConfig.tsx           # Configuración WhatsApp
├── EmailConfig.tsx              # Configuración Email
├── PhoneConfig.tsx              # Configuración Teléfono
├── MessagePreview.tsx           # Preview en tiempo real
├── VariableChips.tsx            # Chips de variables insertables
├── CountryCodePicker.tsx        # Selector de país (bottom sheet)
├── SaveFloatingButton.tsx       # FAB para guardar
├── SuccessFeedback.tsx          # Modal de éxito
└── MobileContactPage.tsx        # Página completa integrada
```

---

## 🎨 Patrones de Diseño

### 1. **Accordion Pattern**
- Cards expandibles para cada método de contacto
- Toggle para activar/desactivar
- Botón "Mostrar/Ocultar configuración"
- Transición suave con `animate-slideDown`

### 2. **Bottom Sheet**
- Selector de código de país
- Desliza desde abajo
- Búsqueda integrada
- Países populares destacados

### 3. **Variable System**
- Chips clickables para insertar variables
- Detección de posición del cursor
- Variables: `{TITULO}`, `{PRECIO}`, `{DIRECCION}`, `{LINK}`, `{TIPO}`, `{OPERACION}`
- Preview en tiempo real con datos de ejemplo

### 4. **Floating Action Button**
- Aparece solo cuando hay cambios
- Muestra estado de guardado
- Animación `animate-scaleIn`
- Feedback táctil con `active:scale-95`

---

## 🔧 Uso

### Integración en página

```tsx
import { useIsMobile } from '../../lib/hooks/useIsMobile';
import { MobileContactPage } from '../../components/dashboard/mobile/contact';

export default function ContactoConfiguracion() {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <MobileContactPage />;
  }
  
  // Desktop view
  return (
    // ... desktop layout
  );
}
```

### Uso individual de componentes

```tsx
import {
  MobileContactLayout,
  ContactMethodCard,
  WhatsAppConfig,
} from '../../components/dashboard/mobile/contact';

function MyPage() {
  const [settings, setSettings] = useState({
    whatsapp: { enabled: false, countryCode: '+51', phoneNumber: '', message: '' }
  });

  return (
    <MobileContactLayout>
      <ContactMethodCard
        icon={<DevicePhoneMobileIcon className="w-6 h-6" />}
        title="WhatsApp"
        description="Recibe mensajes directos"
        enabled={settings.whatsapp.enabled}
        onToggle={(enabled) => setSettings(prev => ({
          ...prev,
          whatsapp: { ...prev.whatsapp, enabled }
        }))}
      >
        <WhatsAppConfig
          value={settings.whatsapp}
          onChange={(value) => setSettings(prev => ({ ...prev, whatsapp: value }))}
        />
      </ContactMethodCard>
    </MobileContactLayout>
  );
}
```

---

## 📊 Flujo de Usuario

```
1. Usuario accede a /dashboard/contacto desde móvil
   ↓
2. Se detecta isMobile = true
   ↓
3. Se renderiza MobileContactPage
   ↓
4. Se muestran 3 cards (WhatsApp, Email, Teléfono)
   ↓
5. Usuario activa toggle de WhatsApp
   ↓
6. Card se expande automáticamente
   ↓
7. Usuario completa configuración:
   - Toca "+51" → Abre CountryCodePicker
   - Selecciona país → Se cierra modal
   - Ingresa número de teléfono
   - Toca chip de variable → Se inserta en mensaje
   - Ve preview en tiempo real
   ↓
8. Aparece FAB "Guardar cambios"
   ↓
9. Usuario toca FAB
   ↓
10. Se guarda en localStorage
    ↓
11. Aparece SuccessFeedback
    ↓
12. Modal se cierra automáticamente (3s)
```

---

## 🎯 Características Clave

### **WhatsAppConfig**
- ✅ Selector de código de país
- ✅ Validación de número (min 7 dígitos)
- ✅ Mensaje con variables insertables
- ✅ Preview estilo WhatsApp
- ✅ Contador de caracteres (500 max)

### **EmailConfig**
- ✅ Validación de email (regex)
- ✅ Asunto personalizable con variables
- ✅ Mensaje largo (1000 caracteres)
- ✅ Preview estilo email
- ✅ Variables en asunto y mensaje

### **PhoneConfig**
- ✅ Selector de código de país
- ✅ Validación de número
- ✅ Checkbox "También es WhatsApp"
- ✅ Tips para recibir más llamadas

### **MessagePreview**
- ✅ Reemplazo de variables en tiempo real
- ✅ Diseño según método (WhatsApp bubble, Email box)
- ✅ Datos de ejemplo realistas
- ✅ Indicador de lectura (WhatsApp)

### **CountryCodePicker**
- ✅ Bottom sheet animado
- ✅ Búsqueda por nombre, código o país
- ✅ Sección "Países populares"
- ✅ Banderas emoji
- ✅ Indicador de selección actual

### **SaveFloatingButton**
- ✅ Aparece solo con cambios
- ✅ Estado de carga
- ✅ Posición fija (bottom-right)
- ✅ Shadow y hover effects

---

## 🎨 Estilos y Animaciones

### Animaciones usadas:
```css
animate-scaleIn       /* FAB, Success modal */
animate-slideDown     /* Accordion content */
animate-fadeIn        /* Modal backdrop */
animate-progressBar   /* Success modal timer */
```

### Tailwind utilities:
```css
scrollbar-hide        /* Listas scrollables */
active:scale-95       /* Feedback táctil */
touch-manipulation    /* Optimización táctil */
pb-safe              /* Safe area (notch) */
```

---

## 📦 Dependencias

### Externas:
- `@heroicons/react` - Iconos
- `react` - Framework
- `next/router` - Navegación

### Internas:
- `lib/hooks/useIsMobile` - Detección móvil
- Tailwind CSS config (animaciones)

---

## 🔄 Estados y Persistencia

### LocalStorage:
```typescript
// Clave
'mobile_contact_settings'

// Estructura
{
  whatsapp: {
    enabled: boolean,
    countryCode: string,
    phoneNumber: string,
    message: string
  },
  email: {
    enabled: boolean,
    email: string,
    subject: string,
    message: string
  },
  phone: {
    enabled: boolean,
    countryCode: string,
    phoneNumber: string,
    allowWhatsApp: boolean
  }
}
```

### Change Detection:
- Comparación JSON.stringify de settings vs initialSettings
- FAB aparece solo cuando `hasChanges = true`
- Al guardar, initialSettings se actualiza

---

## ✅ Validaciones

### WhatsApp:
- ❌ Número < 7 dígitos → Sin checkmark
- ✅ Número ≥ 7 dígitos → Checkmark verde

### Email:
- ❌ Email inválido → Sin checkmark
- ✅ Email válido (regex) → Checkmark verde

### Phone:
- ❌ Número < 7 dígitos → Sin checkmark
- ✅ Número ≥ 7 dígitos → Checkmark verde

---

## 🎯 UX Considerations

### Touch Targets:
- Mínimo 44x44px en todos los botones
- Iconos: 20-24px (w-5 h-5, w-6 h-6)
- Inputs: 44px height (h-11)

### Feedback Visual:
- Hover states (desktop)
- Active states (mobile)
- Loading states (spinner + texto)
- Success states (modal + progress bar)

### Accessibility:
- ARIA labels en toggles
- Placeholders descriptivos
- Error messages claros
- Focus management en modales

---

## 🚀 Testing

### Test Cases:

1. **Toggle Activation**
   - [ ] Toggle WhatsApp → Card expande
   - [ ] Toggle Email → Card expande
   - [ ] Toggle Phone → Card expande
   - [ ] Toggle off → Config se mantiene

2. **Country Code Picker**
   - [ ] Abrir modal → Slide-up animation
   - [ ] Buscar "peru" → Muestra Perú
   - [ ] Seleccionar → Modal cierra + código actualiza
   - [ ] Tap fuera → Modal cierra sin cambios

3. **Variable Insertion**
   - [ ] Tap chip {TITULO} → Se inserta en cursor
   - [ ] Insertar múltiples → Todas funcionan
   - [ ] Preview → Variables reemplazadas correctamente

4. **Save Flow**
   - [ ] Sin cambios → FAB oculto
   - [ ] Con cambios → FAB visible
   - [ ] Tap FAB → Spinner + "Guardando..."
   - [ ] Guardado exitoso → Success modal
   - [ ] Modal auto-cierra en 3s

5. **Validations**
   - [ ] Número corto → Sin checkmark
   - [ ] Número válido → Checkmark verde
   - [ ] Email inválido → Sin checkmark
   - [ ] Email válido → Checkmark verde

6. **Persistence**
   - [ ] Guardar config → localStorage actualizado
   - [ ] Refrescar página → Config cargada
   - [ ] Sin datos guardados → Defaults cargados

---

## 📱 Responsive

### Breakpoint: 768px
```tsx
< 768px  → MobileContactPage
≥ 768px  → Desktop tabs layout
```

### Safe Areas:
- `pt-safe` en top navigation
- `pb-safe` en bottom sheets
- Compatibilidad con notch (iPhone)

---

## 🔮 Mejoras Futuras

### V2:
- [ ] Contacto personalizado por propiedad
- [ ] Templates de mensajes guardados
- [ ] Horarios de disponibilidad
- [ ] Respuestas automáticas
- [ ] Analytics de contacto

### V3:
- [ ] Integración con WhatsApp Business API
- [ ] Email templates avanzados
- [ ] CRM básico
- [ ] Notificaciones push
- [ ] Chat en tiempo real

---

## 📞 Soporte

**Archivos modificados:**
- `pages/dashboard/contacto.tsx` - Integración móvil
- `tailwind.config.js` - Animación progressBar
- `components/dashboard/mobile/contact/*` - Nuevos componentes

**Documentación relacionada:**
- `MOBILE_CONTACT_CONFIG_PLAN.md` - Plan original
- `MOBILE_STRATEGY.md` - Estrategia general

---

## ✨ Conclusión

Sistema completo de configuración de contacto móvil con:
- ✅ 10 componentes creados
- ✅ Accordion pattern implementado
- ✅ Variables insertables funcionando
- ✅ Bottom sheet para país
- ✅ Preview en tiempo real
- ✅ FAB con change detection
- ✅ Success feedback
- ✅ Persistencia en localStorage
- ✅ Validaciones completas
- ✅ Responsive design

**Estado:** ✅ Completado y listo para usar

---

**Última actualización:** Noviembre 11, 2025
**Versión:** 1.0
