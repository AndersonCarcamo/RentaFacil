# Dashboard de Decisión para Migración Async (Search)

Fecha: 2026-02-26  
Ámbito: Endpoints de búsqueda y lectura asociada (search, listing detail, catálogos estáticos)

---

## 1) Objetivo

Definir un score objetivo (0-100) que indique si conviene:

- Mantener arquitectura actual (sync + cache)
- Migrar parcialmente a async (solo read-path de búsqueda)
- Acelerar migración async prioritaria

El score combina latencia, saturación de recursos, eficiencia de cache y estabilidad.

---

## 2) Estado actual de métricas en este backend

Actualmente existe endpoint de métricas JSON en `/v1/system/metrics` (no formato Prometheus text exposition).  
Eso permite dos opciones:

- **Opción A (rápida):** Prometheus + JSON exporter (scrapea `/v1/system/metrics`)
- **Opción B (recomendada mediano plazo):** Instrumentación Prometheus nativa (Histogram/Counter/Gauge)

---

## 3) Matriz de decisión (umbrales)

| Métrica | Verde | Amarillo | Rojo | Peso |
|---|---:|---:|---:|---:|
| p95 búsqueda | < 350 ms | 350-700 ms | > 700 ms | 20% |
| p99 búsqueda | < 700 ms | 700-1400 ms | > 1400 ms | 15% |
| DB pool wait p95 | < 20 ms | 20-80 ms | > 80 ms | 15% |
| % tiempo en I/O DB+Redis | < 50% | 50-70% | > 70% | 15% |
| CPU app (promedio picos) | < 55% | 55-75% | > 75% | 10% |
| Error rate 5xx search | < 0.3% | 0.3-1% | > 1% | 10% |
| Cache hit ratio search | > 70% | 50-70% | < 50% | 10% |
| Variabilidad latencia (CV) | < 0.6 | 0.6-1.0 | > 1.0 | 5% |

### Regla de scoring

- Verde = 0 puntos
- Amarillo = 50 puntos
- Rojo = 100 puntos
- **Score final** = suma ponderada por peso

### Decisión por score

- **0-39:** No migrar async todavía
- **40-69:** Migración async parcial (search read-path)
- **70-100:** Migración async prioritaria

---

## 4) Dashboard mínimo (paneles)

Crear dashboard "Search Async Decision" con estos paneles:

1. p50/p95/p99 latencia search
2. Error rate 5xx search
3. Throughput (RPS) search
4. CPU app
5. Memoria app
6. DB response time / pool wait
7. Cache hit ratio (search)
8. Invalidaciones por minuto (search/listing/static)
9. Score total async (gauge)
10. Semáforo de decisión (Stat: Verde/Amarillo/Rojo)

---

## 5) Queries (modo Prometheus nativo)

> Estas expresiones asumen instrumentación estándar futura.

### Latencia p95 y p99 (search)

```promql
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{route="/v1/search/",method="GET"}[5m])) by (le)) * 1000
```

```promql
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{route="/v1/search/",method="GET"}[5m])) by (le)) * 1000
```

### Error rate 5xx search

```promql
sum(rate(http_requests_total{route="/v1/search/",method="GET",status=~"5.."}[5m]))
/
sum(rate(http_requests_total{route="/v1/search/",method="GET"}[5m])) * 100
```

### RPS search

```promql
sum(rate(http_requests_total{route="/v1/search/",method="GET"}[1m]))
```

### CPU app

```promql
avg(process_cpu_percent{service="backend_api"})
```

### Pool wait p95 DB

```promql
histogram_quantile(0.95, sum(rate(db_pool_wait_seconds_bucket[5m])) by (le)) * 1000
```

### Cache hit ratio search

```promql
sum(rate(search_cache_hits_total[5m]))
/
(sum(rate(search_cache_hits_total[5m])) + sum(rate(search_cache_misses_total[5m]))) * 100
```

### Invalidaciones por minuto

```promql
sum(rate(search_cache_invalidations_total[1m]))
```

---

## 6) Queries (modo actual: endpoint JSON)

