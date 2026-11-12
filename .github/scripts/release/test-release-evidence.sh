#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
VALIDATOR="$ROOT/.github/scripts/release/validate-evidence.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

export ROOT VALIDATOR TMP

jq -n \
  --arg image_base 'ghcr.io/mrgr33n98/avalia-solar-2026' \
  --arg sha_a "$(printf 'a%.0s' {1..40})" \
  --arg sha_b "$(printf 'b%.0s' {1..40})" \
  --arg digest_a "sha256:$(printf 'a%.0s' {1..64})" \
  --arg digest_b "sha256:$(printf 'b%.0s' {1..64})" '
  def component($name; $sha; $digest): {
    source_sha: $sha,
    image: ($image_base + "-" + $name + "@" + $digest),
    digest: $digest,
    container_id: ($name + "-container-id"),
    health: "healthy"
  };
  {
    schema_version: 1,
    environment: "production",
    release_id: "release-current",
    status: "verified",
    components: {
      frontend: component("frontend"; $sha_a; $digest_a),
      backend: component("backend"; $sha_a; $digest_a),
      worker: component("worker"; $sha_a; $digest_a)
    }
  }' > "$TMP/current.json"

jq --arg sha_b "$(printf 'b%.0s' {1..40})" \
  --arg digest_b "sha256:$(printf 'b%.0s' {1..64})" \
  '.release_id = "release-next"
   | .components.frontend.source_sha = $sha_b
   | .components.frontend.digest = $digest_b
   | .components.frontend.image = "ghcr.io/mrgr33n98/avalia-solar-2026-frontend@" + $digest_b
   | .components.frontend.container_id = "frontend-next-container-id"' \
  "$TMP/current.json" > "$TMP/frontend-next.json"

jq '.components |= with_entries(.value |= {digest, container_id, health})' \
  "$TMP/current.json" > "$TMP/runtime.json"

jq -n \
  --arg sha_a "$(printf 'a%.0s' {1..40})" \
  --arg sha_b "$(printf 'b%.0s' {1..40})" \
  --arg container_front "$(printf 'a%.0s' {1..64})" \
  --arg container_back "$(printf 'b%.0s' {1..64})" \
  --arg container_worker "$(printf 'c%.0s' {1..64})" \
  --arg image_id_front "sha256:$(printf 'c%.0s' {1..64})" \
  --arg image_id_back "sha256:$(printf 'd%.0s' {1..64})" \
  --arg digest_front "ghcr.io/mrgr33n98/avalia-solar-2026-frontend@sha256:$(printf 'e%.0s' {1..64})" \
  --arg digest_back "ghcr.io/mrgr33n98/avalia-solar-2026-backend@sha256:$(printf 'f%.0s' {1..64})" '
  {
    schema_version: 1,
    manifest: {
      git_sha: $sha_a,
      frontend_image: "ghcr.io/mrgr33n98/avalia-solar-2026-frontend:latest",
      backend_image: ("ghcr.io/mrgr33n98/avalia-solar-2026-backend:" + $sha_a)
    },
    manifest_divergences: [],
    components: {
      frontend: {container_id:$container_front, config_image:"ghcr.io/mrgr33n98/avalia-solar-2026-frontend:latest", image_id:$image_id_front, repo_digests:[$digest_front], source_sha:$sha_b, state:"running", health:"healthy"},
      backend: {container_id:$container_back, config_image:("ghcr.io/mrgr33n98/avalia-solar-2026-backend:" + $sha_a), image_id:$image_id_back, repo_digests:[$digest_back], source_sha:$sha_a, state:"running", health:"healthy"},
      worker: {container_id:$container_worker, config_image:("ghcr.io/mrgr33n98/avalia-solar-2026-backend:" + $sha_a), image_id:$image_id_back, repo_digests:[$digest_back], source_sha:$sha_a, state:"running", health:"healthy"}
    }
  }' > "$TMP/runtime-report.json"

assert_pass() {
  local name="$1"
  shift
  if "$@" >"$TMP/output" 2>&1; then
    echo "PASS: $name"
  else
    cat "$TMP/output"
    echo "FAIL: $name deveria passar" >&2
    exit 1
  fi
}

assert_block() {
  local name="$1"
  shift
  if "$@" >"$TMP/output" 2>&1; then
    echo "FAIL: $name deveria bloquear" >&2
    exit 1
  fi
  echo "PASS: $name bloqueado"
}

assert_pass 'identifica versões por componente e digest' \
  bash "$VALIDATOR" validate-manifest "$TMP/current.json"
assert_pass 'aceita escopo frontend-only sem tocar backend/worker' \
  bash "$VALIDATOR" validate-scope "$TMP/current.json" "$TMP/frontend-next.json" frontend_only
PLAN="$(bash "$VALIDATOR" plan-scope "$TMP/current.json" "$TMP/frontend-next.json" frontend_only)"
jq -e '.action == "deploy" and .changed_components == ["frontend"]' \
  <<< "$PLAN" >/dev/null \
  || { echo 'FAIL: plano frontend-only incluiu serviço inesperado.' >&2; exit 1; }
echo 'PASS: plano altera somente frontend'
NOOP="$(bash "$VALIDATOR" plan-scope "$TMP/current.json" "$TMP/current.json" frontend_only)"
jq -e '.action == "no_op" and .changed_components == []' <<< "$NOOP" >/dev/null \
  || { echo 'FAIL: mesma versão deveria resultar em NO_OP.' >&2; exit 1; }
