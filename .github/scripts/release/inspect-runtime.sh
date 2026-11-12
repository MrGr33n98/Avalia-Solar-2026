#!/usr/bin/env bash
# Read-only production inventory. Prints only release metadata; never emits Env wholesale.
set -euo pipefail

DEPLOY_DIR="${PRODUCTION_DEPLOY_DIR:-${HOME:-}/Avalia-Solar-2026}"
MANIFEST="$DEPLOY_DIR/.deploy/current.env"

fail() {
  echo "ERRO: $1" >&2
  exit 1
}

manifest_value() {
  local key="$1"
  awk -F= -v key="$key" '$1 == key { sub(/^[^=]*=/, ""); value = $0 } END { if (value != "") print value }' "$MANIFEST"
}

[ -r "$MANIFEST" ] || fail "Manifesto de deploy ausente ou ilegível."
GIT_SHA="$(manifest_value GIT_SHA)"
FRONTEND_IMAGE="$(manifest_value FRONTEND_IMAGE)"
BACKEND_IMAGE="$(manifest_value BACKEND_IMAGE)"
[[ "$GIT_SHA" =~ ^[0-9a-f]{40}$ ]] || fail "GIT_SHA do manifesto inválido."
[ -n "$FRONTEND_IMAGE" ] || fail "FRONTEND_IMAGE ausente no manifesto."
[ -n "$BACKEND_IMAGE" ] || fail "BACKEND_IMAGE ausente no manifesto."

inspect_component() {
  local key="$1" container="$2" inspect image_inspect container_id image_id config_image repo_json source_sha revision state health expected_repository

  inspect="$(docker inspect "$container")" || fail "Container $container não encontrado."
  container_id="$(jq -r '.[0].Id // empty' <<< "$inspect")"
  image_id="$(jq -r '.[0].Image // empty' <<< "$inspect")"
  config_image="$(jq -r '.[0].Config.Image // empty' <<< "$inspect")"
  state="$(jq -r '.[0].State.Status // empty' <<< "$inspect")"
  health="$(jq -r '.[0].State.Health.Status // "missing"' <<< "$inspect")"
  [[ "$image_id" =~ ^sha256:[0-9a-f]{64}$ ]] || fail "Image ID inválido para $container."
  [[ "$container_id" =~ ^[0-9a-f]{64}$ ]] || fail "ID de container inválido para $container."
  [ "$state" = running ] || fail "Container $container não está running."
  [ "$health" = healthy ] || fail "Health check de $container não está healthy."
  # Prefer OCI revision from immutable image config. The full SHA tag fallback is restricted to
  # backend/worker because their deployed refs are already content-specific SHA refs.
  image_inspect="$(docker image inspect "$image_id")" || fail "Imagem ativa de $container não pode ser inspecionada."
  revision="$(jq -r '.[0].Config.Labels["org.opencontainers.image.revision"] // ""' <<< "$image_inspect")"
  source_sha="$revision"
  if [ "$key" != frontend ] && ! [[ "$source_sha" =~ ^[0-9a-f]{40}$ ]]; then
    source_sha="${config_image##*:}"
  fi
  [[ "$source_sha" =~ ^[0-9a-f]{40}$ ]] || fail "SHA de origem de $container não comprovado."

  repo_json="$(jq -c '.[0].RepoDigests // []' <<< "$image_inspect")"
  if [ "$key" = frontend ]; then
    expected_repository='^ghcr\.io/mrgr33n98/avalia-solar-2026-frontend@sha256:[0-9a-f]{64}$'
  else
    expected_repository='^ghcr\.io/mrgr33n98/avalia-solar-2026-backend@sha256:[0-9a-f]{64}$'
  fi
  jq -e --arg pattern "$expected_repository" \
    'type == "array" and length > 0 and all(.[]; test($pattern))' \
    <<< "$repo_json" >/dev/null || fail "Digest OCI ausente ou inválido para $container."

  jq -n --arg id "$container_id" --arg config_image "$config_image" \
    --arg image_id "$image_id" --arg source_sha "$source_sha" \
    --arg revision "$revision" --arg state "$state" --arg health "$health" \
    --argjson repo_digests "$repo_json" \
    '{container_id: $id, config_image: $config_image, image_id: $image_id,
      repo_digests: $repo_digests, source_sha: $source_sha,
      revision_label: $revision, state: $state, health: $health}'
}

frontend="$(inspect_component frontend ab0-frontend)"
backend="$(inspect_component backend ab0-backend)"
worker="$(inspect_component worker ab0-worker)"

divergences='[]'
if [ "$FRONTEND_IMAGE" != "$(jq -r '.config_image' <<< "$frontend")" ]; then
  divergences="$(jq --arg msg 'FRONTEND_IMAGE do manifesto diverge da referência do container ativo.' '. + [$msg]' <<< "$divergences")"
fi
if [ "$BACKEND_IMAGE" != "$(jq -r '.config_image' <<< "$backend")" ]; then
  divergences="$(jq --arg msg 'BACKEND_IMAGE do manifesto diverge da referência do backend ativo.' '. + [$msg]' <<< "$divergences")"
fi
if [ "$BACKEND_IMAGE" != "$(jq -r '.config_image' <<< "$worker")" ]; then
  divergences="$(jq --arg msg 'BACKEND_IMAGE do manifesto diverge da referência do worker ativo.' '. + [$msg]' <<< "$divergences")"
fi
if [ "$GIT_SHA" != "$(jq -r '.source_sha' <<< "$frontend")" ]; then
  divergences="$(jq --arg msg 'GIT_SHA global diverge da origem frontend; identidade por componente prevalece.' '. + [$msg]' <<< "$divergences")"
fi
if [ "$GIT_SHA" != "$(jq -r '.source_sha' <<< "$backend")" ]; then
  divergences="$(jq --arg msg 'GIT_SHA global diverge da origem da imagem backend; identidade por componente prevalece.' '. + [$msg]' <<< "$divergences")"
fi
if [ "$GIT_SHA" != "$(jq -r '.source_sha' <<< "$worker")" ]; then
  divergences="$(jq --arg msg 'GIT_SHA global diverge da origem da imagem worker; identidade por componente prevalece.' '. + [$msg]' <<< "$divergences")"
fi

jq -n --arg git_sha "$GIT_SHA" --arg frontend_image "$FRONTEND_IMAGE" \
  --arg backend_image "$BACKEND_IMAGE" --argjson divergences "$divergences" \
  --argjson frontend "$frontend" --argjson backend "$backend" --argjson worker "$worker" \
  '{schema_version: 1,
    manifest: {git_sha: $git_sha, frontend_image: $frontend_image, backend_image: $backend_image},
    manifest_divergences: $divergences,
    components: {frontend: $frontend, backend: $backend, worker: $worker}}'
