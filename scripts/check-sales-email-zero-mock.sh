#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
front="$root/AB0-1-front"
back="$root/AB0-1-back"

# Providers must never synthesize a successful provider id.
if rg -n --glob '*.rb' \
  "(gmail|msgraph|ses)-#\{SecureRandom|provider_message_id.*SecureRandom|success:\s*true.*(fake|mock)" \
  "$back/app/services/sales"; then
  echo "Provider com identificador/sucesso sintético encontrado." >&2
  exit 1
fi

# Sales email UI cannot manufacture CRM records.
if rg -n --glob '*.{ts,tsx}' \
  "(const|let) (accounts|contacts|opportunities|threads)\s*=\s*\[|faker|mockAccounts|mockContacts|mockOpportunities|fake.*thread" \
  "$front/app/dashboard/sales" "$front/components/sales"; then
  echo "Dados mockados encontrados na superfície Sales." >&2
  exit 1
fi

# The provider stubs must remain explicitly unavailable until OAuth/API exists.
for provider in google.rb microsoft.rb; do
  rg -q "NOT_IMPLEMENTED|NotImplementedError" "$back/app/services/sales/messaging/providers/$provider" || {
    echo "Provider stub sem fail-closed: $provider" >&2
    exit 1
  }
done

echo "Sales email zero-mock gate: PASS"
