# EasyRent API - Documentación Completa del Sistema

## Información General del Proyecto

### Descripción
**EasyRent** es una plataforma completa de marketplace inmobiliario desarrollada con FastAPI y PostgreSQL. El sistema proporciona una API RESTful robusta para la gestión de propiedades en alquiler, incluyendo usuarios, agencias, listados, búsquedas, analytics, y herramientas para desarrolladores.

### Tecnologías Principales
- **Backend**: FastAPI 0.104+ (Python 3.13+)
- **Base de Datos**: PostgreSQL 17 con esquemas especializados
- **Autenticación**: JWT Bearer Token + Firebase Auth (opcional)
- **ORM**: SQLAlchemy 2.0+ con Alembic para migraciones
- **Validación**: Pydantic v2 para schemas y validación de datos
- **Documentación**: OpenAPI/Swagger UI automática
- **Monitoreo**: Sistema de health checks y métricas

### Arquitectura del Sistema
```
Backend/
├── app/
│   ├── api/
│   │   ├── deps.py              # Dependencias de autenticación
│   │   └── endpoints/           # Controladores REST
│   ├── core/                    # Configuración central
│   ├── models/                  # Modelos SQLAlchemy
│   ├── schemas/                 # Schemas Pydantic
│   ├── services/                # Lógica de negocio
│   └── main.py                  # Aplicación FastAPI principal
├── alembic/                     # Migraciones de base de datos
└── requirements.txt             # Dependencias Python
```

## Base de Datos

### Configuración PostgreSQL
- **Version**: PostgreSQL 17.6
- **Extensiones requeridas**: 
  - `pgcrypto` (generación UUID y cifrado)
  - `btree_gin` (índices compuestos)
  - `pg_trgm` (búsqueda por similitud trigram)
  - `citext` (texto case-insensitive para emails)
  - `unaccent` (normalización de texto español)
  - `postgis` (datos geoespaciales)
- **Esquemas organizacionales**:
  - `core`: Tablas principales de negocio (usuarios, listings, planes, facturación)
  - `analytics`: Métricas, eventos e interacciones, vistas materializadas
  - `sec`: Auditoría, seguridad, consentimientos y logs de acceso
  - `archive`: Retención de datos y particiones antiguas
- **Conexión**: Pool de conexiones SQLAlchemy con configuración async/sync
- **Migraciones**: Alembic para control de versiones del schema
- **Particionamiento**: RANGE mensual por `created_at` en tablas de alto volumen

### Modelos Principales

La base de datos utiliza una arquitectura de esquemas especializados con tablas particionadas para alto rendimiento:

#### Esquema `core` - Entidades de Negocio

**Tablas principales:**
- `users` - Usuarios del sistema con roles y verificación
- `agencies` - Agencias inmobiliarias con membresías
- `listings` - Propiedades (PARTICIONADA por mes)
- `listing_images` - Imágenes de propiedades
- `listing_videos` - Videos de propiedades  
- `listing_amenities` - Amenidades asociadas
- `amenities` - Catálogo de amenidades
- `leads` - Contactos de interesados (PARTICIONADA por mes)
- `favorites` - Propiedades marcadas como favoritas
- `search_alerts` - Alertas de búsqueda guardadas
- `plans` - Planes de suscripción disponibles
- `subscriptions` - Suscripciones activas de usuarios
- `invoices` - Facturación y cobros
- `payments` - Registros de pagos

#### Esquema `analytics` - Métricas y Reportes

**Tablas de eventos:**
- `events` - Eventos de interacción (PARTICIONADA por mes)
- `mv_price_m2_90d` - Vista materializada de precios promedio
- `mv_leads_daily` - Vista materializada de leads diarios

#### Esquema `sec` - Seguridad y Auditoría

**Tablas de seguridad:**
- `audit_log` - Log completo de auditoría del sistema
- `user_sessions` - Sesiones activas con tokens
- `user_consents` - Consentimientos GDPR/Ley 29733
- `failed_logins` - Intentos fallidos de autenticación

#### Esquema `archive` - Retención de Datos

