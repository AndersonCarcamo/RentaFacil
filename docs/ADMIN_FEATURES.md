# Gestión de Planes y Administradores - EasyRent

## 📋 Descripción General

Este documento describe las nuevas funcionalidades del panel de administrador que permiten:
1. **Gestionar planes de suscripción** - Modificar precios, límites y características
2. **Gestionar administradores** - Agregar y eliminar usuarios administradores

---

## 🎯 Componentes Implementados

### 1. AdminPlansManager (`components/admin/AdminPlansManager.tsx`)

**Propósito:** Permite a los administradores modificar los planes de suscripción sin tocar código.

**Características principales:**
- ✅ Ver todos los planes en tarjetas visuales
- ✅ Editar precios mensuales y anuales
- ✅ Modificar límites (propiedades, imágenes, videos)
- ✅ Gestionar características/features
- ✅ Agregar/eliminar características dinámicamente
- ✅ Cálculo automático de descuentos
- ✅ Interfaz modal para edición

**Interfaz de datos:**
```typescript
interface Plan {
  id: string;                    // Identificador único
  name: string;                  // Nombre del plan
  description: string;           // Descripción breve
  price_monthly: number;         // Precio mensual en soles
  price_yearly: number;          // Precio anual en soles
  features: string[];            // Lista de características
  limits: {
    max_listings?: number;       // Máximo de propiedades
    max_images?: number;         // Máximo de imágenes por propiedad
    max_videos?: number;         // Máximo de videos por propiedad
    featured_listings?: number;  // Propiedades destacadas
    analytics_access?: boolean;  // Acceso a analíticas
    priority_support?: boolean;  // Soporte prioritario
  };
  active: boolean;               // Plan activo/inactivo
  sort_order: number;            // Orden de visualización
}
```

**Planes actuales:**

| Plan | Mensual | Anual | Descuento | Propiedades | Imágenes | Videos |
|------|---------|-------|-----------|-------------|----------|--------|
| Básico | S/0 | S/0 | - | 3 | 5 | 0 |
| Premium | S/29.90 | S/287.52 | 20% | 20 | 15 | 2 |
| Profesional | S/99.90 | S/959.04 | 20% | Ilimitadas | Ilimitadas | Ilimitadas |

**Uso:**
1. Iniciar sesión como administrador
2. Ir a la pestaña "Suscripciones" en el panel de admin
3. Hacer clic en el ícono de editar (lápiz) en cualquier plan
4. Modificar los campos deseados
5. Hacer clic en "Guardar Cambios"

**Validaciones:**
- Precios deben ser números positivos
- Límites deben ser números enteros positivos
- Use 999999 para representar "ilimitado"
- No se pueden guardar planes sin características

---

### 2. AdminManagement (`components/admin/AdminManagement.tsx`)

**Propósito:** Permite gestionar qué usuarios tienen acceso al panel de administrador.

**Características principales:**
- ✅ Ver lista de administradores actuales
- ✅ Agregar nuevos administradores por email
- ✅ Eliminar administradores existentes
- ✅ Protección de administradores del sistema
- ✅ Validación de formato de email
- ✅ Prevención de duplicados
- ✅ Información de cuándo y quién agregó cada admin

**Interfaz de datos:**
```typescript
interface AdminUser {
  email: string;          // Email del administrador
  addedDate: string;      // Fecha en que fue agregado
  addedBy?: string;       // Quién lo agregó
}
```

**Administradores del sistema (no se pueden eliminar):**
- `admin@easyrent.pe`
- `administrador@easyrent.pe`

**Administradores actuales:**
- admin@easyrent.pe (Sistema)
- administrador@easyrent.pe (Sistema)
- support@easyrent.pe
- rentafacildirectoriohomesperu@gmail.com

**Uso:**
1. Iniciar sesión como administrador
2. Ir a la pestaña "Configuración" en el panel de admin
3. Ingresar el email del nuevo administrador
4. Hacer clic en "Agregar"
5. Para eliminar, hacer clic en el ícono de basura junto al email

**Validaciones:**
- Email debe tener formato válido (regex)
- No se permiten emails duplicados
- No se pueden eliminar administradores del sistema
- Debe haber al menos 1 administrador siempre
- Requiere confirmación para eliminar

