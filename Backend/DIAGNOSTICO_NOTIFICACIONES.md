## Pasos para diagnosticar el problema de notificaciones

### 1. Reiniciar el backend
```bash
cd Backend
# Detener el servidor actual (Ctrl+C)
# Luego iniciar de nuevo
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Hacer una nueva solicitud de reserva

Ve al frontend y crea una nueva solicitud de reserva en una propiedad Airbnb.

### 3. Revisar los logs del backend

Busca en la consola del backend estos mensajes:

**Al crear la reserva:**
```
🔔 Creando notificación para user_id: [UUID del propietario]
   Tipo: booking, Categoría: booking_request
   Título: 🏖️ Nueva solicitud de reserva Airbnb
⚠️ Usuario [UUID] no tiene configuraciones de notificación, usando configuración por defecto
✅ Configuraciones por defecto creadas para usuario [UUID]
💾 Agregando notificación a la base de datos...
✅ Notificación guardada con ID: [UUID de la notificación]
📤 Agregando a cola de envío...
💾 Haciendo commit...
✅✅✅ Notificación creada exitosamente - ID: [UUID], User: [UUID]
🔔 Notificación creada para propietario [email] - reserva [UUID]
```

**Si hay algún error:**
```
❌ Error creando notificación: [mensaje de error]
```

### 4. Verificar el endpoint GET /notifications

Cuando el frontend haga el fetch, deberías ver:

```
📬 GET /notifications - User: [UUID del propietario] ([email])
   Filters: type=None, status=None, priority=None, category=None, read=False
📊 Resultados: X notificaciones encontradas, X no leídas, X total
📋 Primeras notificaciones:
   1. ID: [UUID], Categoría: booking_request, Título: 🏖️ Nueva solicitud de reserva Airbnb
```

### 5. Verificar qué usuario está logueado

**MUY IMPORTANTE:** Asegúrate de que estás logueado con el usuario **PROPIETARIO** de la propiedad, NO con el usuario guest que hizo la solicitud.

Para verificar:
- Abre la consola del navegador (F12)
- Ve a la pestaña "Application" o "Almacenamiento"
- Busca "localStorage"
- Verifica el `access_token`
- Decodifica el token en https://jwt.io/
- Verifica que el `user_id` en el token coincida con el `owner_user_id` de la propiedad

### 6. Posibles problemas y soluciones

#### Problema 1: No se crean las notificaciones
**Síntoma:** No ves los logs de "🔔 Creando notificación..."
**Solución:** El código de bookings.py tiene un try-except que captura errores silenciosamente. Revisa si hay logs de "❌ Error creando notificación"

#### Problema 2: Se crean pero no aparecen en el GET
**Síntoma:** Ves "✅✅✅ Notificación creada exitosamente" pero luego "📊 Resultados: 0 notificaciones"
**Solución:** 
- El user_id de la notificación no coincide con el usuario logueado
- Verifica en los logs el user_id usado al crear vs el user_id en el GET

#### Problema 3: Usuario no tiene configuraciones
**Síntoma:** Ves "⚠️ Usuario no tiene configuraciones de notificación"
**Solución:** 
- Ahora se crean automáticamente
- Si sigue fallando, puede ser un problema de permisos en la BD

#### Problema 4: Estás logueado con el usuario incorrecto
**Síntoma:** Todo funciona en el backend pero no ves notificaciones en el frontend
**Solución:**
- Cierra sesión
- Inicia sesión con el usuario PROPIETARIO
- Deberías ver las notificaciones pendientes

### 7. Query SQL para verificar directamente en la BD

Si quieres verificar directamente en PostgreSQL:

```sql
-- Ver todas las notificaciones no leídas
SELECT 
    n.id,
    n.user_id,
    n.category,
    n.title,
    n.created_at,
    u.email as user_email
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.read_at IS NULL
ORDER BY n.created_at DESC
LIMIT 10;

-- Ver notificaciones de booking_request específicamente
SELECT 
    n.id,
    n.user_id,
    n.category,
    n.title,
    n.message,
    n.created_at,
    u.email as user_email
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.category = 'booking_request'
ORDER BY n.created_at DESC
LIMIT 10;

-- Ver el owner_user_id de una propiedad específica
SELECT 
    id,
    title,
    owner_user_id,
    rental_model
FROM listings
WHERE id = '2d8c8c8c-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

-- Comparar: usuario logueado vs owner de la propiedad
SELECT 
    l.id as listing_id,
    l.title,
    l.owner_user_id,
    u.email as owner_email,
    b.guest_user_id,
    gu.email as guest_email
FROM bookings b
JOIN listings l ON b.listing_id = l.id
JOIN users u ON l.owner_user_id = u.id
JOIN users gu ON b.guest_user_id = gu.id
WHERE b.id IN ('1ba08e26-xxxx-xxxx-xxxx-xxxxxxxxxxxx', '3dc50f00-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
```
