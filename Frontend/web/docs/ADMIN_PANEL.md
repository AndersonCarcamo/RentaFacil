# Panel de Administrador - EasyRent

## 🔐 Sistema de Administración

El sistema de EasyRent incluye un panel de administrador que se activa automáticamente para usuarios con correos electrónicos específicos.

## 👑 Correos de Administrador

Los siguientes correos tienen acceso al panel de administrador:

- `admin@easyrent.pe`
- `administrador@easyrent.pe`
- `support@easyrent.pe`

### Agregar Más Administradores

Para agregar más correos de administrador, edita el archivo:

**`Frontend/web/lib/hooks/useAuth.tsx`**

```typescript
// Lista de correos de administradores
const ADMIN_EMAILS = [
  'admin@easyrent.pe',
  'administrador@easyrent.pe',
  'support@easyrent.pe',
  'tu-correo@ejemplo.com', // ← Agregar aquí
]
```

## 🎯 Características del Panel de Administrador

### Vista General
- **Estadísticas del Sistema**: Usuarios totales, propiedades activas, suscripciones, ingresos
- **Acciones Rápidas**: Acceso directo a funciones administrativas
- **Comparativa Mensual**: Cambios porcentuales vs mes anterior

### Gestión de Usuarios
- Ver lista completa de usuarios
- Suspender/Activar cuentas
- Cambiar roles de usuario
- Ver historial de actividad
- Exportar datos de usuarios

### Gestión de Propiedades
- Ver todas las propiedades del sistema
- Aprobar/Rechazar publicaciones
- Marcar propiedades destacadas
- Eliminar contenido inapropiado
- Estadísticas de publicaciones

### Gestión de Suscripciones
- Ver suscripciones activas
- Gestionar pagos y cobros
- Crear planes personalizados
- Métricas de conversión
- Reportes de ingresos

### Analíticas
- Gráficos de crecimiento
- Análisis de búsquedas populares
- Tasas de conversión
- Propiedades más vistas
- Reportes personalizados

### Configuración del Sistema
- Configurar límites de planes
- Gestionar categorías
- Configurar métodos de pago
- Personalizar emails
- Configurar integraciones

## 🚀 Cómo Acceder

### 1. Iniciar Sesión como Administrador

```bash
cd Frontend/web
npm run dev
```

Navega a: `http://localhost:3000/login`

Inicia sesión con uno de los correos de administrador:
- Email: `admin@easyrent.pe`
- Password: [Tu contraseña]

### 2. Ver el Panel

Después de iniciar sesión, ve al Dashboard:
```
http://localhost:3000/dashboard
```

El panel de administrador aparecerá automáticamente en la parte superior del dashboard con:
- 🛡️ Icono de escudo
- Fondo morado/índigo
- Badge "Modo Admin Activo"
- Tabs de navegación administrativas

## 📋 Estructura del Código

### Componente AdminPanel

**Archivo**: `Frontend/web/components/admin/AdminPanel.tsx`

```typescript
interface AdminPanelProps {
  userEmail: string;
}

export default function AdminPanel({ userEmail }: AdminPanelProps)
```

### Hook de Autenticación

**Archivo**: `Frontend/web/lib/hooks/useAuth.tsx`

```typescript
interface AuthContextType {
  user: AuthUser | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  isLoggedIn: boolean
  isAdmin: boolean  // ← Nuevo
  // ...
}
```

### Integración en Dashboard

**Archivo**: `Frontend/web/pages/dashboard.tsx`

```typescript
const { user, loading, logout, isAdmin } = useAuth();

// Render
{isAdmin && user?.email && (
  <AdminPanel userEmail={user.email} />
)}
```

## 🎨 Diseño Visual

### Colores
- **Fondo Principal**: Gradiente morado-índigo (`purple-600` → `indigo-600`)
- **Badge de Estado**: Amarillo (`yellow-400`)
- **Tab Activo**: Blanco con sombra
- **Tab Inactivo**: Blanco semi-transparente

### Iconos
- 🛡️ **ShieldCheckIcon**: Logo principal
- ⚠️ **ExclamationTriangleIcon**: Badge de modo activo
- 👥 **UsersIcon**: Gestión de usuarios
- 🏢 **BuildingOfficeIcon**: Propiedades
- 💳 **CreditCardIcon**: Suscripciones
- 📊 **ChartBarIcon**: Analíticas
- ⚙️ **Cog6ToothIcon**: Configuración

## 🔒 Seguridad

### Verificación del Lado del Cliente

```typescript
const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
```

### Verificación del Lado del Servidor

⚠️ **IMPORTANTE**: Aunque el panel solo se muestra a usuarios autorizados, **DEBES** implementar verificación en el backend para todos los endpoints administrativos:

