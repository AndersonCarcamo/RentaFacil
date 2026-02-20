
# Sistema de Base de Datos - Marketplace Inmobiliario Renta Facil

TITULO DE EMPRESA: Renta Facil

## Resumen Ejecutivo

### Objetivos del Proyecto
Este sistema de base de datos ha sido diseñado específicamente para **Inmobiliaria Benites** como una plataforma marketplace inmobiliaria escalable y empresarial. El sistema soporta múltiples agencias, gestión avanzada de propiedades, tracking completo de leads, analytics en tiempo real y cumplimiento total con la Ley 29733 de Protección de Datos Personales del Perú.

### Características Técnicas Clave
- **PostgreSQL 17.6** con particionado avanzado mensual
- **Arquitectura modular** en 12 archivos SQL especializados  
- **Claves primarias compuestas** para compatibilidad con particionado
- **Sistema de auditoría empresarial** con trazabilidad completa
- **Cumplimiento legal** Ley 29733 con gestión granular de consentimientos
- **Analytics en tiempo real** con vistas materializadas optimizadas
- **Autenticación Firebase** integrada con gestión híbrida de usuarios

## Sistema de Autenticación

### Arquitectura de Autenticación
El sistema utiliza **Firebase Authentication** como proveedor principal de autenticación, con soporte para desarrollo local sin Firebase configurado.

#### Flujo de Autenticación
1. **Frontend** → Firebase Authentication (Google, Email/Password, redes sociales)
2. **Firebase** → Genera ID Token JWT
3. **Frontend** → Envía token a Backend API
4. **Backend** → Verifica token con Firebase Admin SDK
5. **Backend** → Busca/crea usuario en PostgreSQL por `firebase_uid`
6. **Backend** → Genera JWT tokens internos para sesiones

#### Tabla de Usuarios
```sql
CREATE TABLE core.users (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid            TEXT UNIQUE,  -- ✅ Identificador Firebase
    email                   CITEXT UNIQUE NOT NULL,
    phone                   TEXT,
    first_name              TEXT,
    last_name               TEXT,
    profile_picture_url     TEXT,
    national_id             TEXT,
    national_id_type        TEXT DEFAULT 'DNI',
    is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    role                    core.user_role NOT NULL DEFAULT 'user',
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at           TIMESTAMPTZ,
    login_count             INTEGER NOT NULL DEFAULT 0
);
```

#### Características de Seguridad
- **Sin almacenamiento de contraseñas**: Delegado completamente a Firebase
- **Tokens JWT duales**: Firebase para autenticación, JWT interno para autorización
- **Verificación automática**: Firebase maneja verificación de email/teléfono
- **Soporte multi-proveedor**: Google, Facebook, Apple, Email/Password
- **Modo desarrollo**: Funciona sin Firebase configurado (mock tokens)

### Configuración Firebase

#### Variables de Entorno Requeridas
```env
# Firebase Authentication
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccount.json
# O alternativamente:
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
FIREBASE_PROJECT_ID=your-firebase-project-id
```

#### Dependencias Python
```requirements
firebase-admin==6.2.0
google-auth==2.23.4
```

### Endpoints de Autenticación

#### POST /auth/register
Registra un nuevo usuario (opcionalmente con Firebase UID)
```json
{
  "email": "usuario@ejemplo.com",
  "first_name": "Juan",
  "last_name": "Pérez", 
  "phone": "+51987654321",
  "firebase_uid": "firebase_user_id_123", // Opcional
  "role": "user"
}
```

