#!/usr/bin/env bash
set -euo pipefail

WAHA_BASE_URL="${WAHA_BASE_URL:-http://localhost:3002}"
WAHA_SESSION="${WAHA_SESSION:-avalia-solar-voice}"
: "${WAHA_API_KEY:?Defina WAHA_API_KEY}"

headers=(-H "X-Api-Key: ${WAHA_API_KEY}" -H 'Content-Type: application/json')

if ! curl -fsS "${WAHA_BASE_URL}/api/sessions/${WAHA_SESSION}" "${headers[@]}" >/dev/null; then
  curl -fsS -X POST "${WAHA_BASE_URL}/api/sessions" \
    "${headers[@]}" \
    -d "{\"name\":\"${WAHA_SESSION}\",\"config\":{\"webhooks\":[{\"url\":\"http://ab0-backend:3001/api/v1/voice_reviews/webhook/waha\",\"events\":[\"message\",\"session.status\"]}]}}"
fi

curl -fsS -X POST "${WAHA_BASE_URL}/api/sessions/${WAHA_SESSION}/start" "${headers[@]}"

output_path="${WAHA_QR_PATH:-tmp/waha-${WAHA_SESSION}-qr.png}"
mkdir -p "$(dirname "${output_path}")"
curl -fsS "${WAHA_BASE_URL}/api/${WAHA_SESSION}/auth/qr" \
  -H "X-Api-Key: ${WAHA_API_KEY}" \
  -H 'Accept: image/png' \
  --output "${output_path}"

echo "QR salvo em ${output_path}. Escaneie no WhatsApp e aguarde o status WORKING."
