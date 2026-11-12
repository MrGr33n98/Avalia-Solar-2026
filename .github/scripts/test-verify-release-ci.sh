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
  *"ci-web-backend.yml/runs?head_sha="*)
    if [ "$SCENARIO" = all_green ] || [ "$SCENARIO" = frontend_only_green ]; then
      conclusion=success
    else
      conclusion=failure
    fi
    jq -n --arg c "$conclusion" --arg sha "$RELEASE_SHA" '{workflow_runs: [{id: 42, run_number: 42, head_sha: $sha, head_branch: "main", event: "push", status: "completed", conclusion: $c}]}'
    ;;
  *"actions/runs/84/jobs"*)
    if [ "$SCENARIO" = baseline_not_rspec ]; then
      conclusion=success
    else
      conclusion=failure
    fi
    jq -n --arg c "$conclusion" '{jobs:[{name:"Backend Unit Tests (RSpec)",status:"completed",conclusion:$c}]}'
    ;;
  *"actions/runs/42/jobs"*)
    jq -n --arg scenario "$SCENARIO" '
      {jobs: [
        {name: "Backend Unit Tests (RSpec)", status: "completed", conclusion: "failure"},
        {name: "Code Quality & Security Scan", status: "completed", conclusion: (if $scenario == "security_failed" then "failure" else "success" end)},
        {name: "Ranking Performance Frontend Contract", status: "completed", conclusion: "success"},
        {name: "Ranking Performance Contract", status: "completed", conclusion: (if $scenario == "job_cancelled" then "cancelled" else "success" end)},
        {name: "Category Discovery & SEO Contract Gate", status: "completed", conclusion: "success"},
        {name: "E2E Playwright Tests", status: "completed", conclusion: "skipped"}
      ]}'
    ;;
  *"cd-production.yml/runs?branch="*)
    if [ "$SCENARIO" = no_baseline ]; then
      printf '%s\n' '{"workflow_runs":[]}'
    else
      printf '%s\n' '{"workflow_runs":[{"head_sha":"sha-old","head_branch":"main","event":"push","conclusion":"success","created_at":"2026-11-10T03:00:00Z"}]}'
    fi
    ;;
  *"cd-frontend-production.yml/runs?branch="*)
    printf '%s\n' '{"workflow_runs":[]}'
    ;;
  *"ci-web-backend.yml/runs?branch="*)
    if [ "$SCENARIO" = baseline_green ]; then
      conclusion=success
    else
      conclusion=failure
    fi
    jq -n --arg c "$conclusion" --arg sha "$COMPATIBILITY_BASE_SHA" '{workflow_runs:[{id:84,run_number:1,head_sha:$sha,event:"push",status:"completed",conclusion:$c}]}'
    ;;
  *"compare/"*"...$RELEASE_SHA"*)
    case "$SCENARIO" in
      backend_changed) path="AB0-1-back/app/models/company.rb" ;;
      schema_reconciliation) path="AB0-1-back/db/migrate/20261110100000_reconcile_historical_schema_snapshot.rb" ;;
      unsafe_workflow) path=".github/workflows/other.yml" ;;
      *) path="AB0-1-front/components/CompanyRegistrationTicker.tsx" ;;
    esac
    jq -n --arg path "$path" '{status:"ahead", ahead_by:2, files:[{filename:$path}]}'
    ;;
  *) echo "Unexpected API endpoint: $2" >&2; exit 2 ;;
esac
MOCK
chmod +x "$TMP/bin/gh"

export PATH="$TMP/bin:$PATH"
export GITHUB_REPOSITORY="MrGr33n98/Avalia-Solar-2026"
export RELEASE_SHA="8fb8abede6b004bfad3a524c7f3e7a551204eec0"
export RELEASE_BASE_SHA="5cb4911cfc7f6379c880fc9477d25792b9dbb4e0"
export COMPATIBILITY_BASE_SHA="5cb4911cfc7f6379c880fc9477d25792b9dbb4e0"

assert_gate() {
  local scenario="$1" expectation="$2" scope="${3:-full}"
  export SCENARIO="$scenario"
  export RELEASE_SCOPE="$scope"
  export COMPATIBILITY_BASE_SHA="5cb4911cfc7f6379c880fc9477d25792b9dbb4e0"
  if [ "$scenario" = no_runtime_base ]; then
    export RELEASE_BASE_SHA=""
  elif [ "$scenario" = invalid_runtime_sha ]; then
    export RELEASE_BASE_SHA="not-a-full-sha"
  elif [ "$scenario" = no_backend_base ]; then
    export COMPATIBILITY_BASE_SHA=""
  else
    export RELEASE_BASE_SHA="5cb4911cfc7f6379c880fc9477d25792b9dbb4e0"
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
assert_gate frontend_only_legacy block
assert_gate frontend_only_legacy pass frontend_only
assert_gate no_runtime_base block frontend_only
assert_gate invalid_runtime_sha block frontend_only
assert_gate no_backend_base block frontend_only
assert_gate schema_reconciliation block frontend_only
assert_gate schema_reconciliation block full
assert_gate frontend_only_green pass frontend_only
assert_gate backend_changed block
assert_gate backend_changed block frontend_only
assert_gate unsafe_workflow block
assert_gate security_failed block
assert_gate job_cancelled block
assert_gate no_baseline block
assert_gate baseline_green block
assert_gate baseline_not_rspec block
assert_gate frontend_only_legacy block invalid