#### POST /auth/login
Autenticación con Firebase token
```json
{
  "firebase_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Proceso de Verificación
- **Email/Teléfono**: Manejado por Firebase Authentication
- **Documentos**: Proceso interno posterior al registro
- **KYC**: Workflow de verificación empresarial (tablas moderation.*)

## Arquitectura del Sistema

### Esquemas Organizacionales
| Esquema | Propósito | Tablas Críticas | Particionado |
|---------|-----------|----------------|--------------|
| **core** | Entidades de negocio | users, agencies, listings | listings |
| **analytics** | Métricas y eventos | events, materialized views | events |
| **moderation** | Verificación de contenido | verifications | verifications |
| **sec** | Seguridad y auditoría | audit_log, user_sessions, consents | No |

### Estrategia de Particionado
**Implementación de RANGE Partitioning en PostgreSQL 17.x**

```sql
-- Patrón de particionado mensual
CREATE TABLE core.listings (
    id UUID,
    created_at TIMESTAMPTZ,
    -- ... otros campos
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Particiones automáticas mensuales
CREATE TABLE core.listings_2025_01 PARTITION OF core.listings
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

#### Tablas Particionadas por Alto Volumen
1. **core.listings** - Anuncios de propiedades (alto volumen de creación)
2. **core.leads** - Leads de contacto (alto volumen diario)
3. **analytics.events** - Eventos de usuario (tracking continuo)
4. **moderation.verifications** - Workflow de verificación
3. **03_core_tables.sql** - Tablas principales (usuarios, listings, multimedia) ✅ **Con particionado corregido**
4. **04_user_interactions.sql** - Leads, favoritos, alertas, amenities ✅ **Con FK compuestas corregidas**
5. **05_analytics.sql** - Eventos y materialized views
6. **06_verification_workflow.sql** - Sistema de verificación de anuncios
7. **07_security_audit.sql** - Auditoría, consentimientos y RLS
8. **08_subscription_plans.sql** - Planes y suscripciones
9. **09_billing_payments.sql** - Facturación, pagos y reembolsos
10. **10_partition_management.sql** - Helpers de particionamiento automático
11. **11_business_rules.sql** - Triggers y reglas de negocio
12. **12_sample_data.sql** - Datos de prueba y configuración inicial

### 16.3 Correcciones implementadas en módulos 03-04

**Módulo 03 - Core Tables:**
- ✅ Clave primaria compuesta `(id, created_at)` en `core.listings`
- ✅ Claves foráneas compuestas en `core.images` y `core.videos`
- ✅ Delimitadores únicos en funciones de particionado
- ✅ Índices únicos que incluyen columna de partición

**Módulo 04 - User Interactions:**
- ✅ Clave primaria compuesta `(id, created_at)` en `core.leads`
- ✅ Claves foráneas compuestas en todas las tablas relacionadas
- ✅ Seguimiento UTM completo para analytics de marketing
- ✅ Constraints únicos actualizados para incluir columnas de partición
- ✅ Índices optimizados por partición con mejores patrones de consultaos avanzados, multimedia y seguridad acorde a la Ley de Protección de Datos Personales (Ley N° 29733).

## 2. Requisitos funcionales

- Catálogo de anuncios (listings) con estados: borrador, pendiente de verificación, publicado, archivado.
- Verificación previa del inmueble con tiempo/ventana configurable antes de publicar.
- Búsqueda y filtros:
  - Similitud de texto (title/description) y full text search (FTS) en español.
  - Categorías: dormitorios, baños, estacionamientos, precio (rango), área (m²), distrito/provincia, tipo de operación (alquilar, comprar, temporal, proyectos, traspaso), tipo de inmueble, término de renta (diario, semanal, mensual, etc.), tipo de anunciante (dueño, agente, etc.), antigüedad (años), fecha de publicación, amenities/servicios, y si tiene multimedia.
- Multimedia por anuncio: imágenes y videos con metadatos (dimensiones, duración, tamaño).
  - **Contadores automáticos**: `image_count`, `video_count` (campos GENERATED que se actualizan automáticamente)
  - **Flag de multimedia**: `has_media` (BOOLEAN calculado como `(image_count + video_count) > 0`)
  - **Triggers de validación**: `core.enforce_media_limits` valida límites por plan antes de insertar
- Planes y límites por anunciante: número máximo de publicaciones activas, duración de publicación, límites/calidad de imágenes y videos.
- Indicador de plan activo por anunciante; restricciones aplicadas automáticamente.
- Métricas para el anunciante: vistas, favoritos, contactos/leads, CTR de galería, tiempo hasta verificación, días en mercado, precio/m², conversiones por canal.

## 3. Requisitos no funcionales

- ACID: transacciones, constraints, claves foráneas, enumeraciones.
- Escalabilidad: particionado en tablas críticas, índices adecuados, posibilidad de réplicas de solo lectura.
- Seguridad: RLS, roles, auditoría, cifrado en tránsito (TLS) y políticas de retención.
- Extensibilidad: JSONB/FTS, PostGIS opcional, materialized views (MVs) para analítica.
- Disponibilidad: respaldos continuos (WAL), compatibilidad con pgBackRest; opción de HA/replicación en caliente.

## 4. Arquitectura de la BD

- Schemas:
  - `core`: entidades operacionales (usuarios, listings, media, planes, etc.).
  - `analytics`: eventos de interacción y MVs para dashboards.
  - `sec`: auditoría, consentimientos y seguridad.
- Modelo: normalizado (≈3FN), con catálogos para amenities/servicios y distritos.
- Particionamiento: `core.listings`, `core.leads` y `analytics.events` por mes; otras por región si aplica.

## 5. Extensiones y compatibilidad (PG 17)

| Extensión   | Funcionalidad                               | Compatibilidad |
| ----------- | ------------------------------------------- | -------------- |
| `pgcrypto`  | UUIDs, hashing, cifrado                     | ✅ PG 17       |
| `uuid-ossp` | UUID v1/v4/v5                               | ✅ PG 17       |
| `citext`    | Texto case-insensitive                      | ✅ PG 17       |
| `pg_trgm`   | Similitud trigramas (fuzzy/autocompletar)   | ✅ PG 17       |
| `btree_gin` | Índices mixtos BTree+GIN                    | ✅ PG 17       |
| `unaccent`  | Normalización sin acentos en FTS            | ✅ PG 17       |
| `postgis`   | Geolocalización (GIST, consultas por radio) | ✅ PG 17       |
| `tablefunc` | Pivot y análisis de tablas                  | ✅ PG 17       |

Notas: usar diccionario FTS `spanish`; `unaccent` opcional pero recomendado para mejorar recall en búsquedas (Lima/Limá).

## 6. Modelo lógico (principales entidades)

- `core.users` (CITEXT en email; `advertiser_type`: owner/agent/broker/builder/manager/other).
- `core.agencies` y `core.user_agency` (relación anunciante–agencia, opcional).
- `core.plans` y `core.subscriptions` (plan activo, límites y vigencia por anunciante).
- `core.listings` (particionada por mes de `created_at`):
  - **Clave primaria compuesta**: `(id UUID, created_at TIMESTAMPTZ)` - requerida por PostgreSQL para tablas particionadas  
  - **Claves**: `owner_user_id`, `status`, `verification_status`, `operation` (rent/sale/temporary/project/transfer), `property_type` (apartment/house/room/studio/…)
  - **Filtros**: `price/currency`, `area_built`, `area_total`, `bedrooms`, `bathrooms`, `parking_spots`, `floor_number`, `age_years`, `rental_term`, `district/province/country`, `latitude/longitude`, `published_at`, `published_until`, `views_count`, `leads_count`, `favorites_count`
  - **Búsqueda**: `title`, `description`, `slug`, `meta_title`, `meta_description`, `search_doc` (tsvector español + unaccent)
  - **Contacto**: `contact_name`, `contact_phone_e164`, `contact_whatsapp_phone_e164`, `contact_whatsapp_link` (enlaces para contacto directo por WhatsApp)
  - **SEO**: `slug`, `meta_title`, `meta_description` para URLs amigables y optimización
- `core.images`, `core.videos` (con claves foráneas compuestas):
  - **FK compuesta**: `(listing_id, listing_created_at)` → `core.listings(id, created_at)` para mantener integridad referencial
  - **Metadatos completos**: `filename`, `original_url`, `thumbnail_url`, `medium_url`, `alt_text`, `width`, `height`, `file_size`, `duration_seconds` (videos)
  - **Organización**: `display_order`, `is_main` para control de presentación
- `core.amenities` y `core.listing_amenities` (catálogo normalizado para filtros por servicios/ambientes):
  - **Catálogo simple**: `name`, `icon` para amenidades como 'ascensor', 'piscina', etc.
  - **Relación con FK compuesta**: Incluye `listing_created_at` para integridad referencial
- `core.leads`, `favorites`, `alerts` (búsquedas guardadas y interacciones de usuarios):
  - **`core.leads` particionada**: PRIMARY KEY `(id, created_at)` con FK compuesta a listings
  - **Seguimiento UTM**: `utm_source`, `utm_medium`, `utm_campaign` para analytics de marketing
  - **Datos de contacto**: `contact_name`, `contact_email`, `contact_phone`, `message`
  - **Metadatos técnicos**: `ip_address`, `user_agent` para análisis y seguridad
  - **`core.favorites`**: Con FK compuesta para mantener integridad con listings particionados
  - **`core.alerts`**: Búsquedas guardadas con `search_params` JSONB y frecuencias configurables
- `core.listing_verifications` (workflow: pending/verified/rejected; `scheduled_at`, `verified_at`, `reviewer_user_id`).
- `analytics.events` (particionado mensual; vistas, favoritos, contactos, etc.).
- `analytics` MVs: `mv_price_m2_90d`, `mv_leads_daily`, y agregados por distrito/plan.
- `sec.audit_log`, `sec.user_consents` (consentimientos por propósito, Ley 29733).

### 6.1. Diccionario de datos por tabla (implementado en SQL actual)

- core.users
  - PK: id UUID
  - Columnas: email CITEXT (único), password_hash, name, phone, role (user/seller/admin), verified_at, created_at, updated_at
  - Índices: únicos por email
  - Notas: trigger para updated_at

- core.agencies y core.user_agency
  - agencies: PK id UUID; name, email, phone, website, address, description, logo_url, is_verified, timestamps; trigger updated_at
  - user_agency: PK compuesta (user_id, agency_id); FKs a users/agencies

- core.listings (particionada por rango en created_at)
  - **PK compuesta**: (id UUID, created_at TIMESTAMPTZ) - requerimiento PostgreSQL para particionado
  - FKs: owner_user_id → users, agency_id → agencies (opcional)
  - Campos: status (enum: draft/published/archived), operation (enum: sale/rent), property_type (enum: apartment/house/office/land/commercial/other), title, description, price NUMERIC(12,2), currency CHAR(3) (PEN/USD), bedrooms, bathrooms, parking_spots, area_built, area_total, age_years, address, district/province/country, latitude/longitude DECIMAL, published_at, created_at, updated_at, search_doc tsvector (GENERATED)
  - Índices por partición: (status, verification_status, published_at desc), (operation, property_type, price), (district, province, operation, property_type), (owner_user_id, created_at desc), GIN(search_doc), unique(slug, created_at), geo(latitude, longitude)
  - Notas: función helper core.ensure_listings_partition para crear particiones mensuales core.listings_YYYY_MM

- core.images
  - PK: id UUID
  - **FKs compuestas**: (listing_id, listing_created_at) → listings(id, created_at) CASCADE
  - Campos: filename, original_url, thumbnail_url, medium_url, display_order, alt_text, width, height, file_size, is_main, created_at
  - Índices: (listing_id, display_order)

- core.videos  
  - PK: id UUID
  - **FKs compuestas**: (listing_id, listing_created_at) → listings(id, created_at) CASCADE
  - Campos: filename, original_url, thumbnail_url, duration_seconds, file_size, width, height, display_order, is_main, created_at
  - Índices: (listing_id, display_order)

- core.leads (particionada por rango en created_at)
  - PK compuesta: (id UUID, created_at)
  - FKs: (listing_id, listing_created_at) → listings; to_owner_user_id → users
  - Campos: from_name, from_email CITEXT, from_phone, message, source, created_at
  - Índices por partición: (listing_id, created_at), (to_owner_user_id, created_at), BRIN(created_at)
  - Notas: función helper core.ensure_leads_partition → core.leads_YYYY_MM

- core.favorites
  - PK compuesta: (user_id, listing_id, listing_created_at)
  - FKs: (listing_id, listing_created_at) → listings
  - Campos: created_at
  - Índices: (user_id, created_at desc)

- core.alerts
  - PK: id UUID
  - FKs: user_id → users
  - Campos: query_json JSONB, frequency_min, active, last_sent_at, created_at, updated_at
  - Notas: trigger updated_at

- core.plans
  - PK: id UUID; code (único), name, tier, period_months, price_amount/currency
  - Límites: max_active_listings, listing_active_days, max_images_per_listing, max_videos_per_listing, max_video_seconds, max_image_width/height
  - Timestamps y trigger updated_at

- core.subscriptions
  - PK: id UUID; FKs: user_id → users, plan_id → plans
  - Campos: status (trialing/active/past_due/canceled/unpaid), auto_renew, trial_end, current_period_start/end, cancel_at, canceled_at, external ids, meta JSONB, timestamps
  - Índices: (user_id, status)

- core.tax_rates
  - PK: id UUID; code, name, percentage, active, created_at

- core.coupons
  - PK: id UUID; code (único), percent_off o amount_off (+ currency), max_redemptions, expires_at, created_at

- core.invoices
  - PK: id UUID; number (único opcional), user_id, subscription_id, plan_id, currency
  - Montos: amount_due, tax_amount, discount_amount, amount_paid; status (draft/open/paid/void/uncollectible)
  - Otros: tax_rate_id, coupon_id, issued_at, due_at, paid_at, external_invoice_id, meta JSONB
  - Índices: (user_id, status, issued_at desc)

- core.invoice_items
  - PK: id UUID; FK: invoice_id → invoices
  - Campos: description, quantity, unit_amount, currency, plan_id, period_start/end, tax_rate_id, created_at
  - Índices: (invoice_id)

- core.payments
  - PK: id UUID; FKs: invoice_id → invoices, user_id → users
  - Campos: provider (stripe/culqi/mercadopago/paypal/bank_transfer/other), amount, currency, status (pending/succeeded/failed/refunded), provider_payment_id, method_brand, method_last4, receipt_url, failure_code/message, created_at, confirmed_at
  - Índices: (invoice_id, status, created_at desc)

- core.refunds
  - PK: id UUID; FK: payment_id → payments
  - Campos: amount, reason, status (simple), provider_refund_id, created_at
  - Índices: (payment_id)

- analytics.events (particionada por rango en created_at)
  - PK compuesta: (id UUID, created_at)
  - Campos: user_id (opcional), listing_id (opcional), type (view/favorite/contact/search), context JSONB, created_at
  - Índices por partición: (type, created_at), (user_id, created_at), (listing_id, created_at), BRIN(created_at)
  - Notas: función helper analytics.ensure_events_partition → analytics.events_YYYY_MM

- analytics.mv_price_m2_90d (MV)
  - Agrega: distrito, provincia, operation, property_type, día, conteo, avg_price, avg_price_per_m2
  - Índices: (district, province, operation, property_type, day)

- analytics.mv_leads_daily (MV)
  - Agrega: distrito, día, leads_count
  - Índices: (district, day)

- analytics.mv_revenue_daily (MV)
  - Agrega: día, currency, plan_id, invoices_paid, revenue (sum amount_paid)
  - Índices: (day, currency, plan_id)

- analytics.mv_mrr_monthly (MV)
  - Agrega: month, plan_id, currency, active_subs, mrr (price_amount normalizado por period_months)
  - Índices: (month, plan_id)

- sec.audit_log
  - PK: id BIGSERIAL
  - Campos: table_name, action, row_pk, old_data, new_data, actor_id, occurred_at
  - Trigger genérico: sec.audit_trigger para INSERT/UPDATE/DELETE en users, listings y leads

### 6.2. Extensiones implementadas (verificación, amenities, videos)

Estas capacidades ya están implementadas en el SQL actual:

- core.listing_verifications: workflow (pending/verified/rejected) con scheduled_at/verified_at.
- core.amenities y core.listing_amenities: catálogo normalizado de amenidades/servicios por listing.
- core.videos: metadatos de video y FK al listing.
- Enums ampliados/creados: operation_type (+temporary/project/transfer), property_type (+room/studio), listing_status (+pending_verification), rental_term, advertiser_type, verification_status.

## 7. Búsqueda y filtros

- Texto:
  - Índice GIN sobre `search_doc` (tsvector español + unaccent) para FTS.
  - Índices GIN trigram (`pg_trgm`) en `title` y `description` para similitud y autocompletar.
  - Ranking híbrido: `ts_rank` + `similarity(title, :q)`.
- Estructurados:
  - BTREE: `(operation, property_type)`, `price`, `district`, `published_at`, `year_built`, `rental_term`, `advertiser_type`.
  - BRIN: `created_at` para escaneos por fecha en particiones grandes.
  - GIST: `location` (búsqueda por radio/polígono).
- Semántica de filtros sugerida:
  - `bedrooms`/`bathrooms`: mínimo (>=), y por categorías (1, 2, 3, 4+).
  - `price`/`area_m2`: rangos `[min,max]`.
  - `district`: normalizado a catálogo; aceptar búsqueda por prefijo (`ILIKE 'Miraflores%'`) y/o código UBIGEO.
  - `published_at`: desde/hasta; “recientes” por ventana configurable.
  - `antigüedad`: derivada de `extract(year from now()) - year_built`.
  - `has_media`: boolean (basado en contadores).
  - `amenities`: intersección con `listing_amenities`.

**Función de búsqueda implementada**: `core.search_listings(p jsonb, limit_rows int default 20, offset_rows int default 0)` que combina FTS + similitud + filtros; retorna `id, created_at, relevance_score` ordenado por relevancia y frescura.

### 7.1 Ejemplo de uso de búsqueda
```sql
-- Buscar departamentos en Miraflores con filtros múltiples
SELECT l.*, r.relevance_score 
FROM core.search_listings(
  jsonb_build_object(
    'q', 'departamento vista mar',
    'operation', 'rent',
    'district', 'Miraflores',
    'min_price', 1500,
    'max_price', 3000,
    'bedrooms', 2,
    'has_media', true
  ),
  20, -- limit
  0   -- offset
) r
JOIN core.v_published_listings l ON l.id = r.id AND l.created_at = r.created_at;
```

## 8. Índices y particionamiento

- `core.listings`: particionada mensualmente por `created_at`.
  - Por partición (creados automáticamente por helper): `GIN(search_doc)`, `GIN(title gin_trgm_ops)`, `GIN(description gin_trgm_ops)`, `BTREE (status, published_at desc)`, `BTREE price`, `BTREE (operation, property_type)`, `BTREE district`, `BRIN created_at`, `GIST location`, `BTREE published_until`.
- `core.leads` y `analytics.events`: particionadas mensualmente; índices en `(listing_id, created_at)` y `(event_type, created_at)`.
- Funciones helper `ensure_*_partition()` ejecutadas por cron mensual.

### 8.1. Particionamiento detallado y mantenimiento

- Estrategia: particiones mensuales por rango en `created_at` para `core.listings`, `core.leads` y `analytics.events`.
- Nomenclatura de particiones:
  - `core.listings_YYYY_MM`
  - `core.leads_YYYY_MM`
  - `analytics.events_YYYY_MM`
- Creación automática: funciones helper expuestas por el esquema actual:
  - `core.ensure_listings_partition(date)` crea tabla hija y sus índices por partición.
  - `core.ensure_leads_partition(date)` idem para leads.
  - `analytics.ensure_events_partition(date)` idem para events.
- Índices por partición (actuales):
  - Listings: `(status, published_at desc)`, `price`, `(operation, property_type)`, `district`, `GIN(search_doc)`, `BRIN(created_at)`, `GIST(location)`.
  - Leads: `(listing_id, created_at)`, `(to_owner_user_id, created_at)`, `BRIN(created_at)`.
  - Events: `(type, created_at)`, `(user_id, created_at)`, `(listing_id, created_at)`, `BRIN(created_at)`.
  - Nota: ya se crean por partición los índices de trigramas en `title`/`description` y `published_until` para expiración eficiente.
- Operativa:
  - Cron mensual (fin de mes) para crear la partición del mes siguiente y evitar caída en inserciones.
  - Autovacuum/ANALYZE con thresholds ajustados por tamaño; BRIN minimiza costo en escaneos por tiempo.
  - Al archivar datos antiguos, se pueden desprender particiones completas (DETACH/DROP) para retención.

### 8.3. Consideraciones especiales de particionado PostgreSQL

**Claves primarias compuestas obligatorias:**
- En PostgreSQL, las tablas particionadas requieren que la **PRIMARY KEY incluya la columna de partición**
- `core.listings`: PRIMARY KEY (id, created_at) - no puede ser solo (id)
- Esta restricción aplica a todas las constraints UNIQUE también

**Claves foráneas a tablas particionadas:**
- Las FK deben referenciar la clave primaria completa de la tabla particionada
- `core.images` y `core.videos` incluyen `listing_created_at` para formar FK compuesta
- Constraint: `(listing_id, listing_created_at) REFERENCES core.listings(id, created_at)`
- Beneficio: se mantiene integridad referencial completa con CASCADE

**Impacto en la aplicación:**
- Al crear imágenes/videos, incluir tanto `listing_id` como `listing_created_at`
- Los JOINs pueden usar solo `listing_id` (PostgreSQL optimiza automáticamente)
- Las consultas por ID de listing siguen funcionando normalmente

**Funciones helper actualizadas:**
- `core.ensure_listings_partition()` crea índices únicos que incluyen `created_at`
- Índice único para slugs: `(slug, created_at)` en lugar de solo `(slug)`
- Todos los índices por partición respetan esta restricción

- Objetivo: mantener 12–24 meses “calientes” y archivar meses más antiguos sin borrar datos.
- Helpers implementados:
  - `core.ensure_next_month_partitions()` crea las particiones del próximo mes para `core.listings`, `core.leads` y `analytics.events`.
  - `core.detach_old_listings_partitions(retain_months int default 24, archive_schema text default 'archive')` desprende (`DETACH PARTITION`) las particiones de `core.listings` cuyo rango sea anterior al cutoff y mueve la tabla al esquema de archivo (por defecto `archive`).
  - `core.detach_old_leads_partitions(retain_months int default 24, archive_schema text default 'archive')` idem para `core.leads`.
  - `analytics.detach_old_events_partitions(retain_months int default 24, archive_schema text default 'archive')` idem para `analytics.events`.
- Operación recomendada:
  - Mensual: ejecutar `core.ensure_next_month_partitions()` unos días antes del cambio de mes.
  - Trimestral/anual: ejecutar funciones `detach_old_*_partitions(12|24)` para archivar histórico. El esquema `archive` queda fuera del camino crítico de consultas.
  - Opción: respaldar/descartar particiones antiguas en `archive` según políticas.

## 17. Pagos y facturación (implementado)

- Flujo de alto nivel:
  1) Plan (`core.plans`) define precio, moneda, período (meses) y límites de publicación/multimedia.
  2) Suscripción (`core.subscriptions`) vincula usuario↔plan; controla estado (active/past_due/…) y ventana `current_period_start/end`.
  3) Factura (`core.invoices`) emite cargos con items (`core.invoice_items`), IGV (`core.tax_rates`) y cupones (`core.coupons`).
  4) Pago (`core.payments`) registra cobro por proveedor (Stripe/Culqi/MercadoPago/…); trigger marca factura como paid y activa suscripción.
  5) Reembolsos (`core.refunds`) documentan devoluciones parciales o totales.

