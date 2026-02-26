#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCENARIO="${1:-search}"
BASE_URL="${BASE_URL:-http://localhost:8080}"
API_PREFIX="${API_PREFIX:-/v1}"
PROM_RW_URL="${PROM_RW_URL:-http://localhost:9091/api/v1/write}"

case "$SCENARIO" in
  search)
    SCRIPT="${ROOT_DIR}/scenarios/k6-search-read-heavy.js"
    ;;
  detail)
    SCRIPT="${ROOT_DIR}/scenarios/k6-listing-detail-read-heavy.js"
    ;;
  mixed)
    SCRIPT="${ROOT_DIR}/scenarios/k6-mixed-crud-listings.js"
    if [[ -z "${AUTH_TOKEN:-}" ]]; then
      echo "ERROR: AUTH_TOKEN is required for mixed scenario"
      exit 1
    fi
    ;;
  *)
    echo "Usage: $0 [search|detail|mixed]"
    exit 1
    ;;
esac

echo "Running scenario: ${SCENARIO}"
echo "BASE_URL=${BASE_URL}"
echo "PROM_RW_URL=${PROM_RW_URL}"

BASE_URL="${BASE_URL}" \
API_PREFIX="${API_PREFIX}" \
K6_PROMETHEUS_RW_SERVER_URL="${PROM_RW_URL}" \
k6 run -o experimental-prometheus-rw "${SCRIPT}"
