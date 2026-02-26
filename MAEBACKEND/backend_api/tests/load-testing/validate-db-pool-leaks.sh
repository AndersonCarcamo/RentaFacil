#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
API_PREFIX="${API_PREFIX:-/v1}"
SCENARIO_KIND="${1:-search}"
VUS="${VUS:-20}"
DURATION="${DURATION:-60s}"
MAX_WAIT_SECONDS="${MAX_WAIT_SECONDS:-30}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$SCENARIO_KIND" in
  search)
    SCENARIO_FILE="$ROOT_DIR/scenarios/k6-search-read-heavy.js"
    ;;
  detail)
    SCENARIO_FILE="$ROOT_DIR/scenarios/k6-listing-detail-read-heavy.js"
    ;;
  mixed)
    SCENARIO_FILE="$ROOT_DIR/scenarios/k6-mixed-crud-listings.js"
    if [[ -z "${AUTH_TOKEN:-}" ]]; then
      echo "ERROR: AUTH_TOKEN es obligatorio para el escenario mixed"
      exit 1
    fi
    ;;
  *)
    echo "Uso: $0 [search|detail|mixed]"
    exit 1
    ;;
esac

PRIMARY_POOL_ENDPOINT="${BASE_URL}${API_PREFIX}/system/stats/database/pool"
FALLBACK_POOL_ENDPOINT="${BASE_URL}/stats/database/pool"

resolve_pool_endpoint() {
  local endpoint="$1"
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" || true)"
  if [[ "$code" == "200" ]]; then
    echo "$endpoint"
    return 0
  fi
  return 1
}

POOL_ENDPOINT="$(resolve_pool_endpoint "$PRIMARY_POOL_ENDPOINT" || resolve_pool_endpoint "$FALLBACK_POOL_ENDPOINT" || true)"

if [[ -z "$POOL_ENDPOINT" ]]; then
  echo "ERROR: no se encontró endpoint de pool (intentados: $PRIMARY_POOL_ENDPOINT y $FALLBACK_POOL_ENDPOINT)"
  exit 1
fi

echo "[1/4] Snapshot inicial de pool: ${POOL_ENDPOINT}"
BEFORE_JSON="$(curl -fsS "$POOL_ENDPOINT")"
BEFORE_CHECKEDOUT="$(python3 -c 'import json,sys; d=json.loads(sys.stdin.read()); print((d.get("data") or {}).get("checkedout", 0))' <<< "$BEFORE_JSON")"
BEFORE_SIZE="$(python3 -c 'import json,sys; d=json.loads(sys.stdin.read()); print((d.get("data") or {}).get("size", 0))' <<< "$BEFORE_JSON")"

echo "checkedout(before)=${BEFORE_CHECKEDOUT} size=${BEFORE_SIZE}"

echo "[2/4] Ejecutando carga (${SCENARIO_KIND}) con k6: vus=${VUS}, duration=${DURATION}"
BASE_URL="$BASE_URL" API_PREFIX="$API_PREFIX" k6 run --vus "$VUS" --duration "$DURATION" "$SCENARIO_FILE"

echo "[3/4] Esperando liberación de conexiones"
START_TS="$(date +%s)"
AFTER_CHECKEDOUT=999999

while true; do
  CURRENT_JSON="$(curl -fsS "$POOL_ENDPOINT")"
  AFTER_CHECKEDOUT="$(python3 -c 'import json,sys; d=json.loads(sys.stdin.read()); print((d.get("data") or {}).get("checkedout", 0))' <<< "$CURRENT_JSON")"
  NOW_TS="$(date +%s)"
  ELAPSED=$((NOW_TS - START_TS))

  if [[ "$AFTER_CHECKEDOUT" -le "$BEFORE_CHECKEDOUT" ]]; then
    break
  fi

  if [[ "$ELAPSED" -ge "$MAX_WAIT_SECONDS" ]]; then
    break
  fi

  sleep 2
done

echo "[4/4] Resultado"
FINAL_JSON="$(curl -fsS "$POOL_ENDPOINT")"
FINAL_CHECKEDOUT="$(python3 -c 'import json,sys; d=json.loads(sys.stdin.read()); print((d.get("data") or {}).get("checkedout", 0))' <<< "$FINAL_JSON")"
FINAL_STATUS="$(python3 -c 'import json,sys; d=json.loads(sys.stdin.read()); print((d.get("data") or {}).get("status", "unknown"))' <<< "$FINAL_JSON")"

echo "checkedout(before)=${BEFORE_CHECKEDOUT} checkedout(after)=${FINAL_CHECKEDOUT}"
echo "pool_status=${FINAL_STATUS}"

if [[ "$FINAL_CHECKEDOUT" -gt "$BEFORE_CHECKEDOUT" ]]; then
  echo "FAIL: posible connection leak (checkedout no volvió al baseline)"
  exit 2
fi

echo "OK: no se detecta leak de conexiones en el escenario ${SCENARIO_KIND}."
