# Sistema de Notificación por Email en Reservas

## ✅ Estado: IMPLEMENTADO Y FUNCIONAL

Este documento describe el sistema completo de notificación por email cuando se crea una nueva reserva desde la vista de búsqueda.

---

## 📋 Flujo Completo

### 1. Usuario busca y selecciona propiedad
- **Ubicación:** `/search` (Frontend)
- **Archivo:** `Frontend/web/pages/search.tsx`
- El usuario puede buscar propiedades tipo Airbnb (rental_term = 'daily')

### 2. Visualización de detalles
- **Componente:** `PropertyModal`
- **Archivo:** `Frontend/web/components/property/PropertyModal.tsx`
- Muestra detalles completos de la propiedad
- Si es tipo Airbnb, muestra botón "Reservar Ahora"

### 3. Formulario de reserva
- **Componente:** `BookingModal`
- **Archivo:** `Frontend/web/components/booking/BookingModal.tsx`
- El usuario selecciona:
  - Fechas de check-in y check-out
  - Número de huéspedes
  - Mensaje opcional para el propietario

### 4. Creación de reserva (Backend)
- **Endpoint:** `POST /v1/bookings`
- **Archivo:** `Backend/app/api/endpoints/bookings.py` (líneas 238-410)
- **Estado inicial:** `pending_confirmation`

#### Proceso:
1. ✅ Valida que el listing existe
2. ✅ Verifica que es tipo Airbnb (rental_term = 'daily')
3. ✅ Valida que el usuario no reserva su propia propiedad
4. ✅ Verifica número máximo de huéspedes
5. ✅ Calcula noches y valida mínimo 1 noche
6. ✅ Verifica disponibilidad en calendario
7. ✅ Calcula precios (50% reserva + 50% check-in)
8. ✅ Crea registro en base de datos
9. ✅ **Envía email de notificación al propietario**

### 5. Envío de Email al Propietario
- **Servicio:** `EmailService.send_booking_request_notification()`
- **Archivo:** `Backend/app/services/email_service.py` (líneas 94-292)

#### Datos del email:
```python
email_service.send_booking_request_notification(
    owner_email=owner.email,
    owner_name="Nombre del propietario",
    guest_name="Nombre del huésped",
    property_title="Título de la propiedad",
    check_in="dd/mm/yyyy",
    check_out="dd/mm/yyyy",
    guests=2,
    total_price=300.00,
    booking_id="uuid-de-la-reserva",
    message="Mensaje opcional del huésped"
)
```

#### Contenido del email:
- ✅ Asunto: "🏠 Nueva Solicitud de Reserva - {property_title}"
- ✅ Detalles de la reserva (fechas, huéspedes, precio)
- ✅ Mensaje del huésped (si existe)
- ✅ **Enlace directo a la página de gestión:** `/dashboard/bookings/{booking_id}`
- ✅ Enlace alternativo a lista completa: `/dashboard/bookings`
- ✅ Diseño responsive con estilos HTML

---

## 🎯 Página de Gestión de Reserva

### Vista Individual de Reserva
- **URL:** `/dashboard/bookings/[id]`
- **Archivo:** `Frontend/web/pages/dashboard/bookings/[id].tsx`

#### Características:
- ✅ Información completa de la reserva
- ✅ Detalles del huésped (nombre, email, teléfono)
- ✅ Fechas y duración de la estadía
- ✅ Desglose de pagos (50% + 50%)
- ✅ Mensaje del huésped
- ✅ **Botones de acción:**
  - ✅ Confirmar Reserva (verde)
  - ❌ Rechazar Reserva (rojo)
- ✅ **Responsive para móvil**

### Vista de Lista de Reservas
- **URL:** `/dashboard/bookings`
- **Archivo:** `Frontend/web/pages/dashboard/bookings.tsx`
- Lista todas las reservas del propietario
- Filtros por estado
- Enlaces directos a cada reserva individual

---

## 🔐 Autenticación y Permisos

### Backend:
```python
current_user: User = Depends(get_current_user)
```
- El endpoint `create_booking` requiere JWT token
- Solo usuarios autenticados pueden crear reservas

