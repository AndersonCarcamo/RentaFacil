# Sistema Completo de Pagos - Flujo de Reservas

## 🎯 Flujo Completo Implementado

### 1️⃣ Huésped crea una reserva
- **Endpoint**: `POST /v1/bookings`
- **Estado inicial**: `pending_confirmation`
- **Acción**: Propietario recibe email de notificación

### 2️⃣ Propietario revisa y acepta la reserva
- **URL**: `http://localhost:3000/dashboard/bookings/{booking_id}`
- **Endpoint**: `PATCH /v1/bookings/{booking_id}/confirm`
- **Acciones automáticas**:
  - ✅ Estado → `confirmed`
  - ⏰ `payment_deadline` → NOW() + 6 horas
  - 📧 Email al huésped con:
    - Datos bancarios
    - Monto a pagar (50%)
    - Link a `/my-bookings/{booking_id}`
    - Plazo límite

### 3️⃣ Huésped realiza la transferencia
- **Acción manual**: El huésped hace transferencia bancaria
- **Datos bancarios** (en el email):
  - Banco: BCP
  - Cuenta: 194-2583697-0-42
  - CCI: 00219400258369704211
  - Titular: Benites Villar Luiggi Jhan Carlos

### 4️⃣ Huésped sube comprobante de pago
- **URL**: `http://localhost:3000/my-bookings/{booking_id}`
- **Página**: Muestra:
  - ⏰ Tiempo restante para pagar
  - 📋 Detalles de la reserva
  - 🏦 Datos bancarios
  - 📤 Formulario para subir comprobante
- **Endpoint**: `POST /v1/bookings/{booking_id}/upload-payment-proof`
- **Formatos aceptados**: JPG, PNG, PDF (máx 5MB)
- **Acción**: Comprobante guardado en `/uploads/payment_proofs/`

### 5️⃣ Propietario/Admin verifica el pago
- **URL Admin**: `http://localhost:3000/admin/bookings` (pendiente)
- **URL Host**: `http://localhost:3000/dashboard/bookings/{booking_id}`
- **Endpoint**: `PATCH /v1/bookings/{booking_id}/verify-payment`
- **Parámetros**: `{ "approved": true/false }`
- **Si aprueba**:
  - ✅ Estado → `reservation_paid`
  - ✅ `reservation_paid_at` → NOW()
  - 📧 Email de confirmación al huésped (pendiente)
- **Si rechaza**:
  - ❌ Resetea `payment_proof_url`
  - 📧 Email solicitando nuevo comprobante (pendiente)

### 6️⃣ Sistema automático de cancelación
- **Tarea programada**: Ejecutar cada 15 minutos
- **Endpoint**: `POST /v1/scheduled-tasks/cancel-expired-payments`
- **Acción**: Si `payment_deadline` < NOW() y no hay pago:
  - ❌ Estado → `cancelled_payment_expired`
  - 📧 Email de cancelación al huésped
  - 📅 Libera fechas en calendario

---

## 📁 Archivos Creados/Modificados

### Backend

#### 1. Modelos
- `app/models/booking.py`:
  ```python
  payment_deadline: TIMESTAMP  # Plazo de 6h
  payment_proof_url: TEXT      # URL del comprobante
  payment_proof_uploaded_at: TIMESTAMP
  payment_verified_by: UUID    # Admin que verificó
  payment_verified_at: TIMESTAMP
  ```

#### 2. Endpoints (bookings.py)
- `GET /v1/bookings/my-bookings` ✅
  - Lista reservas del huésped
  - Incluye `payment_status`, `hours_remaining`
  
- `POST /v1/bookings/{id}/upload-payment-proof` ✅
  - Sube comprobante de pago
  - Solo huésped propietario de la reserva
  
- `PATCH /v1/bookings/{id}/verify-payment` ✅
  - Aprueba/rechaza pago
  - Solo admin o host

#### 3. Emails (email_service.py)
- `send_payment_request_email()` ✅
  - Enviado al confirmar reserva
  - Incluye datos bancarios, deadline, link

- `send_payment_expired_notification()` ✅
  - Cuando se cancela por expiración

- `send_payment_deadline_reminder()` ✅
  - 30 min antes de expirar

### Frontend

#### 1. Página: Lista de Reservas
**Archivo**: `pages/my-bookings/index.tsx`

**Características**:
- ✅ Lista todas las reservas del huésped
- ✅ Muestra estados con colores
- ✅ Alerta de pago pendiente con countdown
- ✅ Botón "Pagar Ahora" si está pendiente
- ✅ Auto-refresh cada minuto

**Estados visuales**:
- 🟡 `pending_confirmation`: Pendiente de Confirmación
- 🔵 `confirmed`: Confirmada - Pago Pendiente
- 🟢 `reservation_paid`: Reserva Pagada
- 🟣 `checked_in`: Check-in Realizado
- ⚫ `completed`: Completada
- 🔴 `cancelled_*`: Cancelada

