#!/usr/bin/env bash
# Verifies backend/worker identity against operator-approved production values.
set -euo pipefail

[ "$#" -eq 5 ] || {
  echo "Uso: $0 <runtime.json> <backend-sha> <backend-image-id> <worker-sha> <worker-image-id>" >&2
  exit 2
}
report="$1"
backend_sha="$2"
backend_image_id="$3"
worker_sha="$4"
worker_image_id="$5"

for sha in "$backend_sha" "$worker_sha"; do
  [[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo "ERRO: SHA aprovado inválido." >&2; exit 1; }
done
for image_id in "$backend_image_id" "$worker_image_id"; do
  [[ "$image_id" =~ ^sha256:[0-9a-f]{64}$ ]] \
    || { echo "ERRO: Image ID aprovado inválido." >&2; exit 1; }
done

jq -e \
  --arg backend_sha "$backend_sha" \
  --arg backend_image_id "$backend_image_id" \
  --arg worker_sha "$worker_sha" \
  --arg worker_image_id "$worker_image_id" '
    .components.backend.source_sha == $backend_sha
    and .components.backend.image_id == $backend_image_id
    and .components.worker.source_sha == $worker_sha
    and .components.worker.image_id == $worker_image_id
    and .components.backend.image_id == .components.worker.image_id
    and .components.backend.source_sha == .components.worker.source_sha
    and .components.backend.repo_digests == .components.worker.repo_digests
    and .components.backend.health == "healthy"
    and .components.worker.health == "healthy"
  ' "$report" >/dev/null \
  || { echo "ERRO: runtime backend/worker diverge da baseline aprovada." >&2; exit 1; }

echo "Baseline backend/worker aprovada; divergências históricas do manifesto permanecem auditadas."
