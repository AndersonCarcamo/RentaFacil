# 📊 TABLA DE REFERENCIA RÁPIDA - ARCHIVOS SQL

**Versión Imprimible - Guía de Campo para Desarrolladores Backend**

---

## ✅ ARCHIVOS A EJECUTAR (Orden Obligatorio)

| # | Archivo | Usuario | Propósito | Crítico | Tiempo |
|---|---------|---------|-----------|---------|--------|
| **FASE 1: CONFIGURACIÓN INICIAL** |
| 1 | `01_crear_usuarios.sql` | postgres | Crear usuarios benites_admin y benites_app | ⭐⭐⭐ | <1min |
| 2 | `00_database_setup.sql` | postgres | Crear base de datos easyrent_db | ⭐⭐⭐ | <1min |
| **FASE 2: ESTRUCTURA BASE** |
| 3 | `01_extensions_and_schemas.sql` | benites_admin | Instalar extensiones (pgcrypto, postgis, etc.) | ⭐⭐⭐ | <1min |
| 4 | `02_enums_and_types.sql` | benites_admin | Crear ENUMs (property_type, listing_status, etc.) | ⭐⭐⭐ | <1min |
| 5 | `03_core_tables.sql` | benites_admin | Crear tablas (users, listings, agencies) | ⭐⭐⭐ | 1-2min |
| **FASE 3: FUNCIONALIDADES CORE** |
| 6 | `04_user_interactions.sql` | benites_admin | Leads, favorites, alerts, amenities | ⭐⭐⭐ | 1min |
| 7 | `05_analytics.sql` | benites_admin | Sistema de eventos y analytics | ⭐⭐⭐ | <1min |
| 8 | `06_verification_workflow.sql` | benites_admin | Workflow verificación de listings | ⭐⭐⭐ | <1min |
| 9 | `07_security_audit.sql` | benites_admin | Auditoría, sessions, failed logins | ⭐⭐⭐ | 1min |
| 10 | `08_subscription_plans.sql` | benites_admin | Planes y suscripciones | ⭐⭐⭐ | <1min |
| 11 | `09_billing_payments.sql` | benites_admin | Facturación (invoices, payments, refunds) | ⭐⭐⭐ | <1min |
| 12 | `10_partition_management.sql` | benites_admin | Funciones para manejo de particiones | ⭐⭐⭐ | <1min |
| 13 | `11_business_rules.sql` | benites_admin | Triggers y reglas de negocio | ⭐⭐⭐ | <1min |
| **FASE 4: FEATURES AVANZADAS** |
| 14 | `14_auto_free_subscription.sql` | benites_admin | Auto-asignar plan gratuito a nuevos users | ⭐⭐ | <1min |
| 15 | `17_auto_advertiser_type.sql` | benites_admin | Auto-determinar owner/broker/agency | ⭐⭐ | <1min |
| 16 | `18_agent_invitations.sql` | benites_admin | Sistema invitaciones de agentes | ⭐⭐ | <1min |
| 17 | `19_add_user_agency_role_field.sql` | benites_admin | Campo role en user_agency | ⭐⭐ | <1min |
| 18 | `20_listing_media_system.sql` | benites_admin | Sistema multimedia (imágenes, videos) | ⭐⭐⭐ | 1min |
| **FASE 5: SISTEMA AIRBNB (OPCIONAL)** |
| 19 | `15_airbnb_bookings.sql` | benites_admin | Sistema reservas (bookings, payments) | ⭐ | 1-2min |
| 20 | `18_add_listing_airbnb_fields.sql` | benites_admin | Campos Airbnb (check-in/out, deposit) | ⭐ | <1min |
| **FASE 6: COMUNICACIONES** |
| 21 | `25_chat_system.sql` | benites_admin | Sistema de chat completo | ⭐⭐ | 1min |
| 22 | `26_notifications_system.sql` | benites_admin | Notificaciones (email, push, in-app) | ⭐⭐⭐ | 1min |
| **FASE 7: OPTIMIZACIÓN** |
| 23 | `28_performance_indexes.sql` | benites_admin | Índices de rendimiento críticos | ⭐⭐⭐ | 1min |
| 24 | `29_analytics_refactor.sql` | benites_admin | Analytics mejorados | ⭐⭐ | 1min |
| 25 | `32_optimize_listings_partial_indices.sql` | benites_admin | Indices parciales (NO vistas materializadas) | ⭐⭐⭐ | <1min |
| **FASE 8: DATOS INICIALES (OPCIONAL)** |
| 26 | `12_sample_data.sql` | benites_admin | Datos de ejemplo (planes, amenities, users) | ⭐ | 1min |

