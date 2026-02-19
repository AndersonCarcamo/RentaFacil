# Sistema de Base de Datos - Marketplace Inmobiliario EasyRent

## � Inicio Rápido

**¿Primera vez instalando?** Sigue estos pasos:

1. **[00_INICIO_RAPIDO.md](./00_INICIO_RAPIDO.md)** - Crear usuarios PostgreSQL (3 minutos)
2. **[01_CREAR_USUARIOS.md](./01_CREAR_USUARIOS.md)** - Documentación detallada de usuarios
3. Ejecutar `00_database_setup.sql` - Crear base de datos
4. Ejecutar `install_database.sh` o scripts SQL individuales

---

## 📚 Documentación Esencial

| Documento | Propósito | Cuándo Usar |
|-----------|-----------|-------------|
| **[00_INICIO_RAPIDO.md](./00_INICIO_RAPIDO.md)** | ⚡ Comandos rápidos para empezar | **EMPIEZA AQUÍ** - Primera instalación |
| **[01_CREAR_USUARIOS.md](./01_CREAR_USUARIOS.md)** | 👥 Configuración de usuarios PostgreSQL | Crear benites_admin y benites_app |
| **[RESUMEN_EJECUTIVO.md](./RESUMEN_EJECUTIVO.md)** | 🎯 Respuestas rápidas a consultas clave | Configuración usuario, async, separación listings |
| **[32_optimize_listings_partial_indices.sql](./32_optimize_listings_partial_indices.sql)** | 🚀 **PRODUCCIÓN** - Optimización listings con índices parciales | Mejorar búsquedas 60-85% con consistencia en tiempo real |
| **[ANALISIS_CRITICO_VISTAS_MATERIALIZADAS.md](./ANALISIS_CRITICO_VISTAS_MATERIALIZADAS.md)** | 🔍 Análisis técnico de vistas materializadas | Entender por qué NO usar vistas materializadas |
| **[GUIA_INSTALACION_COMPLETA.md](./GUIA_INSTALACION_COMPLETA.md)** | 📖 Instalación paso a paso con todos los detalles | Instalación inicial completa del sistema |
| **[ESTRATEGIA_ASYNC.md](./ESTRATEGIA_ASYNC.md)** | ⚡ Migración a operaciones asíncronas | Optimizar performance con Celery + Redis |
| **[install_database.sh](./install_database.sh)** | 🤖 Script automático de instalación | Ejecutar todos los SQL en orden correcto |

---

## Arquitectura del Sistema

### Características Técnicas Principales
- **PostgreSQL 17.x** con soporte completo para particionado
- **Arquitectura modular** de 12 archivos SQL especializados
- **Particionado mensual** para tablas de alto volumen (RANGE en created_at)
- **Claves primarias compuestas** para compatibilidad con particionado
- **Sistema de seguridad empresarial** con auditoría completa
- **Configuración profesional** con variables de entorno
- **Cumplimiento legal** Ley 29733 (Protección de Datos Personales - Perú)

### Esquemas de Base de Datos
| Esquema | Propósito | Tablas Principales |
|---------|-----------|-------------------|
| **core** | Entidades principales | users, agencies, listings (particionada), images, videos |
| **analytics** | Eventos y métricas | events (particionada), materialized views |
| **moderation** | Verificación de contenido | verifications (particionada) |
| **sec** | Seguridad y auditoría | audit_log, user_sessions, user_consents, failed_logins |

## Requerimientos del Sistema

### Base de Datos
- **PostgreSQL 17.6** o superior
- **Extensiones requeridas:** uuid-ossp, citext, pg_trgm, ltree
- **Configuración regional:** Español (es-ES) para collation
- **Memoria recomendada:** 4GB+ para desarrollo, 16GB+ para producción

### Herramientas de Desarrollo
- **DataGrip** (recomendado) para ejecución de scripts
- **pgAdmin 4** como alternativa
- **PowerShell** 5.1+ para scripts de configuración

## Instalación Rápida

### 1. Configuración Inicial
```powershell
# Clonar configuración
git clone <repo> && cd "Base De Datos"

# Configurar variables de entorno
cp config.env.example config.env
# Editar config.env con datos de tu empresa
```

### 2. Configuración de la Base de Datos
```powershell
# Manual con psql
psql -U postgres -f 00_database_setup.sql
```

### 3. Ejecución de Módulos SQL
Ejecutar en orden estricto usando DataGrip o psql:

```sql
-- Configuración base
\i 00_master_install.sql
\i 01_extensions_and_schemas.sql
\i 02_enums_and_types.sql

-- Tablas principales (ATENCIÓN: Particionadas)
\i 03_core_tables.sql
\i 04_user_interactions.sql

-- Sistemas especializados
\i 05_analytics.sql
\i 06_verification_workflow.sql
\i 07_security_audit.sql

-- Módulos de negocio
\i 08_subscription_plans.sql
\i 09_billing_payments.sql
\i 10_partition_management.sql
\i 11_business_rules.sql
\i 12_sample_data.sql

-- Optimizaciones (RECOMENDADO para producción)
\i 32_optimize_listings_partial_indices.sql  -- Índices parciales para Traditional/Airbnb
-- NOTA: NO usar 31_optimize_listings_inheritance.sql (vistas materializadas tienen problemas)
```

## Configuración Avanzada

### Variables de Entorno (config.env)
```bash
# Configuración de empresa
COMPANY_NAME="Inmobiliaria Benites"
DATABASE_NAME="easy_rent"
ADMIN_USER="benites_admin"
APP_USER="esrent_app"

# Configuración regional
DB_LOCALE="es-ES"
DB_COLLATION="es-ES"
DB_TIMEZONE="America/Lima"

# Configuración de desarrollo
ENVIRONMENT="development"
LOG_LEVEL="info"
```

