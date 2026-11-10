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
    if [ "$SCENARIO" = all_green ]; then
      conclusion=success
    else
      conclusion=failure
    fi
    jq -n --arg c "$conclusion" '{workflow_runs: [{id: 42, run_number: 42, head_sha: "sha-test", head_branch: "main", event: "push", status: "completed", conclusion: $c}]}'
    ;;
  *"actions/runs/42/jobs"*)
    jq -n --arg scenario "$SCENARIO" '
      {jobs: [
        {name: "Backend Unit Tests (RSpec)", status: "completed", conclusion: "failure"},
        {name: "Code Quality & Security Scan", status: "completed", conclusion: (if $scenario == "security_failed" then "failure" else "success" end)},
        {name: "Ranking Performance Frontend Contract", status: "completed", conclusion: "success"},
        {name: "Ranking Performance Contract", status: "completed", conclusion: "success"},
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
  *"ci-web-backend.yml/runs?branch="*)
    if [ "$SCENARIO" = baseline_green ]; then
      conclusion=success
    else
      conclusion=failure
    fi
    jq -n --arg c "$conclusion" '{workflow_runs:[{head_sha:"sha-old",event:"push",conclusion:$c}]}'
    ;;
  *"compare/sha-old...sha-test"*)
    case "$SCENARIO" in
      backend_changed) path="AB0-1-back/app/models/company.rb" ;;
      unsafe_workflow) path=".github/workflows/other.yml" ;;
      *) path="AB0-1-front/components/CompanyRegistrationTicker.tsx" ;;
    esac
    jq -n --arg path "$path" '{
      status:"ahead", ahead_by:2, files:[
        {filename: $path},
        {filename: ".github/workflows/cd-production.yml"},
        {filename: ".github/scripts/verify-release-ci.sh"}
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
  local scenario="$1" expectation="$2"
  export SCENARIO="$scenario"
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
assert_gate frontend_only_legacy pass
assert_gate backend_changed block
assert_gate unsafe_workflow block
assert_gate security_failed block
assert_gate no_baseline block
assert_gate baseline_green block