Si aún no hay Prometheus nativo:

1. Usar `prometheus-community/json-exporter`
2. Scrappear `/v1/system/metrics`
3. Mapear al menos:
   - `easyrent_cpu_usage_percentage`
   - `easyrent_memory_percentage`
   - `easyrent_database_response_time_ms`
   - `easyrent_requests_total`

**Importante:** con JSON actual no tendrás p95/p99 reales por endpoint, ni hit ratio de cache por tipo.  
Para score confiable, hay que agregar métricas de aplicación específicas de search/cache.

---

## 7) Métricas que faltan y deben añadirse

Para un score robusto, instrumentar:

- `http_request_duration_seconds` (Histogram con labels route/method/status)
- `http_requests_total` (Counter)
- `search_cache_hits_total` y `search_cache_misses_total`
- `search_cache_invalidations_total{reason="..."}`
- `listing_detail_cache_hits_total/misses_total`
- `static_cache_hits_total/misses_total{namespace="..."}`
- `db_pool_wait_seconds` (Histogram)

---

## 8) Alertas recomendadas

### Alerta A: Search p95 degradado

Condición: p95 search > 700 ms durante 10 min

### Alerta B: Error rate alto

Condición: 5xx search > 1% durante 5 min

### Alerta C: Cache ineficiente

Condición: hit ratio search < 50% durante 30 min

### Alerta D: Presión DB

Condición: pool wait p95 > 80 ms durante 10 min

---

## 9) Operación semanal (ritual de decisión)

1. Revisar score diario y semanal
2. Ver top 3 causales de degradación (latencia, pool wait, cache ratio)
3. Si score en amarillo por 2 semanas: preparar migración async parcial
4. Si score en rojo por 3+ días o 3 métricas críticas en rojo: priorizar migración async
5. Si score verde estable: mantener sync y seguir optimizando SQL/cache

---

## 10) Criterio Go/No-Go final

**Go Async parcial (search):**

- Score >= 40 por 2 semanas
- o p95 > 700 ms + pool wait > 80 ms de forma sostenida

**Go Async prioritaria:**

- Score >= 70
- o combinación de p99 alto + error rate > 1% + cache ratio bajo

**No-Go:**

- Score < 40 y sin saturación de pool/CPU

---

## 11) Nota para este proyecto

Con las mejoras ya aplicadas (cache de búsqueda, detalle, estáticos e invalidación inteligente), la siguiente ganancia grande depende de observabilidad fina.  
Sin métricas p95/p99 por endpoint y hit/miss por tipo de cache, la decisión async quedará basada en percepción.

Recomendación práctica: instrumentar primero métricas de app (1 sprint corto), medir 2 semanas y decidir con este score.

---

## 12) Roadmap ejecutable (pendientes del cronograma)

Estado general sugerido:

- **Pendiente por revisar:** decisión de migración async global
- **En cola inmediata:** connection pooling optimizado
- **Condicionado a evidencia:** async en listings CRUD
- **Obligatorio para decidir:** test de carga y benchmarking

### Fase 0 — Preparación y baseline (2-3 días)

Objetivo: tener un baseline confiable antes de cambios de arquitectura.

Entregables:

1. Dashboard operativo con métricas mínimas (CPU, memoria, DB response time, requests)
2. Escenarios de carga definidos:
   - search read-heavy
   - listing detail read-heavy
   - mixed read/write (CRUD listings)
3. Reporte baseline (p50/p95/p99, error rate, throughput)

Criterio de salida:

- Baseline reproducible en al menos 3 corridas por escenario

---

### Fase 1 — Connection pooling optimizado (3-5 días)

Objetivo: reducir contención de conexiones y latencia p95/p99 sin cambiar paradigma sync.

Alcance técnico:

1. Parametrizar pool en configuración por entorno:
   - `pool_size`
   - `max_overflow`
   - `pool_timeout`
   - `pool_recycle`
   - `pool_pre_ping`
2. Definir perfiles por entorno:
   - local/dev: conservador
   - staging/prod: basado en workers y capacidad de PostgreSQL