**Particiones desconectadas:**
- Destino de particiones antiguas para archivado
- Mantenimiento automatizado de retención de datos

### Tablas Particionadas (RANGE por fecha)

Las siguientes tablas están particionadas mensualmente por `created_at` para optimizar rendimiento:

**Particiones activas:**
```sql
-- Ejemplo de estructura de particiones
core.listings_2025_01, core.listings_2025_02, core.listings_2025_03
core.leads_2025_01, core.leads_2025_02, core.leads_2025_03  
analytics.events_2025_01, analytics.events_2025_02, analytics.events_2025_03
```

**Foreign Keys compuestas:**
Las referencias a tablas particionadas requieren claves foráneas compuestas:
```sql
FOREIGN KEY (listing_id, listing_created_at) 
REFERENCES core.listings (id, created_at)
```

### Enumeraciones del Sistema

**Estados de propiedades:**
```sql
core.listing_status: draft, pending_verification, published, archived
core.operation_type: sale, rent, temporary, project, transfer  
core.property_type: apartment, house, office, land, commercial, room, studio, other
core.verification_status: pending, verified, rejected
```

**Sistema de facturación:**
```sql
core.subscription_status: trialing, active, past_due, canceled, unpaid
core.invoice_status: draft, open, paid, void, uncollectible
core.payment_status: pending, succeeded, failed, refunded
core.billing_provider: stripe, culqi, mercadopago, paypal, bank_transfer, other
```

#### 1. Sistema de Usuarios (`auth.py`)
```python
class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "core"}
    
    # Campos principales
    id: UUID (PK)
    firebase_uid: str (opcional, integración Firebase)
    email: str (único, índice)
    phone: str
    first_name, last_name: str
    profile_picture_url: str
    national_id: str
    
    # Estado y roles
    is_verified: bool
    role: UserRole (USER, AGENT, ADMIN)
    is_active: bool
    
    # Relaciones
    api_keys: List[ApiKey]
    webhooks: List[Webhook]
    developer_applications: List[DeveloperApplication]
```

#### 2. Agencias (`agency.py`)
```python
class Agency(Base):
    __tablename__ = "agencies"
    
    # Información básica
    id: UUID (PK)
    name: str
    description: text
    website_url: str
    phone, email: str
    
    # Ubicación
    address: str
    city, state, country: str
    
    # Estado y verificación
    is_verified: bool
    verification_level: enum
    
    # Relaciones
    memberships: List[AgencyMembership]
    listings: List[Listing]
```

#### 3. Listados de Propiedades (`listing.py`)
```python
class Listing(Base):
    __tablename__ = "listings"
    
    # Información básica
    id: UUID (PK)
    title: str
    description: text
    property_type: enum
    
    # Detalles financieros
    price: Decimal
    currency: str (default: "PEN")
    
    # Características
    bedrooms, bathrooms: int
    area_m2: Decimal
    
    # Ubicación
    address: str
    city, district: str
    coordinates: geospatial
    
    # Estado
    status: enum (ACTIVE, INACTIVE, RENTED, etc.)
    is_featured: bool
    
    # Relaciones
    agency_id: UUID (FK)
    created_by: UUID (FK to User)
```

#### 4. Webhooks (`webhook.py`)
```python
class Webhook(Base):
    __tablename__ = "user_webhooks"  # Evita conflicto con tabla integration
    
    # Configuración
    id: UUID (PK)
    user_id: UUID (FK)
    url: str
    secret: str (HMAC)
    
    # Eventos suscritos
    events: List[str]  # ["listing.created", "user.registered", etc.]
    
    # Control
    is_active: bool
    retry_count: int
    
    # Relaciones
    deliveries: List[WebhookDelivery]

class WebhookDelivery(Base):
    # Registro de entregas
    webhook_id: UUID (FK)
    status: enum (PENDING, SUCCESSFUL, FAILED)
    response_status_code: int
    retry_count: int
    error_message: str
```

