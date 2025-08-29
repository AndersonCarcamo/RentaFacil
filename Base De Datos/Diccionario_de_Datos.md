# Diccionario de Datos — Marketplace Inmobiliario

Este documento describe todas las tablas implementadas, sus columnas, tipos, longitudes/precisión, nulabilidad, valores por defecto, claves, índices principales, funciones y helpers. Sirve como referencia técnica para desarrollo y migración del SQL.

**Versión:** Sincronizada con los sql (Agosto 2025)  
**PostgreSQL:** 15+ con extensiones habilitadas  
**Particionamiento:** RANGE mensual en tablas de alto volumen

## Convenciones

- **Longitud:** Para tipos con longitud fija (CHAR(n)) se especifica. TEXT/CITEXT = variable sin límite (validar en aplicación).
- **Precisión:** NUMERIC(p,s) = p dígitos totales, s decimales.
- **Nulabilidad:** "null: NO" = NOT NULL, "null: SÍ" = NULL permitido.
- **Enums:** Se listan todos los valores permitidos.
- **FK:** Foreign Key con tabla destino y acción ON DELETE.
- **Particiones:** Indicadas como "PARTITION BY RANGE" con patrón de nombres.

## Esquemas (Schemas)

- **core:** Entidades operacionales (usuarios, listings, media, planes, facturación)
- **analytics:** Eventos de interacción y materialized views de métricas
- **sec:** Auditoría, consentimientos y seguridad
- **archive:** Destino de particiones antiguas (detached)nario de Datos — Marketplace Inmobiliario

Este documento describe todas las tablas (implementadas y planificadas), sus columnas, tipos, longitudes/precisión, nulabilidad, valores por defecto, claves y principales índices. Sirve como fuente para generar/migrar el SQL.

Convenciones rápidas
- Longitud: para tipos con longitud fija (CHAR(n)) o recomendada en TEXT/CITEXT se anota. Si el motor no fija longitud, se indica “variable; sin límite” y se añade recomendación cuando aplique.
- Precisión: NUMERIC(p,s) indica dígitos totales (p) y decimales (s).
- Enum: se listan valores permitidos.

## 1. Extensiones PostgreSQL

| Extensión | Propósito | Estado |
|-----------|-----------|---------|
| pgcrypto | gen_random_uuid(), hashing/cifrado | ✅ Requerida |
| btree_gin | Índices combinados BTree+GIN | ✅ Implementada |
| pg_trgm | Similitud trigram y fuzzy search | ✅ Implementada |
| citext | Texto case-insensitive (emails) | ✅ Implementada |
| unaccent | Normalización sin acentos para FTS | ✅ Implementada |
| postgis | Soporte geoespacial (geography Point) | ✅ Implementada |

## 2. Enumeraciones (ENUMs)

| Enumeración | Valores | Uso |
|-------------|---------|-----|
| **core.listing_status** | draft, pending_verification, published, archived | Estados del anuncio |
| **core.operation_type** | sale, rent, temporary, project, transfer | Tipo de operación inmobiliaria |
| **core.property_type** | apartment, house, office, land, commercial, other, room, studio | Tipo de propiedad |
| **core.verification_status** | pending, verified, rejected | Estado de verificación |
| **core.rental_term** | daily, weekly, monthly, quarterly, yearly, seasonal | Término de alquiler |
| **core.advertiser_type** | owner, agent, broker, builder, manager, other | Tipo de anunciante |
| **core.subscription_status** | trialing, active, past_due, canceled, unpaid | Estado de suscripción |
| **core.invoice_status** | draft, open, paid, void, uncollectible | Estado de factura |
| **core.payment_status** | pending, succeeded, failed, refunded | Estado de pago |
| **core.billing_provider** | stripe, culqi, mercadopago, paypal, bank_transfer, other | Proveedor de pagos |

## Resumen detallado de enums implementados

### core.listing_status
**Descripción:** Estados del ciclo de vida de un anuncio
| Valor | Significado | Contexto |
|-------|-------------|----------|
| `draft` | Borrador | Anuncio en creación, no visible públicamente |
| `pending_verification` | Pendiente verificación | Enviado para revisión, no visible públicamente |
| `published` | Publicado | Activo y visible en búsquedas públicas |
| `archived` | Archivado | Ya no activo, mantenido para historial |

### core.operation_type
**Descripción:** Tipos de operación inmobiliaria
| Valor | Significado | Contexto |
|-------|-------------|----------|
| `sale` | Venta | Transferencia de propiedad definitiva |
| `rent` | Alquiler | Arrendamiento de largo plazo (>1 año típicamente) |
| `temporary` | Temporal | Alquiler de corto plazo (<1 año, Airbnb-style) |
| `project` | Proyecto | Inmueble en construcción/planos |
| `transfer` | Traspaso | Transferencia de contrato de alquiler |

### core.property_type
**Descripción:** Categorías de tipos de inmueble
| Valor | Significado | Contexto |
|-------|-------------|----------|
| `apartment` | Departamento | Unidad en edificio multifamiliar |
| `house` | Casa | Vivienda unifamiliar independiente |
| `office` | Oficina | Espacio comercial para oficinas |
| `land` | Terreno | Lote sin construcción |
| `commercial` | Local comercial | Espacio para negocio/retail |
| `room` | Habitación | Cuarto individual en vivienda compartida |
| `studio` | Estudio | Departamento de ambiente único |
| `other` | Otro | Tipos especiales no categorizados |

### core.subscription_status
**Descripción:** Estados de suscripción a planes
| Valor | Significado | Contexto |
|-------|-------------|----------|
| `trialing` | En prueba | Período gratuito de evaluación |
| `active` | Activa | Suscripción pagada y funcional |
| `past_due` | Mora | Pago vencido, funcionalidad limitada |
| `canceled` | Cancelada | Terminada por usuario/sistema |
| `unpaid` | Impaga | Sin pago, acceso suspendido |

### core.invoice_status
**Descripción:** Estados del proceso de facturación
| Valor | Significado | Contexto |
|-------|-------------|----------|
| `draft` | Borrador | Factura creada pero no enviada |
| `open` | Abierta | Enviada al cliente, pendiente de pago |
| `paid` | Pagada | Pago recibido y confirmado |
| `void` | Anulada | Cancelada, sin efecto legal |
| `uncollectible` | Incobrable | Marcada como pérdida después de intentos |

### core.payment_status
**Descripción:** Estados del procesamiento de pagos
| Valor | Significado | Contexto |
|-------|-------------|----------|
| `pending` | Pendiente | Pago iniciado, esperando confirmación |
| `succeeded` | Exitoso | Pago procesado correctamente |
| `failed` | Fallido | Error en procesamiento o fondos insuficientes |
| `refunded` | Reembolsado | Dinero devuelto al cliente |

### core.billing_provider
**Descripción:** Proveedores de procesamiento de pagos
| Valor | Significado | Contexto |
|-------|-------------|----------|
| `stripe` | Stripe | Procesador internacional de tarjetas |
| `culqi` | Culqi | Procesador peruano especializado |
| `mercadopago` | MercadoPago | Plataforma regional latinoamericana |
| `paypal` | PayPal | Wallet digital internacional |
| `bank_transfer` | Transferencia bancaria | Pago directo entre bancos |
| `other` | Otro | Métodos alternativos o especiales |

### core.rental_term
**Descripción:** Períodos de arrendamiento
| Valor | Significado | Contexto |
|-------|-------------|----------|
| `daily` | Diario | Alquiler por días (hoteles, Airbnb) |
| `weekly` | Semanal | Alquiler por semanas |
| `monthly` | Mensual | Alquiler tradicional mensual |
| `quarterly` | Trimestral | Contratos de 3 meses |
| `yearly` | Anual | Contratos de 1 año o más |
| `seasonal` | Estacional | Temporadas específicas (verano, etc.) |

### core.advertiser_type
**Descripción:** Tipo de persona que anuncia el inmueble
| Valor | Significado | Contexto |
|-------|-------------|----------|
| `owner` | Propietario | Dueño directo del inmueble |
| `agent` | Agente | Representante de ventas individual |
| `broker` | Corredor | Intermediario inmobiliario certificado |
| `builder` | Constructora | Empresa desarrolladora de proyectos |
| `manager` | Administrador | Gestor de propiedades de terceros |
| `other` | Otro | Tipos especiales de anunciantes |

