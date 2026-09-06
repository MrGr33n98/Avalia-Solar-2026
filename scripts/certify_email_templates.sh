#!/usr/bin/env bash
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
BACK="$ROOT/AB0-1-back"
FRONT="$ROOT/AB0-1-front"
REPORT_DIR="$ROOT/tmp/certification"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="$REPORT_DIR/email_templates_${TIMESTAMP}.log"

PASS=0
FAIL=0
BLOCKED=0

mkdir -p "$REPORT_DIR"
cd "$ROOT" || exit 1

exec > >(tee -a "$REPORT") 2>&1

section() {
  echo
  echo "======================================================================"
  echo "$1"
  echo "======================================================================"
}

pass() {
  echo "✅ PASS — $1"
  PASS=$((PASS + 1))
}

fail() {
  echo "❌ FAIL — $1"
  FAIL=$((FAIL + 1))
}

blocked() {
  echo "⚠️ BLOCKED — $1"
  BLOCKED=$((BLOCKED + 1))
}

run_gate() {
  local name="$1"
  shift

  section "$name"

  if "$@"; then
    pass "$name"
    return 0
  else
    local code=$?
    fail "$name (exit=$code)"
    return 0
  fi
}

section "AVALIA SOLAR — EMAIL TEMPLATES PRIME A+++ CERTIFICATION"

echo "Started : $(date)"
echo "Root    : $ROOT"
echo "Backend : $BACK"
echo "Frontend: $FRONT"
echo "Report  : $REPORT"

# ----------------------------------------------------------------------
# 0. PRE-FLIGHT
# ----------------------------------------------------------------------

section "0. PRE-FLIGHT"

if [[ -d "$ROOT/.git" ]]; then
  pass "Git repository detected"
else
  fail "Git repository not detected"
fi

if [[ -d "$BACK" ]]; then
  pass "Backend detected"
else
  fail "Backend not found"
fi

if [[ -d "$FRONT" ]]; then
  pass "Frontend detected"
else
  fail "Frontend not found"
fi

# ----------------------------------------------------------------------
# 1. GIT STATUS / DIFF
# ----------------------------------------------------------------------

section "1. GIT STATUS / DIFF"

echo "--- Branch ---"
git branch --show-current || true

echo
echo "--- HEAD ---"
git rev-parse HEAD || true

echo
echo "--- Status ---"
git status --short || true

echo
echo "--- Modified tracked files ---"
git diff --name-only || true

echo
echo "--- Untracked files ---"
git ls-files --others --exclude-standard || true

echo
echo "--- Diff stat ---"
git diff --stat || true

run_gate "Git diff check" git diff --check

# ----------------------------------------------------------------------
# 2. MIGRATION REVIEW
# ----------------------------------------------------------------------

MIGRATION="$BACK/db/migrate/20260906000001_enhance_sales_email_templates.rb"

section "2. MIGRATION REVIEW"

if [[ -f "$MIGRATION" ]]; then
  echo "--- Migration ---"
  cat "$MIGRATION"
  echo

  run_gate \
    "Migration Ruby syntax" \
    docker compose -f "$ROOT/docker-compose.test.yml" run --rm \
      -v "$BACK:/app" \
      backend \
      ruby -c "${MIGRATION#$BACK/}"

  if grep -Eq 'drop_table|remove_column|remove_reference|execute[[:space:]]+["'\'']DROP|TRUNCATE' "$MIGRATION"; then
    fail "Potential destructive migration operation detected"
  else
    pass "No obvious destructive migration operation detected"
  fi
else
  fail "Migration not found: $MIGRATION"
fi

# ----------------------------------------------------------------------
# 3. RUBY SYNTAX
# ----------------------------------------------------------------------

section "3. RUBY SYNTAX"

RUBY_FILES=(
  "$BACK/app/controllers/api/v1/sales/email_templates_controller.rb"
  "$BACK/app/models/sales/email_template.rb"
  "$BACK/app/services/sales/messaging/renderer.rb"
  "$BACK/app/services/sales/messaging/context_resolver.rb"
  "$BACK/app/services/sales/messaging/variable_catalog.rb"
  "$BACK/config/routes.rb"
  "$BACK/spec/requests/api/v1/sales/email_templates_spec.rb"
)