#### 5. API Keys (`api_key.py`)
```python
class ApiKey(Base):
    __tablename__ = "api_keys"
    
    # Configuración
    id: UUID (PK)
    user_id: UUID (FK)
    name: str
    key_hash: str (SHA256)
    key_prefix: str  # "pk_live_"
    
    # Permisos y límites
    scopes: List[str]  # ["read", "write", "admin"]
    rate_limit: int (requests/hour)
    
    # Estado
    status: enum (ACTIVE, REVOKED, EXPIRED)
    expires_at: datetime (opcional)
    
    # Estadísticas
    usage_count: int
    last_used_at: datetime
    
    # Relaciones
    usage_logs: List[ApiKeyUsageLog]

class DeveloperApplication(Base):
    # Organización de API keys por aplicación
    id: UUID (PK)
    user_id: UUID (FK)
    name: str
    description: text
    website_url: str
    callback_urls: List[str]
    app_type: enum (WEB, MOBILE, SERVER)
```

#### 6. Integraciones Externas (`integration.py`)
```python
class Integration(Base):
    __tablename__ = "integrations"
    
    # Configuración
    id: UUID (PK)
    user_id: UUID (FK)
    name: str
    integration_type: enum (MLS, CRM, ACCOUNTING, etc.)
    
    # Credenciales (encriptadas)
    credentials: JSON
    
    # Estado y configuración
    is_active: bool
    sync_frequency: enum
    last_sync_at: datetime
    
    # Relaciones
    sync_logs: List[IntegrationSyncLog]
```

## Sistema de Endpoints

### Estructura de la API
- **Base URL**: `https://api.easyrent.com/v1`
- **Autenticación**: JWT Bearer Token en header `Authorization`
- **Formato**: JSON exclusivamente
- **Versionado**: Prefijo `/v1` para todas las rutas
- **Documentación**: Swagger UI en `/docs` (desarrollo)

### Módulos de Endpoints

#### 1. Authentication (`/v1/auth`)
```python
# Endpoints principales
POST   /v1/auth/register          # Registro de usuario
POST   /v1/auth/login             # Inicio de sesión
POST   /v1/auth/refresh           # Renovar token
POST   /v1/auth/logout            # Cerrar sesión
POST   /v1/auth/forgot-password   # Recuperar contraseña
POST   /v1/auth/verify-email      # Verificar email
POST   /v1/auth/firebase-login    # Login con Firebase

# Características:
- JWT con refresh tokens
- Integración Firebase opcional
- Verificación por email
- Rate limiting en endpoints sensibles
```

#### 2. Users (`/v1/users`)
```python
# CRUD completo de usuarios
GET    /v1/users/me              # Perfil del usuario actual
PUT    /v1/users/me              # Actualizar perfil
DELETE /v1/users/me              # Eliminar cuenta
GET    /v1/users/{user_id}       # Ver perfil público
PUT    /v1/users/me/avatar       # Subir avatar
POST   /v1/users/me/change-password  # Cambiar contraseña

# Características:
- Perfiles públicos y privados
- Upload de avatares
- Gestión de privacidad
- Soft delete de cuentas
```

#### 3. Agencies (`/v1/agencies`)
```python
# Gestión de agencias inmobiliarias
GET    /v1/agencies                    # Listar agencias
POST   /v1/agencies                    # Crear agencia
GET    /v1/agencies/{agency_id}        # Ver agencia
PUT    /v1/agencies/{agency_id}        # Actualizar agencia
DELETE /v1/agencies/{agency_id}        # Eliminar agencia

# Membresías
POST   /v1/agencies/{agency_id}/members     # Invitar miembro
DELETE /v1/agencies/{agency_id}/members/{user_id}  # Remover miembro
PUT    /v1/agencies/{agency_id}/members/{user_id}/role  # Cambiar rol

# Características:
- Sistema de membresías con roles
- Verificación de agencias
- Gestión de equipos
- Estadísticas por agencia
```

