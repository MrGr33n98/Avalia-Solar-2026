# Avalia Solar — Change-Based CI/CD | Implementation and release blueprint

**Status:** Phase 1 (shadow) implemented on feature branch, rollout **NOT** enabled.  
**Policy:** `2026-q4-shadow-1` · **Baseline SHA:** `ab894b168bc3d42f4ff87655b2fee83e20cb7622` · **Date:** 2026-11-13

## Objectives and measurable success

| Metric | Baseline method | Target and acceptance |
|---|---|---|
| CI p50 for visual-only PRs | GitHub run started → completed, classified by diff | decrease ≥30% after canary |
| CI p95 for eligible PRs | Same calculation, same risk group | decrease ≥20% |
| Initial feedback, UI changes | PR created → fast feedback check completed | p50 ≤3 minutes |
| Required validation, eligible UI | PR created → stable `build` complete | p50 ≤7 minutes |
| Critical false-negative classification | Security-reviewed sampled PRs | **zero** |
| Backend release with red backend CI | verify-release-ci gate | **zero** |
| Unknown / failed git diff | classifier fallback | always `full` |
| CI branch protection Pending due to skipped workflow | branch rules audit + trial PR | **zero** |
| Exact SHA mismatch on release | gate contract tests | **zero** |

Goals are **targets**, not verified gains. Compare 20+ eligible PRs to representative prior PRs before increasing rollout. Record queue time separately from runner and Docker build time.

## Evidence-backed AS-IS (sample: last 100 GitHub Actions runs, mixed branches)

- 13 workflows inventoried in `.github/workflows` at the time of the initial audit.
- 57 runs of `CI — Web & Backend (Quality & Tests)`; 55 completed, 2 queued/in progress.
- Completed: 9 success, 41 failed, 5 cancelled. **Do not** interpret this historical mix as current `main` reliability.
- Measured from `run_started_at` to `updated_at`: CI p50 **8.4 min** and p95 **20.6 min**, among 55 completed sample runs (including cancelled and failures).
- `ci-web-backend.yml` runs one nightly/manual full regression, changed/full/none RSpec based on `resolve-rspec-scope.sh`, multiple separate Node setups and a Docker Compose E2E environment.
- Current classifier `classify-rspec-scope.sh` sends any `AB0-1-back/app/admin/**` to full RSpec. PR #103 ran 2,932 examples with one failure in an early iteration, later fixed in the PR; use this as a regression case.
- `build` is the existing stable check and depends on E2E. **Do not rename or replace** before reviewing main's required checks. Branch protection API returned **403** to the connector; rules must be verified by a repository admin.
- `verify-release-ci.sh` validates the exact `main` SHA and applies conservative `frontend_only/full` rules. It is intentionally **unchanged**.
- `cd-production.yml` and `cd-frontend-production.yml` share `concurrency: deploy-production` with `cancel-in-progress: false`.
- Existing security checks include Brakeman and non-blocking RuboCop/Bundler Audit/Gitleaks; non-blocking checks must be analyzed separately, never described as blocking protections.

## Phases / delivery gates

| Phase | Deliverable | Operational gate |
|---|---|---|
| P0 — Baseline | metrics, paths, existing gate semantics | no changes to required checks |
| P1 — Shadow classifier | deterministic policy, 35+ cases, reason codes, summary | advisory only; full CI remains active |
| P2 — Frontend canary | affected Jest/E2E owner mapping, risk exceptions, stable build gate | shadow reviewed over ≥20 representative PRs; 0 critical misses |
| P3 — Rails admin | verified admin→RSpec map, authorization tests, cross-domain union | no missing admin tests, all sensitive changes full |
| P4 — Reuse & performance | deduplicate safe setups, cache provenance, Docker build profiling | equal-or-better blocking checks, no privilege escalation |
| P5 — Rollout & observability | policy flag, percentile report, runbook and rollback drill | 20+ canary PRs, no bypass, target reductions evidenced |

