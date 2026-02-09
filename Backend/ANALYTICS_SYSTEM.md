# Sistema de Análisis y Tracking para RentaFacil

## Resumen
Sistema completo de análisis que permite a los propietarios de propiedades:
- Registrar vistas de sus publicaciones (con usuarios anónimos y autenticados)
- Registrar contactos (clicks en teléfono, WhatsApp, email)
- Ver estadísticas detalladas de rendimiento

## Componentes Implementados

### 1. Backend - Endpoints de Analytics
**Archivo**: `Backend/app/api/endpoints/analytics.py`

#### Endpoints Agregados:

##### POST /v1/analytics/track/view
Registra una vista de una publicación (no requiere autenticación).

**Query Parameters:**
- `listing_id` (string, required): UUID del listing
- `session_id` (string, optional): ID de sesión para rastrear visitantes únicos
- `referrer` (string, optional): URL de origen del visitante

**Funcionalidad:**
- Crea registro en `analytics.events` con `event_type = 'view'`
- Incrementa contador `views_count` en `core.listings`
- Captura IP address y user agent

**Respuesta**: `{"message": "View tracked"}`

---

##### POST /v1/analytics/track/contact
Registra un contacto/lead (no requiere autenticación).

**Query Parameters:**
- `listing_id` (string, required): UUID del listing
- `contact_type` (string, required): Tipo de contacto - 'phone', 'whatsapp', 'email'
- `session_id` (string, optional): ID de sesión

**Funcionalidad:**
- Crea registro en `analytics.events` con `event_type = 'contact'`
- Incrementa contador `leads_count` en `core.listings`
- Almacena tipo de contacto en properties JSONB
- Captura IP address y user agent

**Respuesta**: `{"message": "Contact tracked"}`

---

##### GET /v1/analytics/listings/{listing_id}/stats
Obtiene estadísticas detalladas de una publicación (requiere autenticación).

**Path Parameters:**
- `listing_id` (string): UUID del listing

**Autorización:**
- Solo el propietario del listing puede acceder a sus estadísticas
- Verifica que `current_user.id == listing.owner_user_id`

**Respuesta:**
```json
{
  "listing_id": "uuid",
  "total_views": 150,
  "total_leads": 12,
  "total_favorites": 8,
  "last_30_days": {
    "views": 45,
    "contacts": 5,
    "unique_visitors": 32
  },
  "last_7_days": {
    "views": 18
  },
  "daily_stats": [
    {"date": "2025-01-31", "views": 8},
    {"date": "2025-01-30", "views": 5}
  ]
}
```

**Métricas:**
- **Totales históricos**: views_count, leads_count, favorites_count
- **Últimos 30 días**: vistas, contactos, visitantes únicos
- **Últimos 7 días**: vistas totales
- **Desglose diario**: vistas por día (últimos 7 días)

---

### 2. Frontend - Servicio de Analytics
**Archivo**: `Frontend/web/services/analyticsService.ts`

#### Funciones:

##### `getSessionId(): string`
Genera o recupera un ID de sesión único almacenado en sessionStorage.
- Formato: `session_{timestamp}_{random}`
- Persiste durante la sesión del navegador
- Permite rastrear visitantes únicos

##### `trackView(listingId, referrer?)`
Registra una vista automáticamente al cargar la página de detalle.
- Envía request a `POST /analytics/track/view`
- No lanza errores (falla silenciosamente)
- No afecta UX del usuario

##### `trackContact(listingId, contactType)`
Registra clicks en botones de contacto.
- Types: 'phone', 'whatsapp', 'email'
- Envía request a `POST /analytics/track/contact`
- Falla silenciosamente si hay error

##### `getListingStats(listingId)`
Obtiene estadísticas completas de un listing.
- Requiere autenticación (token en headers)
- Solo funciona si el usuario es propietario
- Lanza error si falla (para manejar en UI)

---

### 3. Frontend - Página de Detalle
**Archivo**: `Frontend/web/pages/property/[id].tsx`

**Cambios realizados:**
1. **Import**: Agregado `useEffect` y `analyticsService`
2. **Tracking de vistas**: 
   ```typescript
   useEffect(() => {
     if (property?.id) {
       analyticsService.trackView(property.id)
     }
   }, [property?.id])
   ```
3. **Tracking de contactos**: Integrado en `handleContact()`
   - Registra antes de ejecutar la acción (tel:, whatsapp, mailto)
   - Usa los campos: `owner_contact_phone`, `owner_contact_whatsapp`, `owner_contact_email`

**Flujo de contacto:**
1. Usuario sin autenticar → Redirige a registro
2. Usuario autenticado → Registra contacto + ejecuta acción

---

### 4. Frontend - Dashboard de Estadísticas
**Archivo**: `Frontend/web/pages/dashboard/analytics.tsx`

