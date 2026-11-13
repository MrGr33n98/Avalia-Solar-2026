# Operations Runbook — Change-Based CI/CD

## Phase 1: shadow-only

- CI job: `Change Impact (Shadow Mode)`.
- Required check remains `build`. Existing CI/CD scripts are unchanged.
- Status of shadow job never proves a deploy is safe.
- In the Actions summary, compare `changed_areas`, `reason_codes`, `test_plan` against the current tests; record disagreements in the PR review.
- Do **not** use this classifier for production deploy scope or skipping critical checks until ≥20 reviewed decisions have zero critical misses.

## Fail closed matrix

| Condition | Expected behavior |
|---|---|
| Missing/invalid base/head SHA | fallback=true / full |
| Git fetch failed, truncated diff | fallback=true / full |
| Rename/delete, unusual status | fallback=true / full |
| Unknown repo path | fallback=true / full |
| PR includes frontend AND backend | full, both areas represented |
| Scheduled/manual full sweep | full |
| Shadow job fails | Existing required jobs still run, classifier output is ignored |
| Gate `build` fails | No production release, regardless of shadow recommendation |
| CD SHA does not match approved `main` SHA | Block release |

## Rollback (CI policy)

**Phase 1:** revert `change-impact-shadow` and delete the new scripts in an emergency PR; existing CI/CD decisions never depended on them. Do not change deployment scripts to speed up the rollback.

**Future canary:** turn off `SMART_CI_ENABLED` (to be implemented in separate guarded PR) and return to existing required gates. Confirm `build` stays stable. Never manually force a deployment of an unapproved commit.

## Before enabling canary

1. Obtain admin confirmation of branch protection and checks (connector branch protection returned 403).
2. Categorize ≥20 PRs/pushes by hand, include errors and mixed changes.
3. Validate that all sensitive journeys have a proven test owner.
4. Verify skipped job treatment: `skipped` cannot be accepted as success without audited policy.
5. Compare p50/p95 for eligible changes, queue time separate from runner duration.
6. Test failed SHA, failing security check, cancelled jobs and recovery.
7. Run a rollback drill and record evidence before merging canary.

## Runbook: no output / unexpected fallback

Inspect Actions → CI → Change Impact (Shadow Mode). Validate `GITHUB_EVENT_PATH`, git diff availability, policy version and reason codes. If unknown, leave FULL recommendation. Do not use job outcome to override release gates.

## Runbook: required check Pending

Check that the workflow was actually triggered and branch protection requires the stable `build` check, not a path-filtered/renamed job. Revert change-based filtering to restore stability; never bypass a required check by manually publishing `main`.

## Runbook: slow E2E

Measure Docker build/startup, Playwright browser installation, test runtime, and artifact uploads separately. Profile BuildKit cache effectiveness. Keep critical E2E and security checks until a policy-approved test owner map exists.

## Tracing and privacy

Use GitHub run IDs, SHA and reason codes; do not publish secrets, personal data, or raw environment values into summaries. For every optimization PR, retain previous and new runner timings plus risk classification.
