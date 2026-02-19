# 👥 Configuración de Usuarios PostgreSQL - EasyRent

## 📋 Resumen

Para EasyRent necesitas crear **2 usuarios PostgreSQL** con diferentes niveles de permisos:

1. **`benites_admin`** - Usuario administrador (migraciones, DDL, gestión completa)
2. **`benites_app`** - Usuario de aplicación (operaciones normales, solo DML)

---

## 🔑 Paso 1: Crear Usuarios PostgreSQL

### Opción A: Usando Script Automatizado (RECOMENDADO)

```powershell
# En PowerShell como Administrador
cd d:\Trabajos\benites\backend_doc

# Ejecutar como usuario postgres
psql -U postgres -f 01_crear_usuarios.sql
```

### Opción B: Manual (paso a paso)

```powershell
# Conectar como postgres
psql -U postgres
```

```sql
-- ===================================================================
-- CREAR USUARIOS POSTGRESQL PARA EASYRENT
-- ===================================================================
-- Ejecutar como superusuario (postgres)
-- Fecha: 2026-02-19

-- 1. USUARIO ADMINISTRADOR (benites_admin)
-- ===================================================================
-- USO: Migraciones, creación de tablas, funciones, triggers
-- PERMISOS: CREATEDB, CREATEROLE, todos los privilegios en la DB

CREATE ROLE benites_admin WITH
  LOGIN                        -- Puede hacer login
  PASSWORD 'BeniteS2025!Admin' -- ⚠️ CAMBIAR en producción
  CREATEDB                     -- Puede crear bases de datos
  CREATEROLE                   -- Puede crear otros roles
  INHERIT                      -- Hereda permisos de roles asignados
  CONNECTION LIMIT 10;         -- Máximo 10 conexiones simultáneas

COMMENT ON ROLE benites_admin IS 
'Usuario administrador para migraciones y gestión de base de datos EasyRent';

-- 2. USUARIO DE APLICACIÓN (benites_app)
-- ===================================================================
-- USO: Backend FastAPI, operaciones normales (SELECT, INSERT, UPDATE, DELETE)
-- PERMISOS: Solo operaciones DML, NO puede crear tablas ni modificar esquema

CREATE ROLE benites_app WITH
  LOGIN                       -- Puede hacer login
  PASSWORD 'BeniteS2025!App'  -- ⚠️ CAMBIAR en producción
  INHERIT                     -- Hereda permisos de roles asignados
  CONNECTION LIMIT 50;        -- Máximo 50 conexiones (para connection pool)

COMMENT ON ROLE benites_app IS 
'Usuario de aplicación para operaciones normales de EasyRent';

-- ===================================================================
-- VERIFICAR CREACIÓN
-- ===================================================================

\echo ''
\echo '✅ Usuarios creados exitosamente:'
\echo ''

SELECT 
    rolname as "Usuario",
    rolcanlogin as "Login?",
    rolcreatedb as "Crear DB?",
    rolcreaterole as "Crear Roles?",
    rolconnlimit as "Límite Conex."
FROM pg_roles 
WHERE rolname IN ('benites_admin', 'benites_app')
ORDER BY rolname;

\echo ''
\echo '📝 Próximo paso: Crear la base de datos con 00_database_setup.sql'
\echo ''
```

---

## 🗄️ Paso 2: Crear Base de Datos y Permisos

Ahora que los usuarios existen, crea la base de datos y asigna permisos:

```powershell
# Ejecutar el script de setup (aún como postgres)
psql -U postgres -f 00_database_setup.sql
```

Este script:
- ✅ Crea la base de datos `renta_facil`
- ✅ Instala extensiones (pgcrypto, pg_trgm, citext, postgis, etc.)
- ✅ Crea esquemas (core, analytics, sec, archive)
- ✅ Asigna permisos a `benites_admin` y `benites_app`
- ✅ Configura búsqueda de texto en español

---

## 🔐 Paso 3: Verificar Permisos

```sql
-- Conectar como benites_admin
psql -U benites_admin -d renta_facil

-- Verificar que tienes permisos
\dn+  -- Ver esquemas y permisos

-- Debería mostrar:
-- core      | benites_admin | ...
-- analytics | benites_admin | ...
-- sec       | benites_admin | ...
-- archive   | benites_admin | ...
```

---

## 📊 Tabla de Permisos por Usuario

| Operación | benites_admin | benites_app | Propósito |
|-----------|---------------|-------------|-----------|
| **CREATE DATABASE** | ✅ | ❌ | Solo admin crea DBs |
| **CREATE SCHEMA** | ✅ | ❌ | Solo admin modifica estructura |
| **CREATE TABLE** | ✅ | ❌ | Solo admin en migraciones |
| **ALTER TABLE** | ✅ | ❌ | Solo admin modifica esquema |
| **CREATE FUNCTION** | ✅ | ❌ | Solo admin crea funciones |
| **CREATE INDEX** | ✅ | ❌ | Solo admin optimiza |
| **SELECT** | ✅ | ✅ | Ambos leen datos |
| **INSERT** | ✅ | ✅ | Ambos insertan |
| **UPDATE** | ✅ | ✅ | Ambos actualizan |
| **DELETE** | ✅ | ✅ | Ambos eliminan |
| **TRUNCATE** | ✅ | ❌ | Solo admin limpia tablas |
| **DROP** | ✅ | ❌ | Solo admin elimina objetos |
| **GRANT/REVOKE** | ✅ | ❌ | Solo admin gestiona permisos |

---

