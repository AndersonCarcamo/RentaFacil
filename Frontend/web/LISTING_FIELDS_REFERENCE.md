# Referencia de Campos de Listing

## 📋 Campos Disponibles en la Base de Datos

### Campos Básicos
- `title` - TEXT NOT NULL
- `description` - TEXT
- `operation` - ENUM (rent, sale, temp_rent)
- `property_type` - ENUM (apartment, house, studio, room, office, commercial, land, warehouse, garage, other)
- `advertiser_type` - ENUM (owner, agency, broker, developer) - **AUTO DETERMINADO**
- `status` - ENUM (draft, published, archived, moderated, removed, pending_verification)

### Ubicación
- `country` - TEXT DEFAULT 'PE'
- `department` - TEXT
- `province` - TEXT
- `district` - TEXT
- `address` - TEXT
- `latitude` - NUMERIC(10,8)
- `longitude` - NUMERIC(11,8)

### Precio
- `price` - NUMERIC(12,2) NOT NULL
- `currency` - CHAR(3) DEFAULT 'PEN'
- `deposit_required` - BOOLEAN DEFAULT FALSE ✨
- `deposit_amount` - NUMERIC(12,2) ✨

### Detalles de la Propiedad
- `area_built` - NUMERIC(8,2)
- `area_total` - NUMERIC(8,2)
- `bedrooms` - INTEGER
- `bathrooms` - INTEGER
- `parking_spots` - INTEGER
- `floors` - INTEGER
- `floor_number` - INTEGER
- `age_years` - INTEGER
- `max_guests` - INTEGER ✨

### Alquiler
- `rental_term` - ENUM (daily, weekly, monthly, yearly)
- `rental_model` - ENUM (traditional, airbnb) ✅
- `rental_mode` - ENUM (full_property, private_room, shared_room) ✅
- `furnished` - BOOLEAN DEFAULT FALSE ✅

### Políticas y Reglas ✨
- `pet_friendly` - BOOLEAN ✅
- `smoking_allowed` - BOOLEAN ✨
- `house_rules` - TEXT ✨
- `cancellation_policy` - TEXT DEFAULT 'flexible' ✨

### Estadía (Airbnb) ✨
- `minimum_stay_nights` - INTEGER DEFAULT 1 ✨
- `maximum_stay_nights` - INTEGER ✨
- `check_in_time` - TIME ✨
- `check_out_time` - TIME ✨

### Servicios Incluidos ✨
- `utilities_included` - BOOLEAN DEFAULT FALSE ✨
- `internet_included` - BOOLEAN DEFAULT FALSE ✨
- `cleaning_included` - BOOLEAN DEFAULT FALSE ✨
- `cleaning_fee` - NUMERIC(12,2) ✨

### Airbnb
- `airbnb_score` - INTEGER (0-100) ✅
- `airbnb_eligible` - BOOLEAN ✅
- `airbnb_opted_out` - BOOLEAN DEFAULT FALSE ✅

### Disponibilidad
- `available_from` - DATE ✨

### Verificación y Contacto
- `verification_status` - ENUM (pending, in_review, verified, rejected)
- `contact_name` - TEXT
- `contact_phone_e164` - TEXT
- `contact_whatsapp_phone_e164` - TEXT
- `contact_whatsapp_link` - TEXT

### Media
- `has_media` - BOOLEAN DEFAULT FALSE
- `slug` - TEXT
- `meta_title` - TEXT
- `meta_description` - TEXT

### Estadísticas
- `views_count` - INTEGER DEFAULT 0
- `leads_count` - INTEGER DEFAULT 0
- `favorites_count` - INTEGER DEFAULT 0
- `rating` - NUMERIC(3,2) (0.00-5.00) ✅
- `total_reviews` - INTEGER DEFAULT 0 ✅

### Publicación
- `published_at` - TIMESTAMPTZ
- `published_until` - TIMESTAMPTZ

### Timestamps
- `created_at` - TIMESTAMPTZ DEFAULT NOW()
- `updated_at` - TIMESTAMPTZ DEFAULT NOW()

---

## 🎯 Organización del Formulario

### Paso 1: Información Básica
- Título
- Descripción
- Tipo de operación (rent/sale/temp_rent)
- Tipo de propiedad
- **Mensaje informativo de advertiser_type**

### Paso 2: Ubicación
- Departamento
- Provincia
- Distrito
- Dirección
- (Opcional: Mapa para lat/long)

### Paso 3: Detalles de la Propiedad
- Área construida
- Área total
- Habitaciones
- Baños
- Estacionamientos
- Piso / Número de pisos
- Antigüedad

### Paso 4: Precio y Condiciones
- Precio
- Moneda
- **¿Requiere depósito?**
- **Monto del depósito**
- Disponible desde

### Paso 5: Tipo de Alquiler (si operation = rent/temp_rent)
- Periodo de alquiler (daily/weekly/monthly/yearly)
- **¿Es para Airbnb?** (rental_model)
- **Modalidad** (full_property/private_room/shared_room)
- **Amoblado**

### Paso 6: Amenidades y Servicios
- Selección de amenidades (de tabla amenities)
- **Servicios incluidos** (utilities, internet)
- **Limpieza incluida**
- **Tarifa de limpieza** (si no incluida)

### Paso 7: Políticas (especialmente para Airbnb)
- **¿Acepta mascotas?**
- **¿Se permite fumar?**
- **Reglas de la casa** (textarea)
- **Política de cancelación** (flexible/moderate/strict)

### Paso 8: Configuración Airbnb (si rental_model = airbnb)
- **Número máximo de huéspedes**
- **Estancia mínima** (noches)
- **Estancia máxima** (noches)
- **Hora de check-in**
- **Hora de check-out**

### Paso 9: Información de Contacto
- Nombre de contacto
- Teléfono
- WhatsApp

### Paso 10: Imágenes y Videos (futuro)
- Subir imágenes
- Subir videos
- Orden de imágenes

---

## 🔄 Lógica Condicional

### Si `operation` = "rent" o "temp_rent":
- Mostrar `rental_term`
- Mostrar opción "¿Es para Airbnb?"
- Si rental_model = "airbnb":
  - Mostrar Paso 8 (Configuración Airbnb)
  - Sugerir amenidades importantes (WiFi, Limpieza, etc.)

### Si `operation` = "sale":
- Ocultar campos de alquiler
- Mostrar solo: precio, depósito, disponibilidad

### Si `property_type` = "room":
- Sugerir rental_mode = "private_room" o "shared_room"
- Enfatizar amenidades compartidas

---

## ✅ Validaciones

### Campos Requeridos
- title
- description
- operation
- property_type
- price
- department, province, district

### Validaciones Condicionales
- Si deposit_required = true → deposit_amount es requerido
- Si cleaning_included = false y rental_model = airbnb → sugerir cleaning_fee
- Si rental_model = airbnb → recomendar minimum_stay_nights
- Si operation = rent → rental_term es requerido

---

## 🎨 UX Recommendations

1. **Wizard multi-paso**: Más fácil de completar
2. **Progreso visual**: Barra de progreso o pasos numerados
3. **Guardado automático**: Como draft
4. **Previsualización**: Ver cómo se verá la publicación
5. **Tooltips**: Explicar cada campo
6. **Sugerencias inteligentes**: Basado en tipo de propiedad
7. **Calculadora de elegibilidad Airbnb**: Mostrar score en tiempo real

---

Leyenda:
- ✅ Ya existía en la BD
- ✨ Agregado con script 18_add_listing_airbnb_fields.sql
