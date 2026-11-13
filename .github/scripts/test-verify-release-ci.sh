#!/usr/bin/env bash
# Offline, deterministic contract tests for the production CI gate.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/bin"

cat > "$TMP/bin/gh" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
[ "$1" = api ] || exit 2
case "$2" in
  *"actions/runs/42"|*"actions/runs/43")
    if [ "$2" = "repos/$GITHUB_REPOSITORY/actions/runs/43" ]; then
      jq -n '{id:43,head_sha:"sha-other",head_branch:"main",event:"push",status:"completed",conclusion:"success"}'
    else
      jq -n '{id:42,head_sha:"sha-test",head_branch:"main",event:"push",status:"completed",conclusion:"success"}'
    fi
    ;;
  *"ci-web-backend.yml/runs?head_sha="*)
    if [ "$SCENARIO" = ci_not_started ]; then
      printf '%s\n' '{"workflow_runs":[]}'
      exit 0
    fi
    if [ "$SCENARIO" = all_green ] || [ "$SCENARIO" = frontend_only_green ] || [ "$SCENARIO" = workflow_run_baseline ] || [ "$SCENARIO" = backend_only_green ] || [ "$SCENARIO" = backend_scope_unsafe ] || [ "$SCENARIO" = backend_api_contract ]; then
      conclusion=success
    else
      conclusion=failure
    fi
    if [ "$SCENARIO" = ci_pending ]; then
      status=in_progress
    else
      status=completed
    fi
    jq -n --arg c "$conclusion" --arg s "$status" '{workflow_runs: [{id: 42, run_number: 42, head_sha: "sha-test", head_branch: "main", event: "push", status: $s, conclusion: $c}]}'
    ;;
  *"actions/runs/84/jobs"*)
    if [ "$SCENARIO" = baseline_not_rspec ]; then
      conclusion=success
    else
      conclusion=failure
    fi
    jq -n --arg c "$conclusion" '{jobs:[{name:"Backend Unit Tests (RSpec)",status:"completed",conclusion:$c}]}'
    ;;
  *"actions/runs/900/jobs"*)
    jq -n '{jobs:[{name:"deploy",status:"completed",conclusion:"skipped"}]}'
    ;;
  *"actions/runs/899/jobs"*)
    jq -n '{jobs:[{name:"deploy",status:"completed",conclusion:"success"}]}'
    ;;
  *"actions/runs/950/jobs"*)
    jq -n '{jobs:[{name:"Deploy frontend only",status:"completed",conclusion:"success"}]}'
    ;;
  *"actions/runs/42/jobs"*)
    jq -n --arg scenario "$SCENARIO" '
      {jobs: [
        {name: "Backend Unit Tests (RSpec)", status: "completed", conclusion: "failure"},
        {name: "Code Quality & Security Scan", status: "completed", conclusion: (if $scenario == "security_failed" then "failure" else "success" end)},
        {name: "Ranking Performance Frontend Contract", status: "completed", conclusion: "success"},
        {name: "Ranking Performance Contract", status: "completed", conclusion: (if $scenario == "job_cancelled" then "cancelled" else "skipped" end)},
        {name: "Category Discovery & SEO Contract Gate", status: "completed", conclusion: "success"},
        {name: "E2E Playwright Tests", status: "completed", conclusion: "skipped"}
      ]}'
    ;;
  *"cd-production.yml/runs?branch="*)
    if [ "$SCENARIO" = no_baseline ]; then
      printf '%s\n' '{"workflow_runs":[]}'
    elif [ "$SCENARIO" = workflow_run_baseline ]; then
      jq -n '{workflow_runs:[
        {id:900,head_sha:"sha-no-deploy",head_branch:"main",event:"workflow_run",conclusion:"success",created_at:"2026-11-11T05:00:00Z"},
        {id:899,head_sha:"sha-old",head_branch:"main",event:"workflow_run",conclusion:"success",created_at:"2026-11-10T03:00:00Z"}
      ]}'
    elif [ "$SCENARIO" = backend_only_green ] || [ "$SCENARIO" = backend_api_contract ] || [ "$SCENARIO" = backend_scope_unsafe ]; then
      jq -n '{workflow_runs:[{id:899,head_sha:"sha-old",head_branch:"main",event:"workflow_run",conclusion:"success",created_at:"2026-11-10T03:00:00Z"}]}'
    else
      printf '%s\n' '{"workflow_runs":[{"head_sha":"sha-old","head_branch":"main","event":"push","conclusion":"success","created_at":"2026-11-10T03:00:00Z"}]}'
    fi
    ;;
  *"cd-frontend-production.yml/runs?branch="*)
    if [ "$SCENARIO" = workflow_run_baseline ] || [ "$SCENARIO" = backend_only_green ] || [ "$SCENARIO" = backend_api_contract ] || [ "$SCENARIO" = backend_scope_unsafe ]; then
      jq -n '{workflow_runs:[{id:950,head_sha:"sha-front-old",head_branch:"main",event:"workflow_run",conclusion:"success",created_at:"2026-11-11T03:00:00Z"}]}'
    else
      printf '%s\n' '{"workflow_runs":[]}'
    fi
    ;;
  *"ci-web-backend.yml/runs?branch="*)
    if [ "$SCENARIO" = baseline_green ]; then
      conclusion=success
    else
      conclusion=failure
    fi
    jq -n --arg c "$conclusion" '{workflow_runs:[{id:84,run_number:1,head_sha:"sha-old",event:"push",status:"completed",conclusion:$c}]}'
    ;;
  *"compare/"*"...sha-test"*)
    case "$SCENARIO" in
      backend_changed) path="AB0-1-back/app/models/company.rb" ;;
      backend_only_green) path="AB0-1-back/app/models/company.rb" ;;
      backend_scope_unsafe) path="AB0-1-back/app/models/company.rb" ;;
      backend_api_contract) path="AB0-1-back/app/controllers/api/v1/companies_controller.rb" ;;
      schema_reconciliation) path="AB0-1-back/db/migrate/20261110100000_reconcile_historical_schema_snapshot.rb" ;;
      unsafe_workflow) path=".github/workflows/other.yml" ;;
      *) path="AB0-1-front/components/CompanyRegistrationTicker.tsx" ;;
    esac
    if [ "$SCENARIO" = schema_reconciliation ]; then
      extra_path="AB0-1-front/components/CompanyRegistrationTicker.tsx"
    elif [ "$SCENARIO" = backend_scope_unsafe ]; then
      extra_path="AB0-1-front/app/page.tsx"
    elif [ "$SCENARIO" = frontend_only_legacy ]; then
      extra_path=".gitignore"
    else
      extra_path=""
    fi
    jq -n --arg path "$path" --arg extra_path "$extra_path" --arg scenario "$SCENARIO" '{
      status:"ahead", ahead_by:2, files:[
        {filename: $path},
        (if $extra_path == "" then empty else {filename:$extra_path} end),
        (if $scenario == "backend_only_green" or $scenario == "backend_scope_unsafe" or $scenario == "backend_api_contract" then empty else {filename: ".github/workflows/cd-production.yml"} end),
        (if $scenario == "backend_only_green" or $scenario == "backend_scope_unsafe" or $scenario == "backend_api_contract" then empty else {filename: ".github/scripts/verify-release-ci.sh"} end),
        (if $scenario == "backend_only_green" or $scenario == "backend_scope_unsafe" or $scenario == "backend_api_contract" then empty else {filename: ".github/workflows/cd-frontend-production.yml"} end)
      ]
    }'
    ;;
  *) echo "Unexpected API endpoint: $2" >&2; exit 2 ;;
