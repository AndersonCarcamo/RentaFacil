# Sistema de Plazo de Pago (6 Horas)

## 📋 Descripción General

Sistema implementado para gestionar el plazo de 6 horas que tiene un huésped para completar el pago del 50% después de que el propietario acepta una reserva.

## 🎯 Flujo Completo

### 1. **Huésped crea una reserva**
- Estado inicial: `pending_confirmation`
- El propietario recibe un email de notificación

### 2. **Propietario accede al dashboard**
```
http://127.0.0.1:3000/dashboard/bookings/{booking_id}
```

### 3. **Propietario acepta la reserva**
- **Endpoint**: `PATCH /v1/bookings/{booking_id}/confirm`
- **Acciones automáticas**:
  - ✅ Estado cambia a `confirmed`
  - ⏰ Se establece `payment_deadline` = 6 horas desde ahora
  - 📧 Se envía email al huésped con:
    - Detalles de la reserva
    - Monto a pagar (50% del total)
    - Datos bancarios para transferencia
    - **Plazo límite**: fecha y hora exacta
    - Link para subir comprobante

### 4. **Huésped recibe el email**
El email incluye:
- 🎉 Mensaje de felicitación por reserva aceptada
- ⏰ Advertencia del plazo de 6 horas
- 💰 Monto exacto a pagar (50%)
- 🏦 Datos bancarios completos
- 📱 Instrucciones para subir comprobante
- 🔗 Link directo a la reserva

### 5. **Sistema de Control Automático**

#### Cancelación Automática (después de 6 horas)
- Si el huésped NO paga en 6 horas
- Estado cambia a: `cancelled_payment_expired`
- Razón: "Pago no recibido dentro del plazo de 6 horas"
- La propiedad vuelve a estar disponible

#### Recordatorio (30 minutos antes)
- Se envía email recordatorio al huésped
- Advierte que quedan solo 30 minutos
- Incluye link para pago urgente

## 🔧 Endpoints Implementados

### Para el Propietario

#### Confirmar Reserva
```http
PATCH /v1/bookings/{booking_id}/confirm
Authorization: Bearer {token}
```

**Respuesta exitosa:**
```json
{
  "message": "Reserva confirmada exitosamente. Se ha enviado email al huésped solicitando el pago.",
  "booking_id": "uuid",
  "status": "confirmed",
  "payment_deadline": "2025-12-13T20:30:00Z"
}
```

#### Rechazar Reserva
```http
PATCH /v1/bookings/{booking_id}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "No puedo aceptar la reserva en estas fechas"
}
```

### Para Administradores

#### Cancelar Reservas Expiradas (Manual)
```http
POST /v1/scheduled-tasks/cancel-expired-payments
Authorization: Bearer {admin_token}
```

**Respuesta:**
```json
{
  "success": true,
  "cancelled_count": 2,
  "bookings": [
    {
      "booking_id": "uuid",
      "guest_email": "guest@example.com",
      "listing_title": "Casa en Miraflores",
      "deadline": "2025-12-13T14:30:00Z"
    }
  ]
}
```

#### Enviar Recordatorios de Pago
```http
POST /v1/scheduled-tasks/send-payment-reminders
Authorization: Bearer {admin_token}
```

#### Ver Estado de Pagos
```http
GET /v1/scheduled-tasks/booking-payment-status
Authorization: Bearer {admin_token}
```

**Respuesta:**
```json
{
  "total": 5,
  "bookings": [
    {
      "booking_id": "uuid",
      "status": "confirmed",
      "payment_status": "pending",
      "hours_remaining": 4.5,
      "confirmed_at": "2025-12-13T10:00:00Z",
      "payment_deadline": "2025-12-13T16:00:00Z",
      "reservation_paid_at": null
    }
  ]
}
```

## 📊 Base de Datos

### Nuevo Campo en `core.bookings`
```sql
payment_deadline TIMESTAMP WITH TIME ZONE
```

### Nuevo Estado en `booking_status` Enum
```sql
'cancelled_payment_expired'
```

### Funciones SQL Creadas

#### 1. Cancelar Pagos Expirados
```sql
SELECT * FROM core.cancel_expired_payment_bookings();
```

#### 2. Obtener Advertencias de Deadline
```sql
SELECT * FROM core.get_payment_deadline_warnings();
```

### Vista Creada
```sql
SELECT * FROM core.bookings_payment_status;
```

Estados posibles:
- `not_applicable`: No aplica (estado != confirmed)
- `paid`: Ya se pagó
- `no_deadline`: No tiene deadline configurado
- `pending`: Pendiente (aún hay tiempo)
- `expired`: Expirado (pasó el deadline)

## 📧 Emails Implementados

### 1. Email de Solicitud de Pago
**Asunto**: ✅ Reserva Aceptada - Completa tu Pago (50%) - {property}

