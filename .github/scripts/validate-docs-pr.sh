#!/usr/bin/env bash
# Validates documentation-only PRs: ensures all changed files are strictly non-executable
# documentation and verifies markdown formatting and link integrity.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

diff_file="${RUNNER_TEMP:-/tmp}/docs-diff-$$.txt"
trap 'rm -f "$diff_file"' EXIT

base_sha=""
head_sha="${GITHUB_SHA:-HEAD}"

if [[ -n "${GITHUB_EVENT_PATH:-}" && -f "$GITHUB_EVENT_PATH" ]]; then
  base_sha="$(jq -r '.pull_request.base.sha // empty' "$GITHUB_EVENT_PATH")"
fi

if [[ -z "$base_sha" && -n "${GITHUB_BASE_REF:-}" ]]; then
  git fetch --no-tags origin "$GITHUB_BASE_REF" >/dev/null 2>&1 || true
  base_sha="origin/$GITHUB_BASE_REF"
fi

if [[ -n "$base_sha" ]]; then
  if ! git cat-file -e "${base_sha}^{commit}" 2>/dev/null; then
    git fetch --no-tags origin "$base_sha" >/dev/null 2>&1 || true
  fi
  git diff --name-only "$base_sha" "$head_sha" > "$diff_file"
else
  # Local fallback: diff against previous commit or upstream default
  git diff --name-only HEAD~1 HEAD > "$diff_file" || true
fi

if [[ ! -s "$diff_file" ]]; then
  echo "::error::Nenhum arquivo detectado no diff de documentação. Execução cancelada."
  exit 1
fi

echo "Arquivos detectados para validação documental:"
cat "$diff_file"

python3 .github/scripts/validate_docs_pr.py --repo-root "$ROOT" < "$diff_file"
echo "Validação de documentação concluída com sucesso."
