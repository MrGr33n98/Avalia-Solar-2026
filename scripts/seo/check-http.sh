#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
ACTIVE_SLUG="${2:-monitoramento-operacao-manutencao}"
MISSING_SLUG="categoria-inexistente-check-http-404"

echo "==> [CDSI-020] Verificando semântica HTTP em ${BASE_URL}"

status_active="$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}/categories/${ACTIVE_SLUG}")"
echo "  • GET /categories/${ACTIVE_SLUG} -> HTTP ${status_active}"
if [[ "${status_active}" != "200" ]]; then
  echo "❌ Falha: esperado HTTP 200 para categoria ativa, recebido ${status_active}"
  exit 1
fi

status_missing="$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}/categories/${MISSING_SLUG}")"
echo "  • GET /categories/${MISSING_SLUG} -> HTTP ${status_missing}"
if [[ "${status_missing}" != "404" ]]; then
  echo "❌ Falha: esperado HTTP 404 para categoria ausente (anti-soft-404), recebido ${status_missing}"
  exit 1
fi

for sub in solutions compare matching; do
  status_sub="$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}/categories/${MISSING_SLUG}/${sub}")"
  echo "  • GET /categories/${MISSING_SLUG}/${sub} -> HTTP ${status_sub}"
  if [[ "${status_sub}" != "404" ]]; then
    echo "❌ Falha: esperado HTTP 404 para sub-rota ${sub} de categoria ausente, recebido ${status_sub}"
    exit 1
  fi
done

echo "✅ [CDSI-020] Todos os checks HTTP passaram."

