# Backend Load Testing (k6)

Este directorio contiene pruebas de carga orientadas al backend API.

## Escenarios

- `scenarios/k6-search-read-heavy.js`
- `scenarios/k6-listing-detail-read-heavy.js`
- `scenarios/k6-mixed-crud-listings.js`

## Variables de entorno

```bash
export BASE_URL=http://localhost:8000
export API_PREFIX=/v1
export AUTH_TOKEN="<jwt_token>"
```

`AUTH_TOKEN` es obligatorio para el escenario mixed CRUD.

## Ejecutar un escenario individual

```bash
k6 run scenarios/k6-search-read-heavy.js
k6 run scenarios/k6-listing-detail-read-heavy.js
k6 run scenarios/k6-mixed-crud-listings.js
```

## Ejecutar baseline completo (3 corridas por escenario)

```bash
bash run-baseline-suite.sh
```

## Ver métricas k6 en vivo (Prometheus/Grafana)

Prerequisito: stack de monitoreo levantado en `MAEBACKEND/documentacion/others/ASYNC/monitoring`.

```bash
export BASE_URL=http://localhost:8080
export API_PREFIX=/v1
./run-live-k6-to-prometheus.sh search
```

Escenarios disponibles:

- `./run-live-k6-to-prometheus.sh search`
- `./run-live-k6-to-prometheus.sh detail`
- `./run-live-k6-to-prometheus.sh mixed` (requiere `AUTH_TOKEN`)

Endpoints de monitoreo:

- Grafana: `http://localhost:3001` (dashboard: `Async Decision - k6 Live`)
- Prometheus: `http://localhost:9091`
- DB Pool stats: `http://localhost:8080/v1/system/stats/database/pool`

## Validación de connection leaks (rutas de alto tráfico)

Este script toma snapshot de `checkedout` antes/después de una carga k6 y falla si el pool no vuelve al baseline.

```bash
export BASE_URL=http://localhost:8080
export API_PREFIX=/v1
bash validate-db-pool-leaks.sh search
```

Opciones:

- `bash validate-db-pool-leaks.sh detail`
- `bash validate-db-pool-leaks.sh mixed` (requiere `AUTH_TOKEN`)
- Variables opcionales: `VUS`, `DURATION`, `MAX_WAIT_SECONDS`

Genera resultados en:

- `results/baseline/<timestamp>/*.json`
- `results/baseline/<timestamp>/BASELINE_REPORT.md`
- `results/baseline/<timestamp>/baseline_summary.json`

## Reporte manual (opcional)

```bash
python3 tools/generate_baseline_report.py \
  --input-dir results/baseline/<timestamp> \
  --output-md results/baseline/<timestamp>/BASELINE_REPORT.md \
  --output-json results/baseline/<timestamp>/baseline_summary.json
```
