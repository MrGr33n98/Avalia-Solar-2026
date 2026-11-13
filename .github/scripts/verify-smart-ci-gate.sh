#!/usr/bin/env bash
# Required gate for opt-in CSS-only PR canary. Does NOT authorize production deploy.
set -Eeuo pipefail
required_success() {
  local name="$1" value="$2"
  if [[ "$value" != "success" ]]; then
    echo "::error::Required job $name was not successful: $value"
    exit 1
  fi
}
required_success "fast-feedback" "${FAST_RESULT:-missing}"
required_success "backend-tests" "${BACKEND_RESULT:-missing}"
required_success "ranking-frontend-gate" "${RANKING_FRONTEND_RESULT:-missing}"
required_success "category-seo-contract-gate" "${CATEGORY_RESULT:-missing}"
if [[ "${RANKING_GATE_RESULT:-missing}" != "success" && "${RANKING_GATE_RESULT:-missing}" != "skipped" ]]; then
  echo "::error::Ranking Performance gate must be success or intentionally skipped."
  exit 1
fi
if [[ "${E2E_RESULT:-missing}" == "success" ]]; then
  echo "All required CI checks passed, including critical E2E."
  exit 0
fi

# The only exception is a PR that *only* touches safe, isolated CSS Modules.
# Main pushes, workflow_dispatch and schedule ALWAYS require critical E2E success.
if [[ "${E2E_RESULT:-missing}" == "skipped" &&
      "${GITHUB_EVENT_NAME:-}" == "pull_request" &&
      "${SMART_CI_ENABLED:-false}" == "true" &&
      "${CSS_CANARY_ELIGIBLE:-false}" == "true" &&
      "${IMPACT_RESULT:-missing}" == "success" ]]; then
  echo "CSS-only PR canary: permitted E2E skip. Main push still runs full critical E2E."
  exit 0
fi

echo "::error::E2E missing/failed/cancelled, or canary eligibility was not satisfied."
exit 1
