# Sistema de Reservas para Propiedades Tipo Airbnb

## Flujo de Reserva Automatizado

### Resumen
Sistema de reservas con pago fraccionado para propiedades tipo "Airbnb" (alquiler temporal/vacacional).

### Flujo Completo

```
1. RESERVAR (Usuario)
   ↓
2. CONFIRMACIÓN DE DISPONIBILIDAD (Propietario)
   ↓
3. PAGO 50% - RESERVA (Usuario con tarjeta)
   ↓
4. CHECK-IN + PAGO 50% RESTANTE (Usuario con tarjeta)
   ↓
5. RESERVA COMPLETADA
```

---

## Estados de Reserva

```sql
CREATE TYPE core.booking_status AS ENUM (
    'pending_confirmation',    -- Esperando confirmación del propietario
    'confirmed',               -- Confirmada, esperando pago de reserva
    'reservation_paid',        -- 50% pagado (reserva confirmada)
    'checked_in',              -- Check-in realizado
    'completed',               -- Reserva completada (100% pagado)
    'cancelled_by_guest',      -- Cancelada por huésped
    'cancelled_by_host',       -- Cancelada por propietario
    'cancelled_no_payment',    -- Cancelada por falta de pago
    'refunded'                 -- Reembolsada
);
```

## Estados de Pago

```sql
CREATE TYPE core.payment_status AS ENUM (
    'pending',          -- Pendiente de pago
    'processing',       -- Procesando pago
    'completed',        -- Pago exitoso
    'failed',           -- Pago fallido
    'refunded',         -- Reembolsado
    'partially_refunded' -- Parcialmente reembolsado
);
```

## Tipos de Pago

```sql
CREATE TYPE core.payment_type AS ENUM (
    'reservation',      -- Pago de reserva (50%)
    'checkin',          -- Pago al check-in (50%)
    'full',             -- Pago completo (100%)
    'refund'            -- Reembolso
);
```

---

## Estructura de Tablas

### 1. Tabla: bookings

```sql
CREATE TABLE core.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL,
    guest_user_id UUID NOT NULL,
    host_user_id UUID NOT NULL,
    
    -- Fechas
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights INTEGER NOT NULL,
    
    -- Precios
    price_per_night NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    reservation_amount NUMERIC(10,2) NOT NULL, -- 50% del total
    checkin_amount NUMERIC(10,2) NOT NULL,     -- 50% del total
    service_fee NUMERIC(10,2) DEFAULT 0,
    cleaning_fee NUMERIC(10,2) DEFAULT 0,
    
    -- Estado
    status core.booking_status NOT NULL DEFAULT 'pending_confirmation',
    
    -- Huéspedes
    number_of_guests INTEGER NOT NULL,
    
    -- Mensajes
    guest_message TEXT,
    host_response TEXT,
    cancellation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    reservation_paid_at TIMESTAMPTZ,
    checked_in_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
    CONSTRAINT valid_nights CHECK (nights > 0),
    CONSTRAINT valid_guests CHECK (number_of_guests > 0),
    
    -- Foreign Keys
    CONSTRAINT fk_listing FOREIGN KEY (listing_id) 
        REFERENCES core.listings(id) ON DELETE CASCADE,
    CONSTRAINT fk_guest FOREIGN KEY (guest_user_id) 
        REFERENCES core.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_host FOREIGN KEY (host_user_id) 
        REFERENCES core.users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_bookings_listing ON core.bookings(listing_id);
CREATE INDEX idx_bookings_guest ON core.bookings(guest_user_id);
CREATE INDEX idx_bookings_host ON core.bookings(host_user_id);
CREATE INDEX idx_bookings_status ON core.bookings(status);
CREATE INDEX idx_bookings_dates ON core.bookings(check_in_date, check_out_date);
```

### 2. Tabla: booking_payments