- Estados clave:
  - Suscripción: trialing, active, past_due, canceled, unpaid.
  - Factura: draft, open, paid, void, uncollectible.
  - Pago: pending, succeeded, failed, refunded.

- Analítica de ingresos:
  - `analytics.mv_revenue_daily`: ingresos diarios por plan/moneda; soporta dashboards por rango.
  - `analytics.mv_mrr_monthly`: MRR aproximado por mes y plan (normaliza períodos anuales a mensual).

- Consultas ejemplo:
  - Ingresos por plan y día: `SELECT day, plan_id, revenue FROM analytics.mv_revenue_daily WHERE day BETWEEN :d1 AND :d2 ORDER BY day;`
  - MRR por mes: `SELECT month, plan_id, mrr FROM analytics.mv_mrr_monthly WHERE month >= date_trunc('month', now()) - interval '6 months';`
  - Suscripciones activas: `SELECT plan_id, COUNT(*) FROM core.subscriptions WHERE status='active' GROUP BY plan_id;`

- Integración de pagos (sugerencias):
  - Proveedores soportados en `billing_provider`: stripe, culqi, mercadopago, paypal, bank_transfer, other.
  - Webhooks: mapear eventos (payment_intent.succeeded, charge.refunded, etc.) a `core.payments`/`core.refunds` para mantener sincronía.
  - Numeración fiscal: si aplica, rellenar `invoices.number` con secuencia local o la del PSP.