3. Validar que no haya connection leaks en rutas de alto tráfico

KPIs objetivo de esta fase:

- `db_pool_wait_p95` baja al menos 20-30%
- p95 de search/listing detail mejora 10-20%
- error rate se mantiene <= baseline

Criterio de salida:

- Mejoras estables durante 48-72h en staging bajo carga

---

### Fase 2 — Test de carga y benchmarking formal (2-4 días)

Objetivo: cuantificar impacto real post-pooling y decidir si async es necesario.

Alcance:

1. Ejecutar test suite predefinido en ventana controlada
2. Comparar **baseline vs post-pooling**
3. Publicar reporte con score de decisión async

Estructura del reporte:

1. Tabla comparativa de métricas clave
2. Score final (0-100)
3. Recomendación: no-go / async parcial / async prioritaria

Criterio de salida:

- Reporte firmado por backend + devops con decisión explícita

---

### Fase 3 — Async endpoints para listings CRUD (solo si aplica) (5-10 días)

**Activar solo si score >= 40 sostenido** o si persiste saturación I/O.

Estrategia recomendada: migración incremental por dominio, no big-bang.

Secuencia:

1. Read-path listings (`GET /listings`, `GET /listings/{id}`, `GET /listings/by-slug/{slug}`)
2. Write-path listings (`POST/PUT/DELETE`, publish/unpublish)
3. Ajustes de servicios dependientes (media/amenities/search invalidation)

Controles de riesgo:

1. Feature flag por endpoint
2. Rollback inmediato al path sync
3. Pruebas de regresión funcional + carga por etapa

KPIs objetivo:

- p95 y p99 mejoran >= 20% en escenarios concurrentes
- error rate no aumenta
- throughput sube de forma consistente

---

## 13) Matriz rápida de priorización (qué hacer primero)

| Task | Prioridad | Esfuerzo | Riesgo | Dependencia |
|---|---|---|---|---|
| Connection pooling optimizado | Alta | Medio | Bajo | Ninguna |
| Test de carga y benchmarking | Alta | Medio | Bajo | Fase 0 completa |
| Async endpoints listings CRUD | Media (condicional) | Alto | Medio/Alto | Evidencia Fase 2 |

Regla práctica:

- Si pooling + cache deja score < 40, **no ejecutar async CRUD todavía**.
- Si score >= 40 y estable, iniciar async parcial por etapas.

---

## 14) Checklist de seguimiento semanal

- [ ] Dashboard actualizado y sin gaps de métricas
- [ ] Reporte de carga semanal generado
- [ ] Score de decisión recalculado
- [ ] Estado del cronograma actualizado (pendiente / en progreso / cerrado)
- [ ] Decisión registrada con evidencia (no percepción)

---

## 15) Artefactos implementados (operativos)

### Dashboard mínimo operativo

- Stack: `monitoring/docker-compose.monitoring.yml`
- Prometheus scrape: `monitoring/prometheus/prometheus.yml`
- JSON exporter module: `monitoring/json-exporter/config.yml`
- Grafana dashboard: `monitoring/grafana/dashboards/async-decision-minimal.json`

Ruta base: `MAEBACKEND/documentacion/others/ASYNC/monitoring/`

### Escenarios de carga (k6)

- `MAEBACKEND/backend_api/tests/load-testing/scenarios/k6-search-read-heavy.js`
- `MAEBACKEND/backend_api/tests/load-testing/scenarios/k6-listing-detail-read-heavy.js`
- `MAEBACKEND/backend_api/tests/load-testing/scenarios/k6-mixed-crud-listings.js`
- utilidades: `MAEBACKEND/backend_api/tests/load-testing/scenarios/_common.js`

### Baseline y reporte

- Runner 3x por escenario: `MAEBACKEND/backend_api/tests/load-testing/run-baseline-suite.sh`
- Generador de reporte: `MAEBACKEND/backend_api/tests/load-testing/tools/generate_baseline_report.py`
- Template de reporte: `MAEBACKEND/backend_api/tests/load-testing/BASELINE_REPORT_TEMPLATE.md`