**These are sequential gates.** Phases P2–P5 must not be enabled just because a policy script exists. A review/merge of this shadow PR does **not** deliver measurable CI acceleration yet.

## User stories

- **US-01:** as frontend developer, classify CSS-only changes as UI style and advise focused checks.
- **US-02:** as security owner, treat auth, claim, payment, and similar UI as sensitive despite visual appearance.
- **US-03:** as Rails engineer, map admin changes to reliable RSpec suites, fallback full if uncertain.
- **US-04:** as DBA, migrations/models/schema never select frontend-only releases.
- **US-05:** as maintainer, keep `build` stable and fail on inappropriately skipped checks.
- **US-06:** as reviewer, mixed frontend/backend paths produce union of tests and full release.
- **US-07:** as SRE, malformed/unknown/empty diffs run a full fallback policy.
- **US-08:** as release engineer, compute deployment risk from last confirmed release, not only the last commit.
- **US-09:** as auditor, show policy version, risk, scope, reasons and SHA in summaries.
- **US-10:** as incident responder, disable canary and restore conservative gates without modifying a running deployment.

## Architecture

```text
 feature/pull_request ----------------------- push/main
         |                                       |
         +------ git diff (validated SHAs) ------+
                         |
                 impact policy (SHADOW)
                    /     |     \
                 UI      Rails    critical/unknown
                 |         |             |
            advise Jest   advise RSpec   advise FULL
                    \      |       /
                  JSON + reason codes
                         |
               informational job summary
                         |
           EXISTING CI: all jobs unchanged
                         |
                   required build
                         |
                  exact-SHA CD gate
                         |
               serialized production deploy
                         |
           smoke tests / release SHA / rollback
```

## Contracts and security invariant

- Input comes only from Git diff of validated SHAs. No user-controlled labels can disable tests.
- `--name-status -z` handles renames and unusual filenames. Delete, rename, unknown path, invalid status, missing SHA and resolver failures → full conservative advisory.
- `test_plan` is informational; `release_scope` is not a deployment authorization.
- No third-party dependencies, privileged secrets, PR-provided arbitrary shell commands, or production database calls in classifier.
- Mandatory `build`, existing security checks, regression suites and release gate are unchanged by Phase 1.
- A new `change-impact-shadow` job uses `continue-on-error: true` **only because it cannot influence required CI or deployment**; it must become blocking before any selective skip can occur.
- No `pull_request_target` or privileged `workflow_run` checkout of untrusted PR code.

## Definition of Done — Phase 1

- [x] File-path policy and versioned JSON output
- [x] Unknown and malformed changes default to full
- [x] GitHub PR/push diff resolver and manual/scheduled full fallback
- [x] 35+ path fixtures and additional fault-injection contracts
- [x] Non-blocking shadow job in main CI workflow (PR only; CI outcome pending)
- [x] Baseline and safeguards recorded
- [ ] PR CI all required checks green
- [ ] ≥20 reviewed shadow decisions with zero critical false negatives
- [ ] Security review for required status and branch protection
- [ ] Canary authorized in a **separate** PR only after evidence

## Change management

**Roll forward:** PR → CI → merge once approved → monitor shadow reports; no deployment policy changes.  
**Rollback:** revert new shadow job and its scripts; existing CI and deploy logic remain identical.  
**Incident:** classifier absent or failed? Ignore its advisory output and keep existing CI gates; never bypass `verify-release-ci.sh`.

## Source paths

- `.github/workflows/ci-web-backend.yml`
- `.github/workflows/cd-production.yml`
- `.github/workflows/cd-frontend-production.yml`
- `.github/scripts/classify-rspec-scope.sh`
- `.github/scripts/resolve-rspec-scope.sh`
- `.github/scripts/verify-release-ci.sh`
- `.github/scripts/classify_change_impact.py`
- `.github/scripts/resolve-change-impact.sh`
- `.github/scripts/test_classify_change_impact.py`

**Historical metrics note:** source is GitHub Actions REST metadata for the newest 100 workflow runs on 2026-11-13; refresh before shipping canary.
