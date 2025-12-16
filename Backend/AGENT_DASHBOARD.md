# 🏠 Dashboard del Agente Inmobiliario - EasyRent

## 📋 Descripción

Dashboard completo para agentes inmobiliarios que gestionen propiedades tipo Airbnb. Permite visualizar y gestionar reservas pendientes, aprobarlas o rechazarlas, y ver estadísticas del negocio.

## 🚀 Endpoints Disponibles

### Base URL: `/v1/agent/dashboard`

---

### 1. **GET /** - Dashboard Completo
Obtiene el dashboard completo con estadísticas y todas las reservas.

**Autenticación:** Requerida (Bearer Token)  
**Roles permitidos:** `agent`, `landlord`, `admin`

**Respuesta:**
```json
{
  "stats": {
    "total_properties": 8,
    "active_properties": 5,
    "pending_bookings": 3,
    "confirmed_bookings": 2,
    "completed_bookings": 12,
    "total_revenue_month": 8500.00,
    "total_revenue_year": 45000.00,
    "occupancy_rate": 68.5
  },
  "pending_bookings": [
    {
      "id": "booking-001",
      "status": "pending_confirmation",
      "check_in_date": "2025-12-21",
      "check_out_date": "2025-12-26",
      "nights": 5,
      "number_of_guests": 2,
      "total_price": 1500.00,
      "guest": {
        "id": "guest-001",
        "name": "Carlos Mendoza",
        "email": "carlos.mendoza@email.com",
        "phone": "+51 987654321",
        "avatar_url": "https://i.pravatar.cc/150?img=12",
        "verified": true
      },
      "listing": {
        "id": "listing-001",
        "title": "Departamento moderno en Miraflores",
        "address": "Av. Larco 1234, Miraflores, Lima",
        "property_type": "Departamento",
        "bedrooms": 2,
        "bathrooms": 2,
        "main_image_url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"
      },
      "guest_message": "Hola! Me gustaría reservar este departamento...",
      "host_response": null,
      "created_at": "2025-12-06T10:00:00",
      "confirmed_at": null,
      "cancelled_at": null,
      "reservation_paid": true,
      "checkin_paid": false
    }
  ],
  "upcoming_bookings": [...],
  "recent_bookings": [...]
}
```

---

### 2. **GET /pending** - Solo Reservas Pendientes
Obtiene únicamente las reservas que están pendientes de confirmación.

**Autenticación:** Requerida (Bearer Token)  
**Roles permitidos:** `agent`, `landlord`, `admin`

**Respuesta:**
```json
[
  {
    "id": "booking-001",
    "status": "pending_confirmation",
    "check_in_date": "2025-12-21",
    "check_out_date": "2025-12-26",
    "nights": 5,
    "number_of_guests": 2,
    "total_price": 1500.00,
    "guest": {...},
    "listing": {...},
    "guest_message": "Hola! Me gustaría reservar...",
    "created_at": "2025-12-06T10:00:00",
    "reservation_paid": true
  }
]
```

---

### 3. **POST /{booking_id}/approve** - Aprobar Reserva
Aprueba una reserva pendiente y la confirma.

**Autenticación:** Requerida (Bearer Token)  
**Roles permitidos:** `agent`, `landlord`, `admin`

**Parámetros de ruta:**
- `booking_id` (string, requerido): ID de la reserva a aprobar

**Body:**
```json
{
  "host_response": "¡Bienvenidos! Les enviaré el código de acceso por email."
}
```

**Respuesta:**
```json
{
  "id": "booking-001",
  "listing_id": "listing-001",
  "guest_user_id": "guest-001",
  "host_user_id": "...",
  "status": "confirmed",
  "check_in_date": "2025-12-21",
  "check_out_date": "2025-12-26",
  "nights": 5,
  "total_price": 1500.00,
  "host_response": "¡Bienvenidos! Les enviaré el código de acceso...",
  "confirmed_at": "2025-12-06T12:30:00",
  ...
}
```

---

### 4. **POST /{booking_id}/reject** - Rechazar Reserva
Rechaza una reserva pendiente y la cancela.

**Autenticación:** Requerida (Bearer Token)  
**Roles permitidos:** `agent`, `landlord`, `admin`

**Parámetros de ruta:**
- `booking_id` (string, requerido): ID de la reserva a rechazar

**Body:**
```json
{
  "rejection_reason": "Lo siento, las fechas ya no están disponibles debido a mantenimiento programado."
}
```

**Respuesta:**
```json
{
  "id": "booking-001",
  "listing_id": "listing-001",
  "guest_user_id": "guest-001",
  "host_user_id": "...",
  "status": "cancelled",
  "check_in_date": "2025-12-21",
  "check_out_date": "2025-12-26",
  "cancellation_reason": "Lo siento, las fechas ya no están disponibles...",
  "cancelled_at": "2025-12-06T12:35:00",
  ...
}
```

---

### 5. **GET /stats** - Estadísticas del Agente
Obtiene solo las estadísticas del negocio del agente.

**Autenticación:** Requerida (Bearer Token)  
**Roles permitidos:** `agent`, `landlord`, `admin`

**Respuesta:**
```json
{
  "total_properties": 8,
  "active_properties": 5,
  "pending_bookings": 3,
  "confirmed_bookings": 2,
  "completed_bookings": 12,
  "total_revenue_month": 8500.00,
  "total_revenue_year": 45000.00,
  "occupancy_rate": 68.5
}
```