```sql
CREATE TABLE core.booking_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL,
    
    -- Tipo y monto
    payment_type core.payment_type NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PEN',
    
    -- Estado
    status core.payment_status NOT NULL DEFAULT 'pending',
    
    -- Información de pago
    payment_method VARCHAR(50), -- 'card', 'stripe', etc.
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB,
    error_message TEXT,
    
    -- Foreign Key
    CONSTRAINT fk_booking FOREIGN KEY (booking_id) 
        REFERENCES core.bookings(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_payments_booking ON core.booking_payments(booking_id);
CREATE INDEX idx_payments_status ON core.booking_payments(status);
CREATE INDEX idx_payments_stripe ON core.booking_payments(stripe_payment_intent_id);
```

### 3. Tabla: booking_calendar (Disponibilidad)

```sql
CREATE TABLE core.booking_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL,
    date DATE NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    price_override NUMERIC(10,2), -- Precio especial para esta fecha
    minimum_nights INTEGER,
    booking_id UUID, -- Si está reservada, referencia a la reserva
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraint: Una fecha por propiedad
    CONSTRAINT unique_listing_date UNIQUE (listing_id, date),
    
    -- Foreign Keys
    CONSTRAINT fk_listing FOREIGN KEY (listing_id) 
        REFERENCES core.listings(id) ON DELETE CASCADE,
    CONSTRAINT fk_booking FOREIGN KEY (booking_id) 
        REFERENCES core.bookings(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_calendar_listing ON core.booking_calendar(listing_id);
CREATE INDEX idx_calendar_date ON core.booking_calendar(date);
CREATE INDEX idx_calendar_available ON core.booking_calendar(is_available);
```

---

## API Endpoints

### 1. Crear Reserva (Usuario)

**POST** `/api/v1/bookings`

```json
{
  "listing_id": "uuid",
  "check_in_date": "2025-12-01",
  "check_out_date": "2025-12-05",
  "number_of_guests": 2,
  "guest_message": "Mensaje opcional para el propietario"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "pending_confirmation",
  "total_price": 800.00,
  "reservation_amount": 400.00,
  "checkin_amount": 400.00,
  "nights": 4
}
```

### 2. Confirmar Disponibilidad (Propietario)

**PATCH** `/api/v1/bookings/{booking_id}/confirm`

```json
{
  "host_response": "Mensaje de confirmación"
}
```

### 3. Pagar Reserva 50% (Usuario)

**POST** `/api/v1/bookings/{booking_id}/payment/reservation`

```json
{
  "payment_method_id": "pm_stripe_xxx",
  "card_token": "tok_xxx"
}
```

**Response:**
```json
{
  "payment_id": "uuid",
  "status": "completed",
  "amount": 400.00,
  "booking_status": "reservation_paid"
}
```

### 4. Check-in + Pago 50% Restante (Usuario)

**POST** `/api/v1/bookings/{booking_id}/checkin`

```json
{
  "payment_method_id": "pm_stripe_xxx"
}
```

### 5. Consultar Disponibilidad

**GET** `/api/v1/listings/{listing_id}/availability?start_date=2025-12-01&end_date=2025-12-31`

**Response:**
```json
{
  "available_dates": [
    {
      "date": "2025-12-01",
      "is_available": true,
      "price": 200.00
    }
  ]
}
```

### 6. Cancelar Reserva

**POST** `/api/v1/bookings/{booking_id}/cancel`

```json
{
  "cancellation_reason": "Motivo de cancelación",
  "cancelled_by": "guest" // o "host"
}
```

---

## Reglas de Negocio

### 1. **Validación de Disponibilidad**
- Verificar que todas las fechas estén disponibles antes de crear reserva
- Bloquear fechas automáticamente al confirmar reserva

### 2. **Pagos Fraccionados**
- **50% al reservar**: Confirma la reserva y bloquea fechas
- **50% al check-in**: Completa el pago total

### 3. **Tiempos Límite**
- Propietario tiene **24 horas** para confirmar disponibilidad
- Usuario tiene **48 horas** para pagar después de confirmación
- Auto-cancelación si no se cumple el tiempo límite

