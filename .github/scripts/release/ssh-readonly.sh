#!/usr/bin/env bash
# Runs a read-only VM inventory script over SSH with host-key fingerprint pinning.
set -euo pipefail

[ "$#" -eq 1 ] || { echo "Uso: $0 <script-remoto>" >&2; exit 2; }
REMOTE_SCRIPT="$1"
for required in SSH_HOST SSH_USER SSH_PRIVATE_KEY SSH_HOST_FINGERPRINT; do
  [ -n "${!required:-}" ] || { echo "ERRO: $required ausente." >&2; exit 1; }
done
[[ "${SSH_PORT:-22}" =~ ^[0-9]{1,5}$ ]] || { echo "ERRO: SSH_PORT inválida." >&2; exit 1; }
[ -r "$REMOTE_SCRIPT" ] || { echo "ERRO: script de inspeção ausente." >&2; exit 1; }

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
KEY_FILE="$TMP_DIR/deploy_key"
KNOWN_HOSTS="$TMP_DIR/known_hosts"
printf '%s\n' "$SSH_PRIVATE_KEY" > "$KEY_FILE"
chmod 600 "$KEY_FILE"

ssh-keyscan -p "$SSH_PORT" "$SSH_HOST" > "$KNOWN_HOSTS" 2>/dev/null \
  || { echo "ERRO: não foi possível obter host key SSH." >&2; exit 1; }
FINGERPRINTS="$(ssh-keygen -lf "$KNOWN_HOSTS" -E sha256 | awk '{print $2}' | sort -u)"
grep -Fqx "$SSH_HOST_FINGERPRINT" <<< "$FINGERPRINTS" \
  || { echo "ERRO: fingerprint SSH não confere." >&2; exit 1; }

printf -v REMOTE_COMMAND 'PRODUCTION_DEPLOY_DIR=%q bash -s' "${PRODUCTION_DEPLOY_DIR:-}"
ssh -i "$KEY_FILE" -p "$SSH_PORT" -o BatchMode=yes -o ConnectTimeout=15 \
  -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$KNOWN_HOSTS" \
  "$SSH_USER@$SSH_HOST" "$REMOTE_COMMAND" < "$REMOTE_SCRIPT"