**Contenido**:
- Mensaje de felicitación
- Detalles de la reserva
- ⏰ Advertencia del plazo de 6 horas
- 💰 Monto exacto a pagar
- 🏦 Datos bancarios (BCP)
- 📝 Instrucciones paso a paso
- 🔗 Botón para subir comprobante

### 2. Email de Recordatorio (30 min antes)
**Asunto**: ⏰ Recordatorio: Tu Pago Vence en {X} minutos - {property}

**Contenido**:
- Advertencia urgente
- Tiempo restante exacto
- Link para pago inmediato

### 3. Email de Cancelación por Expiración
**Asunto**: ❌ Reserva Cancelada - Plazo de Pago Vencido - {property}

**Contenido**:
- Notificación de cancelación
- Motivo: Pago no recibido a tiempo
- Opción de hacer nueva reserva

## ⚙️ Configuración de Tareas Programadas

### Opción 1: Cron Job (Linux/Mac)
```bash
# Editar crontab
crontab -e

# Ejecutar cada 15 minutos
*/15 * * * * curl -X POST http://localhost:8000/v1/scheduled-tasks/cancel-expired-payments -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Enviar recordatorios cada 10 minutos
*/10 * * * * curl -X POST http://localhost:8000/v1/scheduled-tasks/send-payment-reminders -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Opción 2: Windows Task Scheduler
Crear archivo `cancel_expired_payments.ps1`:
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_ADMIN_TOKEN"
}
Invoke-RestMethod -Uri "http://localhost:8000/v1/scheduled-tasks/cancel-expired-payments" -Method POST -Headers $headers
```

Programar en Task Scheduler para ejecutar cada 15 minutos.

### Opción 3: Celery (Recomendado para Producción)
```python
# tasks.py
from celery import Celery
from app.services.booking_scheduler import BookingScheduledTasks
from app.core.database import SessionLocal

celery = Celery('tasks', broker='redis://localhost:6379/0')

@celery.task
def cancel_expired_payments():
    db = SessionLocal()
    try:
        BookingScheduledTasks.cancel_expired_payment_bookings(db)
    finally:
        db.close()

@celery.task
def send_payment_reminders():
    db = SessionLocal()
    try:
        BookingScheduledTasks.send_payment_deadline_warnings(db)
    finally:
        db.close()

# Configurar en celerybeat_schedule
celery.conf.beat_schedule = {
    'cancel-expired-every-15-minutes': {
        'task': 'tasks.cancel_expired_payments',
        'schedule': 900.0,  # 15 minutos
    },
    'send-reminders-every-10-minutes': {
        'task': 'tasks.send_payment_reminders',
        'schedule': 600.0,  # 10 minutos
    },
}
```

## 🧪 Pruebas

### 1. Probar Confirmación Manual
```bash
# Crear una reserva de prueba
# Luego confirmarla como propietario

curl -X PATCH http://localhost:8000/v1/bookings/{booking_id}/confirm \
  -H "Authorization: Bearer YOUR_OWNER_TOKEN"
```

### 2. Verificar Email Enviado
Revisar el email del huésped

### 3. Probar Cancelación Automática
```bash
# Esperar 6 horas O modificar manualmente el deadline en la BD:
UPDATE core.bookings 
SET payment_deadline = NOW() - INTERVAL '1 hour'
WHERE id = '{booking_id}';

# Luego ejecutar cancelación manual:
curl -X POST http://localhost:8000/v1/scheduled-tasks/cancel-expired-payments \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 4. Ver Estado de Pagos
```bash
curl http://localhost:8000/v1/scheduled-tasks/booking-payment-status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 📝 Datos Bancarios (Configurados en Email)

**IMPORTANTE**: Actualizar estos datos en `email_service.py` línea ~380:

```python
Banco: BCP
Cuenta Corriente: 123-456789-0-00
CCI: 00212345678900000000
Titular: EasyRent Perú S.A.C.
```

## 🔐 Seguridad

- ✅ Solo el propietario puede confirmar/rechazar su reserva
- ✅ Solo administradores pueden ejecutar tareas programadas
- ✅ Los emails incluyen tokens únicos de booking
- ✅ Validación de ownership en todos los endpoints

## 📊 Monitoreo

### Logs a Revisar
```bash
# Confirmaciones
grep "Reserva.*confirmada por host" backend.log

# Emails enviados
grep "Email de solicitud de pago enviado" backend.log

# Cancelaciones automáticas
grep "Canceladas.*reservas por pago expirado" backend.log
```

## 🚀 Próximos Pasos Recomendados

1. ✅ **Configurar tarea programada** (cron/celery)
2. ✅ **Actualizar datos bancarios** en email_service.py
3. ✅ **Implementar subida de comprobantes** en frontend
4. ✅ **Crear endpoint para verificar pago** (marcar como paid)
5. ✅ **Dashboard para admin** con métricas de pagos
6. ✅ **Notificaciones push** además de email
7. ✅ **Sistema de reembolsos** automático si se cancela

## 📞 Soporte

Para cualquier duda sobre el sistema de plazos de pago, contactar al equipo de desarrollo.