#### 4. Listings (`/v1/listings`)
```python
# Gestión completa de propiedades
GET    /v1/listings                 # Listar propiedades
POST   /v1/listings                 # Crear propiedad
GET    /v1/listings/{listing_id}    # Ver propiedad
PUT    /v1/listings/{listing_id}    # Actualizar propiedad
DELETE /v1/listings/{listing_id}    # Eliminar propiedad

# Gestión de estado
PUT    /v1/listings/{listing_id}/status    # Cambiar estado
POST   /v1/listings/{listing_id}/feature   # Destacar propiedad
POST   /v1/listings/{listing_id}/favorite  # Marcar favorito

# Media
POST   /v1/listings/{listing_id}/media     # Subir imágenes/videos
DELETE /v1/listings/{listing_id}/media/{media_id}  # Eliminar media

# Características:
- Upload múltiple de imágenes
- Geolocalización con coordenadas
- Estados de publicación
- Sistema de favoritos
- Propiedades destacadas
```

#### 5. Search (`/v1/search`)
```python
# Búsqueda avanzada de propiedades
GET    /v1/search                   # Búsqueda general
POST   /v1/search/advanced          # Búsqueda avanzada con filtros
GET    /v1/search/suggestions       # Sugerencias de búsqueda
POST   /v1/search/saved             # Guardar búsqueda
GET    /v1/search/saved             # Ver búsquedas guardadas

# Filtros disponibles:
- price_min, price_max: Rango de precios
- bedrooms, bathrooms: Número de habitaciones
- property_type: Tipo de propiedad
- city, district: Ubicación
- area_min, area_max: Rango de área
- coordinates + radius: Búsqueda por proximidad

# Características:
- Búsqueda full-text
- Filtros combinables
- Ordenamiento múltiple
- Paginación eficiente
- Geolocalización
```

#### 6. Media (`/v1/media`)
```python
# Gestión de archivos multimedia
POST   /v1/media/upload             # Subir archivo
GET    /v1/media/{media_id}         # Ver/descargar archivo
DELETE /v1/media/{media_id}         # Eliminar archivo
PUT    /v1/media/{media_id}         # Actualizar metadatos

# Características:
- Múltiples formatos (imágenes, videos, documentos)
- Redimensionado automático de imágenes
- Validación de tipos MIME
- Almacenamiento optimizado
- URLs firmadas para acceso
```

#### 7. Interactions (`/v1/interactions`)
```python
# Interacciones entre usuarios
POST   /v1/interactions/contact     # Contactar propietario
GET    /v1/interactions/messages    # Ver mensajes
POST   /v1/interactions/messages    # Enviar mensaje
GET    /v1/interactions/leads       # Ver leads (agentes)
PUT    /v1/interactions/leads/{lead_id}/status  # Actualizar lead

# Características:
- Sistema de mensajería
- Gestión de leads
- Notificaciones automáticas
- Historial de contactos
```

#### 8. Subscriptions (`/v1/subscriptions`)
```python
# Planes y suscripciones
GET    /v1/subscriptions/plans      # Ver planes disponibles
POST   /v1/subscriptions/subscribe  # Suscribirse a plan
GET    /v1/subscriptions/current    # Ver suscripción actual
PUT    /v1/subscriptions/upgrade    # Cambiar plan
POST   /v1/subscriptions/cancel     # Cancelar suscripción

# Billing
GET    /v1/subscriptions/billing/history    # Historial de pagos
POST   /v1/subscriptions/billing/methods    # Agregar método de pago
GET    /v1/subscriptions/usage              # Ver uso actual

# Características:
- Múltiples planes (Basic, Professional, Enterprise)
- Facturación automática
- Límites por plan
- Upgrades/downgrades
```

#### 9. Analytics (`/v1/analytics`)
```python
# Análisis y métricas
GET    /v1/analytics/dashboard           # Dashboard principal
GET    /v1/analytics/listings/stats     # Estadísticas de propiedades
GET    /v1/analytics/performance        # Rendimiento de listados
GET    /v1/analytics/market             # Análisis de mercado
GET    /v1/analytics/revenue            # Métricas de ingresos

# Filtros disponibles:
- date_range: Rango de fechas
- property_type: Tipo de propiedad
- location: Ubicación específica
- agency_id: Por agencia

# Características:
- Métricas en tiempo real
- Reportes exportables
- Gráficos de tendencias
- Comparativas de mercado
```

