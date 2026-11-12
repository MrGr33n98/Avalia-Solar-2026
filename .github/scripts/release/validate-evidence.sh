#!/usr/bin/env bash
# Validators for component release evidence used by the frontend production gate.
set -euo pipefail

usage() {
  echo "Uso: $0 {validate-manifest|validate-scope|reconcile|rollback-plan|plan-scope|validate-runtime|assert-preserved} ..." >&2
  exit 2
}

fail() {
  echo "ERRO: $1" >&2
  exit 1
}

validate_manifest() {
  local manifest="$1"

  [ -r "$manifest" ] || fail "Manifesto ausente ou ilegível."
  jq -e '
    def sha: type == "string" and test("^[0-9a-f]{40}$");
    def digest: type == "string" and test("^sha256:[0-9a-f]{64}$");
    def component($name):
      .components[$name] as $component
      | ($component | type == "object")
        and ($component.source_sha | sha)
        and ($component.digest | digest)
        and ($component.image | type == "string")
        and ($component.image | endswith("@" + $component.digest))
        and ($component.image | startswith("ghcr.io/"))
        and ($component.container_id | type == "string" and length > 0)
        and ($component.health == "healthy");
    (.schema_version == 1)
    and (.environment == "production" or .environment == "staging")
    and (.release_id | type == "string" and length > 0)
    and (.status == "verified")
    and ((.components | keys | sort) == ["backend", "frontend", "worker"])
    and component("frontend")
    and component("backend")
    and component("worker")
  ' "$manifest" >/dev/null || fail "Manifesto inválido: SHA, digest, imagem ou saúde não confere."
}

validate_scope() {
  local current="$1" desired="$2" scope="$3"
  validate_manifest "$current"
  validate_manifest "$desired"

  [ "$scope" = "frontend_only" ] || [ "$scope" = "full" ] \
    || fail "Escopo não suportado: $scope"
  [ "$(jq -r '.environment' "$current")" = "$(jq -r '.environment' "$desired")" ] \
    || fail "Ambiente do manifesto desejado diverge do runtime."

  if [ "$scope" = "frontend_only" ]; then
    jq -e -s '
      .[0].components.backend == .[1].components.backend
      and .[0].components.worker == .[1].components.worker
    ' "$current" "$desired" >/dev/null \
      || fail "Escopo frontend_only altera backend ou worker."
  fi
}

reconcile_runtime() {
  local manifest="$1" runtime="$2"
  validate_manifest "$manifest"
  [ -r "$runtime" ] || fail "Evidência de runtime ausente ou ilegível."

  jq -e --slurpfile expected "$manifest" '
    ($expected[0].components | keys | sort) == ["backend", "frontend", "worker"]
    and (.components | keys | sort) == ["backend", "frontend", "worker"]
    and (. as $runtime | $expected[0] as $declared
      | all(["frontend", "backend", "worker"][];
      . as $name
      | $runtime.components[$name] as $actual
      | $declared.components[$name] as $component
      | ($actual | type == "object")
        and ($actual.digest == $component.digest)
        and ($actual.container_id == $component.container_id)
        and ($actual.health == "healthy")
      ))
  ' "$runtime" >/dev/null || fail "Drift detectado entre manifesto e runtime."
}

rollback_plan() {
  local current="$1" previous="$2" scope="$3"
  validate_manifest "$current"
  validate_manifest "$previous"
  [ "$scope" = "frontend_only" ] || fail "Rollback disponível somente para frontend_only."
  [ "$(jq -r '.environment' "$current")" = "$(jq -r '.environment' "$previous")" ] \
    || fail "Ambiente do rollback diverge."
  jq -e -s '
    .[0].components.backend == .[1].components.backend
    and .[0].components.worker == .[1].components.worker
  ' "$current" "$previous" >/dev/null \
    || fail "Rollback frontend_only alteraria backend ou worker."

  jq '{scope: "frontend_only", restore: .components.frontend}' "$previous"
}

