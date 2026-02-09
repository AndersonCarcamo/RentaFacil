# Optimizaciones de Rendimiento - Load Testing

## Problema Detectado
Durante las pruebas de carga con 500 usuarios concurrentes, el servidor colapsó debido a:

1. **Problema N+1 Query**: Se ejecutaba una query individual por cada listing para obtener amenities
2. **Queries de agregación repetidas**: 4 queries GROUP BY en cada búsqueda
3. **Pool de conexiones insuficiente**: Solo 10 conexiones base con 20 overflow

## Resultados Antes de la Optimización
```
📈 Peticiones HTTP: 68,180 total (124.36 req/s)
⏱️  P95 Latency: 5382ms (EXCEDE threshold de 5000ms)
❌ Tasa de Errores: 39.37% (EXCEDE threshold de 10%)
👥 Usuarios: 500 concurrentes
🔴 ESTADO: SERVIDOR COLAPSADO
```

## Optimizaciones Implementadas

### 1. Eliminación del Problema N+1 en Amenities ✅
**Archivo**: `app/services/search_service.py`

**Antes** (N+1 query):
```python
def _listing_to_dict(self, listing):
    # Se ejecuta por CADA listing
    amenities_result = self.db.execute(text("""
        SELECT a.id, a.name, a.icon
        FROM core.listing_amenities la
        JOIN core.amenities a ON la.amenity_id = a.id
        WHERE la.listing_id = :listing_id
    """), {"listing_id": listing.id})
```
**Impacto**: Con 20 listings = 20 queries extra

**Después** (bulk loading):
```python
def _load_amenities_bulk(self, listing_ids):
    # UNA sola query para TODOS los listings
    amenities_result = self.db.execute(text("""
        SELECT la.listing_id, a.id, a.name, a.icon
        FROM core.listing_amenities la
        JOIN core.amenities a ON la.amenity_id = a.id
        WHERE la.listing_id = ANY(:listing_ids)
    """), {"listing_ids": listing_ids})
```
**Impacto**: Con 20 listings = 1 query única

### 2. Optimización de Facetas ✅
**Cambio**: Solo se generan facetas en la primera página (page=1)

**Antes**: 4 queries GROUP BY en cada búsqueda
**Después**: 4 queries GROUP BY solo en página 1, páginas subsecuentes = 0 queries

**Ahorro**: ~75% de queries de agregación (asumiendo que usuarios navegan a página 2+)

### 3. Aumento del Pool de Conexiones ✅
**Archivo**: `app/core/database.py`

```python
# ANTES
pool_size=10       # Solo 10 conexiones base
max_overflow=20    # Máximo 30 conexiones totales

# DESPUÉS
pool_size=50       # 50 conexiones base
max_overflow=100   # Máximo 150 conexiones totales
```

**Capacidad**: De 30 → 150 conexiones simultáneas

## Índices Recomendados (PENDIENTE)

Para mejorar aún más el rendimiento, ejecutar estos índices en PostgreSQL:

```sql
-- Índice para búsquedas por operation + status (muy común)
CREATE INDEX IF NOT EXISTS idx_listings_operation_status_published 
ON core.listings(operation, status, published_at DESC) 
WHERE status = 'published' AND published_at IS NOT NULL;

-- Índice para búsquedas por department + status
CREATE INDEX IF NOT EXISTS idx_listings_department_status_published 
ON core.listings(department, status, published_at DESC) 
WHERE status = 'published' AND published_at IS NOT NULL;

-- Índice compuesto para listing_amenities (optimiza el bulk loading)
CREATE INDEX IF NOT EXISTS idx_listing_amenities_listing_amenity 
ON core.listing_amenities(listing_id, amenity_id);
```

## Configuración PostgreSQL Recomendada

Verificar y ajustar en `postgresql.conf`:

```ini
# Conexiones
max_connections = 200              # Debe ser >= pool_size + max_overflow + buffer

# Memoria
shared_buffers = 256MB             # 25% de RAM disponible
effective_cache_size = 1GB         # 50-75% de RAM disponible
work_mem = 16MB                    # Para operaciones complejas

# Performance
random_page_cost = 1.1             # Para SSD
effective_io_concurrency = 200     # Para SSD
```

## Próximos Pasos para Testing

1. ✅ Reiniciar el servidor backend con los cambios
2. ⏳ Ejecutar nuevamente: `k6 run load-test-search.js`
3. ⏳ Comparar métricas:
   - P95 latency debe estar < 5000ms
   - Error rate debe estar < 10%
   - Servidor debe mantenerse estable durante toda la prueba

## Objetivo de Rendimiento

```
📈 Peticiones HTTP: > 100 req/s
⏱️  P95 Latency: < 5000ms
❌ Tasa de Errores: < 10%
👥 Usuarios: 500 concurrentes
🟢 ESTADO: SERVIDOR ESTABLE
```

## Monitoreo Durante el Test

Observar en logs del backend:
- ❌ No debe haber queries repetidas de amenities
- ❌ No debe haber "pool overflow" warnings
- ✅ Queries deben estar optimizadas con bulk loading
- ✅ Tiempo de respuesta debe ser consistente

---

**Fecha**: 2026-01-24
**Versión**: 1.0.0
**Estado**: Optimizaciones implementadas, pendiente test de validación
