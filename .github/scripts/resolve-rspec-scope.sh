#!/usr/bin/env bash
set -Eeuo pipefail

output_file="${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"
event_name="${GITHUB_EVENT_NAME:?GITHUB_EVENT_NAME is required}"
scope_output=""

if [[ "$event_name" == schedule || "$event_name" == workflow_dispatch ]]; then
  scope_output=$'scope=full\nspecs='
else
  if [[ "$event_name" == pull_request ]]; then
    base_sha="$(jq -r '.pull_request.base.sha // empty' "$GITHUB_EVENT_PATH")"
  elif [[ "$event_name" == push ]]; then
    base_sha="$(jq -r '.before // empty' "$GITHUB_EVENT_PATH")"
  else
    base_sha=""
  fi

  if [[ -z "$base_sha" || "$base_sha" =~ ^0+$ ]]; then
    scope_output=$'scope=full\nspecs='
  elif ! git fetch --no-tags --depth=1 origin "$base_sha"; then
    echo "::warning::Não foi possível buscar o commit base; executando a suíte RSpec completa."
    scope_output=$'scope=full\nspecs='
  elif ! changed_files="$(git diff --name-only --diff-filter=ACMRT "$base_sha...$GITHUB_SHA")"; then
    echo "::warning::Não foi possível calcular os arquivos alterados; executando a suíte RSpec completa."
    scope_output=$'scope=full\nspecs='
  elif [[ -z "$changed_files" ]]; then
    scope_output=$'scope=full\nspecs='
  else
    scope_output="$(printf '%s\n' "$changed_files" | bash .github/scripts/classify-rspec-scope.sh)"
  fi
fi

printf '%s\n' "$scope_output" >> "$output_file"
printf '%s\n' "$scope_output"