**Características:**
- **Selector de propiedad**: Dropdown para elegir qué listing analizar
- **4 tarjetas de métricas principales**:
  1. Vistas Totales (con últimos 30 días)
  2. Contactos (con últimos 30 días)
  3. Visitantes Únicos (últimos 30 días)
  4. Tasa de Conversión (contactos / vistas %)

- **Gráfico de barras**: Vistas diarias de los últimos 7 días
  - Barras horizontales con porcentaje relativo
  - Fecha formateada en español
  - Animaciones de transición

**Validaciones:**
- Redirige a `/login` si no hay usuario
- Muestra mensaje si no hay propiedades publicadas
- Loading states en carga inicial y al cambiar de propiedad

**Acceso:**
- `/dashboard/analytics` - Ruta directa
- Desde dashboard principal → Tab "Analíticas" → Botón "Ver Estadísticas Completas"

---

### 5. Frontend - Dashboard Principal
**Archivo**: `Frontend/web/pages/dashboard.tsx`

**Cambio realizado:**
- Tab "Analíticas" ahora tiene un CTA para ir a `/dashboard/analytics`
- Descripción mejorada: "Ve el rendimiento de tus propiedades con métricas detalladas"
- Botón con ícono de gráfico para mejor UX

---

## Infraestructura de Base de Datos

### Tabla: analytics.events (ya existente)
```sql
CREATE TABLE analytics.events (
  id UUID PRIMARY KEY,
  user_id UUID, -- nullable para anónimos
  session_id VARCHAR(255),
  event_type VARCHAR(50), -- 'view', 'contact', etc.
  listing_id UUID,
  properties JSONB, -- {contact_type, referrer, etc.}
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (created_at);
```

**Índices:**
- `user_id`
- `event_type`
- `listing_id`
- `session_id`
- `properties` (GIN index)

**Particionado:**
- Mensual, gestionado automáticamente por `ensure_events_partition()`

---

### Campos en core.listings
Ya existentes y utilizados:
- `views_count`: Total de vistas históricas
- `leads_count`: Total de contactos históricos
- `favorites_count`: Total de favoritos (no implementado en tracking aún)

---

## Flujo de Datos

### Tracking de Vistas
```
Usuario abre /property/{id}
    ↓
useEffect() ejecuta trackView()
    ↓
POST /analytics/track/view?listing_id={id}&session_id={session}
    ↓
Backend:
  1. INSERT en analytics.events (event_type='view')
  2. UPDATE listings SET views_count = views_count + 1
    ↓
Silenciosamente completa (no afecta UX)
```

### Tracking de Contactos
```
Usuario click en botón WhatsApp/Teléfono/Email
    ↓
handleContact('whatsapp')
    ↓
trackContact(listingId, 'whatsapp')
    ↓
POST /analytics/track/contact?listing_id={id}&contact_type=whatsapp
    ↓
Backend:
  1. INSERT en analytics.events (event_type='contact', properties={contact_type})
  2. UPDATE listings SET leads_count = leads_count + 1
    ↓
Continúa con acción (window.open whatsapp)
```

### Visualización de Estadísticas
```
Propietario entra a /dashboard/analytics
    ↓
loadListings() → Obtiene propiedades del usuario
    ↓
loadStats(listingId) por cada propiedad seleccionada
    ↓
GET /analytics/listings/{id}/stats (con auth token)
    ↓
Backend:
  1. Verifica ownership (owner_user_id == current_user.id)
  2. Query a analytics.events (últimos 30/7 días)
  3. Query contadores de core.listings
  4. Agrupa vistas diarias
    ↓
Renderiza dashboard con métricas y gráficos
```

---

## Privacidad y Seguridad

### Datos Anónimos
- **Vistas**: No requieren autenticación
- **Contactos**: No requieren autenticación (captura intención)
- Se registra IP y user agent para análisis (no mostrados al propietario)
- Session ID permite contar visitantes únicos sin violar privacidad

### Autorización
- **Estadísticas**: Solo el propietario (`owner_user_id`) puede ver stats
- Backend valida ownership antes de retornar datos
- Tokens JWT requeridos para endpoint de stats

### GDPR Considerations
- IP addresses almacenadas para analytics, no expuestas a usuarios
- Session IDs generados client-side, no vinculados a identidad
- Datos particionados por mes (facilita eliminación después de período de retención)

---

## Testing

### Manual Testing Steps

#### 1. Test de Tracking de Vistas
```bash
# Anónimo - abrir en navegador incógnito
http://localhost:3000/property/{listing_id}

# Verificar en DB:
SELECT * FROM analytics.events 
WHERE event_type = 'view' AND listing_id = '{listing_id}' 
ORDER BY created_at DESC LIMIT 5;

# Verificar contador:
SELECT views_count FROM core.listings WHERE id = '{listing_id}';
```

