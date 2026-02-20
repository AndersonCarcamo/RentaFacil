# 📋 AUDITORÍA COMPLETA DE ARCHIVOS SQL

**Fecha**: 2025
**Objetivo**: Clasificar, ordenar y determinar qué archivos SQL usar para instalación de producción

---

## 🎯 RESUMEN EJECUTIVO

**Total de archivos SQL**: 77 archivos
- **Archivos CORE necesarios**: 25 archivos
- **Archivos DUPLICADOS** (eliminar/ignorar): 8 archivos
- **Archivos de MIGRACIÓN** (revisar caso por caso): 12 archivos
- **Archivos OBSOLETOS**: 2 archivos
- **Documentación**: 13 archivos .md
- **Testing/Samples**: 4 archivos

---

## ✅ CATEGORÍA 1: ARCHIVOS CORE (NECESARIOS)

### Instalación Base (Ejecutar en orden)

#### **FASE 1: Configuración Inicial**
```
01_crear_usuarios.sql          ← Crear usuarios PostgreSQL (benites_admin, benites_app)
00_database_setup.sql          ← Crear base de datos con roles y permisos
```

#### **FASE 2: Estructura Base**
```
01_extensions_and_schemas.sql  ← Instalar extensiones (pgcrypto, postgis, pg_trgm, citext)
02_enums_and_types.sql         ← Crear ENUMs (listing_status, property_type, etc.)
03_core_tables.sql             ← Crear tablas principales (users, listings, agencies)
```

#### **FASE 3: Funcionalidades Core**
```
04_user_interactions.sql       ← Leads, favorites, alerts, amenities
05_analytics.sql               ← Sistema de eventos y analytics
06_verification_workflow.sql   ← Workflow de verificación de listings
07_security_audit.sql          ← Auditoría y seguridad (audit_log, sessions, consents)
08_subscription_plans.sql      ← Planes y suscripciones (core.plans, core.subscriptions)
09_billing_payments.sql        ← Facturación (invoices, payments, refunds)
10_partition_management.sql    ← Funciones para manejo automático de particiones
11_business_rules.sql          ← Triggers y reglas de negocio
```

#### **FASE 4: Features Avanzadas**
```
14_auto_free_subscription.sql  ← Trigger: auto-asignar plan gratuito a nuevos usuarios
15_airbnb_bookings.sql         ← Sistema de reservas Airbnb (bookings, payments, calendar)
17_auto_advertiser_type.sql    ← Trigger: auto-determinar tipo de anunciante (owner/broker/agency)
18_add_listing_airbnb_fields.sql ← Campos Airbnb (smoking, deposit, check-in/out, utilities)
18_agent_invitations.sql       ← Sistema de invitaciones de agentes
19_add_user_agency_role_field.sql ← Campo role en tabla user_agency
20_listing_media_system.sql    ← Sistema multimedia (imágenes, videos, tours virtuales)
25_chat_system.sql             ← Sistema de chat completo
26_notifications_system.sql    ← Sistema de notificaciones (email, push, in-app)
28_performance_indexes.sql     ← Índices de rendimiento críticos
29_analytics_refactor.sql      ← Analytics mejorados (listing_views, contacts, searches)
32_optimize_listings_partial_indices.sql ← Optimización con índices parciales (NO vistas materializadas)
```

#### **FASE 5: Datos Iniciales (OPCIONAL)**
```
12_sample_data.sql             ← Datos de ejemplo (planes, amenities, usuarios de prueba)
```

**Total archivos CORE**: 25 archivos

---

## ❌ CATEGORÍA 2: ARCHIVOS DUPLICADOS (ELIMINAR/IGNORAR)

### ⚠️ **No ejecutar - Reemplazados por versiones mejoradas**

| Archivo | Problema | Usar en su lugar |
|---------|----------|------------------|
| `00_master_install.sql` | **VACÍO** - archivo sin contenido | ❌ Eliminar |
| `13_subscription_plans.sql` | Crea tabla `subscription_plans` SIN schema (debería ser `core.plans`) | ✅ `08_subscription_plans.sql` |
| `15_add_rating_reviews_system.sql` | Duplicado del sistema de ratings | ✅ `16_update_existing_db_add_rating.sql` |
| `17_add_max_guests.sql` | Agrega `max_guests` sin constraints | ✅ `17_add_max_guests_to_listings.sql` |
| `31_optimize_listings_inheritance.sql` | **OBSOLETO** - Usa vistas materializadas (inconsistencia 0-120s) | ✅ `32_optimize_listings_partial_indices.sql` |

### 🔄 **Archivos de Migración Redundantes**

Estos archivos agregan columnas que **ya están incluidas** en archivos posteriores:

| Archivo | Columnas que agrega | Ya incluido en |
|---------|---------------------|----------------|
| `add_furnished_column.sql` | `furnished` | `migration_studio_furnished_roommate.sql` |
| `add_rental_model_column.sql` | `rental_model` (enum + columna) | `32_optimize_listings_partial_indices.sql` |
| `add_airbnb_columns.sql` | `airbnb_score`, `airbnb_eligible`, `airbnb_opted_out` | `18_add_listing_airbnb_fields.sql` |

**⚠️ IMPORTANTE**: Solo usar si estás migrando una base de datos existente que no tiene estos campos.

---

## 🔧 CATEGORÍA 3: ARCHIVOS DE MIGRACIÓN (Revisar caso por caso)

### 📌 **Para Bases de Datos Existentes (ya en producción)**

Estos archivos son **ALTER TABLE** para agregar campos/funcionalidades a una base ya en uso:

| Archivo | Propósito | Ejecutar si... |
|---------|-----------|----------------|
| `14_add_plan_target_type.sql` | Agrega campo `target_type` a planes | Tu base NO tiene este campo |
| `16_update_existing_db_add_rating.sql` | Agrega `rating` y `total_reviews` a listings | Necesitas sistema de ratings |
| `17_add_max_guests_to_listings.sql` | Agrega `max_guests` con constraints | Base existente sin este campo |
| `17_fix_airbnb_score.sql` | Corrige cálculo de airbnb_score | Ya tienes airbnb_score pero está mal calculado |
| `26_add_payment_deadline.sql` | Agrega `payment_deadline` a bookings | Usas sistema de reservas |
| `27_add_payment_proof.sql` | Agrega `payment_proof_url` a payments | Necesitas almacenar comprobantes |
| `30_generate_slugs.sql` | Genera slugs para listings existentes | Migración de datos legacy |
| `migration_add_contact_email.sql` | Agrega `contact_email` a listings | Base antigua sin este campo |
| `migration_fix_priority_column.sql` | Corrige tipo dato de `priority` | Problemas con columna priority |
| `migration_studio_furnished_roommate.sql` | Agrega `studio`, `roommate`, `furnished` | Base sin estas features |
| `migration_rental_enhancements.sql` | Mejoras en sistema de alquiler | Migración incremental |
| `migration_create_verifications_table.sql` | Crea tabla `verifications` separada | Sistema legacy de verificaciones |

**⚠️ NO EJECUTAR en instalación limpia** - Estos son para agregar features a una base ya en uso.

---

## 🧪 CATEGORÍA 4: ARCHIVOS DE TESTING/DESARROLLO

### Para desarrollo y pruebas locales

| Archivo | Propósito |
|---------|-----------|
| `create_test_database.sql` | Crear base de datos de testing |
| `16_test_airbnb_property.sql` | Insertar propiedad Airbnb de prueba |
| `sample_data_new_features.sql` | Datos de ejemplo para nuevas features |
| `verificar_agencias.sql` | Script de verificación de agencias |

---

## 🔍 CATEGORÍA 5: ARCHIVOS DE FIXES/PARCHES

### Scripts de corrección específicos

| Archivo | Problema que soluciona |
|---------|------------------------|
| `emergency_airbnb_fix.sql` | Corrección urgente sistema Airbnb |
| `fix_vincular_usuario_agencia.sql` | Corrige relación usuario-agencia |
| `add_airbnb_functions_safe.sql` | Agrega funciones Airbnb con manejo seguro |
| `add_room_property_type.sql` | Agrega tipo 'room' a enum property_type |
| `add_studio_property_type.sql` | Agrega tipo 'studio' a enum property_type |
| `airbnb_system_optimized.sql` | Versión optimizada del sistema Airbnb |

**⚠️ Ejecutar solo si tienes el problema específico que solucionan**

---

## 📚 CATEGORÍA 6: DOCUMENTACIÓN

### Archivos Markdown (conservar)

```
00_INICIO_RAPIDO.md                    ← Guía de inicio rápido
01_CREAR_USUARIOS.md                   ← Cómo crear usuarios PostgreSQL
17_auto_advertiser_type_README.md      ← Documentación advertiser_type
AGENT_MANAGEMENT_IMPLEMENTATION.md     ← Sistema de gestión de agentes
AIRBNB_BOOKING_FLOW.md                 ← Flujo de reservas Airbnb
ANALISIS_CRITICO_VISTAS_MATERIALIZADAS.md ← Por qué NO usar vistas materializadas
ANALISIS_RATING_Y_STATUS.md            ← Análisis rating y status
DECISION_INDICES_VS_VISTAS.md          ← Decisión técnica: índices > vistas
Diccionario_de_Datos.md                ← Diccionario completo
Documentación.md                       ← Documentación general
ENDPOINTS_ADMIN_PENDIENTES.md          ← Endpoints admin pendientes
ESTRATEGIA_ASYNC.md                    ← Estrategia async/caché
GUIA_INSTALACION_COMPLETA.md           ← Guía instalación paso a paso
INSTALL_ADVERTISER_TYPE.md             ← Instalación advertiser_type
MEJORAS_AGENCIAS_IMPLEMENTADAS.md      ← Mejoras sistema agencias
PLANES_AGENCIAS.md                     ← Planes para agencias
README.md                              ← README principal
RESUMEN_EJECUTIVO.md                   ← Resumen ejecutivo optimizaciones
RESUMEN_MEJORAS_FRONTEND.md            ← Mejoras frontend
SISTEMA_INVITACIONES_EMAIL.md          ← Sistema invitaciones por email
```