#### 10. Verifications (`/v1/verifications`)
```python
# Verificación y moderación
POST   /v1/verifications/request          # Solicitar verificación
GET    /v1/verifications/status          # Ver estado de verificación
POST   /v1/verifications/documents       # Subir documentos
GET    /v1/verifications/queue           # Cola de moderación (admin)
PUT    /v1/verifications/{id}/approve    # Aprobar (moderador)
PUT    /v1/verifications/{id}/reject     # Rechazar (moderador)

# Tipos de verificación:
- user_identity: Verificación de identidad
- agency_license: Licencia de agencia
- property_ownership: Propiedad del inmueble
- financial_capacity: Capacidad financiera

# Características:
- Workflow de aprobación
- Upload de documentos
- Notificaciones automáticas
- Historial de verificaciones
```

#### 11. Notifications (`/v1/notifications`)
```python
# Sistema de notificaciones
GET    /v1/notifications               # Ver notificaciones
PUT    /v1/notifications/{id}/read    # Marcar como leída
DELETE /v1/notifications/{id}         # Eliminar notificación
POST   /v1/notifications/preferences  # Configurar preferencias
GET    /v1/notifications/unread/count # Contar no leídas

# Tipos de notificación:
- new_message: Nuevo mensaje
- listing_approved: Propiedad aprobada
- subscription_expiring: Suscripción por vencer
- new_lead: Nuevo interesado

# Características:
- Push notifications
- Email notifications
- Preferencias granulares
- Templates personalizables
```

#### 12. Admin (`/v1/admin`)
```python
# Administración del sistema (solo admin)
GET    /v1/admin/users              # Gestión de usuarios
GET    /v1/admin/listings           # Gestión de propiedades
GET    /v1/admin/agencies           # Gestión de agencias
GET    /v1/admin/reports            # Reportes administrativos
POST   /v1/admin/users/{id}/suspend # Suspender usuario
GET    /v1/admin/system/stats       # Estadísticas del sistema

# Características:
- Control total del sistema
- Moderación de contenido
- Reportes avanzados
- Gestión de usuarios
- Configuración global
```

#### 13. External Integrations (`/v1/integrations`)
```python
# Integraciones con sistemas externos
GET    /v1/integrations             # Ver integraciones
POST   /v1/integrations             # Crear integración
PUT    /v1/integrations/{id}        # Actualizar integración
DELETE /v1/integrations/{id}        # Eliminar integración
POST   /v1/integrations/{id}/test   # Probar conexión
POST   /v1/integrations/{id}/sync   # Sincronizar datos

# Tipos soportados:
- MLS (Multiple Listing Service)
- CRM (Customer Relationship Management)
- ACCOUNTING (Sistemas contables)
- MARKETING (Plataformas de marketing)
- PAYMENT (Procesadores de pago)

# Características:
- Credenciales encriptadas
- Sincronización automática
- Logs de operaciones
- Manejo de errores robusto
```

#### 14. Webhooks Management (`/v1/webhooks`)
```python
# Gestión de webhooks
GET    /v1/webhooks                 # Listar webhooks
POST   /v1/webhooks                 # Crear webhook
PUT    /v1/webhooks/{id}            # Actualizar webhook
DELETE /v1/webhooks/{id}            # Eliminar webhook
POST   /v1/webhooks/{id}/test       # Probar webhook
GET    /v1/webhooks/{id}/deliveries # Ver entregas

# Eventos disponibles:
- listing.created, listing.updated, listing.deleted
- user.registered, user.updated
- payment.completed, payment.failed
- lead.created, lead.updated

# Características:
- Verificación HMAC
- Reintentos automáticos
- Logs de entregas
- Testing integrado
- Filtrado por eventos
```

