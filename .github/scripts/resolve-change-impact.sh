#!/usr/bin/env bash
# Advisory-only; cannot bypass mandatory CI gates or authorize deploy.
set -Eeuo pipefail
cd "$(git rev-parse --show-toplevel)"
plan_file="${RUNNER_TEMP:-/tmp}/change-impact-plan-$$.json"
diff_file="${RUNNER_TEMP:-/tmp}/change-impact-diff-$$.nul"
trap 'rm -f "$plan_file" "$diff_file"' EXIT

head_sha="${GITHUB_SHA:-}"
base_sha=""
fallback_reason=""
case "${GITHUB_EVENT_NAME:-}" in
  pull_request)
    if [[ -f "${GITHUB_EVENT_PATH:-}" ]]; then
      base_sha="$(jq -r '.pull_request.base.sha // empty' "$GITHUB_EVENT_PATH")"
    else
      fallback_reason="MISSING_EVENT_PAYLOAD"
    fi
    ;;
  push)
    if [[ -f "${GITHUB_EVENT_PATH:-}" ]]; then
      base_sha="$(jq -r '.before // empty' "$GITHUB_EVENT_PATH")"
    else
      fallback_reason="MISSING_EVENT_PAYLOAD"
    fi
    ;;
  schedule|workflow_dispatch)
    fallback_reason="SCHEDULED_OR_MANUAL_FULL"
    ;;
  *)
    fallback_reason="UNSUPPORTED_GITHUB_EVENT"
    ;;
esac
if [[ ! "$head_sha" =~ ^[a-f0-9]{40}$ ]]; then fallback_reason="INVALID_HEAD_SHA"; fi
if [[ -z "$fallback_reason" && ( ! "$base_sha" =~ ^[a-f0-9]{40}$ || "$base_sha" =~ ^0+$ ) ]]; then
  fallback_reason="INVALID_BASE_SHA"
fi
if [[ -z "$fallback_reason" ]] && ! git cat-file -e "${base_sha}^{commit}" 2>/dev/null; then
  git fetch --no-tags origin "$base_sha" >/dev/null 2>&1 || fallback_reason="BASE_FETCH_FAILED"
fi
if [[ -z "$fallback_reason" ]] && ! git cat-file -e "${head_sha}^{commit}" 2>/dev/null; then
  git fetch --no-tags origin "$head_sha" >/dev/null 2>&1 || fallback_reason="HEAD_FETCH_FAILED"
fi
if [[ -z "$fallback_reason" ]]; then
  git diff --name-status --find-renames --diff-filter=ACDMRTUXB -z \
    "$base_sha" "$head_sha" > "$diff_file" || fallback_reason="GIT_DIFF_FAILED"
fi
if [[ -n "$fallback_reason" ]]; then
  python3 .github/scripts/classify_change_impact.py \
    --fallback "$fallback_reason" --base "$base_sha" --head "$head_sha" > "$plan_file"
else
  python3 .github/scripts/classify_change_impact.py \
    --nul --base "$base_sha" --head "$head_sha" < "$diff_file" > "$plan_file"
fi
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  python3 .github/scripts/classify_change_impact.py --summary "$plan_file" >> "$GITHUB_STEP_SUMMARY"
fi
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  python3 - "$plan_file" "$GITHUB_OUTPUT" <<'PY'
import json, sys
with open(sys.argv[1], encoding="utf-8") as f:
    plan = json.load(f)
with open(sys.argv[2], "a", encoding="utf-8") as out:
    for key in ("release_scope", "risk", "fallback"):
        value = plan[key]
        out.write("{}={}\n".format(key, str(value).lower() if isinstance(value, bool) else value))
PY
fi
echo "Change impact advisory complete; all existing checks remain mandatory."