validate_runtime_report() {
  local report="$1"
  [ -r "$report" ] || fail "Relatório read-only do runtime ausente ou ilegível."

  jq -e '
    def sha: type == "string" and test("^[0-9a-f]{40}$");
    def image_id: type == "string" and test("^sha256:[0-9a-f]{64}$");
    def repo_digest($component):
      (.components[$component].repo_digests | type == "array" and length > 0)
      and any(.components[$component].repo_digests[];
        if $component == "frontend"
        then test("^ghcr\\.io/mrgr33n98/avalia-solar-2026-frontend@sha256:[0-9a-f]{64}$")
        else test("^ghcr\\.io/mrgr33n98/avalia-solar-2026-backend@sha256:[0-9a-f]{64}$")
        end);
    def healthy($component):
      (.components[$component].container_id | type == "string" and length > 0)
      and (.components[$component].state == "running")
      and (.components[$component].health == "healthy")
      and (.components[$component].image_id | image_id)
      and (.components[$component].source_sha | sha)
      and repo_digest($component);
    (.schema_version == 1)
    and (.manifest.git_sha | sha)
    and (.manifest.frontend_image | type == "string" and startswith("ghcr.io/"))
    and (.manifest.backend_image | type == "string" and startswith("ghcr.io/"))
    and ((.manifest_divergences | type) == "array")
    and healthy("frontend") and healthy("backend") and healthy("worker")
    and (.components.backend.config_image == .manifest.backend_image)
    and (.components.worker.config_image == .manifest.backend_image)
    and (.components.backend.image_id == .components.worker.image_id)
    and (.components.backend.source_sha == .components.worker.source_sha)
    and (.components.backend.repo_digests == .components.worker.repo_digests)
  ' "$report" >/dev/null || fail "Runtime não comprovado: drift, digest, manifesto ou health inválido."

  jq -r '.manifest_divergences[]? | "AVISO: divergência registrada: " + .' "$report" >&2
}

assert_preserved_components() {
  local baseline="$1" observed="$2" scope="$3"
  validate_runtime_report "$baseline"
  validate_runtime_report "$observed"
  [ "$scope" = "frontend_only" ] || fail "Escopo de preservação não suportado: $scope"
  jq -e -s '
    .[0].components.backend == .[1].components.backend
    and .[0].components.worker == .[1].components.worker
  ' "$baseline" "$observed" >/dev/null \
    || fail "Backend ou worker mudou durante operação frontend-only."
}

plan_scope() {
  local current="$1" desired="$2" scope="$3"
  validate_scope "$current" "$desired" "$scope"

  jq -n --slurpfile current "$current" --slurpfile desired "$desired" --arg scope "$scope" '
    ["frontend", "backend", "worker"] as $all
    | [$all[] as $name
       | select($current[0].components[$name].source_sha != $desired[0].components[$name].source_sha
           or $current[0].components[$name].digest != $desired[0].components[$name].digest)
       | $name] as $changed
    | {
        scope: $scope,
        action: (if ($changed | length) == 0 then "no_op" else "deploy" end),
        changed_components: $changed
      }
  '
}

case "${1:-}" in
  validate-manifest)
    [ "$#" -eq 2 ] || usage
    validate_manifest "$2"
    echo "Manifesto válido."
    ;;
  validate-scope)
    [ "$#" -eq 4 ] || usage
    validate_scope "$2" "$3" "$4"
    echo "Escopo válido: $4."
    ;;
  reconcile)
    [ "$#" -eq 3 ] || usage
    reconcile_runtime "$2" "$3"
    echo "Runtime reconciliado."
    ;;
  rollback-plan)
    [ "$#" -eq 4 ] || usage
    rollback_plan "$2" "$3" "$4"
    ;;
  plan-scope)
    [ "$#" -eq 4 ] || usage
    plan_scope "$2" "$3" "$4"
    ;;
  validate-runtime)
    [ "$#" -eq 2 ] || usage
    validate_runtime_report "$2"
    echo "Runtime frontend/backend/worker comprovado."
    ;;
  assert-preserved)
    [ "$#" -eq 4 ] || usage
    assert_preserved_components "$2" "$3" "$4"
    echo "Backend e worker preservados."
    ;;
  *) usage ;;
esac