### core.user_role
**Descripción:** Roles de usuario con permisos y limitaciones específicos
| Rol | Descripción | Permisos y Limitaciones |
|-----|-------------|-------------------------|
| **user** | **Usuario Básico** | <ul><li>✅ Navegar y buscar propiedades</li><li>✅ Ver detalles de listados</li><li>✅ Contactar anunciantes</li><li>❌ No puede publicar propiedades</li><li>❌ Sin acceso a analytics</li><li>🎯 **Target:** Visitantes ocasionales</li></ul> |
| **tenant** | **Inquilino/Cliente** | <ul><li>✅ Todo lo de usuario básico</li><li>✅ Guardar favoritos</li><li>✅ Crear alertas de búsqueda</li><li>✅ Historial de contactos</li><li>✅ Perfil verificado opcional</li><li>❌ No puede publicar propiedades</li><li>🎯 **Target:** Buscadores activos de vivienda</li></ul> |
| **landlord** | **Propietario** | <ul><li>✅ Todo lo de tenant</li><li>✅ Publicar hasta el límite de su plan</li><li>✅ Gestionar sus propiedades</li><li>✅ Ver leads de sus propiedades</li><li>✅ Analytics básicas de sus listados</li><li>❌ No puede gestionar propiedades de otros</li><li>🎯 **Target:** Propietarios individuales</li></ul> |
| **agent** | **Agente Inmobiliario** | <ul><li>✅ Todo lo de landlord</li><li>✅ Gestionar propiedades de terceros</li><li>✅ Asociarse con agencias</li><li>✅ Límites más altos en planes</li><li>✅ Herramientas CRM básicas</li><li>✅ Reportes de ventas/alquileres</li><li>❌ No puede moderar otros usuarios</li><li>🎯 **Target:** Profesionales inmobiliarios</li></ul> |
| **admin** | **Administrador** | <ul><li>✅ Acceso completo al sistema</li><li>✅ Moderar contenido y usuarios</li><li>✅ Gestionar planes y facturación</li><li>✅ Analytics completas del sistema</li><li>✅ Configuración de la plataforma</li><li>✅ Gestión de agencias</li><li>⚠️ Responsabilidad total del sistema</li><li>🎯 **Target:** Equipo de la plataforma</li></ul> |

**Nota sobre roles:** Los roles son extensibles mediante `ALTER TYPE core.user_role ADD VALUE 'nuevo_rol'`

### core.verification_status
**Descripción:** Estados del proceso de verificación de inmuebles
| Valor | Significado | Contexto |
|-------|-------------|----------|
| `pending` | Pendiente | Esperando revisión del equipo |
| `verified` | Verificado | Inmueble confirmado como legítimo |
| `rejected` | Rechazado | No cumple criterios de verificación |

### moderation.verification_status
**Descripción:** Estados específicos del workflow de moderación
| Valor | Significado | Contexto |
|-------|-------------|----------|
| `pending` | Pendiente | En cola de revisión |
| `approved` | Aprobado | Verificación completada exitosamente |
| `rejected` | Rechazado | No cumple criterios o hay problemas |

### Índices recomendados adicionales (por partición en listings)
- GIN(title gin_trgm_ops) y GIN(description gin_trgm_ops) para similitud.
- BTREE(published_until) para expiración rápida.
 - BTREE(owner_user_id, status) para validar límites de publicaciones activas por plan.
 - BTREE(district, operation, property_type, price) para filtros comunes.
 - Parcial: BTREE(published_at DESC) WHERE status='published'.
 - listing_amenities: (amenity_id) para filtros por servicio.


## 3. Tabla de usuarios (core)

### 3.1 core.users
**Descripción:** Usuarios de la plataforma (compradores, anunciantes, administradores)  
**PK:** id (UUID)  
**Autenticación:** Firebase Authentication (Email/Password, OAuth opcional)  
**Índices:** UNIQUE(email), UNIQUE(firebase_uid), trigger BEFORE UPDATE para updated_at

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único (PK) |
| firebase_uid | TEXT | SÍ | - | UID de Firebase Authentication |
| email | CITEXT | NO | - | Email único (case-insensitive) |
| phone | TEXT | SÍ | - | Teléfono de contacto |
| first_name | TEXT | SÍ | - | Nombre |
| last_name | TEXT | SÍ | - | Apellido |
| profile_picture_url | TEXT | SÍ | - | URL de foto de perfil |
| national_id | TEXT | SÍ | - | DNI/Cédula |
| national_id_type | TEXT | SÍ | 'DNI' | Tipo de documento |
| is_verified | BOOLEAN | NO | false | Usuario verificado |
| role | core.user_role | NO | 'user' | Rol del usuario (ver sección de roles) |
| is_active | BOOLEAN | NO | true | Usuario activo |
| created_at | TIMESTAMPTZ | NO | now() | Fecha de registro |
| updated_at | TIMESTAMPTZ | NO | now() | Última actualización |
| last_login_at | TIMESTAMPTZ | SÍ | - | Último acceso |
| login_count | INTEGER | NO | 0 | Contador de logins |

**Autenticación Firebase:**
- ✅ **Email/Password:** Registro tradicional sin dependencia de Google
- ✅ **OAuth opcional:** Google, Facebook, Apple como opciones adicionales  
- ✅ **Seguridad:** Firebase maneja hash de contraseñas, 2FA, recuperación
- ✅ **Escalabilidad:** Auto-scaling y alta disponibilidad
- ✅ **Compliance:** Cumple GDPR y normativas de protección de datos

### 3.2 core.agencies
**Descripción:** Agencias inmobiliarias registradas en la plataforma  
**PK:** id (UUID)  
**Trigger:** BEFORE UPDATE para updated_at

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único (PK) |
| name | TEXT | NO | - | Nombre comercial de la agencia |
| email | CITEXT | SÍ | - | Email de contacto principal |
| phone | TEXT | SÍ | - | Teléfono de contacto |
| website | TEXT | SÍ | - | Sitio web corporativo |
| address | TEXT | SÍ | - | Dirección física de oficinas |
| description | TEXT | SÍ | - | Descripción de servicios y especialidades |
| logo_url | TEXT | SÍ | - | URL del logo para mostrar en listings |
| is_verified | BOOLEAN | NO | FALSE | Verificación administrativa (credenciales, licencias) |
| created_at | TIMESTAMPTZ | NO | now() | Fecha de registro |
| updated_at | TIMESTAMPTZ | NO | now() | Última modificación (auto) |

**Reglas de negocio:**
- `is_verified=true`: Agencia verificada, puede aparecer como "Agencia Verificada" en listings
- Solo agencias verificadas pueden acceder a funciones premium
- El `logo_url` se muestra en listings asociados para dar credibilidad

### 3.3 core.user_agency
**Descripción:** Relación muchos-a-muchos usuario↔agencia  
**PK:** (user_id, agency_id)

| Columna | Tipo | Nulo | FK | Descripción |
|---------|------|------|-----|-------------|
| user_id | UUID | NO | → core.users(id) CASCADE | Usuario |
| agency_id | UUID | NO | → core.agencies(id) CASCADE | Agencia |

## 4. Anuncios y multimedia

### 4.1 core.listings PARTICIONADA
**Descripción:** Anuncios de inmuebles (particionada por mes)  
**PK:** (id, created_at) - Clave primaria compuesta que incluye columna de partición  
**Particiones:** core.listings_YYYY_MM (RANGE created_at)  
**Índices por partición:** 
- (status, verification_status, published_at DESC), (operation, property_type, price)
- (district, province, operation, property_type), (owner_user_id, created_at DESC)
- GIN(search_doc), GIN para búsqueda de texto completo
- UNIQUE(slug, created_at) para URLs amigables
- Geoespaciales en (latitude, longitude)