#### 2. Test de Tracking de Contactos
```bash
# Autenticado - abrir como usuario registrado
1. Ir a /property/{listing_id}
2. Click en botón "WhatsApp" o "Llamar"
3. Verificar que se abre WhatsApp/tel:

# Verificar en DB:
SELECT * FROM analytics.events 
WHERE event_type = 'contact' AND listing_id = '{listing_id}' 
ORDER BY created_at DESC LIMIT 5;

# Verificar contador:
SELECT leads_count FROM core.listings WHERE id = '{listing_id}';
```

#### 3. Test de Dashboard de Stats
```bash
# Como propietario del listing
1. Login con usuario que tiene propiedades
2. Ir a /dashboard → Tab "Analíticas" → "Ver Estadísticas Completas"
3. Verificar que se muestran:
   - Vistas totales
   - Contactos totales
   - Visitantes únicos (30d)
   - Tasa de conversión
   - Gráfico de barras (últimos 7 días)

# Seleccionar otra propiedad en dropdown
4. Verificar que stats se actualizan
```

#### 4. Test de Autorización
```bash
# Como usuario diferente (no propietario)
1. Login con usuario B
2. Intentar acceder: GET /v1/analytics/listings/{listing_owned_by_A}/stats
3. Verificar respuesta: 403 Forbidden

# Consola del navegador debería mostrar:
# Error getting listing stats: Request failed with status code 403
```

---

## Métricas Futuras (No Implementadas)

### Posibles Mejoras:
1. **Tracking de favoritos**: Similar a vistas/contactos
2. **Tracking de búsquedas**: Qué términos llevan a cada listing
3. **Heatmaps**: Dónde hacen click los usuarios en la página
4. **Tiempo en página**: Cuánto tiempo pasan viendo el listing
5. **Device analytics**: Desktop vs Mobile vs Tablet
6. **Geographic analytics**: De qué ciudades/países vienen los visitantes
7. **Conversión a reservas**: Cuántos contactos resultan en bookings
8. **A/B Testing**: Probar diferentes descripciones/fotos

### Optimizaciones Futuras:
1. **Batch inserts**: Agrupar eventos en el cliente y enviar cada 30 segundos
2. **Event queuing**: Usar Redis/Celery para procesamiento asíncrono
3. **Materialized views**: Pre-calcular métricas cada hora
4. **Data warehouse**: Exportar a BigQuery/Redshift para análisis avanzado
5. **Real-time dashboard**: WebSockets para actualización en vivo

---

## Integración con Otros Sistemas

### Sistema de Notificaciones (Potencial)
```python
# Cuando leads_count alcanza múltiplo de 10
if listing.leads_count % 10 == 0:
    send_notification(
        user_id=listing.owner_user_id,
        title=f"¡{listing.leads_count} contactos en tu propiedad!",
        body=f"{listing.title} está generando interés"
    )
```

### Sistema de Planes/Suscripciones (Potencial)
```python
# Limitar views detalladas según plan
if user.plan == 'free':
    # Solo mostrar totales, no desglose diario
    return basic_stats
elif user.plan == 'premium':
    # Mostrar todo + analytics avanzadas
    return detailed_stats
```

---

## Troubleshooting

### Problema: Views no se registran
**Posibles causas:**
1. Partición no existe para el mes actual
   - Solución: `SELECT create_monthly_partitions()`
2. Frontend no está enviando request
   - Check: Consola del navegador → Network tab
3. CORS bloqueando request
   - Check: Backend logs, configurar CORS en FastAPI

### Problema: Stats no cargan
**Posibles causas:**
1. Usuario no es propietario del listing
   - 403 Forbidden es esperado
2. Token JWT expirado
   - Re-login
3. Query muy lenta por muchos eventos
   - Verificar índices en `analytics.events`
   - Considerar materialized views

### Problema: Session ID duplicado
**Posibles causas:**
1. sessionStorage no persiste entre tabs
   - Comportamiento esperado: cada tab = nueva sesión
2. Usuario borra cookies/storage
   - Nueva sesión se genera automáticamente

---

## Conclusión

Sistema completo de analytics implementado con:
- ✅ Tracking de vistas (anónimo)
- ✅ Tracking de contactos (anónimo)
- ✅ Dashboard de estadísticas (propietarios)
- ✅ Métricas: vistas, contactos, visitantes únicos, conversión
- ✅ Gráficos: vistas diarias últimos 7 días
- ✅ Seguridad: solo propietarios ven stats
- ✅ Performance: particionado mensual, índices optimizados
- ✅ UX: tracking silencioso, no afecta experiencia

**Próximos pasos sugeridos:**
1. Agregar tracking de favoritos
2. Implementar notificaciones al alcanzar hitos (10, 50, 100 contactos)
3. Crear dashboard admin con stats globales de la plataforma
4. Exportar reports en PDF/Excel
5. Agregar comparación con promedio de la plataforma
