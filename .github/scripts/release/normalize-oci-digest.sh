#!/usr/bin/env bash
# Produces one canonical OCI digest form: sha256:<64 lowercase hex characters>.
set -euo pipefail

[ "$#" -eq 1 ] || { echo "Uso: $0 <sha256:HEX ou HEX>" >&2; exit 2; }
digest="$1"

if [[ "$digest" =~ ^[0-9a-f]{64}$ ]]; then
  digest="sha256:$digest"
fi

[[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]] \
  || { echo "ERRO: digest OCI inválido ou com prefixo duplicado." >&2; exit 1; }
printf '%s\n' "$digest"
