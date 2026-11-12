#!/usr/bin/env bash
# Compares the frontend artifact base and active backend base independently.
set -euo pipefail

[ "$#" -eq 3 ] || {
  echo "Uso: $0 <frontend-source-sha> <runtime-backend-sha> <release-sha>" >&2
  exit 2
}
FRONTEND_BASE_SHA="$1"
BACKEND_BASE_SHA="$2"
RELEASE_SHA="$3"

fail() {
  echo "ERRO: $1" >&2
  exit 1
}

for sha in "$FRONTEND_BASE_SHA" "$BACKEND_BASE_SHA" "$RELEASE_SHA"; do
  [[ "$sha" =~ ^[0-9a-f]{40}$ ]] || fail "SHA inválido na reconciliação por componente."
  git cat-file -e "${sha}^{commit}" 2>/dev/null || fail "Commit $sha não está disponível no checkout."
  git merge-base --is-ancestor "$sha" "$RELEASE_SHA" \
    || fail "SHA $sha não é ancestral da release solicitada."
done

is_frontend_input() {
  case "$1" in
    AB0-1-front/*|Dockerfile.frontend|.dockerignore) return 0 ;;
    *) return 1 ;;
  esac
}

mapfile -t frontend_delta < <(git diff --name-only "$FRONTEND_BASE_SHA" "$RELEASE_SHA")
mapfile -t runtime_delta < <(git diff --name-only "$BACKEND_BASE_SHA" "$RELEASE_SHA")

effective_json='[]'
for path in "${frontend_delta[@]}"; do
  if is_frontend_input "$path"; then
    effective_json="$(jq --arg path "$path" '. + [$path]' <<< "$effective_json")"
  fi
done
jq -e 'length > 0' <<< "$effective_json" >/dev/null \
  || fail "Nenhum insumo efetivo do artefato frontend mudou desde a imagem ativa."

unauthorized_delta=()
for path in "${runtime_delta[@]}"; do
  if ! is_frontend_input "$path"; then
    unauthorized_delta+=("$path")
  fi
done
if [ "${#unauthorized_delta[@]}" -gt 0 ]; then
  printf 'ERRO: código compartilhado/backend/infra mudou desde a base ativa do backend:\n' >&2
  printf ' - %s\n' "${unauthorized_delta[@]}" >&2
  fail "Frontend-only requer o backend ativo idêntico ao backend da release."
fi

api_json='[]'
while IFS= read -r path; do
  case "$path" in
    AB0-1-front/app/api/*|AB0-1-front/lib/api.ts|AB0-1-front/lib/api/*|AB0-1-front/lib/graphql/*|AB0-1-front/graphql/*)
      api_json="$(jq --arg path "$path" '. + [$path]' <<< "$api_json")"
      ;;
  esac
done < <(jq -r '.[]' <<< "$effective_json")

jq -n \
  --arg frontend_base_sha "$FRONTEND_BASE_SHA" \
  --arg backend_base_sha "$BACKEND_BASE_SHA" \
  --arg release_sha "$RELEASE_SHA" \
  --argjson effective_inputs "$effective_json" \
  --argjson api_contract_inputs "$api_json" \
  --argjson runtime_delta_count "${#runtime_delta[@]}" \
  --argjson shared_delta_count "${#unauthorized_delta[@]}" \
  '{policy:"component_bases", frontend_base_sha:$frontend_base_sha,
    backend_base_sha:$backend_base_sha, release_sha:$release_sha,
    effective_frontend_inputs:$effective_inputs,
    api_contract_inputs:$api_contract_inputs,
    runtime_delta_file_count:$runtime_delta_count,
    backend_shared_delta_count:$shared_delta_count,
    compatibility_required:true,
    backend_artifact_change:false}'