**Mensajes de error:**
- "Por favor ingresa un correo electrónico" - Campo vacío
- "Por favor ingresa un correo electrónico válido" - Formato incorrecto
- "Este correo ya es administrador" - Email duplicado
- "No puedes eliminar el último administrador" - Intento de eliminar único admin
- "No puedes eliminar administradores del sistema" - Protección de admins del sistema

---

## 🔧 Integración con AdminPanel

El componente `AdminPanel.tsx` ahora integra ambos componentes:

```typescript
// Importaciones
import AdminPlansManager from './AdminPlansManager';
import AdminManagement from './AdminManagement';

// En SubscriptionsTab
function SubscriptionsTab() {
  return <AdminPlansManager />;
}

// En SettingsTab
function SettingsTab() {
  return <AdminManagement />;
}
```

---

## 📱 Flujo de Usuario

### Gestión de Planes

```
1. Login como admin
   ↓
2. Dashboard → Panel de Administrador aparece
   ↓
3. Click en pestaña "Suscripciones"
   ↓
4. Ver tarjetas de planes actuales
   ↓
5. Click en ícono de editar (lápiz)
   ↓
6. Modal de edición se abre
   ↓
7. Modificar campos:
   - Nombre del plan
   - Descripción
   - Precio mensual (S/)
   - Precio anual (S/)
   - Límites (propiedades, imágenes, videos)
   - Características (agregar/eliminar)
   ↓
8. Click "Guardar Cambios"
   ↓
9. Modal se cierra
   ↓
10. Cambios reflejados en tarjeta
```

### Gestión de Administradores

```
1. Login como admin
   ↓
2. Dashboard → Panel de Administrador aparece
   ↓
3. Click en pestaña "Configuración"
   ↓
4. Ver lista de administradores actuales
   ↓
5. Agregar nuevo admin:
   5.1. Escribir email en input
   5.2. Click "Agregar"
   5.3. Validación automática
   5.4. Mensaje de éxito/error
   ↓
6. Eliminar admin existente:
   6.1. Click en ícono de basura
   6.2. Confirmación de eliminación
   6.3. Admin removido de la lista
```

---

## 💾 Persistencia de Datos

### Estado Actual (MVP)
Los cambios se almacenan en el **estado local del componente** usando `useState`.

**Limitaciones:**
- ❌ Los cambios se pierden al recargar la página
- ❌ No se sincronizan entre usuarios
- ❌ No hay historial de cambios

### Próximos Pasos (Producción)

#### Opción 1: Backend API (Recomendado)

**Endpoints necesarios:**

```typescript
// Planes
PUT  /api/admin/plans/:id           // Actualizar plan
GET  /api/admin/plans                // Obtener todos los planes
POST /api/admin/plans                // Crear nuevo plan

// Administradores
GET    /api/admin/admins             // Listar administradores
POST   /api/admin/admins             // Agregar administrador
DELETE /api/admin/admins/:email      // Eliminar administrador
```

**Ejemplo de implementación:**

```typescript
// AdminPlansManager.tsx
const handleSavePlan = async () => {
  if (!editingPlan) return;

  try {
    const response = await fetch(`/api/admin/plans/${editingPlan.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingPlan),
    });

    if (response.ok) {
      setPlans(plans.map(p => p.id === editingPlan.id ? editingPlan : p));
      setShowEditModal(false);
      setSuccess('Plan actualizado correctamente');
    }
  } catch (error) {
    setError('Error al guardar el plan');
  }
};
```

#### Opción 2: LocalStorage (Temporal)

```typescript
// Guardar
localStorage.setItem('easyrent_plans', JSON.stringify(plans));
localStorage.setItem('easyrent_admins', JSON.stringify(admins));

// Cargar
useEffect(() => {
  const savedPlans = localStorage.getItem('easyrent_plans');
  if (savedPlans) setPlans(JSON.parse(savedPlans));
}, []);
```

**Limitaciones de localStorage:**
- Solo funciona en el navegador del usuario
- Límite de 5-10MB
- No se sincroniza entre dispositivos

---

## 🔒 Seguridad

### Detección de Administradores

Actualmente se realiza en el frontend mediante lista hardcodeada:

```typescript
// lib/hooks/useAuth.tsx
const ADMIN_EMAILS = [
  'admin@easyrent.pe',
  'administrador@easyrent.pe',
  'support@easyrent.pe',
  'rentafacildirectoriohomesperu@gmail.com',
];

