#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FRONT_DIR="$ROOT_DIR/AB0-1-front"
BACK_DIR="$ROOT_DIR/AB0-1-back"

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

section() {
  echo
  echo "============================================================"
  echo "$1"
  echo "============================================================"
}

pass() {
  echo "✅ PASS: $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo "❌ FAIL: $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

skip() {
  echo "⚠️  SKIP: $1"
  SKIP_COUNT=$((SKIP_COUNT + 1))
}

run_step() {
  local label="$1"
  shift

  echo
  echo "▶ $label"

  if "$@"; then
    pass "$label"
    return 0
  else
    fail "$label"
    return 1
  fi
}

run_frontend_script() {
  local script_name="$1"
  local label="$2"

  if npm run | grep -qE "^[[:space:]]+$script_name$|^[[:space:]]+$script_name[[:space:]]"; then
    run_step "$label" npm run "$script_name"
  else
    skip "$label — script '$script_name' não existe em package.json"
  fi
}

section "0. PRE-FLIGHT"

echo "Root:     $ROOT_DIR"
echo "Frontend: $FRONT_DIR"
echo "Backend:  $BACK_DIR"

if [ ! -d "$FRONT_DIR" ]; then
  echo "❌ Diretório frontend não encontrado: $FRONT_DIR"
  exit 1
fi

if [ ! -d "$BACK_DIR" ]; then
  echo "❌ Diretório backend não encontrado: $BACK_DIR"
  exit 1
fi

section "1. GIT STATUS"

cd "$ROOT_DIR"

git status --short || true
echo
git diff --stat || true

section "2. FRONTEND"

cd "$FRONT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  fail "npm disponível"
else
  pass "npm disponível"

  if [ ! -d node_modules ]; then
    echo
    echo "▶ Instalando dependências frontend..."
    if [ -f package-lock.json ]; then
      run_step "npm ci" npm ci
    else
      run_step "npm install" npm install
    fi
  fi

  run_frontend_script "typecheck" "Frontend typecheck"
  run_step "Frontend lint" npx eslint app/dashboard/components/LeadsOpportunities.tsx components/QuickLeadModal.tsx __tests__/components/LeadsOpportunities.test.tsx

  if npm run | grep -qE "^[[:space:]]+test$|^[[:space:]]+test[[:space:]]"; then
    run_step "Frontend tests" npm test -- --runInBand || true
  else
    skip "Frontend tests — script 'test' não existe"
  fi

  run_frontend_script "build" "Frontend production build"
fi

section "3. BACKEND RUNTIME"

cd "$ROOT_DIR"

USE_DOCKER=0
BACKEND_CMD=()

if command -v bundle >/dev/null 2>&1 && command -v ruby >/dev/null 2>&1; then
  echo "Ruby/Bundler encontrados no host."
  BACKEND_CMD=()
elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  echo "Ruby/Bundler não disponíveis no host. Usando Docker Compose."
  USE_DOCKER=1
else
  fail "Runtime Rails disponível"
  echo
  echo "Nem Ruby/Bundler nem Docker Compose foram encontrados."
  echo "Os checks backend não poderão ser executados."
fi

rails_exec() {
  if [ "$USE_DOCKER" -eq 1 ]; then
    docker compose run --rm --no-deps backend bash -lc "$*"
  else
    cd "$BACK_DIR"
    bash -lc "$*"
  fi
}

if [ "$FAIL_COUNT" -eq 0 ] || [ "$USE_DOCKER" -eq 1 ] || command -v bundle >/dev/null 2>&1; then
  section "4. BACKEND BOOT / ZEITWERK"

  run_step \
    "Rails Zeitwerk check" \
    rails_exec "bundle exec rails zeitwerk:check"

  run_step \
    "Rails boot" \
    rails_exec "bundle exec rails runner 'puts \"BOOT_OK\"'"

  section "5. MIGRATION MVP"

  run_step \
    "db:migrate" \
    rails_exec "bundle exec rails db:migrate"

  run_step \
    "db:migrate:status" \
    rails_exec "bundle exec rails db:migrate:status"

  echo
  echo "⚠️  Rollback automático NÃO será executado por padrão."
  echo "Use RUN_ROLLBACK_CHECK=1 para testar rollback em ambiente seguro."

  if [ "${RUN_ROLLBACK_CHECK:-0}" = "1" ]; then
    section "5.1 ROLLBACK CHECK"

    run_step \
      "db:rollback STEP=1" \
      rails_exec "bundle exec rails db:rollback STEP=1"

    run_step \
      "db:migrate after rollback" \
      rails_exec "bundle exec rails db:migrate"
  else
    skip "Rollback check — defina RUN_ROLLBACK_CHECK=1 em ambiente seguro"
  fi

  section "6. BACKEND SPECS"

  SPECS=(
    "spec/models/lead_spec.rb"
    "spec/models/lead_distribution_spec.rb"
    "spec/jobs/lead_routing_job_spec.rb"
    "spec/jobs/lead_distribution_expiration_job_spec.rb"
    "spec/services/leads/lead_matching_service_spec.rb"
    "spec/services/lead_distribution_service_spec.rb"
    "spec/requests/api/v1/leads_spec.rb"
    "spec/requests/api/v1/lead_distributions_spec.rb"
  )

  EXISTING_SPECS=()

  for spec in "${SPECS[@]}"; do
    if [ -f "$BACK_DIR/$spec" ]; then
      EXISTING_SPECS+=("$spec")
    else
      skip "RSpec $spec — arquivo não existe"
    fi
  done

  if [ "${#EXISTING_SPECS[@]}" -gt 0 ]; then
    SPEC_LIST="${EXISTING_SPECS[*]}"

    run_step \
      "RSpec Lead Marketplace" \
      rails_exec "bundle exec rspec $SPEC_LIST"
  else
    skip "RSpec Lead Marketplace — nenhum spec esperado encontrado"
  fi
fi

section "7. MIGRATION STRUCTURE CHECK"

MIGRATION_FILE="$BACK_DIR/db/migrate/20260819000002_add_marketplace_lifecycle_to_lead_distributions.rb"

if [ -f "$MIGRATION_FILE" ]; then
  pass "Migration 20260819000002 encontrada"

  if grep -q "check_constraint_exists?(" "$MIGRATION_FILE"; then
    echo "⚠️  Atenção: ainda existe chamada direta a check_constraint_exists?"
  fi

  if grep -q "connection.check_constraints" "$MIGRATION_FILE" ||
     grep -q "connection.check_constraint_exists?" "$MIGRATION_FILE"; then
    pass "Migration usa abordagem de constraint via connection"
  else
    echo "⚠️  Não consegui confirmar helper Rails 7-safe de constraint por inspeção."
  fi

  if grep -q "index_lead_distributions_on_lead_and_company" "$MIGRATION_FILE"; then
    pass "Unique index lead_id/company_id presente na migration"
  else
    fail "Unique index lead_id/company_id não encontrado"
  fi
else
  fail "Migration 20260819000002 não encontrada"
fi

section "8. ROUTING SAFETY STATIC CHECK"

LEADS_CONTROLLER="$BACK_DIR/app/controllers/api/v1/leads_controller.rb"
ROUTING_JOB="$BACK_DIR/app/jobs/lead_routing_job.rb"
DISTRIBUTION_MODEL="$BACK_DIR/app/models/lead_distribution.rb"

if [ -f "$LEADS_CONTROLLER" ]; then
  ENQUEUE_COUNT="$(
    grep -c "LeadRoutingJob.perform_later" "$LEADS_CONTROLLER" || true
  )"

  echo "LeadRoutingJob.perform_later encontrados em LeadsController: $ENQUEUE_COUNT"

  if [ "$ENQUEUE_COUNT" -le 1 ]; then
    pass "Routing enqueue aparentemente centralizado no LeadsController"
  else
    echo "⚠️  Existem múltiplos enqueue points. Validar se são branches mutuamente exclusivos."
  fi
fi

if [ -f "$DISTRIBUTION_MODEL" ]; then
  if grep -q "_suffix: true" "$DISTRIBUTION_MODEL"; then
    echo "Enum status usa _suffix: true."

    if grep -Eq "\b(sent|viewed|accepted|rejected|expired|converted)\?" "$DISTRIBUTION_MODEL"; then
      fail "Predicates sem suffix ainda encontrados em LeadDistribution"
    else
      pass "Predicates de LeadDistribution compatíveis com suffix"
    fi
  fi
fi

section "9. SUMMARY"

echo
echo "PASS: $PASS_COUNT"
echo "FAIL: $FAIL_COUNT"
echo "SKIP: $SKIP_COUNT"
echo

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "❌ MVP LEAD MARKETPLACE — FAIL"
  echo
  echo "Corrija os itens FAIL e rode novamente:"
  echo
  echo "  ./scripts/validate_lead_marketplace_mvp.sh"
  exit 1
else
  echo "✅ MVP LEAD MARKETPLACE — VALIDATION PASS"
  echo
  echo "Próximo passo: push e confirmar GitHub Actions + deploy."
fi