**Vistas helper implementadas para planes y límites:**
- `core.v_user_current_plan`: plan activo/vigente por usuario con período de validez
- `core.v_listing_owner_current_plan`: límites efectivos aplicables a cada listing específico

### 9.1 Consultas de planes y límites
```sql
-- Ver plan actual de un usuario
SELECT plan_code, plan_name, tier, max_active_listings, listing_active_days
FROM core.v_user_current_plan 
WHERE user_id = 'uuid-here';

-- Ver límites aplicables a un listing específico
SELECT l.title, p.max_active_listings, p.max_images_per_listing, p.max_videos_per_listing
FROM core.listings l
JOIN core.v_listing_owner_current_plan p ON p.listing_id = l.id 
WHERE l.id = 'uuid-here';
```

## 9. Planes, límites y publicación

- Planes (`core.plans`): definen límites duros: `max_active_listings`, `listing_active_days`, `max_images_per_listing`, `max_videos_per_listing`, `max_video_seconds`, `max_image_width/height`.
- Suscripciones (`core.subscriptions`): asocian usuarios a planes con vigencia (`starts_at`, `ends_at`, `active`).
- Reglas de negocio (a nivel BD vía triggers):
  - Publicar requiere `verification_status = verified`.
  - Respetar `max_active_listings` por anunciante (solo anuncios vigentes: `published_until > now()`).
  - Al publicar: setear `published_at` y `published_until = published_at + listing_active_days` si no están definidos.
  - Carga de multimedia restringida por plan (conteo, dimensiones, duración) y actualiza contadores en listing.
  - `has_media` calculado desde los contadores de imágenes y videos.