## 🔌 Paso 4: Configurar Backend (.env)

Actualiza tu archivo `Backend/.env` con las credenciales:

```bash
# ===================================================================
# DATABASE CONFIGURATION
# ===================================================================

# URL para migraciones (Alembic, scripts de setup)
DATABASE_URL=postgresql://benites_admin:BeniteS2025!Admin@localhost:5432/renta_facil

# URL para aplicación (FastAPI, operaciones normales)
DATABASE_URL_APP=postgresql://benites_app:BeniteS2025!App@localhost:5432/renta_facil

# Si solo tienes una variable DATABASE_URL, usa la de aplicación:
# DATABASE_URL=postgresql://benites_app:BeniteS2025!App@localhost:5432/renta_facil

# Database Settings
DB_HOST=localhost
DB_PORT=5432
DB_NAME=renta_facil
DB_USER=benites_app
DB_PASSWORD=BeniteS2025!App

# Para Alembic (migraciones)
DB_ADMIN_USER=benites_admin
DB_ADMIN_PASSWORD=BeniteS2025!Admin
```

---

## 🔒 Seguridad: Cambiar Contraseñas en Producción

⚠️ **IMPORTANTE:** Las contraseñas por defecto son para desarrollo. En producción:

### Generar contraseñas seguras:

```powershell
# PowerShell - Generar contraseña aleatoria
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Cambiar contraseñas:

```sql
-- Conectar como postgres
psql -U postgres

-- Cambiar contraseña de benites_admin
ALTER ROLE benites_admin WITH PASSWORD 'TU_PASSWORD_SUPER_SEGURA_ADMIN';

-- Cambiar contraseña de benites_app
ALTER ROLE benites_app WITH PASSWORD 'TU_PASSWORD_SUPER_SEGURA_APP';
```

### Actualizar Backend/.env:

```bash
DATABASE_URL=postgresql://benites_app:TU_PASSWORD_SUPER_SEGURA_APP@localhost:5432/renta_facil
```

---

## 🎯 Uso Correcto de Cada Usuario

### 🔴 Usar `benites_admin` para:

```bash
# Migraciones Alembic
alembic upgrade head

# Crear tablas, índices, funciones
psql -U benites_admin -d renta_facil -f 03_core_tables.sql

# Modificar esquema
psql -U benites_admin -d renta_facil -c "ALTER TABLE listings ADD COLUMN new_field TEXT;"

# Optimizaciones
psql -U benites_admin -d renta_facil -f 32_optimize_listings_partial_indices.sql
```

### 🟢 Usar `benites_app` para:

```python
# Backend FastAPI - operaciones normales
from sqlalchemy import create_engine

engine = create_engine(
    "postgresql://benites_app:BeniteS2025!App@localhost:5432/renta_facil"
)

# Todas las operaciones CRUD normales
db.query(Listing).filter(...).all()  # SELECT
db.add(new_listing)                  # INSERT
listing.price = 1500                 # UPDATE
db.delete(listing)                   # DELETE
```

---

## ✅ Checklist de Verificación

Antes de continuar con la instalación de tablas, verifica:

- [ ] Usuario `benites_admin` creado
- [ ] Usuario `benites_app` creado
- [ ] Base de datos `renta_facil` creada
- [ ] Extensiones instaladas (pgcrypto, pg_trgm, citext, postgis)
- [ ] Esquemas creados (core, analytics, sec, archive)
- [ ] Permisos asignados correctamente
- [ ] Backend/.env configurado con credenciales
- [ ] Conexión exitosa: `psql -U benites_app -d renta_facil -c "\dt"`

---

## 🐛 Solución de Problemas

### Error: "role benites_admin already exists"

```sql
-- Eliminar usuario existente
DROP ROLE IF EXISTS benites_admin;
DROP ROLE IF EXISTS benites_app;

-- Volver a crear
-- (ejecutar script de creación de arriba)
```

### Error: "database renta_facil already exists"

```sql
-- Como postgres
DROP DATABASE IF EXISTS renta_facil;

-- Volver a ejecutar 00_database_setup.sql
```

### Error: "cannot drop role because some objects depend on it"

```sql
-- Ver qué objetos dependen del rol
SELECT 
    n.nspname as schema,
    c.relname as object,
    c.relkind as type
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE pg_get_userbyid(c.relowner) = 'benites_admin';

-- Reasignar objetos a postgres antes de eliminar
REASSIGN OWNED BY benites_admin TO postgres;
DROP OWNED BY benites_admin;
DROP ROLE benites_admin;
```

---

## 📚 Próximos Pasos

Una vez completada la configuración de usuarios:

1. ✅ **Ejecutar instalación base de datos**
   ```bash
   cd backend_doc
   ./install_database.sh
   ```

2. ✅ **Aplicar optimizaciones**
   ```bash
   psql -U benites_admin -d renta_facil -f 32_optimize_listings_partial_indices.sql
   ```

3. ✅ **Configurar Redis y Cache** (ver ESTRATEGIA_ASYNC.md)

4. ✅ **Ejecutar Backend** con usuario `benites_app`

---

## 🔗 Referencias

- [00_database_setup.sql](./00_database_setup.sql) - Script principal de setup
- [GUIA_INSTALACION_COMPLETA.md](./GUIA_INSTALACION_COMPLETA.md) - Guía completa de instalación
- [config.env](./config.env) - Variables de configuración

---

**Fecha:** 2026-02-19  
**Versión:** 1.0.0  
**Status:** ✅ LISTO PARA EJECUTAR