### Características del Particionado
**IMPORTANTE: PostgreSQL 17.x requiere claves primarias compuestas**

```sql
-- Ejemplo: Tabla particionada
CREATE TABLE core.listings (
    id UUID,
    created_at TIMESTAMPTZ,
    -- ... otros campos
    PRIMARY KEY (id, created_at)  -- ¡OBLIGATORIO incluir columna de partición!
) PARTITION BY RANGE (created_at);

-- Foreign Keys a tablas particionadas requieren clave compuesta
ALTER TABLE core.listing_images ADD CONSTRAINT fk_listing
FOREIGN KEY (listing_id, listing_created_at) 
REFERENCES core.listings (id, created_at);
```
DATABASE_NAME="tuempresa_marketplace"
ADMIN_USER="tuempresa_admin" 
ADMIN_PASSWORD="TuPassword2025!"
```

### 2. **Ejecutar instalación**

#### Windows (PowerShell):
```powershell
# Abrir PowerShell como Administrador en este directorio
cd "d:\Trabajos\benites\Base De Datos"
.\setup.ps1
```

#### Linux/Mac (Bash):
```bash
# En terminal, navegar a este directorio
cd /path/to/Base\ De\ Datos/
chmod +x setup.sh
./setup.sh
```

### 3. **Verificar instalación**
```sql
-- Conectar con el usuario admin
psql "postgresql://tuempresa_admin:password@localhost:5432/tuempresa"

-- Verificar que todo está instalado
\dt core.*       -- Ver tablas principales
\dt analytics.*  -- Ver tablas de analíticas
\dt sec.*        -- Ver tablas de seguridad

-- Probar búsqueda
SELECT * FROM core.search_listings('{"q":"test"}'::jsonb, 5, 0);
```

## Configuración Personalizada

### Variables principales en `config.env`:

```bash
# Información de la empresa
COMPANY_NAME="NombreDeTuEmpresa"
DATABASE_NAME="tuempresa_marketplace"

# Usuarios de base de datos
ADMIN_USER="tuempresa_admin"
ADMIN_PASSWORD="PasswordSeguro123!"
APP_USER="tuempresa_app"  
APP_PASSWORD="AppPassword123!"

# Configuración regional
DB_LOCALE_COLLATE="Spanish_Peru.UTF-8"  # O tu país
DEFAULT_CURRENCY="PEN"  # O tu moneda
DEFAULT_COUNTRY="PE"    # O tu código de país
TIMEZONE="America/Lima" # O tu zona horaria
```

### Límites por plan (personalizables):
```bash
# Plan Gratuito
FREE_MAX_IMAGES="3"
FREE_MAX_VIDEOS="0"

# Plan Básico  
BASIC_MAX_IMAGES="8"
BASIC_MAX_VIDEOS="1"

# Plan Premium
PREMIUM_MAX_IMAGES="15"
PREMIUM_MAX_VIDEOS="3"
```

## Instalación Manual (Avanzada)

Si prefieres instalar paso a paso:

### 1. Configurar PostgreSQL
```sql
-- Como superuser postgres
psql -U postgres

-- Cambiar variables en 00_database_setup.sql
\set db_name 'mi_empresa_marketplace'
\set app_admin_user 'mi_empresa_admin'
-- ... etc

\i 00_database_setup.sql
```

### 2. Instalar schema de aplicación
```sql
-- Como usuario admin
psql -U mi_empresa_admin -d mi_empresa_marketplace

\i 00_master_install.sql
```

## Características Implementadas

- **PostgreSQL 17.x** con extensiones completas
- **Particionamiento automático** por mes
- **Sistema de planes** (Free, Basic, Premium, Enterprise)
- **Facturación multi-proveedor** (Stripe, Culqi, MercadoPago, etc.)
- **Búsqueda híbrida** (Full-text + trigram similarity)
- **Verificación de listings** con workflow
- **WhatsApp integration** (campos E.164 y links)
- **Analytics y métricas** con materialized views
- **Auditoría y seguridad** (RLS ready)
- **Multimedia** con límites por plan

## Esquemas de Base de Datos

| Schema | Propósito | Tablas principales |
|--------|-----------|-------------------|
| `core` | Operaciones principales | users, listings, plans, subscriptions |
| `analytics` | Métricas y reportes | events, materialized views |
| `sec` | Seguridad y auditoría | audit_log, user_consents |
| `archive` | Retención de datos | particiones antiguas |

## Conexión desde Aplicación

Después de la instalación, usa el archivo `app.env` generado:

```bash
# Conexión admin (migraciones, admin)
DATABASE_URL=postgresql://admin_user:password@localhost:5432/database_name

# Conexión app (operaciones normales)  
DATABASE_URL_READONLY=postgresql://app_user:password@localhost:5432/database_name
```

## Solución de Problemas

### Error: PostgreSQL no está corriendo
```bash
# Windows
net start postgresql-x64-17

# Linux
sudo systemctl start postgresql

# Mac
brew services start postgresql
```

### Error: Extension no encontrada
```sql
-- Instalar como superuser
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Error: Permisos insuficientes
```sql
-- Verificar rol como postgres
\du
-- Conceder permisos
GRANT ALL PRIVILEGES ON DATABASE mi_database TO mi_user;
```

## Próximos Pasos

1. **Configurar backup automático**
2. **Implementar Row Level Security (RLS)**
3. **Configurar monitoring y alertas**
4. **Setup de réplicas de lectura**
5. **Integración con proveedores de pago**

## Soporte

- **Documentación técnica**: `Diccionario_de_Datos.md`
- **Arquitectura completa**: `Documentación.md`
- **Diagrama ER**: `diagrama_er.md`
- **Estado del proyecto**: `VERIFICACION_SQL.md`

---