## 10. Verificación del inmueble

- Workflow en `core.listing_verifications` con estados: `pending`, `verified`, `rejected`.
- Campos: `scheduled_at`, `verified_at`, `reviewer_user_id`, `notes`.
- SLA/tiempo de verificación: parametrizable a nivel de proceso; solo listings verificados pueden pasar a `published`.

## 11. Analítica y métricas para el anunciante

- Eventos en `analytics.events`: `listing_view`, `gallery_view`, `favorite_add`, `lead_submit`, `contact_reveal`, etc.; incluir `context` (utm/source, device, geo aproximada).
- KPIs sugeridos por anuncio y por plan:
  - Vistas totales/únicas; CTR de galería; tasa de favoritos; tasa de leads; precio/m² vs. mediana del distrito; días en mercado; tasa de verificación a tiempo; desempeño por canal.
- Materialized Views: `mv_leads_daily`, `mv_price_m2_90d`, agregados por distrito/plan; `REFRESH CONCURRENTLY` programado.

## 12. Seguridad y cumplimiento (Perú — Ley N° 29733)

- RLS: 
  - Público: solo `status='published'`, `verification_status='verified'` y `published_until > now()`.
  - Vendedores: acceso a sus propios listings y métricas agregadas.
  - Admin: acceso total.