**Triggers:** set_updated_at_listings, enforce_listing_publish_rules  
**Constraint especial:** PRIMARY KEY debe incluir created_at por requisito de particionado

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| owner_user_id | UUID | NO | - | FK → core.users(id) RESTRICT |
| agency_id | UUID | SÍ | - | FK → core.agencies(id) SET NULL |
| status | core.listing_status | NO | 'draft' | Estado del anuncio |
| operation | core.operation_type | NO | - | Tipo de operación |
| property_type | core.property_type | NO | - | Tipo de propiedad |
| title | TEXT | NO | - | Título del anuncio |
| description | TEXT | NO | - | Descripción detallada |
| price | NUMERIC(12,2) | NO | - | Precio (CHECK >= 0) |
| currency | CHAR(3) | NO | 'PEN' | Moneda (PEN/USD) |
| bedrooms | SMALLINT | SÍ | - | Número de dormitorios |
| bathrooms | SMALLINT | SÍ | - | Número de baños |
| parking_spaces | SMALLINT | SÍ | - | Espacios de estacionamiento |
| area_m2 | NUMERIC(10,2) | SÍ | - | Área en metros cuadrados |
| year_built | SMALLINT | SÍ | - | Año de construcción |
| address | TEXT | SÍ | - | Dirección |
| district | TEXT | SÍ | - | Distrito |
| province | TEXT | SÍ | - | Provincia |
| country | TEXT | SÍ | 'Peru' | País |
| location | geography(Point,4326) | SÍ | - | Coordenadas PostGIS |
| features | JSONB | NO | '{}' | Características adicionales |
| advertiser_type | core.advertiser_type | SÍ | - | Tipo de anunciante |
| verification_status | core.verification_status | NO | 'pending' | Estado de verificación |
| rental_term | core.rental_term | SÍ | - | Término de alquiler |
| image_count | INTEGER | NO | 0 | Contador de imágenes |
| video_count | INTEGER | NO | 0 | Contador de videos |
| has_media | BOOLEAN | NO | GENERATED | (image_count + video_count) > 0 |
| contact_whatsapp_phone_e164 | TEXT | SÍ | - | Teléfono WhatsApp E.164 |
| contact_whatsapp_link | TEXT | SÍ | - | Link WhatsApp preformateado |
| published_at | TIMESTAMPTZ | SÍ | - | Fecha de publicación |
| published_until | TIMESTAMPTZ | SÍ | - | Válido hasta (plan) |
| created_at | TIMESTAMPTZ | NO | now() | Fecha de creación (parte de PK compuesta) |
| updated_at | TIMESTAMPTZ | NO | now() | Última modificación |
| search_doc | tsvector | NO | GENERATED | FTS español title+description |

### 4.2 core.images
**Descripción:** Imágenes de anuncios  
**PK:** id (UUID)  
**FK:** (listing_id, listing_created_at) → core.listings CASCADE  
**Índices:** (listing_id, display_order)  
**Triggers:** maintain_media_counters, enforce_media_limits

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| listing_id | UUID | NO | - | ID del anuncio |
| listing_created_at | TIMESTAMPTZ | NO | - | Fecha creación anuncio (para FK compuesta) |
| filename | TEXT | NO | - | Nombre del archivo |
| original_url | TEXT | NO | - | URL de la imagen original |
| thumbnail_url | TEXT | SÍ | - | URL de miniatura |
| medium_url | TEXT | SÍ | - | URL de imagen mediana |
| display_order | INTEGER | NO | 0 | Orden de visualización |
| alt_text | TEXT | SÍ | - | Texto alternativo |
| width | INTEGER | SÍ | - | Ancho en píxeles |
| height | INTEGER | SÍ | - | Alto en píxeles |
| file_size | INTEGER | SÍ | - | Tamaño en bytes |
| is_main | BOOLEAN | NO | FALSE | Imagen principal |
| created_at | TIMESTAMPTZ | NO | now() | Fecha de subida |

### 4.3 core.videos
**Descripción:** Videos de anuncios  
**PK:** id (UUID)  
**FK:** (listing_id, listing_created_at) → core.listings CASCADE  
**Índices:** (listing_id, display_order)  
**Triggers:** maintain_media_counters, enforce_media_limits

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| listing_id | UUID | NO | - | ID del anuncio |
| listing_created_at | TIMESTAMPTZ | NO | - | Fecha creación anuncio (para FK compuesta) |
| filename | TEXT | NO | - | Nombre del archivo |
| original_url | TEXT | NO | - | URL del video |
| thumbnail_url | TEXT | SÍ | - | URL de miniatura |
| duration_seconds | INTEGER | SÍ | - | Duración en segundos |
| file_size | INTEGER | SÍ | - | Tamaño en bytes |
| width | INTEGER | SÍ | - | Ancho en píxeles |
| height | INTEGER | SÍ | - | Alto en píxeles |
| display_order | INTEGER | NO | 0 | Orden de visualización |
| is_main | BOOLEAN | NO | FALSE | Video principal |
| created_at | TIMESTAMPTZ | NO | now() | Fecha de subida |

## 5. Leads y engagement

### 5.1 core.leads ⚡ PARTICIONADA
**Descripción:** Contactos/leads enviados a propietarios  
**PK:** (id, created_at) - Clave primaria compuesta que incluye columna de partición  
**Particiones:** core.leads_YYYY_MM (RANGE created_at)  
**FK:** (listing_id, listing_created_at) → core.listings CASCADE  
**Índices por partición:** (listing_id, listing_created_at, created_at), (user_id, created_at), (source, created_at)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| listing_id | UUID | NO | - | ID del anuncio |
| listing_created_at | TIMESTAMPTZ | NO | - | Fecha creación anuncio (para FK compuesta) |
| user_id | UUID | SÍ | - | FK → core.users(id) SET NULL |
| contact_name | TEXT | NO | - | Nombre del interesado |
| contact_email | CITEXT | NO | - | Email del interesado |
| contact_phone | TEXT | SÍ | - | Teléfono del interesado |
| message | TEXT | SÍ | - | Mensaje del lead |
| source | TEXT | NO | 'web' | Origen: web/app/campaign |
| utm_source | TEXT | SÍ | - | Fuente UTM |
| utm_medium | TEXT | SÍ | - | Medio UTM |
| utm_campaign | TEXT | SÍ | - | Campaña UTM |
| ip_address | INET | SÍ | - | Dirección IP del contacto |
| user_agent | TEXT | SÍ | - | User agent del navegador |
| created_at | TIMESTAMPTZ | NO | now() | Fecha del contacto (parte de PK compuesta) |

### 5.2 core.favorites
**Descripción:** Favoritos de usuarios  
**PK:** id (UUID)  
**FK:** (listing_id, listing_created_at) → core.listings CASCADE  
**Índices:** (user_id, created_at DESC), (listing_id, listing_created_at)  
**Constraint:** UNIQUE(user_id, listing_id, listing_created_at)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| user_id | UUID | NO | - | FK → core.users(id) CASCADE |
| listing_id | UUID | NO | - | ID del anuncio |
| listing_created_at | TIMESTAMPTZ | NO | - | Fecha creación anuncio (para FK compuesta) |
| created_at | TIMESTAMPTZ | NO | now() | Fecha de favorito |

### 5.3 core.alerts
**Descripción:** Búsquedas guardadas y alertas  
**PK:** id (UUID)  
**Trigger:** BEFORE UPDATE para updated_at

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| user_id | UUID | NO | - | FK → core.users(id) CASCADE |
| name | TEXT | NO | - | Nombre de la alerta |
| search_params | JSONB | NO | - | Criterios de búsqueda |
| is_active | BOOLEAN | NO | TRUE | Alerta activa |
| frequency | TEXT | NO | 'daily' | Frecuencia: daily/weekly/instant |
| last_notified_at | TIMESTAMPTZ | SÍ | - | Último envío |
| created_at | TIMESTAMPTZ | NO | now() | Fecha de creación |
| updated_at | TIMESTAMPTZ | NO | now() | Última modificación |

## 6. Interacciones de usuario

### 6.1 core.leads ⚡ PARTICIONADA
**Descripción:** Leads de contacto con seguimiento UTM  
**PK:** (id, created_at) - Clave primaria compuesta que incluye columna de partición  
**Particiones:** core.leads_YYYY_MM (RANGE created_at)  
**FK Compuesta:** (listing_id, listing_created_at) → core.listings (id, created_at)  
**Índices por partición:** (listing_id, listing_created_at, created_at), (contact_phone), (email, created_at)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| listing_id | UUID | NO | - | ID del anuncio (parte de FK compuesta) |
| listing_created_at | TIMESTAMPTZ | NO | - | Created_at del anuncio (parte de FK compuesta) |
| user_id | UUID | SÍ | - | FK → core.users(id) SET NULL (si registrado) |
| contact_name | TEXT | NO | - | Nombre del contacto |
| contact_phone | TEXT | SÍ | - | Teléfono del contacto |
| email | CITEXT | SÍ | - | Email del contacto |
| message | TEXT | SÍ | - | Mensaje del lead |
| utm_source | TEXT | SÍ | - | Fuente UTM (google, facebook, etc.) |
| utm_medium | TEXT | SÍ | - | Medio UTM (cpc, social, email, etc.) |
| utm_campaign | TEXT | SÍ | - | Campaña UTM |
| utm_term | TEXT | SÍ | - | Término UTM |
| utm_content | TEXT | SÍ | - | Contenido UTM |
| created_at | TIMESTAMPTZ | NO | now() | Timestamp de creación (parte de PK compuesta) |

