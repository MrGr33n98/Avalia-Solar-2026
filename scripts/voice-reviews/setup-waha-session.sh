#!/usr/bin/env bash
set -euo pipefail

WAHA_BASE_URL="${WAHA_BASE_URL:-http://localhost:3002}"
WAHA_SESSION="${WAHA_SESSION:-avalia-solar-voice}"
: "${WAHA_API_KEY:?Defina WAHA_API_KEY}"

headers=(-H "X-Api-Key: ${WAHA_API_KEY}" -H 'Content-Type: application/json')

if ! curl -fsS "${WAHA_BASE_URL}/api/sessions/${WAHA_SESSION}" "${headers[@]}" >/dev/null 2>&1; then
  curl -fsS -X POST "${WAHA_BASE_URL}/api/sessions" \
    "${headers[@]}" \
    -d "{\"name\":\"${WAHA_SESSION}\"}"
fi

curl -fsS -X POST "${WAHA_BASE_URL}/api/sessions/${WAHA_SESSION}/start" "${headers[@]}" >/dev/null 2>&1 || true

echo "Aguardando geração do QR Code..."
max_attempts=30
attempt=0
while [ "$attempt" -lt "$max_attempts" ]; do
  status=$(curl -s "${WAHA_BASE_URL}/api/sessions/${WAHA_SESSION}" "${headers[@]}" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "")
  if [ "$status" = "SCAN_QR_CODE" ] || [ "$status" = "WORKING" ]; then
    break
  fi
  attempt=$((attempt + 1))
  sleep 1
done

output_path="${WAHA_QR_PATH:-tmp/waha-${WAHA_SESSION}-qr.png}"
mkdir -p "$(dirname "${output_path}")"
curl -fsS "${WAHA_BASE_URL}/api/${WAHA_SESSION}/auth/qr" \
  -H "X-Api-Key: ${WAHA_API_KEY}" \
  -H 'Accept: image/png' \
  --output "${output_path}"

echo "QR salvo em ${output_path}. Escaneie no WhatsApp e aguarde o status WORKING."