- Roles: `app_user` (solo lectura pública), `app_seller` (CRUD acotado), `app_admin` (DDL/migraciones).
- Auditoría: `sec.audit_log` para DML y accesos sensibles; `pgaudit` recomendado.
- Consentimientos: `sec.user_consents` (propósitos: marketing/analytics/terms). Soporte para revocación y cumplimiento de derechos ARCO.
- Minimizacion de PII: emails con `citext`, evitar datos innecesarios; políticas de retención (p. ej., leads > 18 meses) y anonimización.
- Cifrado: TLS obligatorio; cifrado en reposo a nivel motor/volumen según infraestructura.

## 13. Operación y mantenimiento

- Particiones: jobs mensuales que crean particiones nuevas antes del rollover.
- Autovacuum/ANALYZE ajustados para tablas grandes; índices BRIN para escaneos por fecha.
- Réplicas de solo lectura para búsquedas pesadas; PgBouncer como pool.
- Backups continuos (WAL) y pruebas de restore periódicas.

## 14. Contratos técnicos (resumen)

- **Función de búsqueda implementada**: `core.search_listings(p jsonb, limit_rows int default 20, offset_rows int default 0)`
  - Entradas (claves JSON): `q`, `district`, `operation`, `property_type`, `min_price`, `max_price`, `bedrooms`, `bathrooms`, `min_area`, `max_area`, `rental_term`, `amenities`, `has_media`, `published_since`, `antiguedad_max`.
  - Salida: `id`, `created_at`, `rank`.
  - Orden: relevancia (FTS + trigram) y frescura (`created_at`).