#### 15. Developer Tools (`/v1/api-keys`)
```python
# Herramientas para desarrolladores
GET    /v1/api-keys                 # Listar API keys
POST   /v1/api-keys                 # Crear API key
PUT    /v1/api-keys/{id}            # Actualizar API key
DELETE /v1/api-keys/{id}            # Eliminar API key
POST   /v1/api-keys/{id}/regenerate # Regenerar key
GET    /v1/api-keys/{id}/stats      # Estadísticas de uso

# Aplicaciones de desarrollador
GET    /v1/api-keys/apps            # Listar aplicaciones
POST   /v1/api-keys/apps            # Crear aplicación
PUT    /v1/api-keys/apps/{id}       # Actualizar aplicación
DELETE /v1/api-keys/apps/{id}       # Eliminar aplicación

# Características:
- Scopes granulares (read, write, admin)
- Rate limiting por key
- Estadísticas detalladas
- Organización por aplicaciones
- Documentación integrada
```

#### 16. System Utilities (`/health`, `/version`, `/docs`)
```python
# Utilidades del sistema
GET    /health                      # Health check completo
GET    /version                     # Información de versión
GET    /docs                        # Documentación Swagger
GET    /stats                       # Estadísticas del sistema
GET    /ping                        # Ping básico
GET    /ready                       # Readiness check
GET    /metrics                     # Métricas para monitoreo

# Health check incluye:
- database: Conectividad PostgreSQL
- redis: Estado de cache (si aplica)  
- kafka: Message broker (si aplica)
- memory: Uso de memoria del sistema
- disk: Espacio en disco disponible

# Características:
- Monitoreo comprehensivo
- Métricas de rendimiento
- Información de versión detallada
- Estados de servicios dependientes
```

## Configuración y Deployment

### Variables de Entorno
```bash
# Base de datos PostgreSQL 17.6
DATABASE_URL="postgresql://user:pass@localhost/easyrent"
DATABASE_MAX_CONNECTIONS=20

# Aplicación
APP_NAME="EasyRent API"
APP_VERSION="1.0.0"
ENVIRONMENT="development"  # development, staging, production
DEBUG=true

# Seguridad JWT
SECRET_KEY="your-secret-key-here-minimum-256-bits"
JWT_SECRET_KEY="jwt-secret-key-different-from-main-secret"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
ALGORITHM="HS256"

# CORS y API
API_V1_STR="/api/v1"
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:8000","http://127.0.0.1:3000"]

# Rate limiting y uploads
RATE_LIMIT_REQUESTS_PER_MINUTE=100
MAX_UPLOAD_SIZE_MB=10
ALLOWED_IMAGE_TYPES="image/jpeg,image/png,image/webp"
UPLOAD_DIR="./uploads"
STATIC_FILES_DIR="./static"

# Firebase (opcional)
FIREBASE_CREDENTIALS_PATH="/path/to/firebase-credentials.json"
FIREBASE_PROJECT_ID="your-project-id"

# URLs aplicación
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8000"

# Logging y monitoreo
LOG_LEVEL="INFO"  # DEBUG|INFO|WARNING|ERROR
LOG_FILE="app.log"
DB_ECHO=false     # Log SQL queries para debugging

# Email/SMTP (opcional)
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT=587
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="noreply@easyrent.com"

# Redis (si se usa)
REDIS_URL="redis://localhost:6379/0"
```

### Requisitos del Sistema

#### Dependencias Python (requirements.txt)
```
# Framework principal
fastapi>=0.104.0
uvicorn[standard]>=0.24.0

# Base de datos y ORM  
sqlalchemy>=2.0.0
alembic>=1.12.0
psycopg2-binary>=2.9.0

# Validación y serialización
pydantic>=2.4.0
pydantic-settings>=2.0.0

# Autenticación y seguridad
python-jose[cryptography]>=3.3.0
python-multipart>=0.0.6
bcrypt>=4.0.0

# HTTP client y utilidades
httpx>=0.25.0
python-dotenv>=1.0.0

# Monitoreo del sistema
psutil>=5.9.0

# Opcional: Firebase (si se usa)
firebase-admin>=6.2.0
```

#### Extensiones PostgreSQL Requeridas
```sql
-- Extensiones críticas para funcionamiento
CREATE EXTENSION IF NOT EXISTS pgcrypto;           -- UUID generation y hashing
CREATE EXTENSION IF NOT EXISTS btree_gin;          -- Índices compuestos optimizados
CREATE EXTENSION IF NOT EXISTS pg_trgm;            -- Búsqueda fuzzy y similitud
CREATE EXTENSION IF NOT EXISTS citext;             -- Emails case-insensitive
CREATE EXTENSION IF NOT EXISTS unaccent;           -- Normalización texto español
CREATE EXTENSION IF NOT EXISTS postgis;            -- Coordenadas geográficas
```

