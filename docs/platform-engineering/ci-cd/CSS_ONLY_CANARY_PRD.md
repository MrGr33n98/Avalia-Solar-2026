# PRD — CSS-only PR Canary (Feature-Flagged, default OFF)

**Parent:** `feat/smart-ci-change-impact-shadow-q4` (#105)  
**Policy:** `2026-q4-canary-1`  
**Status:** Implementation in **DRAFT PR**, NOT enabled and NOT merged to main.  
**Switch:** repository variable `SMART_CI_ENABLED` must be the literal `true` to opt in; missing/false/any other value means full critical E2E.

## Goal

Accelerate Pull Request validation for isolated `*.module.css` changes, without skipping main-push tests, security checks, RSpec, contract checks or deployment verification. **Do not enable before shadow decisions are manually audited for ≥20 representative changes and branch protection is reviewed.**

## Eligibility (ALL required)

- Event = `pull_request`.
- Only changed files under `AB0-1-front/components/**` ending `*.module.css`.
- Only additions or modifications (no rename, copy, deletion, type-change, conflict or unknown file).
- No sensitive path such as auth/login/claim/payment/checkout/billing/lead/WhatsApp and no global CSS.
- Shadow classifier job succeeded and returned `css_canary_eligible=true`.
- Repository variable equals `SMART_CI_ENABLED=true`; default remains disabled.

The above rules are evaluated by a deterministic classifier and the stable `build` gate. Main push and scheduled/manual CI must still run all critical Playwright E2E tests.

## Existing jobs preserved

- `Code Quality & Security Scan` — required.
- `Backend Unit Tests (RSpec)` — must complete successfully; scope selection remains as existing.
- `Ranking Performance Frontend Contract` — required.
- `Category Discovery & SEO Contract Gate` — required.
- `Ranking Performance Gate` — success or intentional scheduled/manual skip (existing behavior).
- `build` — stable required job name, now validates all critical job results and authorized CSS-only skip.
- CD workflows and `verify-release-ci.sh` — unchanged.

## Acceptance tests

- [x] Script test suite for required gate (18 positive/negative scenarios).
- [x] Classifier regression tests include pure module CSS, global CSS, auth/claim CSS, renames, deletes and mixed docs+CSS.
- [ ] PR CI succeeds with flag OFF and all Playwright checks unchanged.
- [ ] Shadow-reviewed ≥20 representative PRs with 0 critical false negatives.
- [ ] Repository admin confirms `build` and security rules required.
- [ ] Visual-only PR in a controlled canary demonstrates permitted skip (flag ON) without bypassing required checks.
- [ ] `main` CI re-runs critical E2E after merge regardless of toggle.
- [ ] Performance p50/p95 measured versus comparable baseline.
- [ ] Rollback drill: disable `SMART_CI_ENABLED` and verify next PR executes critical E2E.

## Threat model and limitations

- PR code is untrusted. Branch protection and code review must prevent unreviewed workflow or classifier modifications.
- CSS can affect interaction and layout; an owner map must be audited before broader eligibility. The first rollout should restrict to known non-critical components.
- A classifier recommendation never authorizes full or frontend production deployment.
- No `pull_request_target`, privileged tokens, secret reads or schema changes.

## Fail-closed matrix

| Condition | Expected |
|---|---|
| Toggle absent/false/unrecognized | E2E required |
| New/unknown file | E2E required |
| .github/ workflow changed | E2E required |
| Auth or claim .module.css | E2E required |
| Global CSS | E2E required |
| Delete, rename, mixed docs | E2E required |
| Shadow job fails / absent output | E2E required |
| Backend check fails | `build` fails |
| Frontend contract check fails | `build` fails |
| E2E failed or cancelled | `build` fails, no bypass |
| Main push | E2E required, independent of switch |
| Only proven safe CSS Module in PR with toggle ON | E2E skipped on PR; `build` may succeed if all other required checks passed |

## Rollback

Immediately set `SMART_CI_ENABLED=false` or delete the repository variable (admin action), then verify a PR executes E2E. If code bug is found, revert the canary PR; do not touch release gates. Document the incident and re-run full validation. The feature must remain OFF until complete go/no-go review.
