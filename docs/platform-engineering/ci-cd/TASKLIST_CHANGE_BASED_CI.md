# Smart CI — Engineering Execution Backlog (T-001…T-038)

**Owner:** Platform Engineering & DevSecOps · **Version:** 2026-Q4 · **Release:** `v0.1.0` candidate planning  
**Guiding rule:** test selection is an optimization; it never constitutes deployment authorization.

## PR-0 — Baseline and contracts

- [x] **T-001** Inventory required/optional workflows and dependencies; record branch-protection visibility limitation (API 403). **Accept:** no actual required check renamed.
- [x] **T-002** Record sample of 100 Actions runs, separated by workflow with p50/p95 and caveats. **Accept:** source, date and sample described.
- [x] **T-003** Version risk path groups: auth, payment, claims, Rails, DB, CI. **Accept:** deterministic unit matrix.
- [x] **T-004** Document stable `build`, RSpec, E2E, release gate and failed/skipped semantics. **Accept:** unchanged gates in shadow PR.
- [x] **T-005** Audit `continue-on-error` and `|| true`. **Accept:** gaps are marked nonblocking; no false security claims.
- [x] **T-006** Publish baseline report with source SHA and links. **Accept:** reviewable in PR.
- [ ] **Gate PR-0:** obtain repository admin read of protected checks and verify required workflow contexts.

## PR-1 — Shadow classifier (current PR #105)

- [x] **T-007** Implement conservative path classifier and versioned JSON contract. **Accept:** unknown → full, no secrets.
- [x] **T-008** Resolve PR/push SHA from event and git diff; support schedule/manual. **Accept:** missing/invalid input → full.
- [x] **T-009** Automated matrix with >35 path scenarios and fault injection. **Accept:** unit job passes.
- [x] **T-010** Add informative shadow job to main CI workflow. **Accept:** no current check depends on shadow.
- [x] **T-011** Emit machine-readable plan and Actions job summary. **Accept:** no PII or token logging.
- [ ] **T-012** Manually compare ≥20 representative decisions to actual tests (mix CSS, auth, claim, admin, DB, infra); log false negatives.
- [ ] **Gate PR-1:** all required CI green plus shadow review, shadow itself does not skip checks.

## PR-2 — Selective frontend tests (NOT ACTIVE)

- [ ] **T-013** Build evidence-backed component→Jest ownership table with explicit paths and glob precedence.
- [ ] **T-014** Keep frontend lint, TypeScript and relevant security baseline in all frontend cases.
- [ ] **T-015** Run impacted Jest suites for PWA/layout cases; fall back full for unknown owners.
- [ ] **T-016** Assign E2E owner for login, signup, claims, finance, banners and CTAs.
- [ ] **T-017** Modify gate `build` to reject unauthorized skipped/cancelled/failed jobs; never accept skip generically.
- [ ] **T-018** Add mobile/desktop viewport smoke tests for sensitive and visual owner scopes.
- [ ] **T-019** Keep complete scheduled/manual Playwright and main-push critical release E2E.
- [ ] **Gate PR-2:** ≥20 audited shadows, zero critical misses, branch protection confirmed; canary off by default.

## PR-3 — Selective Rails/ActiveAdmin (NOT ACTIVE)

- [ ] **T-020** Map each admin/controller/service to request/spec/security tests.
- [ ] **T-021** Enhance existing `classify-rspec-scope.sh` with proven admin mappings, not blanket guesses.
- [ ] **T-022** Always run admin authorization, approval/rejection, CSRF, concurrency and membership tests on access changes.
- [ ] **T-023** Keep full for policies, models, callbacks, migration, Ransack, schema or unknown shared code.
- [ ] **T-024** Preserve PostgreSQL/Redis integration tests in sensitive changes.
- [ ] **T-025** Add ≥15 RSpec scope regression cases including PR #103 scenario.
- [ ] **Gate PR-3:** no admin security regression and zero falsely skipped required tests.

## PR-4 — Optimization and immutable release gates (NOT ACTIVE)

- [ ] **T-026** Time npm ci, bundle, Jest/typecheck repeats, Playwright browser install, Docker Compose and build caches.
- [ ] **T-027** Replace duplicated setup only when the jobs retain clear logs and security context boundaries.
- [ ] **T-028** Cache by lockfile/toolchain with integrity isolation for untrusted PRs.
- [ ] **T-029** Preserve stable `build` while aggregating required jobs and approved skip reasons.
- [ ] **T-030** Extend `test-verify-release-ci.sh` for SHA mismatch, missing job, cancelled/skipped, security failure, full/backend red and frontend-only rules.
- [ ] **T-031** Admin-confirm main branch protection before touching required check names.
- [ ] **T-032** Preserve serialized CD, GHCR immutable digest/SHA trace, migrations, rollback and public `X-Release` smoke.
- [ ] **Gate PR-4:** no path authorizes full deployment with red backend CI.

## PR-5 — Rollout, measurement and rollback (NOT ACTIVE)

- [ ] **T-033** Create `SMART_CI_ENABLED` kill-switch, off by default and fail closed on invalid values.
- [ ] **T-034** Canary low-risk CSS-only PRs; main push still full critical checks.
- [ ] **T-035** Measure p50/p95 versus same risk cohort; minimum 20 eligible PRs.
- [ ] **T-036** Enable frontend shared and Rails admin only after independent reviews and owner mapping.
- [x] **T-037** Document interim runbook for fallback, Pending, E2E failure and deploy block; revise after canary.
- [ ] **T-038** Complete changelog, operational handoff, chart and go/no-go record.

## Rollout decision criteria

### GO

- Required `build`/security checks remain protected and visible.
- No false-negative required test skips in reviewed sample.
- Canary shows ≥30% p50 improvement or documented reason target missed.
- Full release verification still checks approved `main` SHA and successful backend CI.
- Rollback of policy and existing production deployment tested.

### NO-GO

- Missing required job, permissive `skipped` handling, secrets leakage, changed SHA between test and deploy, classification unknown without full fallback, false-negative auth/claim/DB, or missing rollback.

### What is *not* done

Shadow mode is **not** production optimization. Do not represent this feature PR as all 38 tasks finished. Do not merge P2–P5 merely to close backlog; each has explicit evidence gates.