### 6.2 core.favorites
**Descripción:** Favoritos de usuarios  
**PK:** (user_id, listing_id, listing_created_at)  
**FK Compuesta:** (listing_id, listing_created_at) → core.listings (id, created_at)  
**Índices:** (user_id, created_at DESC), (listing_id, listing_created_at)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| user_id | UUID | NO | - | FK → core.users(id) CASCADE |
| listing_id | UUID | NO | - | ID del anuncio (parte de FK compuesta) |
| listing_created_at | TIMESTAMPTZ | NO | - | Created_at del anuncio (parte de FK compuesta) |
| created_at | TIMESTAMPTZ | NO | now() | Fecha de marcado como favorito |

### 6.3 core.search_alerts
**Descripción:** Alertas de búsqueda personalizadas  
**PK:** id (UUID)  
**Índices:** (user_id, is_active), (created_at)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| user_id | UUID | NO | - | FK → core.users(id) CASCADE |
| name | TEXT | NO | - | Nombre de la alerta |
| search_criteria | JSONB | NO | '{}' | Criterios de búsqueda (filtros JSON) |
| frequency | TEXT | NO | 'daily' | Frecuencia: daily/weekly/immediate |
| is_active | BOOLEAN | NO | TRUE | Alerta activa |
| last_run | TIMESTAMPTZ | SÍ | - | Última ejecución |
| created_at | TIMESTAMPTZ | NO | now() | Fecha de creación |

### 6.4 core.amenities
**Descripción:** Catálogo de amenidades y servicios  
**PK:** id (SERIAL)  
**Índices:** UNIQUE(name)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | SERIAL | NO | nextval() | Identificador único |
| name | TEXT | NO | - | Nombre único (ej: 'ascensor', 'piscina') |
| icon | TEXT | SÍ | - | Icono o clase CSS |

### 6.5 core.listing_amenities
**Descripción:** Amenidades asociadas a anuncios  
**PK:** (listing_id, listing_created_at, amenity_id)  
**FK Compuesta:** (listing_id, listing_created_at) → core.listings CASCADE  
**Índices:** (listing_id, listing_created_at), (amenity_id)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| listing_id | UUID | NO | - | ID del anuncio (parte de FK compuesta) |
| listing_created_at | TIMESTAMPTZ | NO | - | Fecha creación anuncio (para FK compuesta) |
| amenity_id | INTEGER | NO | - | FK → core.amenities(id) CASCADE |

## 6.5. Verificación y moderación

### 6.5.1 moderation.verifications ⚡ PARTICIONADA
**Descripción:** Workflow de verificación de listings  
**PK:** (id, created_at) - Clave primaria compuesta con columna de partición  
**Particiones:** moderation.verifications_YYYY_MM (RANGE created_at)  
**FK Compuesta:** (listing_id, listing_created_at) → core.listings (id, created_at)  
**Índices:** (status, created_at), (assigned_to, status), (listing_id, listing_created_at, status)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| listing_id | UUID | NO | - | ID del listing (parte de FK compuesta) |
| listing_created_at | TIMESTAMPTZ | NO | - | Created_at del listing (parte de FK compuesta) |
| status | moderation.verification_status | NO | 'pending' | Estado: pending/approved/rejected |
| assigned_to | UUID | SÍ | - | FK → core.users(id) SET NULL (reviewer) |
| rejection_reason | TEXT | SÍ | - | Razón de rechazo |
| notes | TEXT | SÍ | - | Notas internas del moderador |
| created_at | TIMESTAMPTZ | NO | now() | Timestamp de creación (parte de PK compuesta) |
| updated_at | TIMESTAMPTZ | NO | now() | Última actualización |

### 6.5.2 Vistas de moderación

#### moderation.v_pending_verifications
**Descripción:** Verifications pendientes con datos del listing y agencia  
**JOIN:** Corregido para usar FK compuesta con listings particionados  
**Filtros:** status = 'pending'  
**Ordenado por:** created_at ASC (FIFO)

### 6.5.3 Funciones de workflow

#### moderation.submit_for_verification()
**Descripción:** Registra listing para verificación  
**Parámetros:** listing_id, listing_created_at, submitter_id, notes  
**Delimitador:** `$submit_verification$`  
**Retorna:** UUID de la verificación creada

#### moderation.assign_verification()
**Descripción:** Asigna verificación a moderador  
**Parámetros:** verification_id, reviewer_id  
**Delimitador:** `$assign_verification$`  
**Retorna:** BOOLEAN de éxito

#### moderation.complete_verification()
**Descripción:** Completa proceso de verificación  
**Parámetros:** verification_id, status, reviewer_id, notes, rejection_reason  
**Delimitador:** `$complete_verification$`  
**Side Effects:** Actualiza is_verified en core.listings  
**Retorna:** BOOLEAN de éxito

## 7. Planes y facturación

### 7.1 core.plans
**Descripción:** Planes de suscripción con límites  
**PK:** id (UUID)  
**Índices:** UNIQUE(code)  
**Trigger:** BEFORE UPDATE para updated_at

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| code | TEXT | NO | - | Código único (FREE, PRO_M, PRO_Y) |
| name | TEXT | NO | - | Nombre del plan |
| description | TEXT | SÍ | - | Descripción detallada |
| tier | TEXT | NO | - | Nivel: free/pro/enterprise |
| period_months | SMALLINT | NO | 1 | Duración en meses |
| price_amount | NUMERIC(12,2) | NO | 0 | Precio |
| price_currency | CHAR(3) | NO | 'PEN' | Moneda |
| max_active_listings | INTEGER | NO | 1 | Máx. anuncios activos |
| listing_active_days | INTEGER | NO | 30 | Días de vigencia |
| max_images_per_listing | INTEGER | NO | 10 | Máx. imágenes por anuncio |
| max_videos_per_listing | INTEGER | NO | 1 | Máx. videos por anuncio |
| max_video_seconds | INTEGER | NO | 60 | Máx. duración video |
| max_image_width | INTEGER | NO | 4096 | Máx. ancho imagen |
| max_image_height | INTEGER | NO | 4096 | Máx. alto imagen |
| created_at | TIMESTAMPTZ | NO | now() | Fecha de creación |
| updated_at | TIMESTAMPTZ | NO | now() | Última modificación |

### 7.2 core.subscriptions
**Descripción:** Suscripciones de usuarios a planes  
**PK:** id (UUID)  
**Índices:** (user_id, status)  
**Trigger:** BEFORE UPDATE para updated_at

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| user_id | UUID | NO | - | FK → core.users(id) CASCADE |
| plan_id | UUID | NO | - | FK → core.plans(id) RESTRICT |
| status | core.subscription_status | NO | 'active' | Estado de suscripción |
| auto_renew | BOOLEAN | NO | TRUE | Renovación automática |
| trial_end | TIMESTAMPTZ | SÍ | - | Fin del período de prueba |
| current_period_start | TIMESTAMPTZ | NO | now() | Inicio período actual |
| current_period_end | TIMESTAMPTZ | NO | now() + 30d | Fin período actual |
| cancel_at | TIMESTAMPTZ | SÍ | - | Programada cancelación |
| canceled_at | TIMESTAMPTZ | SÍ | - | Fecha de cancelación |
| external_customer_id | TEXT | SÍ | - | ID cliente PSP |
| external_subscription_id | TEXT | SÍ | - | ID suscripción PSP |
| meta | JSONB | NO | '{}' | Metadatos adicionales |
| created_at | TIMESTAMPTZ | NO | now() | Fecha de creación |
| updated_at | TIMESTAMPTZ | NO | now() | Última modificación |

### 7.3 core.tax_rates
**Descripción:** Tasas de impuesto (IGV, etc.)  
**PK:** id (UUID)  
**Índices:** UNIQUE(code)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| code | TEXT | NO | - | Código único (IGV18) |
| name | TEXT | NO | - | Nombre descriptivo |
| percentage | NUMERIC(5,2) | NO | - | Porcentaje (ej: 18.00) |
| active | BOOLEAN | NO | TRUE | Tasa activa |
| created_at | TIMESTAMPTZ | NO | now() | Fecha de creación |