for file in "${RUBY_FILES[@]}"; do
  if [[ -f "$file" ]]; then
    run_gate \
      "ruby -c ${file#$ROOT/}" \
      docker compose -f "$ROOT/docker-compose.test.yml" run --rm \
        -v "$BACK:/app" \
        backend \
        ruby -c "${file#$BACK/}"
  else
    blocked "Missing file: ${file#$ROOT/}"
  fi
done

# ----------------------------------------------------------------------
# 4. TEST DATABASE
# ----------------------------------------------------------------------

section "4. TEST DATABASE / MIGRATIONS"

if [[ -f "$ROOT/docker-compose.test.yml" ]]; then
  if docker compose -f "$ROOT/docker-compose.test.yml" config >/dev/null 2>&1; then

    run_gate \
      "Rails test db:prepare" \
      docker compose -f "$ROOT/docker-compose.test.yml" run --rm \
        -v "$BACK:/app" \
        backend \
        bundle exec rails db:prepare RAILS_ENV=test

    run_gate \
      "Rails pending migrations check" \
      docker compose -f "$ROOT/docker-compose.test.yml" run --rm \
        -v "$BACK:/app" \
        backend \
        bundle exec rails db:abort_if_pending_migrations RAILS_ENV=test

  else
    blocked "docker-compose.test.yml could not be parsed"
  fi
else
  blocked "docker-compose.test.yml not found"
fi

# ----------------------------------------------------------------------
# 5. RSPEC — EMAIL TEMPLATES
# ----------------------------------------------------------------------

SPEC="$BACK/spec/requests/api/v1/sales/email_templates_spec.rb"

if [[ -f "$SPEC" ]]; then
  run_gate \
    "RSpec — Email Templates API" \
    docker compose -f "$ROOT/docker-compose.test.yml" run --rm \
      -v "$BACK:/app" \
      backend \
      bundle exec rspec \
        spec/requests/api/v1/sales/email_templates_spec.rb \
        --format documentation
else
  blocked "Email Templates request spec not found"
fi

# ----------------------------------------------------------------------
# 6. PREVIEW REGRESSION
# ----------------------------------------------------------------------

PREVIEW_SPEC="$BACK/spec/requests/api/v1/sales/email_templates_preview_spec.rb"

if [[ -f "$PREVIEW_SPEC" ]]; then
  run_gate \
    "RSpec — Preview regression context {}" \
    docker compose -f "$ROOT/docker-compose.test.yml" run --rm \
      -v "$BACK:/app" \
      backend \
      bundle exec rspec \
        spec/requests/api/v1/sales/email_templates_preview_spec.rb \
        --format documentation
else
  blocked "Existing preview regression spec not found"
fi

# ----------------------------------------------------------------------
# 7. RENDERER SPECS
# ----------------------------------------------------------------------

RENDERER_SPEC="$BACK/spec/services/sales/messaging/renderer_spec.rb"

if [[ -f "$RENDERER_SPEC" ]]; then
  run_gate \
    "RSpec — Messaging Renderer" \
    docker compose -f "$ROOT/docker-compose.test.yml" run --rm \
      -v "$BACK:/app" \
      backend \
      bundle exec rspec \
        spec/services/sales/messaging/renderer_spec.rb \
        --format documentation
else
  blocked "Renderer spec not found"
fi

# ----------------------------------------------------------------------
# 8. ROUTES
# ----------------------------------------------------------------------

run_gate \
  "Rails routes — email_templates" \
  docker compose -f "$ROOT/docker-compose.test.yml" run --rm \
    -v "$BACK:/app" \
    backend \
    bundle exec rails routes -g email_template RAILS_ENV=test

# ----------------------------------------------------------------------
# 9. FRONTEND — TYPECHECK
# ----------------------------------------------------------------------

section "9. FRONTEND"

