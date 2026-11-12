#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
NORMALIZER="$ROOT/.github/scripts/release/normalize-oci-digest.sh"
HEX="$(printf 'a%.0s' {1..64})"

[ "$(bash "$NORMALIZER" "$HEX")" = "sha256:$HEX" ]
echo 'PASS: digest hexadecimal normalizado com prefixo único'
[ "$(bash "$NORMALIZER" "sha256:$HEX")" = "sha256:$HEX" ]
echo 'PASS: digest OCI prefixado preservado'

if bash "$NORMALIZER" "sha256:sha256:$HEX" >/dev/null 2>&1; then
  echo 'FAIL: digest com prefixo duplicado foi aceito.' >&2
  exit 1
fi
echo 'PASS: digest sha256:sha256:... rejeitado'

if bash "$NORMALIZER" "sha256:$(printf 'A%.0s' {1..64})" >/dev/null 2>&1; then
  echo 'FAIL: digest com formato inválido foi aceito.' >&2
  exit 1
fi
echo 'PASS: digest inválido rejeitado'