### 4. **Cancelaciones**
- **Por huésped antes del check-in**: Reembolso 50% si pagó reserva
- **Por propietario**: Reembolso 100% + penalización al host
- **Sin pago de reserva**: Cancelación sin costo

### 5. **Notificaciones**
- Email/notificación en cada cambio de estado
- Recordatorio de pago 24h antes de vencimiento
- Recordatorio de check-in 24h antes

---

## Integración con Stripe

### Setup
```python
import stripe
stripe.api_key = settings.STRIPE_SECRET_KEY
```

### Crear Payment Intent (Reserva 50%)
```python
intent = stripe.PaymentIntent.create(
    amount=int(reservation_amount * 100),  # centavos
    currency='pen',
    metadata={
        'booking_id': str(booking_id),
        'payment_type': 'reservation',
        'user_id': str(user_id)
    }
)
```

### Confirmar Pago
```python
stripe.PaymentIntent.confirm(
    intent_id,
    payment_method=payment_method_id
)
```

---

## Validaciones Frontend

### Al crear reserva:
1. ✅ Verificar disponibilidad de fechas
2. ✅ Validar número de huéspedes vs capacidad
3. ✅ Calcular precio total (noches × precio_noche + fees)
4. ✅ Mostrar resumen con breakdown de precios

### Al pagar:
1. ✅ Validar tarjeta con Stripe Elements
2. ✅ Mostrar monto exacto (50% o restante)
3. ✅ Confirmar antes de procesar

### Calendario:
1. ✅ Bloquear fechas no disponibles
2. ✅ Mostrar precios por fecha
3. ✅ Validar mínimo de noches

---

## Flujo Completo Ilustrado

```
┌─────────────┐
│   USUARIO   │
│  (Huésped)  │
└──────┬──────┘
       │
       ├─► 1. Selecciona fechas y crea reserva
       │      Status: pending_confirmation
       │
┌──────▼──────────┐
│  PROPIETARIO    │
└──────┬──────────┘
       │
       ├─► 2. Confirma disponibilidad (24h)
       │      Status: confirmed
       │
┌──────▼──────┐
│   USUARIO   │
└──────┬──────┘
       │
       ├─► 3. Paga 50% con tarjeta (48h)
       │      Payment: reservation (50%)
       │      Status: reservation_paid
       │
       ├─► 4. Día del check-in
       │      Paga 50% restante
       │      Payment: checkin (50%)
       │      Status: checked_in
       │
       ├─► 5. Fin de estancia
       │      Status: completed
       │
       └─► ✅ RESERVA COMPLETADA
```

---

## Próximos Pasos de Implementación

### Backend:
1. ✅ Crear migraciones SQL (enums, tablas, índices)
2. ✅ Modelos SQLAlchemy (bookings, payments, calendar)
3. ✅ Schemas Pydantic (validaciones)
4. ✅ Services (lógica de negocio)
5. ✅ Endpoints API
6. ✅ Integración Stripe
7. ✅ Sistema de notificaciones
8. ✅ Cron jobs (auto-cancelaciones, recordatorios)

### Frontend:
1. ✅ Componente de calendario de disponibilidad
2. ✅ Flujo de creación de reserva
3. ✅ Integración Stripe Elements
4. ✅ Panel de gestión de reservas (huésped)
5. ✅ Panel de gestión de reservas (propietario)
6. ✅ Sistema de notificaciones en tiempo real

---

## Consideraciones Adicionales

### Seguridad:
- Validar que el usuario sea el huésped antes de permitir pagos
- Validar que el propietario sea el owner antes de confirmar
- Tokens de pago de un solo uso
- Webhook verification con Stripe

### Performance:
- Cache de disponibilidad de calendario
- Índices en fechas y estados
- Particionado de tablas por fecha si crece mucho

### Escalabilidad:
- Queue para procesamiento de pagos (Celery)
- Webhooks de Stripe para actualizaciones asíncronas
- Sistema de eventos para notificaciones