if [[ -d "$FRONT" ]]; then
  cd "$FRONT" || exit 1

  run_gate "TypeScript typecheck" npm run typecheck

  # --------------------------------------------------------------------
  # 10. ESLINT
  # --------------------------------------------------------------------

  run_gate \
    "ESLint — Email Templates" \
    npx eslint \
      components/sales/campaigns/templates \
      components/sales/campaigns/TemplateManager.tsx \
      lib/api/sales/emailTemplates.ts

  # --------------------------------------------------------------------
  # 11. JEST
  # --------------------------------------------------------------------

  section "11. JEST"

  TEMPLATE_TESTS="$(find . \
    \( -path './node_modules' -o -path './.next' \) -prune \
    -o \
    \( -iname '*template*.test.ts' \
       -o -iname '*template*.test.tsx' \
       -o -iname '*template*.spec.ts' \
       -o -iname '*template*.spec.tsx' \) \
    -print 2>/dev/null || true)"

  if [[ -n "$TEMPLATE_TESTS" ]]; then
    echo "$TEMPLATE_TESTS"

    run_gate \
      "Jest — Templates" \
      npm test -- --runInBand --testPathPatterns=template
  else
    blocked "No frontend Template Jest/RTL tests found"
  fi

  # --------------------------------------------------------------------
  # 12. PRODUCTION BUILD
  # --------------------------------------------------------------------

  run_gate "Next.js production build" npm run build

  cd "$ROOT" || exit 1
else
  fail "Frontend directory unavailable"
fi

# ----------------------------------------------------------------------
# 13. CAMPAIGN WIZARD INTEGRATION
# ----------------------------------------------------------------------

section "13. CAMPAIGN WIZARD"

CAMPAIGN_WIZARD="$FRONT/components/sales/campaigns/CampaignWizardModal.tsx"

if [[ -f "$CAMPAIGN_WIZARD" ]]; then
  if grep -n "email_template_id" "$CAMPAIGN_WIZARD"; then
    pass "Campaign Wizard preserves email_template_id"
  else
    fail "Campaign Wizard does not reference email_template_id"
  fi
else
  blocked "CampaignWizardModal.tsx not found"
fi

# ----------------------------------------------------------------------
# 14. BACKEND CONTRACT CHECK
# ----------------------------------------------------------------------

section "14. API CONTRACT STATIC CHECK"

CONTROLLER="$BACK/app/controllers/api/v1/sales/email_templates_controller.rb"

for action in index show create update destroy preview stats variables categories duplicate archive test_send; do
  if grep -Eq "^[[:space:]]*def[[:space:]]+$action([[:space:]]|$)" "$CONTROLLER"; then
    pass "Controller action: $action"
  else
    fail "Missing controller action: $action"
  fi
done

# ----------------------------------------------------------------------
# 15. SECURITY STATIC CHECK
# ----------------------------------------------------------------------

section "15. SECURITY STATIC CHECK"

SECURITY_PATHS=(
  "$BACK/app/controllers/api/v1/sales/email_templates_controller.rb"
  "$BACK/app/models/sales/email_template.rb"
  "$BACK/app/services/sales/messaging"
  "$FRONT/components/sales/campaigns/templates"
  "$FRONT/lib/api/sales/emailTemplates.ts"
)

DANGEROUS='to_unsafe_h|User\.first|Company\.first|@ts-ignore|@ts-nocheck|eslint-disable'

if grep -R -n -E "$DANGEROUS" "${SECURITY_PATHS[@]}" 2>/dev/null; then
  fail "Forbidden/suspicious pattern detected"
else
  pass "No basic forbidden patterns detected"
fi

# ----------------------------------------------------------------------
# 16. REQUIRED FRONTEND STRUCTURE
# ----------------------------------------------------------------------

section "16. FRONTEND STRUCTURE"