#### Base de Datos
- PostgreSQL 17+ (recomendado)
- Extensiones requeridas: uuid-ossp, postgis (para geolocalización)
- Configuración de conexiones concurrentes
- Índices optimizados para búsquedas

### Seguridad Implementada

#### Autenticación y Autorización
- JWT Bearer Tokens con refresh tokens
- Validación de tokens en todas las rutas protegidas
- Roles de usuario (USER, AGENT, ADMIN)
- Scopes granulares para API keys

#### Protección de Datos
- Hashing seguro de contraseñas (bcrypt)
- Encriptación de credenciales de integración
- Validación de entrada con Pydantic
- Sanitización de queries SQL

#### API Security
- Rate limiting configurable
- CORS configurado apropiadamente
- Headers de seguridad
- Validación de API keys con HMAC
- Logs de auditoría

## Características Técnicas Avanzadas

### Performance
- Pool de conexiones SQLAlchemy optimizado
- Queries paginados para listas grandes
- Índices de base de datos estratégicos
- Caché de respuestas frecuentes
- Compresión de respuestas

### Escalabilidad
- Arquitectura stateless
- Separación clara de responsabilidades
- Servicios independientes por dominio
- Base de datos preparada para sharding
- API versionada para evolución

### Monitoreo y Logging
- Health checks comprehensivos
- Métricas de sistema (CPU, memoria, disco)
- Logs estructurados
- Tracking de performance por endpoint
- Alertas automáticas

### Integración y Extensibilidad
- Sistema de webhooks para eventos
- API keys para acceso programático
- Integraciones con servicios externos
- Sistema de plugins extensible
- Documentation automática OpenAPI

## Uso y Testing

### Estructura de Testing
```python
# Ejemplos de uso de la API

# 1. Autenticación
POST /v1/auth/login
{
    "email": "user@example.com",
    "password": "securepassword"
}

# Response
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "expires_in": 1800
}

# 2. Crear listado
POST /v1/listings
Authorization: Bearer <token>
{
    "title": "Hermoso departamento en Miraflores",
    "description": "Departamento moderno con vista al mar...",
    "property_type": "apartment",
    "price": 2500.00,
    "currency": "PEN",
    "bedrooms": 3,
    "bathrooms": 2,
    "area_m2": 120.5,
    "address": "Av. José Larco 1234",
    "city": "Lima",
    "district": "Miraflores"
}

# 3. Búsqueda avanzada
GET /v1/search?price_min=1500&price_max=3000&bedrooms=2&city=Lima&page=1&limit=20

# 4. Webhook
POST /v1/webhooks
Authorization: Bearer <token>
{
    "url": "https://myapp.com/webhooks/easyrent",
    "events": ["listing.created", "listing.updated"],
    "name": "My App Webhook"
}
```

### Comandos de Desarrollo
```bash
# Instalar dependencias
pip install -r requirements.txt

# Ejecutar migraciones
alembic upgrade head

# Iniciar servidor de desarrollo
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Acceder a documentación
http://localhost:8000/docs

# Health check
curl http://localhost:8000/health
```

## Conclusión

EasyRent API es un sistema completo de marketplace inmobiliario que cubre todos los aspectos necesarios para una plataforma moderna:

- **Gestión completa**: Usuarios, agencias, propiedades, búsquedas
- **Características avanzadas**: Analytics, verificaciones, notificaciones
- **Herramientas para desarrolladores**: API keys, webhooks, integraciones
- **Monitoreo**: Health checks, métricas, logs
- **Seguridad**: Autenticación JWT, autorización por roles, validación
- **Escalabilidad**: Arquitectura modular, base de datos optimizada

El sistema está diseñado para ser extensible, mantenible y preparado para producción, con documentación automática y herramientas de desarrollo integradas.