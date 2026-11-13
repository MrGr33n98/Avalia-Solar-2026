#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
gate="$ROOT/.github/scripts/verify-smart-ci-gate.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
check() {
  local name="$1" expected="$2"
  shift 2
  local observed="block"
  if env \
    FAST_RESULT=success BACKEND_RESULT=success \
    RANKING_FRONTEND_RESULT=success CATEGORY_RESULT=success \
    RANKING_GATE_RESULT=skipped IMPACT_RESULT=success \
    E2E_RESULT=success CSS_CANARY_ELIGIBLE=false \
    SMART_CI_ENABLED=false GITHUB_EVENT_NAME=pull_request \
    "$@" bash "$gate" >"$tmp/result" 2>&1; then
    observed="allow"
  fi
  if [[ "$observed" != "$expected" ]]; then
    echo "FAIL: $name expected=$expected got=$observed" >&2
    cat "$tmp/result" >&2
    exit 1
  fi
  echo "PASS: $name => $observed"
}
check "normal green" allow
check "css-only canary enabled" allow E2E_RESULT=skipped CSS_CANARY_ELIGIBLE=true SMART_CI_ENABLED=true
check "disabled canary never skips" block E2E_RESULT=skipped CSS_CANARY_ELIGIBLE=true
check "non-css never skips" block E2E_RESULT=skipped CSS_CANARY_ELIGIBLE=false SMART_CI_ENABLED=true
check "main push never skips" block E2E_RESULT=skipped CSS_CANARY_ELIGIBLE=true SMART_CI_ENABLED=true GITHUB_EVENT_NAME=push
check "manual never skips" block E2E_RESULT=skipped CSS_CANARY_ELIGIBLE=true SMART_CI_ENABLED=true GITHUB_EVENT_NAME=workflow_dispatch
check "schedule never skips" block E2E_RESULT=skipped CSS_CANARY_ELIGIBLE=true SMART_CI_ENABLED=true GITHUB_EVENT_NAME=schedule
check "shadow failure blocks skip" block E2E_RESULT=skipped CSS_CANARY_ELIGIBLE=true SMART_CI_ENABLED=true IMPACT_RESULT=failure
check "shadow skipped blocks skip" block E2E_RESULT=skipped CSS_CANARY_ELIGIBLE=true SMART_CI_ENABLED=true IMPACT_RESULT=skipped
check "backend failure always blocks" block BACKEND_RESULT=failure
check "backend skipped blocks" block BACKEND_RESULT=skipped E2E_RESULT=skipped CSS_CANARY_ELIGIBLE=true SMART_CI_ENABLED=true
check "lint failure blocks" block FAST_RESULT=failure
check "ranking frontend failure blocks" block RANKING_FRONTEND_RESULT=failure
check "seo failure blocks" block CATEGORY_RESULT=failure
check "ranking failure blocks" block RANKING_GATE_RESULT=failure
check "E2E failure never bypassed" block E2E_RESULT=failure CSS_CANARY_ELIGIBLE=true SMART_CI_ENABLED=true
check "E2E cancelled never bypassed" block E2E_RESULT=cancelled CSS_CANARY_ELIGIBLE=true SMART_CI_ENABLED=true
check "invalid toggle blocks" block E2E_RESULT=skipped CSS_CANARY_ELIGIBLE=true SMART_CI_ENABLED=maybe
echo "Smart CI required gate contract: all scenarios passed."
