#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target="$root/AB0-1-front"

if rg -n --glob '*.{ts,tsx}' \
  "(const|let) (accounts|contacts|opportunities)\\s*=\\s*\\[|faker|mockAccounts|mockContacts|mockOpportunities" \
  "$target/app/dashboard/sales" "$target/components/sales"; then
  echo "Dados mockados encontrados na superfície Sales." >&2
  exit 1
fi

echo "Sales zero-mock gate: PASS"