echo 'PASS: imagem já ativa resulta em NO_OP'
assert_block 'bloqueia alteração backend em escopo frontend-only' \
  bash "$VALIDATOR" validate-scope "$TMP/current.json" \
    <(jq --arg sha "$(printf 'b%.0s' {1..40})" \
         --arg digest "sha256:$(printf 'b%.0s' {1..64})" \
         '.components.backend.source_sha = $sha
          | .components.backend.digest = $digest
          | .components.backend.image = "ghcr.io/mrgr33n98/avalia-solar-2026-backend@" + $digest' \
         "$TMP/frontend-next.json") frontend_only
assert_block 'bloqueia digest não imutável' \
  bash "$VALIDATOR" validate-manifest \
    <(jq '.components.frontend.digest = "latest"' "$TMP/current.json")
assert_block 'bloqueia SHA de origem inválido' \
  bash "$VALIDATOR" validate-manifest \
    <(jq '.components.worker.source_sha = "not-a-sha"' "$TMP/current.json")
assert_pass 'runtime reconciliado corresponde ao manifesto' \
  bash "$VALIDATOR" reconcile "$TMP/current.json" "$TMP/runtime.json"
assert_block 'drift de imagem/container bloqueia release' \
  bash "$VALIDATOR" reconcile "$TMP/current.json" \
    <(jq --arg digest "sha256:$(printf 'f%.0s' {1..64})" \
         '.components.backend.digest = $digest' "$TMP/runtime.json")
assert_pass 'rollback restaura frontend anterior sem alterar backend/worker' \
  bash "$VALIDATOR" rollback-plan "$TMP/frontend-next.json" "$TMP/current.json" frontend_only
ROLLBACK="$(bash "$VALIDATOR" rollback-plan "$TMP/frontend-next.json" "$TMP/current.json" frontend_only)"
EXPECTED_DIGEST="sha256:$(printf 'a%.0s' {1..64})"
jq -e --arg digest "$EXPECTED_DIGEST" \
  '.scope == "frontend_only" and .restore.digest == $digest' \
  <<< "$ROLLBACK" >/dev/null \
  || { echo 'FAIL: plano não identifica digest imutável de rollback.' >&2; exit 1; }
echo 'PASS: rollback aponta digest anterior verificável'
assert_block 'manifesto ausente bloqueia operação' \
  bash "$VALIDATOR" validate-manifest "$TMP/missing.json"
assert_pass 'inspeção confirma imagem, digest OCI, SHA e health dos três serviços' \
  bash "$VALIDATOR" validate-runtime "$TMP/runtime-report.json"
assert_pass 'baseline explícita aprova runtime backend/worker conhecido apesar do manifesto histórico' \
  bash "$ROOT/.github/scripts/release/validate-runtime-baseline.sh" \
    "$TMP/runtime-report.json" "$(printf 'a%.0s' {1..40})" \
    "sha256:$(printf 'd%.0s' {1..64})" "$(printf 'a%.0s' {1..40})" \
    "sha256:$(printf 'd%.0s' {1..64})"
assert_block 'baseline explícita bloqueia Image ID backend não autorizado' \
  bash "$ROOT/.github/scripts/release/validate-runtime-baseline.sh" \
    "$TMP/runtime-report.json" "$(printf 'a%.0s' {1..40})" \
    "sha256:$(printf 'e%.0s' {1..64})" "$(printf 'a%.0s' {1..40})" \
    "sha256:$(printf 'd%.0s' {1..64})"
assert_block 'baseline explícita bloqueia SHA de origem backend não autorizado' \
  bash "$ROOT/.github/scripts/release/validate-runtime-baseline.sh" \
    <(jq '.components.backend.source_sha = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"' "$TMP/runtime-report.json") \
    "$(printf 'a%.0s' {1..40})" "sha256:$(printf 'd%.0s' {1..64})" \
    "$(printf 'a%.0s' {1..40})" "sha256:$(printf 'd%.0s' {1..64})"
assert_block 'health check falho bloqueia preflight' \
  bash "$VALIDATOR" validate-runtime \
    <(jq '.components.frontend.health = "unhealthy"' "$TMP/runtime-report.json")
assert_block 'divergência de digest backend/worker bloqueia preflight' \
  bash "$VALIDATOR" validate-runtime \
    <(jq '.components.worker.repo_digests[0] |= sub("f+$"; "e")' "$TMP/runtime-report.json")
assert_block 'Container ID fora do formato Docker bloqueia preflight' \
  bash "$VALIDATOR" validate-runtime \
    <(jq '.components.backend.container_id = "not-a-container-id"' "$TMP/runtime-report.json")
assert_pass 'snapshot subsequente preserva backend e worker' \
  bash "$VALIDATOR" assert-preserved "$TMP/runtime-report.json" "$TMP/runtime-report.json" frontend_only
assert_block 'mudança de digest backend entre snapshots bloqueia frontend-only' \
  bash "$VALIDATOR" assert-preserved "$TMP/runtime-report.json" \
    <(jq '.components.backend.image_id = "sha256:changed"' "$TMP/runtime-report.json") frontend_only

echo 'Todos os cenários de evidência passaram.'