### 7.4 core.coupons
**Descripción:** Cupones de descuento  
**PK:** id (UUID)  
**Índices:** UNIQUE(code)  
**Check:** (percent_off IS NOT NULL) OR (amount_off IS NOT NULL)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| code | TEXT | NO | - | Código único del cupón |
| percent_off | NUMERIC(5,2) | SÍ | - | Descuento porcentual (0-100) |
| amount_off | NUMERIC(12,2) | SÍ | - | Descuento fijo |
| currency | CHAR(3) | SÍ | 'PEN' | Moneda descuento fijo |
| max_redemptions | INTEGER | SÍ | - | Máx. usos |
| expires_at | TIMESTAMPTZ | SÍ | - | Fecha de expiración |
| created_at | TIMESTAMPTZ | NO | now() | Fecha de creación |

### 7.5 core.invoices
**Descripción:** Facturas por suscripciones  
**PK:** id (UUID)  
**Índices:** (user_id, status, issued_at DESC), UNIQUE(number)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| number | TEXT | SÍ | - | Número de factura (único) |
| user_id | UUID | NO | - | FK → core.users(id) CASCADE |
| subscription_id | UUID | SÍ | - | FK → core.subscriptions(id) SET NULL |
| plan_id | UUID | SÍ | - | FK → core.plans(id) SET NULL |
| currency | CHAR(3) | NO | 'PEN' | Moneda |
| amount_due | NUMERIC(12,2) | NO | 0 | Monto adeudado |
| tax_amount | NUMERIC(12,2) | NO | 0 | Impuestos |
| discount_amount | NUMERIC(12,2) | NO | 0 | Descuentos |
| amount_paid | NUMERIC(12,2) | NO | 0 | Monto pagado |
| status | core.invoice_status | NO | 'open' | Estado de factura |
| tax_rate_id | UUID | SÍ | - | FK → core.tax_rates(id) |
| coupon_id | UUID | SÍ | - | FK → core.coupons(id) |
| issued_at | TIMESTAMPTZ | NO | now() | Fecha de emisión |
| due_at | TIMESTAMPTZ | SÍ | - | Fecha de vencimiento |
| paid_at | TIMESTAMPTZ | SÍ | - | Fecha de pago |
| external_invoice_id | TEXT | SÍ | - | ID factura PSP |
| meta | JSONB | NO | '{}' | Metadatos adicionales |

### 7.6 core.invoice_items
**Descripción:** Líneas de factura  
**PK:** id (UUID)  
**Índices:** (invoice_id)  
**Check:** quantity > 0

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| invoice_id | UUID | NO | - | FK → core.invoices(id) CASCADE |
| description | TEXT | NO | - | Descripción del ítem |
| quantity | INTEGER | NO | 1 | Cantidad |
| unit_amount | NUMERIC(12,2) | NO | - | Precio unitario |
| currency | CHAR(3) | NO | 'PEN' | Moneda |
| plan_id | UUID | SÍ | - | FK → core.plans(id) SET NULL |
| period_start | TIMESTAMPTZ | SÍ | - | Inicio período facturado |
| period_end | TIMESTAMPTZ | SÍ | - | Fin período facturado |
| tax_rate_id | UUID | SÍ | - | FK → core.tax_rates(id) |
| created_at | TIMESTAMPTZ | NO | now() | Fecha de creación |

### 7.7 core.payments
**Descripción:** Pagos procesados  
**PK:** id (UUID)  
**Índices:** (invoice_id, status, created_at DESC)  
**Trigger:** on_payment_succeeded

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| invoice_id | UUID | NO | - | FK → core.invoices(id) CASCADE |
| user_id | UUID | NO | - | FK → core.users(id) CASCADE |
| provider | core.billing_provider | NO | - | Proveedor de pagos |
| amount | NUMERIC(12,2) | NO | - | Monto pagado |
| currency | CHAR(3) | NO | 'PEN' | Moneda |
| status | core.payment_status | NO | 'pending' | Estado del pago |
| provider_payment_id | TEXT | SÍ | - | ID pago en PSP |
| method_brand | TEXT | SÍ | - | Marca del método (Visa/Master) |
| method_last4 | TEXT | SÍ | - | Últimos 4 dígitos |
| receipt_url | TEXT | SÍ | - | URL del recibo |
| failure_code | TEXT | SÍ | - | Código de error |
| failure_message | TEXT | SÍ | - | Mensaje de error |
| created_at | TIMESTAMPTZ | NO | now() | Fecha de creación |
| confirmed_at | TIMESTAMPTZ | SÍ | - | Fecha de confirmación |

### 7.8 core.refunds
**Descripción:** Reembolsos de pagos  
**PK:** id (UUID)  
**Índices:** (payment_id)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| payment_id | UUID | NO | - | FK → core.payments(id) CASCADE |
| amount | NUMERIC(12,2) | NO | - | Monto reembolsado |
| reason | TEXT | SÍ | - | Motivo del reembolso |
| status | TEXT | NO | 'succeeded' | Estado del reembolso |
| provider_refund_id | TEXT | SÍ | - | ID reembolso en PSP |
| created_at | TIMESTAMPTZ | NO | now() | Fecha de creación |

## 8. Analytics y eventos

### 8.1 analytics.events ⚡ PARTICIONADA
**Descripción:** Eventos de interacción de usuarios  
**PK:** (id, created_at) - Clave primaria compuesta que incluye columna de partición  
**Particiones:** analytics.events_YYYY_MM (RANGE created_at)  
**Índices por partición:** (user_id, created_at), (event_type, created_at), (listing_id, event_type, created_at), (session_id, created_at), GIN(properties)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| user_id | UUID | SÍ | - | FK → core.users(id) SET NULL |
| session_id | TEXT | SÍ | - | ID de sesión del usuario |
| event_type | TEXT | NO | - | Tipo: 'view', 'favorite', 'contact', 'search', 'click' |
| listing_id | UUID | SÍ | - | ID del anuncio relacionado |
| listing_created_at | TIMESTAMPTZ | SÍ | - | Para futura FK a listings particionados |
| properties | JSONB | NO | '{}' | Contexto adicional (UTM, device, etc.) |
| ip_address | INET | SÍ | - | Dirección IP del usuario |
| user_agent | TEXT | SÍ | - | User agent del navegador |
| created_at | TIMESTAMPTZ | NO | now() | Timestamp del evento (parte de PK compuesta) |

### 8.2 Materialized Views (MVs)

#### analytics.mv_price_m2_90d
**Descripción:** Precios promedio por m² últimos 90 días  
**Índices:** UNIQUE(district, province, operation, property_type, day)  
**Refresh:** CONCURRENTLY con analytics.refresh_all_mvs()

| Columna | Tipo | Descripción |
|---------|------|-------------|
| district | TEXT | Distrito |
| province | TEXT | Provincia |
| operation | core.operation_type | Tipo de operación |
| property_type | core.property_type | Tipo de propiedad |
| day | DATE | Día (truncado) |
| listings_count | BIGINT | Cantidad de anuncios |
| median_price_m2 | NUMERIC | Precio mediano por m² |
| avg_price_m2 | NUMERIC | Precio promedio por m² |
| min_price_m2 | NUMERIC | Precio mínimo por m² |
| max_price_m2 | NUMERIC | Precio máximo por m² |

#### analytics.mv_leads_daily
**Descripción:** Leads diarios por distrito  
**Índices:** UNIQUE(district, day)  
**JOIN:** Corregido con FK compuesta a listings particionados

| Columna | Tipo | Descripción |
|---------|------|-------------|
| district | TEXT | Distrito (con COALESCE para valores nulos) |
| day | DATE | Día |
| leads_count | BIGINT | Cantidad de leads |

### 8.3 Vistas y funciones de analytics

#### analytics.v_listing_performance
**Descripción:** Métricas de rendimiento por listing  
**Columnas calculadas:** lead_conversion_rate, favorite_rate, days_on_market

#### analytics.track_event()
**Descripción:** API para registrar eventos desde la aplicación  
**Parámetros:** event_type, user_id, session_id, listing_id, listing_created_at, properties  
**Retorna:** UUID del evento creado

#### analytics.refresh_all_mvs()
**Descripción:** Actualiza todas las vistas materializadas con logging automático  
**Delimitador:** `$refresh_mvs$`  
**Logging:** Registra timestamp en analytics.events