### Frontend:
```typescript
function getAuthToken(): string | null {
  return localStorage.getItem('access_token')
}

headers['Authorization'] = `Bearer ${token}`
```

---

## 📧 Configuración de Email

### Variables de Entorno (Backend)
```env
# SMTP Configuration
EMAIL_ENABLED=True
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=tu-email@gmail.com
SMTP_PASSWORD=tu-contraseña-de-aplicación
EMAIL_FROM=noreply@easyrent.com
EMAIL_FROM_NAME=EasyRent

# Frontend URL (para enlaces en emails)
FRONTEND_URL=http://localhost:3000
```

### Verificar Configuración
```bash
# Revisar archivo de configuración
cat Backend/.env

# Verificar que las variables están cargadas
python -c "import os; print(os.getenv('SMTP_HOST'))"
```

---

## 🧪 Pruebas

### 1. Probar envío de email manualmente
```python
# Backend/test_email.py
from app.services.email_service import EmailService

email_service = EmailService()
result = email_service.send_booking_request_notification(
    owner_email="propietario@example.com",
    owner_name="Juan Pérez",
    guest_name="María García",
    property_title="Departamento en Miraflores",
    check_in="15/12/2025",
    check_out="20/12/2025",
    guests=2,
    total_price=500.00,
    booking_id="test-booking-123",
    message="Me gustaría reservar para mi familia"
)
print(f"Email enviado: {result}")
```

### 2. Probar endpoint de creación de reserva
```bash
# Con curl
curl -X POST http://localhost:8000/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "listingId": "uuid-de-propiedad",
    "checkInDate": "2025-12-15",
    "checkOutDate": "2025-12-20",
    "numberOfGuests": 2,
    "guestMessage": "Hola, me gustaría reservar"
  }'
```

### 3. Verificar logs
```bash
# Backend logs
tail -f Backend/app/logs/app.log | grep -E "Email|📧|Reserva creada"
```

### 4. Probar desde el frontend
1. Iniciar sesión en el sistema
2. Ir a `/search`
3. Buscar una propiedad tipo Airbnb
4. Hacer clic en la propiedad
5. Clic en "Reservar Ahora"
6. Completar formulario de reserva
7. Enviar solicitud
8. **Verificar:**
   - ✅ Toast de confirmación: "¡Solicitud de reserva enviada!"
   - ✅ Mensaje: "El propietario recibirá un correo de notificación"
   - ✅ Redirección a `/dashboard/bookings`
   - ✅ Email recibido en bandeja del propietario

---

## 📝 Formato del Email

### Ejemplo Visual:

```
┌─────────────────────────────────────────────┐
│      🏠 Nueva Solicitud de Reserva          │
│        [Encabezado con gradiente]           │
└─────────────────────────────────────────────┘

Hola Juan Pérez,

¡Buenas noticias! Has recibido una nueva solicitud 
de reserva para tu propiedad:

┌─────────────────────────────────────────────┐
│  📋 Detalles de la Reserva                  │
│                                             │
│  Propiedad: Departamento en Miraflores     │
│  Huésped: María García                      │
│  Check-in: 15/12/2025                       │
│  Check-out: 20/12/2025                      │
│  Huéspedes: 2 persona(s)                    │
│  Precio Total: S/ 500.00                    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  💬 Mensaje del huésped:                    │
│  "Me gustaría reservar para mi familia"     │
└─────────────────────────────────────────────┘

    Por favor revisa y gestiona esta solicitud

    [📋 Ver Detalles y Gestionar Reserva]
          ↓ (botón azul)
    /dashboard/bookings/{booking_id}

    Ver todas tus reservas →

⏰ Recuerda: Es importante responder pronto para
mantener una buena experiencia con tus huéspedes.

───────────────────────────────────────────────
Este es un correo automático de EasyRent
Si tienes alguna pregunta, contáctanos en 
soporte@easyrent.com
```

---

## 🔄 Estados de la Reserva

1. **pending_confirmation** ⏳
   - Estado inicial al crear la reserva
   - Esperando acción del propietario
   - **Email enviado al propietario** ✅