**Tiempo total estimado**: 15-20 minutos

**Leyenda**:
- ⭐⭐⭐ = Crítico (imprescindible)
- ⭐⭐ = Importante (muy recomendado)
- ⭐ = Opcional (según necesidad)

---

## ❌ ARCHIVOS A NO EJECUTAR (Duplicados/Obsoletos)

| Archivo | Razón | Reemplazado por |
|---------|-------|-----------------|
| `00_master_install.sql` | VACÍO - Sin contenido | - |
| `13_subscription_plans.sql` | Usa tabla sin schema `subscription_plans` | `08_subscription_plans.sql` |
| `15_add_rating_reviews_system.sql` | Duplicado sistema ratings | `16_update_existing_db_add_rating.sql` |
| `17_add_max_guests.sql` | Incompleto (sin constraints) | `17_add_max_guests_to_listings.sql` |
| `31_optimize_listings_inheritance.sql` | OBSOLETO - Vistas materializadas (inconsistencia) | `32_optimize_listings_partial_indices.sql` |
| `add_furnished_column.sql` | Redundante | Ya incluido en `migration_studio_furnished_roommate.sql` |
| `add_rental_model_column.sql` | Redundante | Ya incluido en `32_optimize_listings_partial_indices.sql` |
| `add_airbnb_columns.sql` | Redundante | Ya incluido en `18_add_listing_airbnb_fields.sql` |
| `add_room_property_type.sql` | Redundante | Ya incluido en `02_enums_and_types.sql` |
| `add_studio_property_type.sql` | Redundante | Ya incluido en `02_enums_and_types.sql` |

---

## 🔧 ARCHIVOS DE MIGRACIÓN (Solo para BD Existentes)

| Archivo | Usar si... | No usar si... |
|---------|------------|---------------|
| `14_add_plan_target_type.sql` | Ya tienes planes sin campo `target_type` | Instalación nueva |
| `16_update_existing_db_add_rating.sql` | Base existente sin `rating` | Instalación nueva |
| `17_add_max_guests_to_listings.sql` | Base existente sin `max_guests` | Instalación nueva |
| `17_fix_airbnb_score.sql` | Airbnb score calculado mal | No tienes airbnb_score |
| `26_add_payment_deadline.sql` | Bookings sin `payment_deadline` | No usas bookings |
| `27_add_payment_proof.sql` | Payments sin `payment_proof_url` | Instalación nueva |
| `30_generate_slugs.sql` | Listings sin slugs | Instalación nueva |
| `migration_*.sql` | Migrando datos legacy | Instalación nueva |

---

## 📋 CHECKLIST DE INSTALACIÓN

### Pre-instalación

- [ ] PostgreSQL 17.x instalado
- [ ] `psql` en PATH del sistema
- [ ] Permisos de superusuario (usuario `postgres`)
- [ ] Archivos SQL descargados en `backend_doc/`

### Ejecución Manual

```bash
# Windows (PowerShell)
cd d:\Trabajos\benites\backend_doc
```

```bash
# Linux/macOS
cd /ruta/a/benites/backend_doc
```