## 15. Checklist técnico rápido

| Componente             | Estado | Detalles clave |
|------------------------|--------|----------------|
| ACID y normalización   | Sí     | Constraints, PK/FK, enums |
| Extensiones PG 17      | Sí     | citext, pgcrypto, pg_trgm, btree_gin, unaccent, postgis |
| Índices y particiones  | Sí     | GIN, BRIN, GIST, BTREE por partición |
| Búsqueda eficiente     | Sí     | FTS español + trigram; ranking híbrido |
| Verificación           | Sí     | Workflow y gating de publicación |
| Planes y límites       | Sí     | Publicaciones activas, ventanas, multimedia |
| Métricas y MVs         | Sí     | Vistas, leads, price/m², días en mercado |
| Seguridad y RLS        | Sí     | Roles, políticas públicas y por propietario |
| Cumplimiento Perú      | Sí     | Consentimientos y retención |
| Arquitectura modular   | Sí     | 12 módulos SQL especializados |

## 16. Arquitectura modular implementada

El esquema se ha organizado en **12 módulos especializados** para facilitar el mantenimiento, testing y despliegue:

### 16.1 Módulos del sistema
1. **01_extensions_and_schemas.sql** - Extensiones PostgreSQL y esquemas base
2. **02_enums_and_types.sql** - Enumeraciones y tipos personalizados
3. **03_core_tables.sql** - Tablas principales (usuarios, listings, multimedia)
4. **04_user_interactions.sql** - Leads, favoritos, alertas, amenities
5. **05_analytics.sql** - Eventos y materialized views
6. **06_verification_workflow.sql** - Sistema de verificación de anuncios
7. **07_security_audit.sql** - Auditoría, consentimientos y RLS
8. **08_subscription_plans.sql** - Planes y suscripciones
9. **09_billing_payments.sql** - Facturación, pagos y reembolsos
10. **10_partition_management.sql** - Helpers de particionamiento automático
11. **11_business_rules.sql** - Triggers y reglas de negocio
12. **12_sample_data.sql** - Datos de prueba y configuración inicial

### 16.2 Instalación modular
```bash
# Ejecutar desde directorio Base De Datos/
psql -d your_database -f 00_master_install.sql
```

### 16.3 Ventajas de la modularización
- **Mantenibilidad**: Cada módulo tiene responsabilidad específica
- **Testing**: Validación granular por funcionalidad
- **Escalabilidad**: Carga selectiva según necesidades
- **Colaboración**: División clara del trabajo de desarrollo
- **Debugging**: Problemas localizados por módulo

## 17. Roadmap sugerido

1) Implementar DDL base (schemas, enums, tablas principales).  
2) Activar extensiones (`pg_trgm`, `citext`, `unaccent`, `pgcrypto`, `postgis` opcional).  
3) Particionar `listings`/`events` y crear índices por partición.  
4) Triggers: publicación/planes, contadores multimedia, verificación.  
5) Función `core.search_listings` y endpoints API.  
6) MVs de analítica y cron de `REFRESH CONCURRENTLY`.  
7) RLS y roles; auditoría y consentimientos.  
8) Carga de datos de catálogos (distritos/amenities) y pruebas de rendimiento.  
9) Réplicas de lectura y tuning de autovacuum.