2. **confirmed** ✅
   - Propietario aceptó la reserva
   - Esperando pago del 50% inicial
   - Email enviado al huésped (futuro)

3. **rejected** ❌
   - Propietario rechazó la reserva
   - Email enviado al huésped (futuro)

4. **reservation_paid** 💰
   - Huésped pagó el 50% inicial
   - Reserva confirmada

5. **checked_in** 🏠
   - Huésped realizó check-in
   - Pago del 50% restante

6. **completed** ✅
   - Reserva completada
   - 100% pagado

---

## 🐛 Troubleshooting

### Email no se envía

1. **Verificar configuración SMTP:**
```python
# Backend/check_email_config.py
import os
from dotenv import load_dotenv

load_dotenv()

print("SMTP_HOST:", os.getenv('SMTP_HOST'))
print("SMTP_PORT:", os.getenv('SMTP_PORT'))
print("SMTP_USER:", os.getenv('SMTP_USER'))
print("SMTP_FROM_EMAIL:", os.getenv('SMTP_FROM_EMAIL'))
```

2. **Verificar logs del backend:**
```bash
grep "Email enviado\|Error enviando email" Backend/logs/app.log
```

3. **El propietario no tiene email:**
```sql
-- Verificar email del propietario
SELECT id, email, first_name, last_name 
FROM core.users 
WHERE id = 'uuid-del-propietario';
```

4. **Gmail bloquea el envío:**
   - Usar "Contraseña de aplicación" en vez de contraseña normal
   - Habilitar "Acceso de aplicaciones menos seguras"
   - Verificar que no esté bloqueado por spam

### Reserva se crea pero no redirige

Verificar que el `booking.id` se esté devolviendo correctamente:
```typescript
// BookingModal.tsx - línea ~119
const booking = await bookingService.createBooking(bookingData)
console.log('✅ Reserva creada:', booking)
```

---

## ✅ Checklist de Verificación

- [x] Backend: Endpoint `POST /v1/bookings` funcional
- [x] Backend: Servicio de email configurado
- [x] Backend: Email se envía al crear reserva
- [x] Backend: Email contiene enlace correcto
- [x] Frontend: Modal de reserva funcional
- [x] Frontend: Servicio de booking configurado
- [x] Frontend: Redirección post-reserva correcta
- [x] Frontend: Página de gestión individual
- [x] Frontend: Página de lista de reservas
- [x] Frontend: Vistas responsive para móvil
- [x] Autenticación: JWT token requerido
- [x] Email: Template HTML con estilos
- [x] Email: Enlace a `/dashboard/bookings/{id}`
- [x] Email: Información completa de la reserva

---

## 📚 Archivos Clave

### Backend
- `Backend/app/api/endpoints/bookings.py` - Endpoint de creación
- `Backend/app/services/email_service.py` - Servicio de email
- `Backend/app/schemas/bookings.py` - DTOs de reserva
- `Backend/app/models/booking.py` - Modelo de base de datos

### Frontend
- `Frontend/web/pages/search.tsx` - Vista de búsqueda
- `Frontend/web/components/property/PropertyModal.tsx` - Modal de propiedad
- `Frontend/web/components/booking/BookingModal.tsx` - Modal de reserva
- `Frontend/web/pages/dashboard/bookings/[id].tsx` - Vista individual
- `Frontend/web/pages/dashboard/bookings.tsx` - Vista de lista
- `Frontend/web/services/bookingService.ts` - Servicio API
- `Frontend/web/types/booking.ts` - Tipos TypeScript

---

## 🚀 Próximas Mejoras

1. **Email al huésped** cuando el propietario confirma/rechaza
2. **Notificaciones push** en la aplicación
3. **Recordatorios automáticos** para pagos pendientes
4. **Email de recordatorio** 24h antes del check-in
5. **Sistema de calificaciones** post-estadía
6. **Integración con calendario** (Google Calendar, iCal)

---

## 📞 Contacto

Para soporte técnico o dudas sobre el sistema:
- Email: soporte@easyrent.com
- Documentación completa: `/Backend/SISTEMA_DOCUMENTACION_COMPLETA.md`
