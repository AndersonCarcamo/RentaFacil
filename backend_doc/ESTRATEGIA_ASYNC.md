# Estrategia de Base de Datos Asíncrona - EasyRent

## Índice
1. [Visión General](#visión-general)
2. [Aspectos Clave para Migración Asíncrona](#aspectos-clave-para-migración-asíncrona)
3. [Componentes Asíncronos Implementados](#componentes-asíncronos-implementados)
4. [Roadmap de Implementación](#roadmap-de-implementación)
5. [Patrones y Best Practices](#patrones-y-best-practices)

---

## 1. Visión General

### Arquitectura Actual vs Objetivo

```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA ACTUAL                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (Next.js) ──► Backend (FastAPI) ──► PostgreSQL   │
│                              │                               │
│                              └──► Síncrono (Bloqueante)     │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 ARQUITECTURA OBJETIVO (Async)                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (Next.js) ──► Backend (FastAPI Async)             │
│         │                     │                              │
│         │                     ├──► PostgreSQL (asyncpg)      │
│         │                     │                              │
│         │                     ├──► Redis Cache               │
│         │                     │                              │
│         │                     └──► Celery Workers            │
│         │                           │                        │
│         │                           ├─► Tareas Async         │
│         │                           ├─► Email Queue          │
│         │                           └─► Analytics            │
│         │                                                     │
│         └──► WebSockets (Real-time)                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Aspectos Clave para Migración Asíncrona

### A. Operaciones que DEBEN ser Asíncronas 🔥

#### 1. **Búsqueda de Listings**
**Razón:** Alto volumen de consultas, múltiples filtros, joins complejos

```python
# ❌ ANTES (Síncrono)
@app.get("/api/search")
def search_listings(filters: SearchFilters):
    results = db.query(Listing).filter(...).all()
    return results

# ✅ DESPUÉS (Asíncrono)
@app.get("/api/search")
async def search_listings(filters: SearchFilters):
    async with async_session() as db:
        # Usar vista materializada para mejor performance
        query = await db.execute(
            text("SELECT * FROM core.search_airbnb_listings(...)")
        )
        results = query.fetchall()
        
        # Cache en Redis
        await redis.setex(
            f"search:{hash(filters)}", 
            300,  # 5 minutos
            json.dumps(results)
        )
        
        return results
```

**Beneficios:**
- ✅ No bloquea el event loop
- ✅ Permite múltiples búsquedas concurrentes
- ✅ Mejor experiencia de usuario
- ✅ Escalabilidad horizontal

---

#### 2. **Procesamiento de Imágenes**
**Razón:** Operación CPU-intensive, no debe bloquear requests HTTP

```python
# ✅ IMPLEMENTAR (Async Task)
@celery_app.task
def process_listing_images(listing_id: str, images: List[str]):
    """
    Procesa imágenes de forma asíncrona:
    1. Optimizar (comprimir, redimensionar)
    2. Generar thumbnails
    3. Subir a S3
    4. Actualizar DB con URLs
    """
    for image in images:
        # Redimensionar
        optimized = resize_image(image, max_width=1920)
        thumbnail = resize_image(image, max_width=400)
        
        # Subir a S3
        s3_url = upload_to_s3(optimized, f"listings/{listing_id}/")
        thumb_url = upload_to_s3(thumbnail, f"listings/{listing_id}/thumbs/")
        
        # Actualizar DB
        db.execute(text("""
            INSERT INTO core.listing_media (listing_id, url, thumbnail_url)
            VALUES (:id, :url, :thumb)
        """), {"id": listing_id, "url": s3_url, "thumb": thumb_url})
    
    db.commit()
    return {"status": "success", "processed": len(images)}

# En el endpoint
@app.post("/api/listings/{listing_id}/upload-images")
async def upload_images(listing_id: str, files: List[UploadFile]):
    # Guardar temporalmente
    temp_paths = await save_temp_files(files)
    
    # Procesar en background
    process_listing_images.delay(listing_id, temp_paths)
    
    return {"status": "processing", "message": "Imágenes en proceso"}
```

---

#### 3. **Envío de Emails y Notificaciones**
**Razón:** SMTP puede ser lento, no debe afectar response time

```python
# ✅ IMPLEMENTAR (Async Queue)
@celery_app.task
def send_booking_confirmation_email(booking_id: str):
    """Envía email de confirmación de reserva"""
    booking = db.query(Booking).filter_by(id=booking_id).first()
    
    email_data = {
        "to": booking.guest.email,
        "subject": f"Confirmación de reserva - {booking.listing.title}",
        "template": "booking_confirmation.html",
        "data": {
            "guest_name": booking.guest.name,
            "listing_title": booking.listing.title,
            "check_in": booking.check_in_date,
            "check_out": booking.check_out_date,
            "total_price": booking.total_price
        }
    }
    
    send_email(email_data)
    
    # Registrar en log
    db.execute(text("""
        INSERT INTO core.email_log (booking_id, email_type, sent_at)
        VALUES (:id, 'booking_confirmation', NOW())
    """), {"id": booking_id})
    db.commit()

# En el endpoint
@app.post("/api/bookings")
async def create_booking(booking_data: CreateBookingDto):
    # Crear reserva
    booking = await create_booking_in_db(booking_data)
    
    # Enviar emails en background
    send_booking_confirmation_email.delay(booking.id)
    send_host_notification_email.delay(booking.id)
    
    return booking
```

---

#### 4. **Analytics y Reportes**
**Razón:** Agregaciones pesadas, no deben afectar operaciones OLTP

```python
# ✅ IMPLEMENTAR (Scheduled Tasks)
@celery_app.task
def generate_daily_analytics():
    """
    Genera analytics diarios:
    - Vistas por listing
    - Conversiones
    - Revenue
    - KPIs
    """
    db.execute(text("""
        REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.daily_metrics;
        REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.listing_performance;
        REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.user_engagement;
    """))
    db.commit()
    
    # Calcular métricas adicionales
    metrics = calculate_advanced_metrics()
    
    # Guardar snapshot
    db.execute(text("""
        INSERT INTO analytics.daily_snapshots (date, metrics)
        VALUES (CURRENT_DATE, :metrics)
    """), {"metrics": json.dumps(metrics)})
    db.commit()

# Programar en celery beat
celery_app.conf.beat_schedule = {
    'daily-analytics': {
        'task': 'generate_daily_analytics',
        'schedule': crontab(hour=1, minute=0),  # 1:00 AM
    }
}
```

---

#### 5. **Refresh de Vistas Materializadas** 🆕
**Razón:** Operación pesada que no debe bloquear lecturas

```python
# ✅ YA IMPLEMENTADO en 31_optimize_listings_inheritance.sql
@celery_app.task
def refresh_listings_views():
    """Refresca vistas materializadas cada 2 minutos"""
    db.execute(text("SELECT core.refresh_listings_views();"))
    db.commit()

# Programar
celery_app.conf.beat_schedule = {
    'refresh-listings': {
        'task': 'refresh_listings_views',
        'schedule': crontab(minute='*/2'),  # Cada 2 minutos
    }
}
```

---

### B. Operaciones que PUEDEN permanecer Síncronas ⚡

1. **CRUD simple de usuarios**
   - Login/logout
   - Actualizar perfil
   - Cambiar contraseña

2. **Lectura de datos cachéables**
   - Listar amenidades
   - Listar tipos de propiedad
   - Datos de configuración

3. **Operaciones transaccionales críticas**
   - Crear reserva (core logic síncrono, notificaciones async)
   - Procesar pago (Culqi webhook debe ser síncrono)

---

## 3. Componentes Asíncronos Implementados

### A. Celery Workers

```python
# Backend/app/celery_app.py
from celery import Celery

celery_app = Celery(
    'easyrent',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

# Configuración
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='America/Lima',
    enable_utc=True,
    
    # Retry policy
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Concurrency
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
)
```

### B. Redis Cache Layer

```python
# Backend/app/cache.py
from redis.asyncio import Redis
import json
from typing import Optional, Any

class CacheManager:
    def __init__(self, redis_url: str):
        self.redis = Redis.from_url(redis_url, decode_responses=True)
    
    async def get(self, key: str) -> Optional[Any]:
        """Obtener valor del cache"""
        value = await self.redis.get(key)
        return json.loads(value) if value else None
    
    async def set(self, key: str, value: Any, ttl: int = 300):
        """Guardar en cache con TTL"""
        await self.redis.setex(key, ttl, json.dumps(value))
    
    async def delete(self, pattern: str):
        """Eliminar claves por patrón"""
        keys = await self.redis.keys(pattern)
        if keys:
            await self.redis.delete(*keys)
    
    async def invalidate_listings(self):
        """Invalidar cache de listings"""
        await self.delete("search:*")
        await self.delete("listing:*")

# Uso
cache = CacheManager(redis_url=settings.REDIS_URL)

@app.get("/api/listings/{listing_id}")
async def get_listing(listing_id: str):
    # Intentar cache primero
    cached = await cache.get(f"listing:{listing_id}")
    if cached:
        return cached
    
    # Si no está en cache, consultar DB
    async with async_session() as db:
        listing = await db.get(Listing, listing_id)
        
        # Guardar en cache
        await cache.set(f"listing:{listing_id}", listing.dict(), ttl=600)
        
        return listing
```

### C. PostgreSQL Async (asyncpg)

```python
# Backend/app/database_async.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Engine asíncrono
async_engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost/easyrent_db",
    echo=False,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True,
)

# Session factory
async_session_maker = sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Dependency
async def get_async_db():
    async with async_session_maker() as session:
        yield session
```

---

## 4. Roadmap de Implementación

### Fase 1: Fundamentos (Semana 1-2) ✅
- [x] Instalar Redis
- [x] Configurar Celery
- [x] Crear tareas básicas (refresh views, analytics)
- [x] Implementar vistas materializadas
- [x] Setup monitoring (Flower)

### Fase 2: Cache Layer (Semana 3-4)
- [ ] Implementar Redis cache para búsquedas
- [ ] Cache de listings individuales
- [ ] Cache de datos estáticos (amenidades, tipos)
- [ ] Implementar invalidación inteligente

### Fase 3: Async Database (Semana 5-6)
- [ ] Migrar endpoints de búsqueda a async
- [ ] Implementar connection pooling optimizado
- [ ] Async endpoints para listings CRUD
- [ ] Test de carga y benchmarking

### Fase 4: Background Jobs (Semana 7-8)
- [ ] Procesar imágenes async
- [ ] Queue de emails
- [ ] Notificaciones push async
- [ ] Generación de reportes async

### Fase 5: WebSockets (Semana 9-10)
- [ ] Real-time notifications
- [ ] Chat en vivo
- [ ] Updates de disponibilidad en tiempo real

### Fase 6: Optimización Final (Semana 11-12)
- [ ] Read replicas para analytics
- [ ] CDN para static assets
- [ ] Implementar Elasticsearch para búsqueda fulltext
- [ ] Auto-scaling de workers

---

## 5. Patrones y Best Practices

### A. Patrón: Cache-Aside

```python
async def get_listing_with_cache(listing_id: str):
    """Patrón cache-aside estándar"""
    # 1. Intentar leer del cache
    cached = await cache.get(f"listing:{listing_id}")
    if cached:
        return cached
    
    # 2. Si no está, leer de DB
    async with async_session() as db:
        listing = await db.get(Listing, listing_id)
    
    # 3. Guardar en cache para próxima vez
    await cache.set(f"listing:{listing_id}", listing.dict(), ttl=600)
    
    return listing
```

### B. Patrón: Write-Through Cache

```python
async def update_listing(listing_id: str, data: dict):
    """Actualizar y sincronizar cache"""
    async with async_session() as db:
        # 1. Actualizar en DB
        listing = await db.get(Listing, listing_id)
        for key, value in data.items():
            setattr(listing, key, value)
        await db.commit()
        
        # 2. Actualizar cache inmediatamente
        await cache.set(f"listing:{listing_id}", listing.dict())
        
        # 3. Invalidar caches relacionados
        await cache.delete(f"search:*")
        
        return listing
```

### C. Patrón: Event-Driven Updates

```python
# Usar eventos para mantener consistencia
from app.events import EventBus

@app.post("/api/bookings")
async def create_booking(booking_data: CreateBookingDto):
    # 1. Crear reserva
    booking = await create_booking_in_db(booking_data)
    
    # 2. Emitir evento
    await EventBus.emit("booking.created", {
        "booking_id": booking.id,
        "listing_id": booking.listing_id,
        "guest_id": booking.guest_user_id,
    })
    
    return booking

# Subscribers
@EventBus.on("booking.created")
async def on_booking_created(data: dict):
    # Invalidar cache de disponibilidad
    await cache.delete(f"availability:{data['listing_id']}:*")
    
    # Enviar emails
    send_booking_confirmation_email.delay(data['booking_id'])
    send_host_notification_email.delay(data['booking_id'])
    
    # Actualizar analytics
    increment_booking_count.delay(data['listing_id'])
```

### D. Patrón: Retry con Backoff

```python
from celery import retry

@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60  # 1 minuto
)
def send_email_with_retry(self, email_data: dict):
    try:
        send_email(email_data)
    except SMTPException as exc:
        # Retry con backoff exponencial
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
```

---

## 6. Métricas de Performance Esperadas

### Antes de Optimización
```
Búsqueda de listings:        ~800-1200ms
Creación de listing:          ~1500-2000ms
Upload de imágenes:           ~3000-5000ms (bloqueante)
Envío de email:               ~1000-1500ms (bloqueante)
```

### Después de Optimización
```
Búsqueda (con cache):         ~50-150ms   (↓ 85%)
Búsqueda (sin cache):         ~200-400ms  (↓ 60%)
Creación de listing:          ~300-500ms  (↓ 75%)
Upload de imágenes:           ~200ms      (↓ 95%, async)
Envío de email:               ~50ms       (↓ 95%, queued)
```

### Capacidad de Concurrencia
```
Antes:  ~50-100 requests/segundo
Después: ~500-1000 requests/segundo (↑ 1000%)
```

---

## Conclusión

La migración a una arquitectura asíncrona es **crítica** para el crecimiento de EasyRent:

✅ **Separación de Listings (Implementado):** Vistas materializadas optimizadas  
✅ **Celery Workers (Implementado):** Tareas en background funcionando  
🚧 **Redis Cache (Próximo):** Mayor impacto en performance  
🚧 **Async DB (Próximo):** Para alta concurrencia  

**Recomendación:** Implementar Fase 2 (Cache Layer) inmediatamente después de completar la instalación base.

---

**Última actualización:** 2026-02-11  
**Autor:** Sistema EasyRent  
**Versión:** 1.0.0
