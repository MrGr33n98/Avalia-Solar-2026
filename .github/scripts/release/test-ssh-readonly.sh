#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/bin"
cat > "$TMP/bin/ssh-keyscan" <<'MOCK'
#!/usr/bin/env bash
echo 'production.example ssh-ed25519 AAAATEST'
MOCK
cat > "$TMP/bin/ssh-keygen" <<'MOCK'
#!/usr/bin/env bash
echo '256 SHA256:known-host-fingerprint production.example (ED25519)'
MOCK
cat > "$TMP/bin/ssh" <<'MOCK'
#!/usr/bin/env bash
cat >/dev/null
printf '%s\n' '{"read_only":true}'
MOCK
chmod +x "$TMP/bin/"*
echo 'echo runtime-json' > "$TMP/inspect.sh"

export PATH="$TMP/bin:$PATH"
export SSH_HOST=production.example SSH_USER=deploy SSH_PORT=22
export SSH_PRIVATE_KEY='private-key-fixture'
export SSH_HOST_FINGERPRINT='SHA256:known-host-fingerprint'

RESULT="$(bash "$ROOT/.github/scripts/release/ssh-readonly.sh" "$TMP/inspect.sh")"
jq -e '.read_only == true' <<< "$RESULT" >/dev/null
echo 'PASS: inspeção SSH aceita fingerprint pinado e captura JSON'

if SSH_HOST_FINGERPRINT='SHA256:wrong' \
  bash "$ROOT/.github/scripts/release/ssh-readonly.sh" "$TMP/inspect.sh" >"$TMP/out" 2>&1; then
  echo 'FAIL: fingerprint divergente deveria bloquear.' >&2
  exit 1
fi
echo 'PASS: fingerprint divergente bloqueia SSH'

if env -u SSH_HOST_FINGERPRINT \
  bash "$ROOT/.github/scripts/release/ssh-readonly.sh" "$TMP/inspect.sh" >"$TMP/out" 2>&1; then
  echo 'FAIL: fingerprint ausente deveria bloquear.' >&2
  exit 1
fi
echo 'PASS: fingerprint ausente bloqueia SSH'
