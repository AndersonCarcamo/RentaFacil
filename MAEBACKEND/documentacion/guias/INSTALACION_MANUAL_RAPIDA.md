# 🚀 GUÍA RÁPIDA DE INSTALACIÓN MANUAL

**Para desarrolladores que prefieren ejecutar comandos paso a paso**

---

## 📋 ÍNDICE

1. [Instalación Automática](#instalación-automática) ⚡
2. [Instalación Manual (Windows)](#instalación-manual-windows) 🪟
3. [Instalación Manual (Linux/macOS)](#instalación-manual-linuxmacos) 🐧
4. [Verificación Post-Instalación](#verificación-post-instalación) ✅
5. [Problemas Comunes](#problemas-comunes) 🔧

---

## ⚡ INSTALACIÓN AUTOMÁTICA

### Windows (PowerShell)

```powershell
# Abrir PowerShell como Administrador
cd d:\Trabajos\benites\backend_doc

# Permitir ejecución de scripts (solo esta sesión)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Ejecutar instalación automática
.\install_database_auto.ps1
```

### Linux/macOS (Bash)

```bash
cd /ruta/a/benites/backend_doc

# Dar permisos de ejecución
chmod +x install_database_auto.sh

# Ejecutar instalación automática
./install_database_auto.sh
```

---

## 🪟 INSTALACIÓN MANUAL (Windows)

### Pre-requisitos

```powershell
# Verificar PostgreSQL instalado
psql --version

# Conectar como postgres
psql -U postgres
```

### FASE 1: Usuarios y Base de Datos

```powershell
# Cambiar al directorio de scripts
cd d:\Trabajos\benites\backend_doc

# 1. Crear usuarios PostgreSQL
psql -U postgres -f 01_crear_usuarios.sql

# 2. Crear base de datos
psql -U postgres -f 00_database_setup.sql
```

### FASE 2: Estructura Base

```powershell
# 3. Instalar extensiones y schemas
psql -U benites_admin -d easyrent_db -f 01_extensions_and_schemas.sql

# 4. Crear ENUMs y tipos
psql -U benites_admin -d easyrent_db -f 02_enums_and_types.sql

# 5. Crear tablas principales
psql -U benites_admin -d easyrent_db -f 03_core_tables.sql
```

### FASE 3: Funcionalidades Core

```powershell
# 6. User interactions
psql -U benites_admin -d easyrent_db -f 04_user_interactions.sql

# 7. Analytics
psql -U benites_admin -d easyrent_db -f 05_analytics.sql

# 8. Verification workflow
psql -U benites_admin -d easyrent_db -f 06_verification_workflow.sql

# 9. Security audit
psql -U benites_admin -d easyrent_db -f 07_security_audit.sql

# 10. Subscription plans
psql -U benites_admin -d easyrent_db -f 08_subscription_plans.sql

# 11. Billing payments
psql -U benites_admin -d easyrent_db -f 09_billing_payments.sql

# 12. Partition management
psql -U benites_admin -d easyrent_db -f 10_partition_management.sql

# 13. Business rules
psql -U benites_admin -d easyrent_db -f 11_business_rules.sql
```

### FASE 4: Features Avanzadas

```powershell
# 14. Auto-asignación plan gratuito
psql -U benites_admin -d easyrent_db -f 14_auto_free_subscription.sql

# 15. Auto-detección advertiser type
psql -U benites_admin -d easyrent_db -f 17_auto_advertiser_type.sql

# 16. Invitaciones de agentes
psql -U benites_admin -d easyrent_db -f 18_agent_invitations.sql

# 17. Campo role en user_agency
psql -U benites_admin -d easyrent_db -f 19_add_user_agency_role_field.sql

# 18. Sistema multimedia
psql -U benites_admin -d easyrent_db -f 20_listing_media_system.sql
```

### FASE 5: Sistema Airbnb (OPCIONAL)

```powershell
# 19. Sistema de reservas Airbnb
psql -U benites_admin -d easyrent_db -f 15_airbnb_bookings.sql

# 20. Campos Airbnb en listings
psql -U benites_admin -d easyrent_db -f 18_add_listing_airbnb_fields.sql
```

### FASE 6: Chat y Notificaciones

```powershell
# 21. Sistema de chat
psql -U benites_admin -d easyrent_db -f 25_chat_system.sql

# 22. Sistema de notificaciones
psql -U benites_admin -d easyrent_db -f 26_notifications_system.sql
```

### FASE 7: Optimización y Performance

```powershell
# 23. Índices de rendimiento
psql -U benites_admin -d easyrent_db -f 28_performance_indexes.sql

# 24. Analytics refactor
psql -U benites_admin -d easyrent_db -f 29_analytics_refactor.sql

# 25. Optimización con índices parciales (NO vistas materializadas)
psql -U benites_admin -d easyrent_db -f 32_optimize_listings_partial_indices.sql
```

### FASE 8: Datos Iniciales (OPCIONAL)

```powershell
# 26. Cargar datos de ejemplo
psql -U benites_admin -d easyrent_db -f 12_sample_data.sql
```

---

## 🐧 INSTALACIÓN MANUAL (Linux/macOS)

### Pre-requisitos

```bash
# Verificar PostgreSQL
psql --version

# Cambiar al directorio de scripts
cd /ruta/a/benites/backend_doc
```

### Comando Completo (One-liner)

```bash
# Ejecutar todos los scripts en orden
for script in \
    "01_crear_usuarios.sql:postgres:postgres" \
    "00_database_setup.sql:postgres:postgres" \
    "01_extensions_and_schemas.sql:benites_admin:easyrent_db" \
    "02_enums_and_types.sql:benites_admin:easyrent_db" \
    "03_core_tables.sql:benites_admin:easyrent_db" \
    "04_user_interactions.sql:benites_admin:easyrent_db" \
    "05_analytics.sql:benites_admin:easyrent_db" \
    "06_verification_workflow.sql:benites_admin:easyrent_db" \
    "07_security_audit.sql:benites_admin:easyrent_db" \
    "08_subscription_plans.sql:benites_admin:easyrent_db" \
    "09_billing_payments.sql:benites_admin:easyrent_db" \
    "10_partition_management.sql:benites_admin:easyrent_db" \
    "11_business_rules.sql:benites_admin:easyrent_db" \
    "14_auto_free_subscription.sql:benites_admin:easyrent_db" \
    "17_auto_advertiser_type.sql:benites_admin:easyrent_db" \
    "18_agent_invitations.sql:benites_admin:easyrent_db" \
    "19_add_user_agency_role_field.sql:benites_admin:easyrent_db" \
    "20_listing_media_system.sql:benites_admin:easyrent_db" \
    "15_airbnb_bookings.sql:benites_admin:easyrent_db" \
    "18_add_listing_airbnb_fields.sql:benites_admin:easyrent_db" \
    "25_chat_system.sql:benites_admin:easyrent_db" \
    "26_notifications_system.sql:benites_admin:easyrent_db" \
    "28_performance_indexes.sql:benites_admin:easyrent_db" \
    "29_analytics_refactor.sql:benites_admin:easyrent_db" \
    "32_optimize_listings_partial_indices.sql:benites_admin:easyrent_db"; do
    
    IFS=':' read -r file user db <<< "$script"
    echo "Ejecutando: $file"
    psql -U "$user" -d "$db" -f "$file" || {
        echo "Error en $file"
        exit 1
    }
done

echo "✅ Instalación completada"
```

### O paso por paso:

```bash
# FASE 1: Usuarios y Base de Datos
psql -U postgres -f 01_crear_usuarios.sql
psql -U postgres -f 00_database_setup.sql

# FASE 2: Estructura Base
psql -U benites_admin -d easyrent_db -f 01_extensions_and_schemas.sql
psql -U benites_admin -d easyrent_db -f 02_enums_and_types.sql
psql -U benites_admin -d easyrent_db -f 03_core_tables.sql

# FASE 3: Funcionalidades Core
for file in 04_user_interactions 05_analytics 06_verification_workflow \
            07_security_audit 08_subscription_plans 09_billing_payments \
            10_partition_management 11_business_rules; do
    psql -U benites_admin -d easyrent_db -f "${file}.sql"
done

# FASE 4: Features Avanzadas
for file in 14_auto_free_subscription 17_auto_advertiser_type \
            18_agent_invitations 19_add_user_agency_role_field \
            20_listing_media_system; do
    psql -U benites_admin -d easyrent_db -f "${file}.sql"
done

# FASE 5: Sistema Airbnb (OPCIONAL)
psql -U benites_admin -d easyrent_db -f 15_airbnb_bookings.sql
psql -U benites_admin -d easyrent_db -f 18_add_listing_airbnb_fields.sql

# FASE 6: Chat y Notificaciones
psql -U benites_admin -d easyrent_db -f 25_chat_system.sql
psql -U benites_admin -d easyrent_db -f 26_notifications_system.sql

# FASE 7: Optimización
psql -U benites_admin -d easyrent_db -f 28_performance_indexes.sql
psql -U benites_admin -d easyrent_db -f 29_analytics_refactor.sql
psql -U benites_admin -d easyrent_db -f 32_optimize_listings_partial_indices.sql

# FASE 8: Datos de ejemplo (OPCIONAL)
psql -U benites_admin -d easyrent_db -f 12_sample_data.sql
```

---

## ✅ VERIFICACIÓN POST-INSTALACIÓN

### Verificar instalación completa

```sql
-- Conectar a la base de datos
psql -U benites_admin -d easyrent_db

-- 1. Verificar extensiones
SELECT extname FROM pg_extension 
WHERE extname IN ('pgcrypto', 'postgis', 'pg_trgm', 'citext', 'unaccent', 'btree_gin');
-- Debe mostrar 6 extensiones

-- 2. Verificar schemas
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name IN ('core', 'analytics', 'sec', 'chat', 'archive');
-- Debe mostrar 5 schemas (o 4 si no instalaste chat)

-- 3. Verificar tablas en core
SELECT COUNT(*) as total_tablas FROM information_schema.tables 
WHERE table_schema = 'core';
-- Debe mostrar 20-30 tablas (dependiendo de features instaladas)

-- 4. Verificar ENUMs
SELECT t.typname as enum_name, 
       string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as valores
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'core')
GROUP BY t.typname
ORDER BY t.typname;

-- 5. Verificar planes de suscripción
SELECT code, name, tier, price_amount FROM core.plans;
-- Debe mostrar al menos 4 planes (free, basic-monthly, premium-monthly, enterprise-yearly)

-- 6. Verificar amenities
SELECT COUNT(*) FROM core.amenities;
-- Debe mostrar ~20 amenities

-- 7. Verificar particiones creadas para el mes actual
SELECT tablename FROM pg_tables 
WHERE schemaname = 'core' 
  AND tablename LIKE 'listings_%' 
  AND tablename ~ '\d{4}_\d{2}';
-- Debe mostrar al menos 2 particiones (mes actual y siguiente)

-- 8. Verificar triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'core'
ORDER BY event_object_table, trigger_name;

-- 9. Verificar usuarios y roles
\du
-- Debe mostrar: postgres, benites_admin (Superuser, Create role, Create DB), benites_app

-- 10. Verificar permisos de benites_app
SELECT 
    schemaname,
    tablename,
    has_table_privilege('benites_app', schemaname||'.'||tablename, 'SELECT') as can_select,
    has_table_privilege('benites_app', schemaname||'.'||tablename, 'INSERT') as can_insert,
    has_table_privilege('benites_app', schemaname||'.'||tablename, 'UPDATE') as can_update
FROM pg_tables 
WHERE schemaname IN ('core', 'analytics', 'sec', 'chat')
LIMIT 5;
```

### Verificar funciones creadas

```sql
-- Listar funciones en schema core
SELECT p.proname as function_name,
       pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'core'
ORDER BY p.proname;
```

### Test rápido de funcionalidad

```sql
-- Insertar un usuario de prueba
INSERT INTO core.users (firebase_uid, email, first_name, last_name, role)
VALUES ('test_firebase_uid', 'test@example.com', 'Test', 'User', 'tenant')
RETURNING id, email, role;

-- Verificar que se creó automáticamente una suscripción gratuita
SELECT u.email, s.status, p.code as plan_code, p.name as plan_name
FROM core.users u
JOIN core.subscriptions s ON s.user_id = u.id
JOIN core.plans p ON p.id = s.plan_id
WHERE u.email = 'test@example.com';

-- Limpiar test
DELETE FROM core.users WHERE email = 'test@example.com';
```

---

## 🔧 PROBLEMAS COMUNES

### Error: "role does not exist"

```sql
-- Solución: Ejecutar primero 01_crear_usuarios.sql
psql -U postgres -f 01_crear_usuarios.sql
```

### Error: "database does not exist"

```sql
-- Solución: Ejecutar 00_database_setup.sql
psql -U postgres -f 00_database_setup.sql
```

### Error: "extension does not exist"

```sql
-- Instalar extensiones manualmente (como superuser)
psql -U postgres -d easyrent_db

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS btree_gin;
```

### Error: "schema does not exist"

```sql
-- Ejecutar 01_extensions_and_schemas.sql
psql -U benites_admin -d easyrent_db -f 01_extensions_and_schemas.sql
```

### Error: "type does not exist" (ENUMs)

```sql
-- Ejecutar 02_enums_and_types.sql
psql -U benites_admin -d easyrent_db -f 02_enums_and_types.sql
```

### Error: "permission denied"

```powershell
# Windows: Ejecutar PowerShell como Administrador
# O verificar pg_hba.conf para permitir conexiones locales

# Linux/macOS:
sudo systemctl restart postgresql
```

### Ver errores detallados

```sql
-- Activar mensajes detallados
\set VERBOSITY verbose

-- Ver últimos logs de PostgreSQL (Linux)
sudo tail -f /var/log/postgresql/postgresql-17-main.log

# Windows: Ver Event Viewer > Windows Logs > Application
# Filtrar por fuente "PostgreSQL"
```

### Recrear base de datos (si algo salió mal)

```sql
-- ⚠️ CUIDADO: Esto elimina TODO
psql -U postgres

DROP DATABASE IF EXISTS easyrent_db;
DROP ROLE IF EXISTS benites_app;
DROP ROLE IF EXISTS benites_admin;

-- Volver a empezar desde FASE 1
\q
psql -U postgres -f 01_crear_usuarios.sql
```

---

## 📊 MÉTRICAS DE INSTALACIÓN EXITOSA

Después de completar la instalación, deberías tener:

```
✅ 6 extensiones instaladas
✅ 5 schemas creados (core, analytics, sec, chat, archive)
✅ 25+ tablas en schema core
✅ 10+ funciones en schema core
✅ 15+ ENUMs definidos
✅ 4+ planes de suscripción
✅ 20+ amenities
✅ 2+ particiones por tabla particionada
✅ 5+ triggers automáticos
✅ 2 usuarios de base de datos (benites_admin, benites_app)
```

---

## 📚 RECURSOS ADICIONALES

- **AUDITORIA_SQL_COMPLETA.md**: Listado completo de archivos y clasificación
- **00_INICIO_RAPIDO.md**: Guía de inicio rápido visual
- **01_CREAR_USUARIOS.md**: Detalles sobre usuarios PostgreSQL
- **GUIA_INSTALACION_COMPLETA.md**: Guía detallada con explicaciones
- **README.md**: Documentación general del proyecto

---

## 🚀 SIGUIENTE PASO

Configurar el backend:

```python
# Backend/app/core/config.py
DATABASE_URL = "postgresql://benites_app:tu_password@localhost:5432/easyrent_db"
```

Configurar Redis:

```bash
# Instalar Redis
# Windows: https://github.com/microsoftarchive/redis/releases
# Linux: sudo apt install redis-server

# Iniciar Redis
redis-server

# Configurar en backend
REDIS_URL = "redis://localhost:6379/0"
```

---

**✅ INSTALACIÓN COMPLETA - SERVIDOR IMPECABLE**
