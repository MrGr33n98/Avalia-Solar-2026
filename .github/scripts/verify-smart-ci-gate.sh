#!/usr/bin/env bash
# Required gate for Pull Requests and releases.
# Supports fast-path for docs-only PRs and opt-in CSS-only PR canary.
# Main branch pushes, releases, and scheduled runs always require complete verification.
set -Eeuo pipefail

required_success() {
  local name="$1" value="$2"
  if [[ "$value" != "success" ]]; then
    echo "::error::Required job $name was not successful: $value"
    exit 1
  fi
}

# 1. Fail immediately if docs validation explicitly failed or was cancelled
if [[ "${DOCS_RESULT:-missing}" == "failure" || "${DOCS_RESULT:-missing}" == "cancelled" ]]; then
  echo "::error::Documentation validation job failed or was cancelled."
  exit 1
fi

# 2. Documentation-only PR path:
# Strictly restricted to pull_request events (or manual dispatch with docs_only suite).
# Never permitted on push events (e.g., merge to main), ensuring production release SHA
# verification in verify-release-ci.sh is never compromised.
if [[ ( "${GITHUB_EVENT_NAME:-}" == "pull_request" || ( "${GITHUB_EVENT_NAME:-}" == "workflow_dispatch" && "${TEST_SUITE_INPUT:-}" == "docs_only" ) ) &&
      "${DOCS_ONLY:-false}" == "true" ]]; then
  if [[ "${DOCS_RESULT:-missing}" == "success" &&
        "${IMPACT_RESULT:-missing}" == "success" &&
        "${FAST_RESULT:-missing}" == "skipped" &&
        "${BACKEND_RESULT:-missing}" == "skipped" &&
        "${RANKING_FRONTEND_RESULT:-missing}" == "skipped" &&
        "${CATEGORY_RESULT:-missing}" == "skipped" &&
        "${SEO_W0_RESULT:-missing}" == "skipped" &&
        "${E2E_RESULT:-missing}" == "skipped" ]]; then
    echo "Documentation-only PR: all documentation validations passed. Code tests safely skipped."
    exit 0
  else
    echo "::error::Documentation PR detected but required validation conditions were not met (DOCS_RESULT=${DOCS_RESULT:-missing}, IMPACT_RESULT=${IMPACT_RESULT:-missing}, FAST_RESULT=${FAST_RESULT:-missing})."
    exit 1
  fi
fi

# 3. Standard Code PR and Release Gate checks
required_success "fast-feedback" "${FAST_RESULT:-missing}"
required_success "backend-tests" "${BACKEND_RESULT:-missing}"
required_success "ranking-frontend-gate" "${RANKING_FRONTEND_RESULT:-missing}"
required_success "category-seo-contract-gate" "${CATEGORY_RESULT:-missing}"
required_success "seo-w0-regression-gate" "${SEO_W0_RESULT:-missing}"

if [[ "${RANKING_GATE_RESULT:-missing}" != "success" && "${RANKING_GATE_RESULT:-missing}" != "skipped" ]]; then
  echo "::error::Ranking Performance gate must be success or intentionally skipped."
  exit 1
fi

if [[ "${E2E_RESULT:-missing}" == "success" ]]; then
  echo "All required CI checks passed, including critical E2E."
  exit 0
fi

# 4. CSS-only PR Canary exception
# The only exception for skipping E2E is an opt-in PR that *only* touches safe, isolated CSS Modules.
# Main pushes, workflow_dispatch (default/full) and schedule ALWAYS require critical E2E success.
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