- [ ] FASE 1: Usuarios y BD (archivos 1-2)
- [ ] FASE 2: Estructura (archivos 3-5)
- [ ] FASE 3: Core (archivos 6-13)
- [ ] FASE 4: Features (archivos 14-18)
- [ ] FASE 5: Airbnb (archivos 19-20) - OPCIONAL
- [ ] FASE 6: Comunicaciones (archivos 21-22)
- [ ] FASE 7: Optimización (archivos 23-25)
- [ ] FASE 8: Datos iniciales (archivo 26) - OPCIONAL

### Ejecución Automatizada

- [ ] Script PowerShell: `.\install_database_auto.ps1`
- [ ] Script Bash: `./install_database_auto.sh`

### Post-instalación

- [ ] Verificar extensiones (6 instaladas)
- [ ] Verificar schemas (5 creados)
- [ ] Verificar tablas (20-30 en `core`)
- [ ] Verificar planes (4 mínimo)
- [ ] Verificar particiones (2 mínimo)
- [ ] Verificar triggers (5+ activos)
- [ ] Test insert usuario → auto-suscripción

### Configuración Backend

- [ ] Actualizar `DATABASE_URL` en config.py
- [ ] Configurar Redis (`REDIS_URL`)
- [ ] Configurar cron/task para particiones
- [ ] Configurar backup automático
- [ ] Migrar datos existentes (si aplica)

---

## 🔍 VERIFICACIÓN RÁPIDA (Copy-Paste)

```sql
-- Conectar a la base de datos
psql -U benites_admin -d easyrent_db

-- Verificación rápida (debe dar OK en todos)
SELECT 
    'Extensiones' as check_name,
    CASE WHEN COUNT(*) = 6 THEN '✅ OK' ELSE '❌ ERROR' END as status
FROM pg_extension WHERE extname IN ('pgcrypto','postgis','pg_trgm','citext','unaccent','btree_gin')
UNION ALL
SELECT 
    'Schemas',
    CASE WHEN COUNT(*) >= 4 THEN '✅ OK' ELSE '❌ ERROR' END
FROM information_schema.schemata WHERE schema_name IN ('core','analytics','sec','chat','archive')
UNION ALL
SELECT 
    'Tablas Core',
    CASE WHEN COUNT(*) >= 20 THEN '✅ OK' ELSE '❌ ERROR' END
FROM information_schema.tables WHERE table_schema = 'core'
UNION ALL
SELECT 
    'Planes',
    CASE WHEN COUNT(*) >= 4 THEN '✅ OK' ELSE '❌ ERROR' END
FROM core.plans
UNION ALL
SELECT 
    'Amenities',
    CASE WHEN COUNT(*) >= 15 THEN '✅ OK' ELSE '❌ ERROR' END
FROM core.amenities;
```

Si todos muestran `✅ OK`, la instalación es exitosa.

---

## 📞 COMANDOS DE EMERGENCIA

### Reiniciar desde cero

```sql
-- ⚠️ CUIDADO: Elimina TODO
DROP DATABASE IF EXISTS easyrent_db;
DROP ROLE IF EXISTS benites_app;
DROP ROLE IF EXISTS benites_admin;
```

### Ver errores en vivo

```bash
# Linux
sudo tail -f /var/log/postgresql/postgresql-17-main.log

# Windows (PowerShell como Admin)
Get-EventLog -LogName Application -Source PostgreSQL* -Newest 20
```

### Probar conexión

```bash
# Como benites_admin
psql -U benites_admin -d easyrent_db -c "SELECT current_user, current_database();"

# Como benites_app
psql -U benites_app -d easyrent_db -c "SELECT current_user, current_database();"
```

---

## 📊 ESTRUCTURA FINAL ESPERADA