## 9. Seguridad y auditoría

### 9.1 sec.user_sessions
**Descripción:** Sesiones activas de usuarios para autenticación  
**PK:** id (UUID)  
**Índices:** (user_id, expires_at), UNIQUE(token_hash), (last_activity)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| user_id | UUID | NO | - | FK → core.users(id) CASCADE |
| token_hash | TEXT | NO | - | Hash del token de sesión (único) |
| ip_address | INET | SÍ | - | Dirección IP de origen |
| user_agent | TEXT | SÍ | - | User agent del navegador |
| last_activity | TIMESTAMPTZ | NO | now() | Última actividad |
| expires_at | TIMESTAMPTZ | NO | - | Fecha de expiración |
| created_at | TIMESTAMPTZ | NO | now() | Fecha de creación |
| revoked_at | TIMESTAMPTZ | SÍ | - | Fecha de revocación |

### 9.2 sec.audit_log
**Descripción:** Log de auditoría para todas las operaciones críticas  
**PK:** id (UUID)  
**Índices:** (user_id, created_at DESC), (table_name, record_id, created_at DESC)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| user_id | UUID | SÍ | - | FK → core.users(id) SET NULL |
| action | TEXT | NO | - | Acción: INSERT/UPDATE/DELETE/CONSENT_GRANTED/etc |
| table_name | TEXT | NO | - | Tabla afectada (schema.table) |
| record_id | UUID | SÍ | - | ID del registro afectado |
| old_values | JSONB | SÍ | - | Valores anteriores (UPDATE/DELETE) |
| new_values | JSONB | SÍ | - | Valores nuevos (INSERT/UPDATE) |
| ip_address | INET | SÍ | - | Dirección IP del usuario |
| user_agent | TEXT | SÍ | - | User agent del navegador |
| created_at | TIMESTAMPTZ | NO | now() | Timestamp de la acción |

### 9.3 sec.user_consents
**Descripción:** Gestión de consentimientos según Ley 29733 (Perú)  
**PK:** id (UUID)  
**Índices:** (user_id, purpose), (granted, granted_at)  
**Constraint:** UNIQUE(user_id, purpose) DEFERRABLE - evita duplicados activos

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| user_id | UUID | NO | - | FK → core.users(id) CASCADE |
| purpose | TEXT | NO | - | Propósito: marketing/analytics/functional/etc |
| granted | BOOLEAN | NO | - | Consentimiento otorgado |
| granted_at | TIMESTAMPTZ | NO | now() | Fecha de otorgamiento |
| withdrawn_at | TIMESTAMPTZ | SÍ | - | Fecha de retiro |
| ip_address | INET | SÍ | - | IP donde se otorgó |
| user_agent | TEXT | SÍ | - | User agent del navegador |

### 9.4 sec.failed_logins
**Descripción:** Tracking de intentos fallidos de login para seguridad  
**PK:** id (UUID)  
**Índices:** (email, created_at DESC), (ip_address, created_at DESC)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| email | CITEXT | SÍ | - | Email del intento fallido |
| ip_address | INET | NO | - | Dirección IP del intento |
| user_agent | TEXT | SÍ | - | User agent del navegador |
| failure_reason | TEXT | SÍ | 'invalid_credentials' | Razón del fallo |
| created_at | TIMESTAMPTZ | NO | now() | Timestamp del intento |

### 9.5 Funciones de seguridad

#### sec.audit_trigger()
**Descripción:** Trigger genérico para auditoría automática  
**Delimitador:** `$audit_trigger$`  
**Aplica a:** Todas las tablas críticas (usuarios, listings, etc.)  
**Funcionalidad:** Captura INSERT/UPDATE/DELETE automáticamente

#### sec.grant_user_consent()
**Descripción:** Otorga consentimiento de usuario  
**Parámetros:** user_id, purpose, ip_address, user_agent  
**Delimitador:** `$grant_consent$`  
**Side Effects:** Retira consentimientos previos, registra en audit_log

#### sec.withdraw_user_consent()
**Descripción:** Retira consentimiento de usuario  
**Parámetros:** user_id, purpose, ip_address, user_agent  
**Delimitador:** `$withdraw_consent$`  
**Retorna:** BOOLEAN (éxito/fracaso)

#### sec.has_user_consent()
**Descripción:** Verifica si usuario tiene consentimiento activo  
**Parámetros:** user_id, purpose  
**Delimitador:** `$has_consent$`  
**Retorna:** BOOLEAN

#### sec.create_user_session()
**Descripción:** Crea nueva sesión de usuario  
**Parámetros:** user_id, token_hash, ip_address, user_agent, expires_hours  
**Delimitador:** `$create_session$`  
**Side Effects:** Revoca sesiones existentes con mismo token

#### sec.validate_session()
**Descripción:** Valida y actualiza sesión activa  
**Parámetros:** token_hash, ip_address  
**Delimitador:** `$validate_session$`  
**Side Effects:** Actualiza last_activity  
**Retorna:** UUID del user_id o NULL

#### sec.log_failed_login()
**Descripción:** Registra intento fallido de login  
**Parámetros:** email, ip_address, user_agent, failure_reason  
**Delimitador:** `$log_failed_login$`  
**Retorna:** UUID del log creado

### 9.6 Vistas de seguridad

#### sec.v_user_consent_status
**Descripción:** Estado actual de consentimientos por usuario  
**Columnas:** user_id, email, purpose, granted, granted_at, withdrawn_at, status  
**Status:** 'active', 'withdrawn', 'denied'
| created_at | TIMESTAMPTZ | NO | now() | Timestamp de creación |

### 9.2 sec.audit_logs
**Descripción:** Logs de auditoría del sistema  
**PK:** id  
**Índices:** (table_name, action, created_at), (user_id, created_at), BRIN(created_at)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| user_id | UUID | SÍ | - | Usuario que ejecuta acción |
| table_name | TEXT | NO | - | Tabla afectada |
| record_id | TEXT | NO | - | ID del registro (como texto) |
| action | TEXT | NO | - | Acción: INSERT/UPDATE/DELETE |
| old_values | JSONB | SÍ | - | Valores anteriores |
| new_values | JSONB | SÍ | - | Valores nuevos |
| ip_address | INET | SÍ | - | IP del usuario |
| user_agent | TEXT | SÍ | - | User agent |
| created_at | TIMESTAMPTZ | NO | now() | Timestamp de la acción |

## 10. Sistema de facturación y pagos

### 10.1 core.plans
**Descripción:** Planes de suscripción disponibles  
**PK:** id  
**Índices:** (active, price)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| name | TEXT | NO | - | Nombre del plan |
| description | TEXT | SÍ | - | Descripción detallada |
| price | NUMERIC(10,2) | NO | - | Precio mensual |
| currency | CHAR(3) | NO | 'PEN' | Moneda ISO |
| max_listings | INTEGER | SÍ | - | Límite de anuncios (NULL = ilimitado) |
| max_contacts_per_day | INTEGER | SÍ | - | Límite contactos/día (NULL = ilimitado) |
| max_photos_per_listing | INTEGER | SÍ | 10 | Límite fotos por anuncio |
| max_videos_per_listing | INTEGER | SÍ | 1 | Límite videos por anuncio |
| can_use_whatsapp | BOOLEAN | NO | false | Puede usar WhatsApp |
| active | BOOLEAN | NO | true | Plan disponible |
| sort_order | SMALLINT | NO | 0 | Orden de presentación |
| created_at | TIMESTAMPTZ | NO | now() | Timestamp de creación |

### 10.2 core.subscriptions
**Descripción:** Suscripciones de usuarios a planes  
**PK:** id  
**Índices:** (user_id, status), (current_period_end), (plan_id)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| user_id | UUID | NO | - | Usuario suscrito |
| plan_id | UUID | NO | - | Plan contratado |
| status | core.subscription_status | NO | 'trialing' | Estado de suscripción |
| provider | core.billing_provider | NO | - | Proveedor de facturación |
| external_id | TEXT | SÍ | - | ID en proveedor externo |
| current_period_start | TIMESTAMPTZ | NO | - | Inicio período actual |
| current_period_end | TIMESTAMPTZ | NO | - | Fin período actual |
| trial_start | TIMESTAMPTZ | SÍ | - | Inicio período de prueba |
| trial_end | TIMESTAMPTZ | SÍ | - | Fin período de prueba |
| canceled_at | TIMESTAMPTZ | SÍ | - | Fecha de cancelación |
| created_at | TIMESTAMPTZ | NO | now() | Timestamp de creación |

