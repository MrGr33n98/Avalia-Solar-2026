#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${STAGING_BASE_URL:-https://staging-api.avaliasolar.com.br}}"
TIMEOUT="${HEALTHCHECK_TIMEOUT:-10}"

endpoints=(
  "/health"
  "/health/readiness"
  "/health/liveness"
  "/api/v1/states"
)

for path in "${endpoints[@]}"; do
  url="${BASE_URL%/}${path}"
  echo "Checking ${url}"
  curl --fail --silent --show-error --max-time "${TIMEOUT}" "${url}" > /dev/null
done

echo "All checks passed."