esac
MOCK
chmod +x "$TMP/bin/gh"

export PATH="$TMP/bin:$PATH"
export GITHUB_REPOSITORY="MrGr33n98/Avalia-Solar-2026"
export RELEASE_SHA="sha-test"

assert_gate() {
  local scenario="$1" expectation="$2" scope="${3:-full}"
  export SCENARIO="$scenario"
  export RELEASE_SCOPE="$scope"
  if [ "$scenario" = ci_run_id_match ]; then
    export CI_RUN_ID=42
  elif [ "$scenario" = ci_run_id_mismatch ]; then
    export CI_RUN_ID=43
  else
    unset CI_RUN_ID || true
  fi
  if bash "$ROOT/.github/scripts/verify-release-ci.sh" >"$TMP/log" 2>&1; then
    outcome=pass
  else
    outcome=block
  fi
  if [ "$outcome" != "$expectation" ]; then
    cat "$TMP/log"
    echo "FAIL: $scenario expected=$expectation observed=$outcome" >&2
    exit 1
  fi
  echo "PASS: $scenario -> $outcome"
}

assert_gate all_green pass
assert_gate ci_run_id_match pass
assert_gate ci_run_id_mismatch block
assert_gate ci_not_started block
assert_gate ci_pending block
assert_gate frontend_only_legacy block
assert_gate frontend_only_legacy pass frontend_only
assert_gate schema_reconciliation block frontend_only
assert_gate schema_reconciliation block full
assert_gate frontend_only_green pass frontend_only
assert_gate workflow_run_baseline pass frontend_only
assert_gate backend_only_green pass backend_only
assert_gate backend_scope_unsafe block backend_only
assert_gate backend_api_contract block backend_only
assert_gate frontend_only_legacy block backend_only
assert_gate backend_changed block
assert_gate backend_changed block frontend_only
assert_gate unsafe_workflow block
assert_gate security_failed block
assert_gate job_cancelled block
assert_gate no_baseline block
assert_gate baseline_green block
assert_gate baseline_not_rspec block
assert_gate frontend_only_legacy block invalid
