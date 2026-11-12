#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/deploy/.deploy" "$TMP/bin"

SHA_A="$(printf 'a%.0s' {1..40})"
SHA_B="$(printf 'b%.0s' {1..40})"
SHA_GLOBAL="$(printf '9%.0s' {1..40})"
ID_FRONT="sha256:$(printf 'c%.0s' {1..64})"
ID_BACK="sha256:$(printf 'd%.0s' {1..64})"
DIGEST_FRONT="ghcr.io/mrgr33n98/avalia-solar-2026-frontend@sha256:$(printf 'e%.0s' {1..64})"
DIGEST_BACK="ghcr.io/mrgr33n98/avalia-solar-2026-backend@sha256:$(printf 'f%.0s' {1..64})"

cat > "$TMP/deploy/.deploy/current.env" <<EOF
GIT_SHA=$SHA_GLOBAL
FRONTEND_IMAGE=ghcr.io/mrgr33n98/avalia-solar-2026-frontend:stale-manifest-ref
BACKEND_IMAGE=ghcr.io/mrgr33n98/avalia-solar-2026-backend:$SHA_A
EOF

cat > "$TMP/bin/docker" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
if [ "$1" = inspect ]; then
  container="$2"
  case "$container" in
    ab0-frontend) service=frontend; image_id="$ID_FRONT"; ref="$MOCK_FRONTEND_IMAGE"; sha="$SHA_B" ;;
    ab0-backend) service=backend; image_id="$ID_BACK"; ref="$BACKEND_IMAGE"; sha="$SHA_A" ;;
    ab0-worker) service=worker; image_id="$ID_BACK"; ref="$BACKEND_IMAGE"; sha="$SHA_A" ;;
    *) exit 2 ;;
  esac
  jq -n --arg id "$image_id" --arg ref "$ref" --arg sha "$sha" \
    --arg health "${MOCK_HEALTH:-healthy}" '[{Id:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",Image:$id,Config:{Image:$ref,Env:[("GIT_SHA="+$sha),"SECRET_TOKEN=must-not-leak"],Labels:{"org.opencontainers.image.revision":$sha}},State:{Status:"running",Health:{Status:$health}}}]'
elif [ "$1" = image ] && [ "$2" = inspect ]; then
  case "$3" in
    "$ID_FRONT") digest="$DIGEST_FRONT"; sha="$SHA_B" ;;
    "$ID_BACK") digest="$DIGEST_BACK"; sha="$SHA_A" ;;
    *) exit 2 ;;
  esac
  if [ "${MOCK_NO_REVISION:-false}" = true ]; then labels='{}'; else labels="{\"org.opencontainers.image.revision\":\"$sha\"}"; fi
  jq -n --arg digest "$digest" --argjson labels "$labels" '[{RepoDigests:[$digest],Config:{Labels:$labels}}]'
else
  exit 2
fi
MOCK
chmod +x "$TMP/bin/docker"

export PATH="$TMP/bin:$PATH" PRODUCTION_DEPLOY_DIR="$TMP/deploy"
MOCK_FRONTEND_IMAGE="ghcr.io/mrgr33n98/avalia-solar-2026-frontend:latest"
BACKEND_IMAGE="ghcr.io/mrgr33n98/avalia-solar-2026-backend:$SHA_A"
export SHA_A SHA_B SHA_GLOBAL ID_FRONT ID_BACK DIGEST_FRONT DIGEST_BACK MOCK_FRONTEND_IMAGE BACKEND_IMAGE

REPORT="$(bash "$ROOT/.github/scripts/release/inspect-runtime.sh")"
bash "$ROOT/.github/scripts/release/validate-evidence.sh" \
  validate-runtime <(jq -n --argjson report "$REPORT" '$report')
jq -e '.manifest_divergences | length == 4' \
  <<< "$REPORT" >/dev/null \
  || { jq '.manifest_divergences' <<< "$REPORT" >&2; echo 'FAIL: divergência com GIT_SHA global não foi registrada.' >&2; exit 1; }
echo 'PASS: divergências do manifesto global registradas sem usar X-Release'
if grep -q 'must-not-leak' <<< "$REPORT"; then
  echo 'FAIL: inspeção expôs valor de ambiente fora da allowlist.' >&2
  exit 1
fi
echo 'PASS: inventário read-only limita campos e omite secrets'

if MOCK_HEALTH=unhealthy bash "$ROOT/.github/scripts/release/inspect-runtime.sh" >"$TMP/out" 2>&1; then
  echo 'FAIL: health check não saudável deveria bloquear.' >&2
  exit 1
fi
echo 'PASS: inspeção bloqueia health check não saudável'

if MOCK_NO_REVISION=true bash "$ROOT/.github/scripts/release/inspect-runtime.sh" >"$TMP/out" 2>&1; then
  echo 'FAIL: env GIT_SHA não pode substituir revision OCI ausente.' >&2
  exit 1
fi
grep -q 'SHA de origem.*não comprovado' "$TMP/out" \
  || { echo 'FAIL: falta de revision OCI não foi explicada.' >&2; exit 1; }
echo 'PASS: SHA de ambiente e tag mutável não substituem revision OCI'

echo 'Todos os cenários de inspeção passaram.'