```python
# Backend ejemplo (FastAPI)
def is_admin(email: str) -> bool:
    ADMIN_EMAILS = [
        "admin@easyrent.pe",
        "administrador@easyrent.pe", 
        "support@easyrent.pe"
    ]
    return email.lower() in ADMIN_EMAILS

@app.get("/admin/users")
async def get_all_users(current_user: User = Depends(get_current_user)):
    if not is_admin(current_user.email):
        raise HTTPException(status_code=403, detail="No autorizado")
    # ... lógica de admin
```

## 📱 Responsividad

### Desktop (>1024px)
- Grid de 6 columnas para tabs
- Estadísticas en 4 columnas
- Layout espacioso

### Tablet (768px - 1024px)
- Grid de 3 columnas para tabs
- Estadísticas en 2 columnas
- Iconos visibles

### Mobile (<768px)
- Grid de 2 columnas para tabs
- Estadísticas en 1 columna
- Solo iconos en tabs (nombres ocultos)

## 🛠️ Estado Actual

### ✅ Implementado
- [x] Detección automática de administradores
- [x] Panel de administrador con 6 tabs
- [x] Vista general con estadísticas mock
- [x] Diseño responsive
- [x] Badge de modo admin activo
- [x] Integración en dashboard

### ⏳ En Desarrollo
- [ ] Conexión a APIs de backend
- [ ] Gestión real de usuarios
- [ ] Gestión real de propiedades
- [ ] Dashboard de analíticas con gráficos
- [ ] Sistema de permisos granular
- [ ] Logs de auditoría

## 🔄 Próximas Mejoras

### Corto Plazo
1. Crear endpoints de backend para funciones admin
2. Implementar lista de usuarios con paginación
3. Agregar filtros y búsqueda en cada tab
4. Implementar acciones masivas (bulk actions)

### Mediano Plazo
5. Dashboard de analíticas con Chart.js/Recharts
6. Sistema de notificaciones para admins
7. Logs de actividad de administradores
8. Exportación de reportes en PDF/Excel

### Largo Plazo
9. Sistema de roles jerárquico (super-admin, moderador, etc.)
10. Panel de configuración avanzado
11. Webhooks para eventos del sistema
12. API pública para integraciones

## 📊 Ejemplo de Uso

### Escenario 1: Ver Estadísticas

```typescript
// Usuario admin inicia sesión
// → isAdmin se establece en true automáticamente
// → AdminPanel se renderiza en dashboard
// → Tab "Vista General" muestra estadísticas
```

### Escenario 2: Gestionar Usuarios

```typescript
// Admin hace clic en tab "Usuarios"
// → Se muestra interfaz de gestión
// → (Futuro) Lista de usuarios desde API
// → (Futuro) Botones de acción: suspender, activar, editar rol
```

### Escenario 3: Revisar Propiedades

```typescript
// Admin hace clic en tab "Propiedades"
// → Se muestra lista de todas las propiedades del sistema
// → (Futuro) Filtros por estado, tipo, usuario
// → (Futuro) Botones: aprobar, rechazar, destacar, eliminar
```

## 📝 Notas Importantes

1. **Primer Login**: Si es la primera vez que usas un correo de admin, asegúrate de que la cuenta esté registrada en el sistema.

2. **Cache**: El estado de `isAdmin` se establece en tiempo real cuando detecta el cambio de autenticación.

3. **Logs**: El sistema imprime en consola cuando detecta un usuario admin:
   ```
   👑 Admin user detected: admin@easyrent.pe
   ```

4. **Desarrollo vs Producción**: Los correos de admin están hardcodeados. Para producción, considera mover esta lista a variables de entorno o base de datos.

## 🐛 Troubleshooting

### El panel no aparece después de login

**Verificar**:
1. ¿El correo está en la lista `ADMIN_EMAILS`?
2. ¿La sesión se inicializó correctamente?
3. Revisa la consola del navegador para mensajes de log

**Solución**:
```bash
# Limpiar caché del navegador
# O cerrar sesión y volver a iniciar
```

### Error: "isAdmin is undefined"

**Causa**: El hook `useAuth` no tiene la propiedad `isAdmin`

**Solución**:
```bash
# Reiniciar el servidor de desarrollo
npm run dev
```

### El panel se muestra a usuarios no admin

**Causa**: Email incluido en `ADMIN_EMAILS` por error

**Solución**:
1. Verificar `lib/hooks/useAuth.tsx` línea 40-45
2. Remover el email no deseado
3. Reiniciar servidor

## 🎓 Aprende Más

- [Documentación de Firebase Auth](https://firebase.google.com/docs/auth)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [React Context API](https://react.dev/reference/react/useContext)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Última actualización**: Noviembre 2025  
**Versión**: 1.0.0  
**Mantenedor**: Equipo EasyRent