---

## 🎯 ORDEN DE INSTALACIÓN RECOMENDADO

### Para Instalación Nueva (Servidor Impecable)

```bash
# ============================================
# INSTALACIÓN COMPLETA BASE DE DATOS POSTGRESQL
# ============================================

# FASE 1: Usuarios y Base de Datos
psql -U postgres -f 01_crear_usuarios.sql
psql -U postgres -f 00_database_setup.sql

# FASE 2: Estructura Base (como benites_admin)
psql -U benites_admin -d easyrent_db -f 01_extensions_and_schemas.sql
psql -U benites_admin -d easyrent_db -f 02_enums_and_types.sql
psql -U benites_admin -d easyrent_db -f 03_core_tables.sql

# FASE 3: Funcionalidades Core
psql -U benites_admin -d easyrent_db -f 04_user_interactions.sql
psql -U benites_admin -d easyrent_db -f 05_analytics.sql
psql -U benites_admin -d easyrent_db -f 06_verification_workflow.sql
psql -U benites_admin -d easyrent_db -f 07_security_audit.sql
psql -U benites_admin -d easyrent_db -f 08_subscription_plans.sql
psql -U benites_admin -d easyrent_db -f 09_billing_payments.sql
psql -U benites_admin -d easyrent_db -f 10_partition_management.sql
psql -U benites_admin -d easyrent_db -f 11_business_rules.sql

# FASE 4: Features Avanzadas
psql -U benites_admin -d easyrent_db -f 14_auto_free_subscription.sql
psql -U benites_admin -d easyrent_db -f 17_auto_advertiser_type.sql
psql -U benites_admin -d easyrent_db -f 18_agent_invitations.sql
psql -U benites_admin -d easyrent_db -f 19_add_user_agency_role_field.sql
psql -U benites_admin -d easyrent_db -f 20_listing_media_system.sql

# FASE 5: Sistema Airbnb (si lo vas a usar)
psql -U benites_admin -d easyrent_db -f 15_airbnb_bookings.sql
psql -U benites_admin -d easyrent_db -f 18_add_listing_airbnb_fields.sql

# FASE 6: Chat y Notificaciones
psql -U benites_admin -d easyrent_db -f 25_chat_system.sql
psql -U benites_admin -d easyrent_db -f 26_notifications_system.sql

# FASE 7: Optimización y Performance
psql -U benites_admin -d easyrent_db -f 28_performance_indexes.sql
psql -U benites_admin -d easyrent_db -f 29_analytics_refactor.sql
psql -U benites_admin -d easyrent_db -f 32_optimize_listings_partial_indices.sql

# FASE 8: Datos Iniciales (OPCIONAL)
psql -U benites_admin -d easyrent_db -f 12_sample_data.sql
```

---

## ⚠️ ARCHIVOS QUE **NO** DEBES EJECUTAR

### En instalación nueva (Fresh Install):

```
❌ 00_master_install.sql                    (VACÍO)
❌ 13_subscription_plans.sql                 (Duplicado de 08)
❌ 15_add_rating_reviews_system.sql          (Duplicado de 16)
❌ 17_add_max_guests.sql                     (Incompleto, usar 17_add_max_guests_to_listings.sql)
❌ 31_optimize_listings_inheritance.sql      (OBSOLETO - vistas materializadas)
❌ add_furnished_column.sql                  (Ya incluido en migration_studio_furnished_roommate.sql)
❌ add_rental_model_column.sql               (Ya incluido en 32_optimize_listings_partial_indices.sql)
❌ add_airbnb_columns.sql                    (Ya incluido en 18_add_listing_airbnb_fields.sql)
❌ migration_*.sql                           (Solo para bases existentes)
❌ fix_*.sql                                 (Solo si tienes problemas específicos)
❌ emergency_*.sql                           (Solo para emergencias)
```

---

## 📊 DEPENDENCIAS CRÍTICAS

### Orden que DEBE respetarse:

```
01_extensions_and_schemas.sql
    ↓
02_enums_and_types.sql (necesita schemas)
    ↓
03_core_tables.sql (necesita ENUMs)
    ↓
04_user_interactions.sql (necesita core.listings, core.users)
    ↓
08_subscription_plans.sql (necesita core.users)
    ↓
14_auto_free_subscription.sql (necesita core.plans, core.subscriptions)
    ↓
15_airbnb_bookings.sql (necesita core.listings)
    ↓
20_listing_media_system.sql (necesita core.listings)
    ↓
25_chat_system.sql (necesita core.users, core.listings)
    ↓
28_performance_indexes.sql (optimiza tablas existentes)
    ↓
32_optimize_listings_partial_indices.sql (optimización final)
```

---

## 🗑️ RECOMENDACIÓN: ARCHIVOS A ELIMINAR

### Limpieza de repositorio

```bash
# Archivos vacíos o duplicados
backend_doc/00_master_install.sql
backend_doc/13_subscription_plans.sql
backend_doc/15_add_rating_reviews_system.sql
backend_doc/17_add_max_guests.sql
backend_doc/31_optimize_listings_inheritance.sql

# Migraciones redundantes (si haces instalación limpia)
backend_doc/add_furnished_column.sql
backend_doc/add_rental_model_column.sql
backend_doc/add_airbnb_columns.sql
backend_doc/add_room_property_type.sql
backend_doc/add_studio_property_type.sql
```

**O mejor**: Moverlos a carpeta `backend_doc/obsolete/` para mantener historial.

---

## ✅ CHECKLIST DE INSTALACIÓN

### Pre-instalación
- [X] PostgreSQL 18.x instalado
- [X] Usuario postgres con permisos de superusuario
- [~] Red configurada (localhost o IP servidor)

### Ejecución
- [X] Crear usuarios (01_crear_usuarios.sql)
- [X] Crear base de datos (00_database_setup.sql)
- [X] Instalar extensiones (01_extensions_and_schemas.sql)
- [ ] Crear ENUMs (02_enums_and_types.sql)
- [ ] Crear tablas core (03-11)
- [ ] Agregar features (14-20, 25-26)
- [ ] Optimizar (28, 29, 32)
- [ ] Cargar datos iniciales (12_sample_data.sql)

### Validación
- [ ] Verificar extensiones: `SELECT * FROM pg_extension;`
- [ ] Verificar schemas: `SELECT schema_name FROM information_schema.schemata;`
- [ ] Verificar tablas: `\dt core.*`
- [ ] Verificar particiones: `SELECT tablename FROM pg_tables WHERE tablename LIKE '%_202%';`
- [ ] Verificar usuarios: `SELECT email, role FROM core.users;`
- [ ] Verificar planes: `SELECT code, name, tier FROM core.plans;`

---

## 📝 NOTAS IMPORTANTES

### 1. **Particiones Automáticas**
Los scripts `10_partition_management.sql` y archivos posteriores crean funciones para gestión automática de particiones mensuales. Configurar cron job para crear particiones futuras.

### 2. **Índices Parciales > Vistas Materializadas**
Decisión técnica documentada en `DECISION_INDICES_VS_VISTAS.md` y `ANALISIS_CRITICO_VISTAS_MATERIALIZADAS.md`. Usar `32_optimize_listings_partial_indices.sql`, **NO** `31_optimize_listings_inheritance.sql`.

### 3. **Triggers Automáticos**
- `14_auto_free_subscription.sql`: Auto-asigna plan gratuito a nuevos usuarios
- `17_auto_advertiser_type.sql`: Auto-determina tipo de anunciante
- `11_business_rules.sql`: Triggers de negocio (updated_at, etc.)

### 4. **Sistema de Schemas**
```
core.*        → Tablas principales (users, listings, subscriptions)
analytics.*   → Eventos y métricas
sec.*         → Seguridad y auditoría
chat.*        → Sistema de mensajería
archive.*     → Datos históricos
```

---

## 🚀 SIGUIENTE PASO

Después de completar instalación:
1. ✅ Configurar conexión en backend (FastAPI + SQLAlchemy)
2. ✅ Configurar Redis para caché de búsquedas
3. ✅ Configurar cron para creación de particiones
4. ✅ Configurar backup automático
5. ✅ Migrar datos existentes (si aplica)

---

## 📞 CONTACTO Y SOPORTE

Para dudas sobre archivos específicos, consultar:
- **README.md**: Documentación general
- **GUIA_INSTALACION_COMPLETA.md**: Guía detallada paso a paso
- **00_INICIO_RAPIDO.md**: Inicio rápido con comandos específicos

---

**Auditoría realizada por**: GitHub Copilot AI
**Archivos revisados**: 77 archivos
**Fecha**: 2025
**Estado**: ✅ COMPLETO - Listo para instalación de producción
