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

if [[ "${GITHUB_EVENT_NAME:-}" == "workflow_dispatch" && "${TEST_SUITE_INPUT:-}" == "docs_only" ]]; then
  # Ensure the SAME trusted branch-wide comparison as change-impact.
  # HEAD~1 would permit a code change followed by a docs-only commit to pass.
  if ! git fetch --no-tags origin main >/dev/null 2>&1; then
    echo "::error::Cannot fetch origin/main for manual docs validation."
    exit 1
  fi
  if ! base_sha="$(git merge-base "$head_sha" FETCH_HEAD)" || [[ -z "$base_sha" ]]; then
    echo "::error::Cannot determine the branch merge-base."
    exit 1
  fi
fi

if [[ -z "$base_sha" && -n "${GITHUB_BASE_REF:-}" ]]; then
  if ! git fetch --no-tags origin "$GITHUB_BASE_REF" >/dev/null 2>&1; then
    echo "::error::Cannot fetch pull request base ref."
    exit 1
  fi
  base_sha="FETCH_HEAD"
fi

if [[ -z "$base_sha" ]]; then
  echo "::error::No authoritative docs diff base. Refusing short-commit fallback."
  exit 1
fi

if ! git cat-file -e "${base_sha}^{commit}" 2>/dev/null; then
  if ! git fetch --no-tags origin "$base_sha" >/dev/null 2>&1; then
    echo "::error::Unable to fetch base commit for docs validation."
    exit 1
  fi
fi
if ! git diff --name-only "$base_sha" "$head_sha" > "$diff_file"; then
  echo "::error::Unable to compute docs diff."
  exit 1
fi

if [[ ! -s "$diff_file" ]]; then
  echo "::error::Nenhum arquivo detectado no diff de documentação. Execução cancelada."
  exit 1
fi

echo "Arquivos detectados para validação documental:"
cat "$diff_file"

python3 .github/scripts/validate_docs_pr.py --repo-root "$ROOT" < "$diff_file"
echo "Validação de documentação concluída com sucesso."