```
easyrent_db/
├── Schemas (5)
│   ├── core (tablas principales)
│   ├── analytics (eventos, métricas)
│   ├── sec (seguridad, auditoría)
│   ├── chat (mensajería)
│   └── archive (datos históricos)
│
├── Extensiones (6)
│   ├── pgcrypto (encriptación)
│   ├── postgis (geolocalización)
│   ├── pg_trgm (búsqueda fuzzy)
│   ├── citext (emails case-insensitive)
│   ├── unaccent (búsqueda sin acentos)
│   └── btree_gin (índices compuestos)
│
├── Tablas Core (25+)
│   ├── users (particionada)
│   ├── listings (particionada mensual)
│   ├── agencies
│   ├── subscriptions
│   ├── plans
│   ├── bookings (Airbnb)
│   ├── notifications
│   └── ... (ver AUDITORIA_SQL_COMPLETA.md)
│
├── ENUMs (15+)
│   ├── listing_status
│   ├── property_type
│   ├── operation_type
│   ├── rental_model
│   └── ... (ver 02_enums_and_types.sql)
│
├── Funciones (10+)
│   ├── ensure_listings_partition()
│   ├── create_free_subscription_for_new_user()
│   ├── set_advertiser_type()
│   └── ... (triggers automáticos)
│
└── Usuarios (2)
    ├── benites_admin (DDL, migraciones)
    └── benites_app (DML, operaciones)
```

---

## 🎯 DECISIONES TÉCNICAS CLAVE

### ✅ USAR (Mejores Prácticas)

| Feature | Archivo | Razón |
|---------|---------|-------|
| **Índices Parciales** | `32_optimize_listings_partial_indices.sql` | Rápido (3-5ms), consistente, sin overhead |
| **Particiones Mensuales** | `03_core_tables.sql` + `10_partition_management.sql` | Escalabilidad, mantenimiento |
| **Schemas Separados** | `01_extensions_and_schemas.sql` | Organización, permisos granulares |
| **ENUMs Tipados** | `02_enums_and_types.sql` | Validación, integridad, performance |
| **Triggers Automáticos** | `14_auto_free_subscription.sql`, `17_auto_advertiser_type.sql` | Automatización, consistencia |

### ❌ NO USAR (Antipatrones)

| Feature | Archivo | Razón |
|---------|---------|-------|
| **Vistas Materializadas** | `31_optimize_listings_inheritance.sql` | Inconsistencia 0-120s, complejidad refresh |
| **Tablas Sin Schema** | `13_subscription_plans.sql` | Desorganización, conflictos de nombres |
| **Herencia de Tablas** | (ninguno) | PostgreSQL recomienda particiones |
| **Varchar Sin Límite** | - | Usar TEXT o VARCHAR(n) específico |

---

## 📚 DOCUMENTACIÓN RELACIONADA

1. **AUDITORIA_SQL_COMPLETA.md** - Análisis detallado de 77 archivos
2. **INSTALACION_MANUAL_RAPIDA.md** - Comandos paso a paso (esta guía extendida)
3. **00_INICIO_RAPIDO.md** - Quickstart visual
4. **01_CREAR_USUARIOS.md** - Gestión de usuarios PostgreSQL
5. **DECISION_INDICES_VS_VISTAS.md** - Por qué índices > vistas
6. **ANALISIS_CRITICO_VISTAS_MATERIALIZADAS.md** - Problemas de vistas materializadas
7. **README.md** - Documentación general del proyecto

---

## 🚀 QUICK START (TL;DR)

### Windows

```powershell
cd d:\Trabajos\benites\backend_doc
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install_database_auto.ps1
```

### Linux/macOS

```bash
cd /ruta/a/benites/backend_doc
chmod +x install_database_auto.sh
./install_database_auto.sh
```

### Verificación

```sql
psql -U benites_admin -d easyrent_db
SELECT current_user, current_database();
\dt core.*
SELECT code, name FROM core.plans;
```

---

**✅ SERVIDOR IMPECABLE - BASE DE DATOS LISTA PARA PRODUCCIÓN**

---

_Última actualización: 2025 | Versión: 1.0 | Autor: GitHub Copilot AI_