---

## 🧪 Datos Mockeados

Actualmente el dashboard utiliza datos de ejemplo (mock) que incluyen:

### Huéspedes Mockeados (5 personas)
- Carlos Mendoza, María García, Pedro Sánchez, Ana Torres, Luis Ramírez
- Con emails, teléfonos y avatares de ejemplo
- Estados de verificación variados

### Propiedades Mockeadas (5 propiedades)
- Departamento en Miraflores
- Casa en San Isidro
- Loft en Barranco
- Penthouse en La Punta
- Estudio en San Miguel

### Reservas Mockeadas (7 reservas)
- 3 pendientes de confirmación
- 2 confirmadas próximas
- 2 completadas recientes

### Estadísticas Mockeadas
- 8 propiedades totales
- 5 activas
- Ingresos mensuales: S/ 8,500
- Ingresos anuales: S/ 45,000
- Tasa de ocupación: 68.5%

---

## 🔐 Autenticación

Todos los endpoints requieren autenticación mediante JWT Bearer Token:

```bash
Authorization: Bearer <tu-token-jwt>
```

Solo usuarios con roles de `agent`, `landlord` o `admin` pueden acceder a estos endpoints.

---

## 🧑‍💻 Ejemplos de Uso

### Ejemplo con cURL

```bash
# Obtener dashboard completo
curl -X GET "http://localhost:8000/v1/agent/dashboard/" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Aprobar una reserva
curl -X POST "http://localhost:8000/v1/agent/dashboard/booking-001/approve" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"host_response": "Bienvenidos! El check-in es a partir de las 3pm"}'

# Rechazar una reserva
curl -X POST "http://localhost:8000/v1/agent/dashboard/booking-001/reject" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"rejection_reason": "Fechas no disponibles por mantenimiento"}'
```

### Ejemplo con Python (requests)

```python
import requests

# Configuración
base_url = "http://localhost:8000/v1/agent/dashboard"
token = "tu-token-jwt-aqui"
headers = {"Authorization": f"Bearer {token}"}

# Obtener dashboard
response = requests.get(f"{base_url}/", headers=headers)
dashboard = response.json()

print(f"Reservas pendientes: {len(dashboard['pending_bookings'])}")
print(f"Ingresos del mes: S/ {dashboard['stats']['total_revenue_month']}")

# Aprobar una reserva
booking_id = "booking-001"
approve_data = {
    "host_response": "¡Bienvenidos! Les espero."
}
response = requests.post(
    f"{base_url}/{booking_id}/approve",
    headers=headers,
    json=approve_data
)
print(f"Reserva aprobada: {response.json()['status']}")
```

### Ejemplo con JavaScript (fetch)

```javascript
const baseUrl = 'http://localhost:8000/v1/agent/dashboard';
const token = 'tu-token-jwt-aqui';

// Obtener dashboard
async function getDashboard() {
  const response = await fetch(`${baseUrl}/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  console.log('Reservas pendientes:', data.pending_bookings.length);
  return data;
}

// Aprobar reserva
async function approveBooking(bookingId, message) {
  const response = await fetch(`${baseUrl}/${bookingId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      host_response: message
    })
  });
  return await response.json();
}

// Uso
getDashboard();
approveBooking('booking-001', '¡Bienvenidos!');
```

---

## 📊 Flujo de Trabajo

1. **Huésped crea reserva** → Estado: `pending_confirmation`
2. **Agente revisa en dashboard** → Ve la solicitud con detalles del huésped
3. **Agente toma decisión:**
   - **Aprobar** → Estado: `confirmed` (huésped recibe confirmación)
   - **Rechazar** → Estado: `cancelled` (se devuelve el pago al huésped)
4. **Check-in** → Estado: `checked_in`
5. **Check-out** → Estado: `completed`

---

## 📝 Notas Importantes

- ⚠️ **Los datos actuales son MOCKEADOS** - En producción se conectarán a la base de datos real
- 🔒 Requiere autenticación y rol de agente
- 📧 En producción, aprobar/rechazar enviará emails automáticos al huésped
- 💰 Al rechazar, se procesará automáticamente el reembolso del pago de reserva
- 📱 Perfecto para integrar con un frontend React/Vue/Angular

---

## 🎯 Próximos Pasos (Producción)

1. Conectar a la base de datos real PostgreSQL
2. Implementar sistema de notificaciones por email
3. Integrar con Stripe para reembolsos automáticos
4. Agregar filtros de búsqueda y paginación
5. Implementar webhooks para actualizaciones en tiempo real
6. Agregar sistema de ratings y reviews post-estadía

---

## 🐛 Testing

Para probar los endpoints, puedes usar la documentación interactiva de Swagger:

**http://localhost:8000/docs**

Busca la sección "Agent Dashboard" y prueba cada endpoint con el token de autenticación.

---

## 💡 Integración Frontend

Este dashboard está diseñado para ser consumido por un frontend moderno. Ejemplo de componentes recomendados:

- `AgentDashboard.tsx` - Vista principal con tabs
- `PendingBookingsTable.tsx` - Tabla de reservas pendientes
- `BookingCard.tsx` - Card individual de reserva
- `StatsCards.tsx` - Cards de estadísticas
- `ApproveBookingModal.tsx` - Modal para aprobar
- `RejectBookingModal.tsx` - Modal para rechazar

---

¡Dashboard listo para usar! 🎉
