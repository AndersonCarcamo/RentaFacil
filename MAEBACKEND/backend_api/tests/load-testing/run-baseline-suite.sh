#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${ROOT_DIR}/results/baseline"
TS="$(date +%Y%m%d_%H%M%S)"
OUT_DIR="${RESULTS_DIR}/${TS}"

mkdir -p "${OUT_DIR}"

run_case() {
  local scenario_name="$1"
  local script_path="$2"

  for run in 1 2 3; do
    echo "[baseline] Running ${scenario_name} - run ${run}/3"
    RESULT_FILE="${OUT_DIR}/${scenario_name}_run${run}.json" \
      k6 run "${script_path}" || true
  done
}

run_case "search_read_heavy" "${ROOT_DIR}/scenarios/k6-search-read-heavy.js"
run_case "listing_detail_read_heavy" "${ROOT_DIR}/scenarios/k6-listing-detail-read-heavy.js"
run_case "mixed_crud_listings" "${ROOT_DIR}/scenarios/k6-mixed-crud-listings.js"

python3 "${ROOT_DIR}/tools/generate_baseline_report.py" \
  --input-dir "${OUT_DIR}" \
  --output-md "${OUT_DIR}/BASELINE_REPORT.md" \
  --output-json "${OUT_DIR}/baseline_summary.json"

echo "[baseline] Completed. Results at: ${OUT_DIR}"