REQUIRED_FRONT_FILES=(
  "$FRONT/components/sales/campaigns/templates/TemplatesWorkspace.tsx"
  "$FRONT/components/sales/campaigns/templates/types.ts"
  "$FRONT/components/sales/campaigns/templates/library/TemplateHeader.tsx"
  "$FRONT/components/sales/campaigns/templates/library/TemplateStats.tsx"
  "$FRONT/components/sales/campaigns/templates/library/TemplateTabs.tsx"
  "$FRONT/components/sales/campaigns/templates/library/TemplateCard.tsx"
  "$FRONT/components/sales/campaigns/templates/library/TemplateFilters.tsx"
  "$FRONT/components/sales/campaigns/templates/library/TemplateLibrary.tsx"
  "$FRONT/components/sales/campaigns/templates/editor/TemplateEditor.tsx"
  "$FRONT/components/sales/campaigns/templates/editor/TemplateMetadataForm.tsx"
  "$FRONT/components/sales/campaigns/templates/editor/TemplateBlockPalette.tsx"
  "$FRONT/components/sales/campaigns/templates/editor/TemplateComposer.tsx"
  "$FRONT/components/sales/campaigns/templates/preview/TemplatePreview.tsx"
  "$FRONT/components/sales/campaigns/templates/preview/TemplateDeviceToggle.tsx"
  "$FRONT/components/sales/campaigns/templates/variables/TemplateVariablePanel.tsx"
  "$FRONT/components/sales/campaigns/templates/dialogs/TemplateTestEmailDialog.tsx"
  "$FRONT/components/sales/campaigns/templates/dialogs/TemplateDeleteDialog.tsx"
  "$FRONT/lib/api/sales/emailTemplates.ts"
)

for file in "${REQUIRED_FRONT_FILES[@]}"; do
  if [[ -f "$file" ]]; then
    pass "Exists: ${file#$ROOT/}"
  else
    fail "Missing: ${file#$ROOT/}"
  fi
done

# ----------------------------------------------------------------------
# 17. BODY_JSON BLOCKS
# ----------------------------------------------------------------------

section "17. STRUCTURED EDITOR BLOCKS"

for block in heading text image button divider spacer html; do
  if grep -R -i -q "$block" \
      "$FRONT/components/sales/campaigns/templates/editor" \
      "$BACK/app/services/sales/messaging/renderer.rb" 2>/dev/null; then
    pass "Structured block found: $block"
  else
    fail "Structured block missing: $block"
  fi
done

# ----------------------------------------------------------------------
# 18. FINAL DIFF
# ----------------------------------------------------------------------

section "18. FINAL WORKTREE"

cd "$ROOT" || exit 1

echo "--- git status --short ---"
git status --short || true

echo
echo "--- git diff --stat ---"
git diff --stat || true

echo
echo "--- git diff --check ---"

if git diff --check; then
  pass "Final git diff --check"
else
  fail "Final git diff --check"
fi

# ----------------------------------------------------------------------
# 19. RUNTIME / PRODUCTION GATES
# ----------------------------------------------------------------------

section "19. RUNTIME CERTIFICATION"

echo "⚠️ NOT CERTIFIED — Authenticated API smoke"
echo "⚠️ NOT CERTIFIED — Browser/UI smoke"
echo "⚠️ NOT CERTIFIED — Campaign Wizard E2E"
echo "⚠️ NOT CERTIFIED — Real test-send / SES"
echo "⚠️ NOT CERTIFIED — Production migration"
echo "⚠️ NOT CERTIFIED — Production deployment"
echo "⚠️ NOT CERTIFIED — Production smoke"
echo
echo "Este script NÃO modifica production."
echo "Este script NÃO executa migration em production."
echo "Este script NÃO faz git add/commit/push."
echo "Este script NÃO executa deploy."

# ----------------------------------------------------------------------
# 20. RESULT
# ----------------------------------------------------------------------

section "FINAL RESULT"

echo "PASS    : $PASS"
echo "FAIL    : $FAIL"
echo "BLOCKED : $BLOCKED"
echo
echo "Report:"
echo "$REPORT"
echo

if [[ "$FAIL" -eq 0 && "$BLOCKED" -eq 0 ]]; then
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║ AUTOMATED CERTIFICATION: PASS                           ║"
  echo "║ Runtime/Production certification is still required.     ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  exit 0
else
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║ AUTOMATED CERTIFICATION: NOT READY                      ║"
  echo "║ Fix FAIL/BLOCKED items before commit/deploy.            ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  exit 1
fi