const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};
```

### ⚠️ IMPORTANTE: Validación Backend

**NUNCA confíes solo en validación frontend para seguridad.**

El backend debe:
1. ✅ Verificar que el usuario esté autenticado
2. ✅ Validar que el email esté en la lista de admins (base de datos)
3. ✅ Verificar permisos antes de cada operación
4. ✅ Registrar todas las acciones de admin en logs de auditoría
5. ✅ Implementar rate limiting para prevenir abuso

**Ejemplo de middleware de backend:**

```typescript
// middleware/adminAuth.ts
export async function requireAdmin(req, res, next) {
  const user = await getAuthenticatedUser(req);
  
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  const isAdmin = await checkIsAdmin(user.email);
  
  if (!isAdmin) {
    await logUnauthorizedAccess(user.email, req.path);
    return res.status(403).json({ error: 'No autorizado' });
  }
  
  await logAdminAction(user.email, req.method, req.path);
  next();
}

// Usar en rutas
app.put('/api/admin/plans/:id', requireAdmin, updatePlan);
```

### Mejores Prácticas

1. **Autenticación de dos factores (2FA)** para cuentas admin
2. **Tokens JWT con expiración corta** (15-30 minutos)
3. **Refresh tokens** para mantener sesión
4. **Logs de auditoría** de todas las acciones admin
5. **Notificaciones** cuando se agregan/eliminan admins
6. **Backup automático** antes de cambios críticos
7. **Límite de intentos** de login fallidos

---

## 🎨 Diseño UI/UX

### Colores y Estilos

**AdminPlansManager:**
- Tarjetas: Borde azul en hover
- Botón editar: Fondo azul claro
- Modal: Sombra 2xl, fondo blanco
- Inputs: Border gris → azul en focus
- Botón guardar: Azul 600 → 700 en hover
- Botón cancelar: Borde gris → fondo gris en hover

**AdminManagement:**
- Sección agregar: Fondo azul claro
- Lista admin: Tarjetas blancas con borde
- Badge "Sistema": Fondo morado
- Botón eliminar: Rojo claro → rojo oscuro
- Mensajes éxito: Verde claro con ícono
- Mensajes error: Rojo claro con ícono
- Advertencia: Amarillo claro con ícono

### Iconos Heroicons v2

```typescript
// AdminPlansManager
PencilIcon          // Editar plan
PlusIcon            // Agregar característica
CheckIcon           // Guardar cambios
XMarkIcon           // Cerrar modal / Eliminar característica
CurrencyDollarIcon  // Precios (opcional)
SparklesIcon        // Destacados (opcional)

// AdminManagement
UserPlusIcon        // Agregar admin
TrashIcon           // Eliminar admin
ShieldCheckIcon     // Ícono de admin
EnvelopeIcon        // Email (opcional)
ExclamationTriangleIcon // Advertencias
```

### Responsive Design

**Mobile (< 768px):**
- Planes en columna única
- Modal a pantalla completa
- Inputs apilados verticalmente
- Tabs en 2 columnas

**Tablet (768px - 1024px):**
- Planes en 2 columnas
- Modal con max-width 600px
- Inputs en grid 2 columnas

**Desktop (> 1024px):**
- Planes en 3 columnas
- Modal con max-width 800px
- Tabs en 6 columnas

---

## 🧪 Testing Manual

### Test Cases - AdminPlansManager

#### TC-01: Abrir modal de edición
1. Click en botón editar de un plan
2. ✅ Modal se abre
3. ✅ Datos del plan se cargan correctamente
4. ✅ Todos los campos son editables

#### TC-02: Modificar precio mensual
1. Abrir modal de edición
2. Cambiar precio mensual a 49.90
3. Click "Guardar Cambios"
4. ✅ Modal se cierra
5. ✅ Nuevo precio se refleja en tarjeta

#### TC-03: Agregar característica
1. Abrir modal de edición
2. Click "+ Agregar" en sección características
3. Escribir "Nueva característica"
4. Click "Guardar Cambios"
5. ✅ Nueva característica aparece en la lista

#### TC-04: Eliminar característica
1. Abrir modal de edición
2. Click en ícono X de una característica
3. ✅ Característica se elimina inmediatamente
4. Click "Guardar Cambios"
5. ✅ Cambios persisten

#### TC-05: Validación de precios negativos
1. Intentar ingresar precio negativo
2. ✅ Input no permite valores negativos

#### TC-06: Cancelar edición
1. Hacer cambios en el modal
2. Click "Cancelar"
3. ✅ Modal se cierra sin guardar
4. ✅ Cambios no se reflejan

### Test Cases - AdminManagement

#### TC-07: Agregar administrador válido
1. Escribir "nuevo@admin.com"
2. Click "Agregar"
3. ✅ Mensaje de éxito aparece
4. ✅ Nuevo admin en la lista

#### TC-08: Email inválido
1. Escribir "email-invalido"
2. Click "Agregar"
3. ✅ Mensaje de error: "correo electrónico válido"

#### TC-09: Email duplicado
1. Escribir email de admin existente
2. Click "Agregar"
3. ✅ Mensaje de error: "ya es administrador"

#### TC-10: Eliminar admin normal
1. Click en ícono basura de admin no-sistema
2. ✅ Confirmación aparece
3. Click "Aceptar"
4. ✅ Admin removido de lista
5. ✅ Mensaje de éxito

#### TC-11: Intentar eliminar admin del sistema
1. Click en ícono basura de "admin@easyrent.pe"
2. ✅ Mensaje de error: "administradores del sistema"

#### TC-12: Prevenir eliminar último admin
1. Eliminar todos los admins excepto uno
2. Intentar eliminar el último
3. ✅ Mensaje de error: "último administrador"

---

## 📊 Métricas y Monitoreo

### Eventos a trackear

```typescript
// Planes
- admin_plan_edited: { planId, changes, adminEmail }
- admin_plan_price_changed: { planId, oldPrice, newPrice }
- admin_feature_added: { planId, feature }
- admin_feature_removed: { planId, feature }

