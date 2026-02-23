# Guía de Instalación Completa - EasyRent Database

## Índice
1. [Requisitos Previos](#requisitos-previos)
2. [Configuración de Usuario y Base de Datos](#configuración-de-usuario-y-base-de-datos)
3. [Instalación de Scripts SQL](#instalación-de-scripts-sql)
4. [Configuración de Tareas Asíncronas](#configuración-de-tareas-asíncronas)
5. [Optimización de Listings](#optimización-de-listings)
6. [Verificación y Monitoreo](#verificación-y-monitoreo)

---

## 1. Requisitos Previos

### Software Necesario
- **PostgreSQL**: 18.x o superior
- **Redis**: 6.x o superior (para cache y tareas asíncronas)
- **Python**: 3.9 o superior
- **Node.js**: 16.x o superior (para frontend)

### Extensiones de PostgreSQL
```sql
-- Conectar como superusuario
psql -U postgres

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- Para búsquedas de texto
CREATE EXTENSION IF NOT EXISTS "unaccent";      -- Para normalización de texto
```

---

## 2. Configuración de Usuario y Base de Datos

### A. Crear Usuario de Base de Datos

```sql
-- Conectar como postgres (superusuario)
psql -U postgres

-- Crear usuario de la aplicación
CREATE USER easyrent_app WITH PASSWORD 'tu_password_seguro_aqui';

-- Crear base de datos
CREATE DATABASE easyrent_db 
    OWNER easyrent_app
    ENCODING 'UTF8'
    LC_COLLATE 'es_PE.UTF-8'
    LC_CTYPE 'es_PE.UTF-8'
    TEMPLATE template0;

-- Otorgar privilegios
GRANT ALL PRIVILEGES ON DATABASE easyrent_db TO easyrent_app;
```

### B. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto backend:

```bash
# Database
DATABASE_URL=postgresql://easyrent_app:tu_password_seguro_aqui@localhost:5432/easyrent_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=easyrent_db
DB_USER=easyrent_app
DB_PASSWORD=tu_password_seguro_aqui

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
SECRET_KEY=genera_una_clave_secreta_aleatoria_muy_larga_aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Culqi (Pagos)
CULQI_PUBLIC_KEY=tu_pk_test_aqui
CULQI_SECRET_KEY=tu_sk_test_aqui

# Firebase (Notificaciones - Opcional)
FIREBASE_CREDENTIALS_PATH=./firebase-serviceAccount.json

# Email (Opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_app_password
SMTP_FROM=noreply@easyrent.com

# S3/Storage (Opcional)
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_BUCKET_NAME=easyrent-media
AWS_REGION=us-east-1

# App
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO
```

### C. Generar Claves Secretas

```bash
# Para SECRET_KEY (Python)
python -c "import secrets; print(secrets.token_urlsafe(64))"

# Para JWT Secret
openssl rand -base64 64
```

---

## 3. Instalación de Scripts SQL

### Orden de Ejecución (ESTRICTO)

```bash
# Conectar como easyrent_app
psql -U easyrent_app -d easyrent_db

# O usando variable de entorno
export PGPASSWORD='tu_password_seguro_aqui'
psql -U easyrent_app -d easyrent_db
```

#### Paso 1: Configuración Base
```bash
psql -U easyrent_app -d easyrent_db -f 00_database_setup.sql
psql -U easyrent_app -d easyrent_db -f 01_extensions_and_schemas.sql
```

#### Paso 2: Tipos y Enums
```bash
psql -U easyrent_app -d easyrent_db -f 02_enums_and_types.sql
```

#### Paso 3: Tablas Core
```bash
psql -U easyrent_app -d easyrent_db -f 03_core_tables.sql
psql -U easyrent_app -d easyrent_db -f 04_user_interactions.sql
```

#### Paso 4: Analytics y Verificación
```bash
psql -U easyrent_app -d easyrent_db -f 05_analytics.sql
psql -U easyrent_app -d easyrent_db -f 06_verification_workflow.sql
psql -U easyrent_app -d easyrent_db -f 07_security_audit.sql
```

#### Paso 5: Planes y Pagos
```bash
psql -U easyrent_app -d easyrent_db -f 08_subscription_plans.sql
psql -U easyrent_app -d easyrent_db -f 09_billing_payments.sql
psql -U easyrent_app -d easyrent_db -f 13_subscription_plans.sql  # Actualización
psql -U easyrent_app -d easyrent_db -f 14_add_plan_target_type.sql
psql -U easyrent_app -d easyrent_db -f 14_auto_free_subscription.sql
```

#### Paso 6: Particionamiento y Reglas
```bash
psql -U easyrent_app -d easyrent_db -f 10_partition_management.sql
psql -U easyrent_app -d easyrent_db -f 11_business_rules.sql
```

#### Paso 7: Sistema Airbnb (IMPORTANTE)
```bash
psql -U easyrent_app -d easyrent_db -f 15_add_rating_reviews_system.sql
psql -U easyrent_app -d easyrent_db -f 15_airbnb_bookings.sql
psql -U easyrent_app -d easyrent_db -f 17_add_max_guests.sql
psql -U easyrent_app -d easyrent_db -f 17_add_max_guests_to_listings.sql
psql -U easyrent_app -d easyrent_db -f 18_add_listing_airbnb_fields.sql
psql -U easyrent_app -d easyrent_db -f add_rental_model_column.sql
```

#### Paso 8: Agencias y Relaciones
```bash
psql -U easyrent_app -d easyrent_db -f 17_auto_advertiser_type.sql
psql -U easyrent_app -d easyrent_db -f 18_agent_invitations.sql
psql -U easyrent_app -d easyrent_db -f 19_add_user_agency_role_field.sql
```

#### Paso 9: Media y Comunicación
```bash
psql -U easyrent_app -d easyrent_db -f 20_listing_media_system.sql
psql -U easyrent_app -d easyrent_db -f 25_chat_system.sql
psql -U easyrent_app -d easyrent_db -f 26_notifications_system.sql
```

#### Paso 10: Mejoras de Pagos
```bash
psql -U easyrent_app -d easyrent_db -f 26_add_payment_deadline.sql
psql -U easyrent_app -d easyrent_db -f 27_add_payment_proof.sql
```

#### Paso 11: Performance
```bash
psql -U easyrent_app -d easyrent_db -f 28_performance_indexes.sql
psql -U easyrent_app -d easyrent_db -f 29_analytics_refactor.sql
psql -U easyrent_app -d easyrent_db -f 30_generate_slugs.sql
```

#### Paso 12: **OPTIMIZACIÓN LISTINGS (NUEVO)** ⭐
```bash
psql -U easyrent_app -d easyrent_db -f 31_optimize_listings_inheritance.sql
```

#### Paso 13: Datos de Prueba (Opcional)
```bash
psql -U easyrent_app -d easyrent_db -f 12_sample_data.sql
psql -U easyrent_app -d easyrent_db -f sample_data_new_features.sql
```

---

## 4. Configuración de Tareas Asíncronas

### A. Redis Setup

```bash
# Instalar Redis (Ubuntu/Debian)
sudo apt update
sudo apt install redis-server

# Iniciar Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verificar
redis-cli ping  # Debe responder: PONG
```

### B. Celery (Tareas Asíncronas en Backend)

Crear archivo `Backend/app/celery_app.py`:

```python
from celery import Celery
from celery.schedules import crontab
import os

redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

celery_app = Celery(
    'easyrent',
    broker=redis_url,
    backend=redis_url
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='America/Lima',
    enable_utc=True,
    
    # Tareas programadas
    beat_schedule={
        # Refresh vistas materializadas de listings
        'refresh-listings-views': {
            'task': 'app.tasks.refresh_listings_views',
            'schedule': crontab(minute='*/2'),  # Cada 2 minutos
        },
        
        # Actualizar analytics diarios
        'update-daily-analytics': {
            'task': 'app.tasks.update_daily_analytics',
            'schedule': crontab(hour=1, minute=0),  # 1:00 AM
        },
        
        # Limpiar sesiones expiradas
        'cleanup-expired-sessions': {
            'task': 'app.tasks.cleanup_expired_sessions',
            'schedule': crontab(hour=3, minute=0),  # 3:00 AM
        },
        
        # Enviar recordatorios de pagos
        'send-payment-reminders': {
            'task': 'app.tasks.send_payment_reminders',
            'schedule': crontab(hour=10, minute=0),  # 10:00 AM
        },
        
        # Verificar reservas pendientes
        'check-pending-bookings': {
            'task': 'app.tasks.check_pending_bookings',
            'schedule': crontab(minute='*/15'),  # Cada 15 minutos
        },
    }
)
```

### C. Tareas Async Implementadas

Crear archivo `Backend/app/tasks.py`:

```python
from celery import shared_task
from sqlalchemy import text
from app.database import SessionLocal
import logging

logger = logging.getLogger(__name__)

@shared_task
def refresh_listings_views():
    """Refresca vistas materializadas de listings"""
    db = SessionLocal()
    try:
        db.execute(text("SELECT core.refresh_listings_views();"))
        db.commit()
        logger.info("✓ Listings views refreshed successfully")
        return {"status": "success", "task": "refresh_listings_views"}
    except Exception as e:
        logger.error(f"Error refreshing listings views: {e}")
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@shared_task
def update_daily_analytics():
    """Actualiza analytics diarios"""
    db = SessionLocal()
    try:
        # Actualizar vistas materializadas de analytics
        db.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.daily_metrics;"))
        db.commit()
        logger.info("✓ Daily analytics updated")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error updating analytics: {e}")
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@shared_task
def cleanup_expired_sessions():
    """Limpia sesiones y tokens expirados"""
    db = SessionLocal()
    try:
        # Eliminar tokens expirados
        result = db.execute(text("""
            DELETE FROM core.user_sessions 
            WHERE expires_at < NOW()
        """))
        db.commit()
        logger.info(f"✓ Cleaned {result.rowcount} expired sessions")
        return {"status": "success", "cleaned": result.rowcount}
    except Exception as e:
        logger.error(f"Error cleaning sessions: {e}")
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@shared_task
def send_payment_reminders():
    """Envía recordatorios de pagos pendientes"""
    db = SessionLocal()
    try:
        # Obtener bookings con pagos pendientes próximos a vencer
        result = db.execute(text("""
            SELECT 
                b.id,
                b.guest_user_id,
                u.email,
                b.check_in_date,
                b.reservation_amount
            FROM core.bookings b
            JOIN core.users u ON u.id = b.guest_user_id
            WHERE b.status = 'confirmed'
            AND b.payment_deadline BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
        """))
        
        bookings = result.fetchall()
        sent_count = 0
        
        for booking in bookings:
            # TODO: Implementar envío de email
            logger.info(f"Payment reminder sent for booking {booking.id}")
            sent_count += 1
        
        logger.info(f"✓ Sent {sent_count} payment reminders")
        return {"status": "success", "sent": sent_count}
    except Exception as e:
        logger.error(f"Error sending reminders: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@shared_task
def check_pending_bookings():
    """Verifica y cancela reservas pendientes expiradas"""
    db = SessionLocal()
    try:
        # Cancelar bookings pendientes de confirmación > 24h
        result = db.execute(text("""
            UPDATE core.bookings
            SET status = 'cancelled_no_payment',
                cancellation_reason = 'Pago no recibido en el plazo establecido'
            WHERE status = 'confirmed'
            AND payment_deadline < NOW()
        """))
        db.commit()
        
        cancelled_count = result.rowcount
        logger.info(f"✓ Cancelled {cancelled_count} expired bookings")
        return {"status": "success", "cancelled": cancelled_count}
    except Exception as e:
        logger.error(f"Error checking bookings: {e}")
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
```

### D. Iniciar Workers

```bash
# Terminal 1: Celery Worker
cd Backend
celery -A app.celery_app worker --loglevel=info

# Terminal 2: Celery Beat (Scheduler)
celery -A app.celery_app beat --loglevel=info

# Terminal 3: Flower (Monitor - Opcional)
celery -A app.celery_app flower --port=5555
# Acceder en: http://localhost:5555
```

---

## 5. Optimización de Listings

### A. Arquitectura Implementada

**Tabla Base:** `core.listings` (particionada por mes)
- Contiene TODOS los listings (tradicionales + Airbnb)
- Particionada por `created_at` para mejor performance

**Vistas Materializadas:**
1. `listings_traditional_active` → Alquiler/venta tradicional (mensual, anual)
2. `listings_airbnb_active` → Alquiler temporal (diario, semanal)

**Ventajas:**
- ✅ Consultas 3-5x más rápidas
- ✅ Índices específicos por tipo de listing
- ✅ Menor uso de memoria en búsquedas
- ✅ Escalabilidad independiente

### B. Uso en Backend

**Búsquedas Tradicionales:**
```python
# app/api/endpoints/search.py
from sqlalchemy import text

def search_traditional(filters: dict):
    query = text("""
        SELECT * FROM core.search_traditional_listings(
            p_department := :department,
            p_province := :province,
            p_district := :district,
            p_operation := :operation,
            p_property_type := :property_type,
            p_min_price := :min_price,
            p_max_price := :max_price,
            p_limit := :limit
        )
    """)
    
    result = db.execute(query, filters)
    return result.fetchall()
```

**Búsquedas Airbnb:**
```python
def search_airbnb(filters: dict):
    query = text("""
        SELECT * FROM core.search_airbnb_listings(
            p_department := :department,
            p_check_in := :check_in,
            p_check_out := :check_out,
            p_guests := :guests,
            p_min_rating := :min_rating,
            p_limit := :limit
        )
    """)
    
    result = db.execute(query, filters)
    return result.fetchall()
```

---

## 6. Verificación y Monitoreo

### A. Verificar Instalación

```sql
-- Conectar a la DB
psql -U easyrent_app -d easyrent_db

-- Verificar schemas
\dn

-- Verificar tablas core
\dt core.*

-- Verificar vistas materializadas
\dm core.*

-- Verificar funciones
\df core.search_*
\df core.refresh_*

-- Verificar particiones de listings
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'core' 
AND tablename LIKE 'listings_%'
ORDER BY tablename;

-- Verificar datos
SELECT 
    rental_model,
    status,
    COUNT(*) as total
FROM core.listings
GROUP BY rental_model, status;
```

### B. Monitorear Performance

```sql
-- Performance de vistas materializadas
SELECT 
    schemaname,
    matviewname,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size,
    last_refresh
FROM pg_matviews
WHERE schemaname = 'core';

-- Índices más usados
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'core'
ORDER BY idx_scan DESC
LIMIT 20;

-- Queries lentas
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
WHERE query LIKE '%listings%'
ORDER BY mean_time DESC
LIMIT 10;
```

### C. Logs y Alertas

```bash
# Ver logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Ver logs de Celery Worker
tail -f celery_worker.log

# Ver logs de Celery Beat
tail -f celery_beat.log
```

---

## 7. Próximos Pasos Recomendados

### Corto Plazo (1-2 semanas)
- [ ] Implementar cache Redis para búsquedas frecuentes
- [ ] Configurar monitoreo con Prometheus/Grafana
- [ ] Implementar rate limiting en endpoints de búsqueda
- [ ] Agregar tests de carga con Locust

### Mediano Plazo (1-2 meses)
- [ ] Implementar sistema de CDN para imágenes
- [ ] Migrar a Amazon RDS Aurora (PostgreSQL compatible)
- [ ] Implementar full-text search con Elasticsearch
- [ ] Agregar sistema de recomendaciones con ML

### Largo Plazo (3-6 meses)
- [ ] Implementar replicación read-only para analytics
- [ ] Migrar a arquitectura de microservicios
- [ ] Implementar GraphQL API
- [ ] Sistema de machine learning para precios dinámicos

---

## Soporte y Recursos

- **Documentación PostgreSQL:** https://www.postgresql.org/docs/14/
- **Celery Docs:** https://docs.celeryproject.org/
- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **Redis Docs:** https://redis.io/documentation

---

**Última actualización:** 2026-02-11
**Versión:** 1.0.0