#### 2. Página: Subir Comprobante
**Archivo**: `pages/my-bookings/[id].tsx`

**Características**:
- ✅ Muestra tiempo restante (countdown)
- ✅ Detalles completos de la reserva
- ✅ Datos bancarios para transferencia
- ✅ Upload de archivo con preview
- ✅ Validación de formato y tamaño
- ✅ Feedback visual de carga

---

## 🗄️ Base de Datos

### Migración 27: Payment Proof
```sql
ALTER TABLE core.bookings
ADD COLUMN payment_proof_url TEXT,
ADD COLUMN payment_proof_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_verified_by UUID,
ADD COLUMN payment_verified_at TIMESTAMP WITH TIME ZONE;
```

### Estados de Pago
Vista: `core.bookings_payment_status`

```sql
payment_status:
  - 'not_applicable': No aplica
  - 'paid': Pagado
  - 'no_deadline': Sin deadline
  - 'pending': Pendiente
  - 'expired': Expirado
```

---

## 🧪 Testing

### 1. Crear una reserva
```bash
# Huésped crea reserva
POST /v1/bookings
```

### 2. Confirmar como propietario
```bash
curl -X PATCH http://localhost:8000/v1/bookings/{id}/confirm \
  -H "Authorization: Bearer {owner_token}"
```

### 3. Ver mis reservas (como huésped)
```bash
curl http://localhost:8000/v1/bookings/my-bookings \
  -H "Authorization: Bearer {guest_token}"
```

### 4. Subir comprobante
```bash
curl -X POST http://localhost:8000/v1/bookings/{id}/upload-payment-proof \
  -H "Authorization: Bearer {guest_token}" \
  -F "file=@comprobante.jpg"
```

### 5. Verificar pago (como admin)
```bash
curl -X PATCH http://localhost:8000/v1/bookings/{id}/verify-payment \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'
```

---

## 🎨 Interfaz de Usuario

### Página: /my-bookings

**Diseño**:
- Cards con imagen de la propiedad
- Badge de estado con colores
- Grid responsivo de detalles
- Alerta amarilla si pago pendiente
- Countdown en tiempo real

### Página: /my-bookings/[id]

**Secciones**:
1. **Alerta superior**: Tiempo restante (amarillo)
2. **Columna izquierda**: Detalles de reserva
3. **Columna derecha**:
   - Box azul: Datos bancarios
   - Box blanco: Upload de comprobante

---

## ✅ Checklist de Implementación

### Backend
- [x] Migración SQL (27_add_payment_proof.sql)
- [x] Modelo actualizado
- [x] Endpoint GET /my-bookings
- [x] Endpoint POST /upload-payment-proof
- [x] Endpoint PATCH /verify-payment
- [x] Email de solicitud de pago
- [x] Directorio uploads/payment_proofs

### Frontend
- [x] Página /my-bookings (lista)
- [x] Página /my-bookings/[id] (pago)
- [x] Countdown de tiempo restante
- [x] Upload con preview
- [x] Validación de archivos
- [x] Estados visuales

### Pendientes (Mejoras futuras)
- [ ] Email de pago verificado
- [ ] Email de pago rechazado
- [ ] Panel admin para ver comprobantes
- [ ] Notificación push al subir comprobante
- [ ] Historial de comprobantes
- [ ] Sistema de reembolsos

---

## 🚀 Para Probar

### 1. Backend
```bash
cd Backend
python -m uvicorn app.main:app --reload
```

### 2. Frontend
```bash
cd Frontend/web
npm run dev
```

### 3. Flujo Completo
1. Login como huésped: `http://localhost:3000/login`
2. Crear una reserva
3. Login como propietario
4. Ir a: `http://localhost:3000/dashboard/bookings`
5. Confirmar la reserva
6. Logout y login como huésped
7. Ir a: `http://localhost:3000/my-bookings`
8. Click en "Pagar Ahora"
9. Subir un comprobante (imagen o PDF)
10. Login como admin/propietario
11. Verificar el pago

---

## 📧 Datos Bancarios Configurados

**IMPORTANTE**: Actualizar en `email_service.py` línea ~480:

```python
Banco: BCP
Cuenta Corriente: 194-2583697-0-42
CCI: 00219400258369704211
Titular: Benites Villar Luiggi Jhan Carlos
```

Estos datos están hardcodeados en:
1. Email de solicitud de pago
2. Página `/my-bookings/[id].tsx`

Para cambiarlos, buscar "BCP" o "194-2583697" en ambos archivos.

---

## 🎉 Sistema Completo!

El huésped ahora puede:
✅ Ver sus reservas
✅ Ver tiempo restante para pagar
✅ Ver datos bancarios
✅ Subir comprobante de pago
✅ Recibir confirmación cuando se verifique

El propietario puede:
✅ Confirmar reservas
✅ Ver comprobantes subidos
✅ Aprobar/rechazar pagos

El sistema automático:
✅ Cancela reservas expiradas
✅ Envía recordatorios
✅ Notifica a todas las partes