// Administradores
- admin_user_added: { email, addedBy }
- admin_user_removed: { email, removedBy }
- admin_add_failed: { email, reason }
- admin_remove_failed: { email, reason }
```

### Dashboard de métricas

- Número total de cambios de precio por mes
- Planes más editados
- Admins agregados/eliminados por mes
- Tiempo promedio de edición de planes

---

## 🔄 Próximas Mejoras

### Corto Plazo (1-2 semanas)
- [ ] Conectar con backend API
- [ ] Agregar logs de auditoría
- [ ] Implementar confirmación de cambios críticos
- [ ] Agregar preview de cambios antes de guardar

### Medio Plazo (1 mes)
- [ ] Historial de cambios de planes
- [ ] Rollback de cambios
- [ ] Notificaciones email cuando se agregan admins
- [ ] Permisos granulares (super admin vs admin)
- [ ] Exportar planes a JSON/CSV

### Largo Plazo (3 meses)
- [ ] A/B testing de precios
- [ ] Análisis de impacto de cambios de precio
- [ ] Planes temporales/promocionales
- [ ] Scheduler para cambios de precio
- [ ] Multi-idioma en características

---

## 🐛 Problemas Conocidos

### Limitaciones Actuales

1. **Persistencia:** Los cambios no persisten al recargar (usar backend)
2. **Sincronización:** Múltiples admins no ven cambios en tiempo real
3. **Validación:** Validación limitada a frontend (agregar backend)
4. **Concurrencia:** Sin manejo de edición simultánea
5. **Historial:** No hay registro de quién hizo qué cambio

### Workarounds Temporales

1. Documentar cambios manualmente en Google Sheets
2. Coordinar ediciones entre admins por Slack/WhatsApp
3. Hacer backup de datos antes de cambios importantes
4. Refrescar página para ver cambios de otros admins

---

## 📞 Soporte

### ¿Necesitas ayuda?

**Documentación:**
- [ADMIN_PANEL.md](./ADMIN_PANEL.md) - Panel de administrador
- [CULQI_INTEGRATION.md](./CULQI_INTEGRATION.md) - Pasarela de pagos

**Contacto:**
- Email: dev@easyrent.pe
- Slack: #admin-support

### Reporte de Bugs

Por favor incluye:
1. Pasos para reproducir
2. Comportamiento esperado
3. Comportamiento actual
4. Screenshots si aplica
5. Navegador y versión

---

## 📄 Changelog

### v1.0.0 (2024-01-20)
- ✅ Implementación inicial de AdminPlansManager
- ✅ Implementación inicial de AdminManagement
- ✅ Integración con AdminPanel
- ✅ Interfaz completa de edición de planes
- ✅ Gestión completa de administradores
- ✅ Validaciones frontend
- ✅ Mensajes de éxito/error
- ✅ Diseño responsive

---

**Última actualización:** 20 de enero, 2024
**Autor:** EasyRent Dev Team
**Versión:** 1.0.0