### 10.3 core.invoices
**Descripción:** Facturas generadas  
**PK:** id  
**Índices:** (subscription_id, status), (user_id, due_date), (provider, external_id)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| subscription_id | UUID | NO | - | Suscripción asociada |
| user_id | UUID | NO | - | Usuario facturado |
| status | core.invoice_status | NO | 'draft' | Estado de factura |
| provider | core.billing_provider | NO | - | Proveedor de facturación |
| external_id | TEXT | SÍ | - | ID en proveedor externo |
| number | TEXT | SÍ | - | Número de factura |
| currency | CHAR(3) | NO | 'PEN' | Moneda |
| subtotal | NUMERIC(10,2) | NO | - | Subtotal |
| tax | NUMERIC(10,2) | NO | 0 | Impuestos |
| total | NUMERIC(10,2) | NO | - | Total a pagar |
| due_date | TIMESTAMPTZ | NO | - | Fecha de vencimiento |
| paid_at | TIMESTAMPTZ | SÍ | - | Fecha de pago |
| created_at | TIMESTAMPTZ | NO | now() | Timestamp de creación |

### 10.4 core.payments
**Descripción:** Pagos realizados  
**PK:** id  
**Índices:** (invoice_id), (user_id, status), (provider, external_id), (created_at)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| invoice_id | UUID | NO | - | Factura pagada |
| user_id | UUID | NO | - | Usuario que paga |
| status | core.payment_status | NO | 'pending' | Estado del pago |
| provider | core.billing_provider | NO | - | Proveedor de pago |
| external_id | TEXT | SÍ | - | ID en proveedor externo |
| amount | NUMERIC(10,2) | NO | - | Monto pagado |
| currency | CHAR(3) | NO | 'PEN' | Moneda |
| payment_method | TEXT | SÍ | - | Método: card/bank/wallet |
| processed_at | TIMESTAMPTZ | SÍ | - | Fecha de procesamiento |
| metadata | JSONB | NO | '{}' | Metadata adicional |
| created_at | TIMESTAMPTZ | NO | now() | Timestamp de creación |

### 10.5 core.refunds
**Descripción:** Reembolsos procesados  
**PK:** id  
**Índices:** (payment_id), (user_id, status), (created_at)

| Columna | Tipo | Nulo | Default | Descripción |
|---------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Identificador único |
| payment_id | UUID | NO | - | Pago reembolsado |
| user_id | UUID | NO | - | Usuario del reembolso |
| amount | NUMERIC(10,2) | NO | - | Monto reembolsado |
| currency | CHAR(3) | NO | 'PEN' | Moneda |
| reason | TEXT | SÍ | - | Razón del reembolso |
| status | core.payment_status | NO | 'pending' | Estado del reembolso |
| provider | core.billing_provider | NO | - | Proveedor |
| external_id | TEXT | SÍ | - | ID en proveedor externo |
| processed_at | TIMESTAMPTZ | SÍ | - | Fecha de procesamiento |
| created_at | TIMESTAMPTZ | NO | now() | Timestamp de creación |

## 11. Vistas de asociación de planes

### 11.1 core.v_user_active_plan
**Descripción:** Vista que muestra el plan activo actual de cada usuario

```sql
SELECT 
    u.id as user_id,
    u.email,
    s.id as subscription_id,
    p.id as plan_id,
    p.name as plan_name,
    p.max_listings,
    p.max_contacts_per_day,
    p.max_photos_per_listing,
    p.max_videos_per_listing,
    p.can_use_whatsapp,
    s.status as subscription_status,
    s.current_period_end
FROM core.users u
LEFT JOIN core.subscriptions s ON u.id = s.user_id 
    AND s.status IN ('trialing', 'active')
LEFT JOIN core.plans p ON s.plan_id = p.id
```

### 11.2 core.v_user_usage_stats
**Descripción:** Vista que muestra estadísticas de uso vs. límites del plan

```sql
SELECT 
    u.user_id,
    u.plan_name,
    u.max_listings,
    u.max_contacts_per_day,
    u.max_photos_per_listing,
    u.max_videos_per_listing,
    COALESCE(ls.active_listings, 0) as current_listings,
    COALESCE(ct.contacts_today, 0) as contacts_today
FROM core.v_user_active_plan u
LEFT JOIN (
    -- Listings activos por usuario
    SELECT user_id, COUNT(*) as active_listings
    FROM core.listings 
    WHERE status = 'published'
    GROUP BY user_id
) ls ON u.user_id = ls.user_id
LEFT JOIN (
    -- Contactos hoy por usuario
    SELECT user_id, COUNT(*) as contacts_today
    FROM core.leads 
    WHERE created_at::date = CURRENT_DATE
    GROUP BY user_id
) ct ON u.user_id = ct.user_id
```

## 12. Funciones y triggers del sistema

### 12.1 Triggers de límites de plan

#### core.enforce_listing_limits_trigger
**Tabla:** core.listings  
**Evento:** BEFORE INSERT  
**Función:** core.check_listing_limits()

Valida que el usuario no exceda el límite de anuncios de su plan antes de crear uno nuevo.

#### core.enforce_contact_limits_trigger  
**Tabla:** core.leads  
**Evento:** BEFORE INSERT  
**Función:** core.check_contact_limits()

Valida que el usuario no exceda el límite de contactos diarios de su plan.

### 12.2 Funciones de particionado actualizadas

#### core.ensure_listings_partition(p_month_start date)
**Delimitadores:** `$partition_func$` y `$create_table$`  
**Descripción:** Crea partición mensual para core.listings con todos los índices especializados  
**Índices creados automáticamente:**
- `(owner_user_id, created_at DESC)` - consultas por propietario
- `(district, province, operation, property_type)` - filtros geográficos
- `(operation, property_type, price)` - filtros comerciales  
- `GIN(search_doc)` - búsqueda de texto completo
- `(status, verification_status, published_at)` - filtros de estado
- `(latitude, longitude)` - consultas geoespaciales
- `UNIQUE(slug, created_at)` - URLs amigables únicas

#### core.ensure_leads_partition(p_month_start date)  
**Delimitadores:** `$leads_func$` y `$create_partition$`  
**Descripción:** Crea partición mensual para core.leads con índices optimizados  
**Índices creados automáticamente:**
- `(listing_id, listing_created_at, created_at DESC)` - consultas por anuncio
- `(user_id, created_at DESC)` - consultas por usuario  
- `(source, created_at DESC)` - análisis por canal de origen

#### Corrección de llamadas con casting
```sql
-- Casting requerido para evitar errores de tipo
SELECT core.ensure_listings_partition(date_trunc('month', now())::date);
SELECT core.ensure_leads_partition(date_trunc('month', now())::date);
```

### 12.3 Funciones de búsqueda

#### core.search_listings(query_text, filters_json)
**Parámetros:**
- `query_text`: Texto de búsqueda
- `filters_json`: Filtros en formato JSON

**Retorna:** TABLE con resultados rankeados

Función principal de búsqueda híbrida que combina:
- Full Text Search con diccionario español
- Similitud por trigramas
- Filtros geográficos y de precio
- Ranking por relevancia y recencia

## 13. Índices principales del sistema

### 13.1 Índices de búsqueda
```sql
-- Búsqueda full-text en listings
core.listings_fts_idx: GIN(fts_vector)

-- Búsqueda por trigramas
core.listings_trigram_idx: GIN(title gin_trgm_ops, description gin_trgm_ops)

-- Búsqueda geográfica
core.listings_geo_idx: (district, province, operation, property_type)
```

### 13.2 Índices de rendimiento
```sql
-- Filtros comunes
core.listings_filters_idx: (status, operation, property_type, created_at)
core.listings_price_idx: (operation, price, price_per_m2)

-- Consultas de usuario
core.listings_user_status_idx: (user_id, status, created_at)
core.leads_user_date_idx: (user_id, created_at)

-- Analytics
analytics.events_type_date_idx: (type, created_at)
analytics.events_user_date_idx: (user_id, created_at)
```

### 13.3 Índices de particiones
```sql
-- Índices BRIN para particiones por fecha
core.listings_created_at_brin: BRIN(created_at)
core.leads_created_at_brin: BRIN(created_at)
analytics.events_created_at_brin: BRIN(created_at)
```

## 14. Configuración de RLS (Row Level Security)

