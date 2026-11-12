#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
git -C "$TMP" init -q
git -C "$TMP" config user.name 'CI Scope Test'
git -C "$TMP" config user.email 'ci-scope@example.invalid'
mkdir -p "$TMP/AB0-1-front/app" "$TMP/AB0-1-back/app"
printf 'front-base\n' > "$TMP/AB0-1-front/app/page.tsx"
printf 'backend-base\n' > "$TMP/AB0-1-back/app/api.rb"
git -C "$TMP" add .
git -C "$TMP" commit -qm 'base components'
FRONTEND_BASE="$(git -C "$TMP" rev-parse HEAD)"

printf 'backend version deployed later\n' > "$TMP/AB0-1-back/app/api.rb"
git -C "$TMP" add .
git -C "$TMP" commit -qm 'backend deployed independently'
BACKEND_BASE="$(git -C "$TMP" rev-parse HEAD)"

printf 'front release\n' > "$TMP/AB0-1-front/app/page.tsx"
git -C "$TMP" add .
git -C "$TMP" commit -qm 'frontend change'
RELEASE="$(git -C "$TMP" rev-parse HEAD)"

SCOPE_RESULT="$(cd "$TMP" && bash "$ROOT/.github/scripts/release/validate-frontend-scope.sh" \
  "$FRONTEND_BASE" "$BACKEND_BASE" "$RELEASE")"
echo "$SCOPE_RESULT" | jq -e '
  .compatibility_required == true
  and .backend_artifact_change == false
  and .backend_shared_delta_count == 0
  and .runtime_delta_file_count == 1
  and (.effective_frontend_inputs == ["AB0-1-front/app/page.tsx"])
' >/dev/null
echo 'PASS: delta misto histórico aceito usando bases reais por componente'

mkdir -p "$TMP/AB0-1-front/lib"
printf 'new frontend API dependency\n' > "$TMP/AB0-1-front/lib/api.ts"
git -C "$TMP" add .
git -C "$TMP" commit -qm 'frontend API contract change'
RELEASE="$(git -C "$TMP" rev-parse HEAD)"
SCOPE_RESULT="$(cd "$TMP" && bash "$ROOT/.github/scripts/release/validate-frontend-scope.sh" \
  "$FRONTEND_BASE" "$BACKEND_BASE" "$RELEASE")"
echo "$SCOPE_RESULT" | jq -e '.api_contract_inputs == ["AB0-1-front/lib/api.ts"]' >/dev/null
echo 'PASS: alteração de contrato é sinalizada para o gate E2E'

printf 'backend incompatible route\n' > "$TMP/AB0-1-back/app/api.rb"
git -C "$TMP" add .
git -C "$TMP" commit -qm 'backend drift after runtime base'
RELEASE="$(git -C "$TMP" rev-parse HEAD)"
if (cd "$TMP" && bash "$ROOT/.github/scripts/release/validate-frontend-scope.sh" \
  "$FRONTEND_BASE" "$BACKEND_BASE" "$RELEASE") >"$TMP/output" 2>&1; then
  echo 'FAIL: delta backend desde a base runtime foi aceito.' >&2
  exit 1
fi
grep -q 'backend ativo idêntico' "$TMP/output"
echo 'PASS: delta backend pós-runtime bloqueado'