### 14.1 Políticas de core.listings
```sql
-- Lectura pública de anuncios publicados
core.listings_public_read: 
  FOR SELECT TO public USING (status = 'published')

-- Propietarios pueden ver/editar sus anuncios
core.listings_owner_all:
  FOR ALL TO authenticated USING (user_id = current_user_id())

-- Administradores acceso completo
core.listings_admin_all:
  FOR ALL TO admin_role USING (true)
```

### 14.2 Políticas de core.leads
```sql
-- Propietarios ven leads de sus anuncios
core.leads_listing_owner:
  FOR SELECT TO authenticated 
  USING (listing_user_id = current_user_id())

-- Usuarios ven sus propios leads
core.leads_user_own:
  FOR ALL TO authenticated 
  USING (user_id = current_user_id())
```

### 14.3 Políticas de facturación
```sql
-- Usuarios solo ven su información de facturación
core.subscriptions_user_own:
  FOR ALL TO authenticated 
  USING (user_id = current_user_id())

core.invoices_user_own:
  FOR SELECT TO authenticated 
  USING (user_id = current_user_id())

core.payments_user_own:
  FOR SELECT TO authenticated 
  USING (user_id = current_user_id())
```

## 15. Mantenimiento y operaciones

### 15.1 Tareas automáticas
- **Particionado:** Crear particiones futuras y archivar antiguas (mensual)
- **Estadísticas:** Actualizar MVs de analytics (diario)
- **Limpieza:** Eliminar sesiones expiradas (semanal)
- **Facturación:** Procesar suscripciones y generar facturas (diario)

### 15.2 Monitoreo
- **Métricas clave:** Anuncios activos, leads diarios, ingresos MRR
- **Alertas:** Particiones llenas, MVs desactualizadas, pagos fallidos
- **Performance:** Tiempo de búsqueda, uso de índices, locks prolongados

### 15.3 Backup y recuperación
- **Frecuencia:** Backup completo semanal, incrementales diarios
- **Retención:** 30 días online, 1 año archivo
- **Pruebas:** Restore automático mensual en ambiente de testing

## 16. Modelo de capa gratuita

### 16.1 Funcionamiento del plan gratuito
El sistema soporta una **capa completamente gratuita** con las siguientes características:

**Plan FREE:**
- `code`: 'FREE'
- `tier`: 'free'  
- `price_amount`: 0.00
- `period_months`: 999 (permanente)
- Límites restrictivos pero funcionales

**Asignación automática:**
- Usuarios nuevos reciben automáticamente el plan FREE
- No requiere suscripción de pago
- Sin fecha de expiración (`current_period_end` muy lejana)

**Transición a planes pagos:**
- Usuarios pueden upgrader manteniendo su historial
- Al downgrade, regresan al plan FREE (no a trial)
- Plan FREE como fallback permanente

### 16.2 Diferencia FREE vs TRIAL
| Aspecto | Plan FREE | Status TRIALING |
|---------|-----------|-----------------|
| **Duración** | Permanente | Temporal (7-30 días) |
| **Propósito** | Capa gratuita funcional | Evaluación de plan pago |
| **Facturación** | Nunca se factura | Precede facturación |
| **Límites** | Básicos pero suficientes | Similares a plan pago |
| **Público objetivo** | Usuarios casuales | Potenciales clientes premium |

### 16.3 Gestión de límites gratuitos
Los triggers `check_listing_limits()` y `check_contact_limits()` validan:
- Plan FREE: Límites permanentes (ej: 1 anuncio, 5 contactos/día)
- Status TRIALING: Límites generosos durante evaluación
- Transición suave sin perder funcionalidad básica

---

## Extensiones requeridas y enumeraciones

- Extensiones PostgreSQL
  - pgcrypto — UUIDs/crypto; requerido.
  - btree_gin — índices combinados; recomendado.
  - pg_trgm — similitud trigram; recomendado para búsquedas.
  - citext — emails case-insensitive; recomendado.
  - unaccent — FTS sin acentos; recomendado.
  - postgis — geoespacial; opcional pero recomendado.

- Enumeraciones (actuales y a crear/extender)
  - core.listing_status: 'draft','published','archived' (+ 'pending_verification' a agregar).
  - core.operation_type: 'sale','rent' (+ 'temporary','project','transfer' a agregar).
  - core.property_type: 'apartment','house','office','land','commercial','other' (+ 'room','studio' a agregar).
  - core.subscription_status: 'trialing','active','past_due','canceled','unpaid'.
  - core.invoice_status: 'draft','open','paid','void','uncollectible'.
  - core.payment_status: 'pending','succeeded','failed','refunded'.
  - core.billing_provider: 'stripe','culqi','mercadopago','paypal','bank_transfer','other'.
  - A crear: core.rental_term, core.advertiser_type, core.verification_status.

## Vistas lógicas recomendadas (asociación cliente ↔ plan actual)

- core.v_user_current_plan (vista)
  - Descripción: Asocia cada usuario con su suscripción activa y plan vigente.
  - Columnas: user_id, subscription_id, plan_id, plan_code, plan_name, tier, period_months, current_period_start, current_period_end, status.
  - Lógica: suscripciones con status in ('trialing','active') y now() BETWEEN current_period_start AND current_period_end; elegir la más reciente por usuario.

- core.v_listing_owner_current_plan (vista)
  - Descripción: Une listing → owner_user_id → v_user_current_plan para conocer límites aplicables a ese listing.
  - Columnas: listing_id, listing_created_at, owner_user_id, plan_id, plan_code, max_active_listings, listing_active_days, max_images_per_listing, max_videos_per_listing, max_video_seconds, max_image_width, max_image_height.

Nota: Estas vistas evitan denormalizar el plan en `core.users`. La app las puede consultar para aplicar límites o mostrarlos en UI.

## WhatsApp en publicaciones

- Almacenamiento recomendado en `core.listings`:
  - contact_whatsapp_phone_e164 — número validado E.164 (ej: +51987654321).
  - contact_whatsapp_link — URL preconstruida wa.me o api.whatsapp.com con mensaje inicial.
- Generación del link: `https://wa.me/<E164_sin_+>?text=<mensaje%20urlencoded>`; ejemplo: `https://wa.me/51987654321?text=Estoy%20interesado%20en%20tu%20anuncio%20<id>`.
- Seguridad: Sanitizar el mensaje; no exponer datos personales adicionales.

## ¿Cómo funciona la partición mensual por rango?

- Definición: Las tablas `core.listings`, `core.leads` y `analytics.events` están definidas como PARTITION BY RANGE(created_at).
- Particiones hijas: Se crea una tabla hija por mes con un rango [mes, mes+1). Ejemplos: `core.listings_2025_08`, `core.leads_2025_09`.
- Enrutamiento: Al insertar una fila con created_at dentro del rango, PostgreSQL la coloca automáticamente en la partición correspondiente.
- Creación automática: Las funciones `core.ensure_listings_partition(date)`, `core.ensure_leads_partition(date)` y `analytics.ensure_events_partition(date)` crean la partición e índices del mes indicado. Se recomienda ejecutar un cron a fin de mes para el mes siguiente.
- Beneficios: Mejora de rendimiento en consultas por fecha, mantenimiento (VACUUM/ANALYZE) más eficiente y archivado sencillo (DETACH/DROP por partición).
- Respuesta corta: Sí, se crea una partición por mes; así cada mes tiene su propia tabla hija con índices propios.

## Helpers de particiones y archivado (implementados)

- core.ensure_next_month_partitions(): crea en bloque las particiones del mes siguiente para `core.listings`, `core.leads` y `analytics.events`.
- core.detach_old_listings_partitions(retain_months int=24, archive_schema text='archive'): desprende y mueve a esquema de archivo particiones antiguas de listings.
- core.detach_old_leads_partitions(retain_months int=24, archive_schema text='archive'): idem para leads.
- analytics.detach_old_events_partitions(retain_months int=24, archive_schema text='archive'): idem para events.
- Esquema `archive`: se crea automáticamente si no existe; queda fuera del camino crítico de consultas del front.

---

## 17. Diagrama Entidad-Relación

📊 **Ver diagrama ER completo:** [diagrama_er.md](./diagrama_er.md)

El diagrama incluye:
- **25+ entidades** con todos los campos y tipos
- **Relaciones completas** entre esquemas core, analytics, sec
- **Tablas particionadas** claramente identificadas
- **Leyenda detallada** con tipos de claves y datos
- **Notas arquitecturales** sobre particionamiento y diseño
