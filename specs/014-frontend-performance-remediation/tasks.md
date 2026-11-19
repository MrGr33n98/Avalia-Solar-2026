# Spec 014 — Remediação de Performance do Frontend

Last updated 2026-11-19. Branch: `feat/spec-014-frontend-performance-phase1-20261119` (PR #203, draft).

**This checklist records committed changes, not production verification.** “Done” denotes a committed implementation only; none is production-validated. The Spec 014 DoD requires the cross-route test suite, reproducible RUM/Lighthouse baseline, comparison after rollout and no SEO/authorization regression. Statuses: 29 implemented in branch; 12 partially addressed; 1 pending.

- [x] T001 — baseline template by route/device/commit/environment
- [x] T002 — include search and products in LHCI
- [x] T003 — route shell/data/interactive instrumentation
- [x] T004 — baseline cold/internal-navigation quickstart
- [x] T005 — server-side loaders for search/companies/products
- [x] T006 — per-request memoization where shared
- [x] T007 — minimal first-render DTO and public card API boundaries (runtime regression verification tracked under T041)
- [x] T008 — state fixtures
- [x] T009 — SEO/a11y/tracking compatibility criteria
- [x] T010 — search server-first initial payload
- [ ] T011 — search client interactive fallback and tracking **(partial; validation outstanding)**
- [ ] T012 — search server-first tests **(partial; validation outstanding)**
- [x] T013 — companies initial server payload
- [x] T014 — keepPreviousData, AbortSignal and prefetch
- [ ] T015 — company initial/filter/pagination/error tests **(partial; validation outstanding)**
- [x] T016 — products initial server payload and client hook
- [ ] T017 — products URL/empty/loading parity **(partial; validation outstanding)**
- [ ] T018 — products server-first tests **(partial; validation outstanding)**
- [x] T019 — independent company and reviews loaders
- [x] T020 — review boundary
- [x] T021 — remove ineffective Suspense
- [x] T022 — non-critical analytics separated
- [ ] T023 — streaming/analytics fallback tests **(partial; validation outstanding)**
- [x] T024 — secondary tab dynamic imports
- [x] T025 — mount only active tab contents
- [x] T026 — remove unused legacy imports
- [x] T027 — defer static Sentry provider import
- [ ] T028 — build and route-chunk report captured; analyzer/network interpretation outstanding **(partial; validation outstanding)**
- [ ] T029 — map never loaded initially test **(partial; validation outstanding)**
- [x] T030 — non-blocking search URL transitions
- [x] T031 — company filters and navigation transitions
- [x] T032 — products filter transitions
- [x] T033 — dedupe global listeners
- [x] T034 — activeSpecFilters memoization
- [x] T035 — content-visibility/virtualization evaluation
- [ ] T036 — route budgets and RUM metrics **(partial; validation outstanding)**
- [ ] T037 — before/after real metrics **(partial; validation outstanding)**
- [x] T038 — per-route Web Vitals reporter
- [x] T039 — rollback procedure
- [ ] T040 — run Jest/typecheck/lint/build/LHCI **(partial; validation outstanding)**
- [ ] T041 — mobile/desktop/a11y/empty/error verification **(pending; hard release gate)**
- [ ] T042 — final report with actual outcomes **(partial; validation outstanding)**

## Critical release blockers

- Production PostHog field baseline has been retrieved, but critical route sample counts are low and lab cold-load/script-size/TTFB baselines remain unmeasured.
- GitHub CI/typecheck/build/Lighthouse results must be read on the final commit; previous runs are insufficient when this branch changes.
- `/search` and `/products` client components were moved into dedicated files. Existing integrations and E2E parity must be verified.
- Server-side public API payloads must be audited against DTO shape and information classification. No authenticated response may be serialized into RSC.
- Company review JSON-LD is streamed: crawler retrieval, canonical and structured-data parity require regression tests.
- React Query cache, authorization/CTA gates and state on tab switch require functional verification.
- Do not merge draft PR until these gates are cleared and baseline recorded.

## Evidence added on 2026-11-19

Production PostHog \$web_vitals provided a provisional seven-day RUM baseline for public routes. See metrics.md; small sample counts are explicitly marked. LCP/INP targets are **not met** on several sampled routes. True lab cold-load, streaming, accessibility, transfer budgets and after metrics are still release blockers.

## Evidence interpretation

[x] means a code or planning artifact is committed; it is **not** a production-ready acceptance claim. T035 evaluation concluded *do not introduce virtualization/content-visibility without traces and accessibility evidence*. T040 CI and T041 E2E/Lighthouse remain blocked until the appropriate environment runs. T026 removed the unreachable legacy profile branch; T028 has a real analyzer artifact but Lighthouse network validation is still required. Post-release comparisons T037/T042 cannot be completed before an actual rollout.

### Lint gate clarification
The existing full `npm run lint` fails on preexisting broad-codebase `no-explicit-any`, unused imports and image warnings (for example CompanyLogo, QuoteForm, PostHogProvider). The Spec014 workflow now **hard-fails** lint in its newly introduced server-first modules and **collects** the full lint as a non-blocking inventory. This does not mean full lint is passing; the release DoD remains partial until the repository-wide debt is addressed or an explicit scope decision is approved.

## Consolidation policy

Final branch changes will be delivered through one squashed commit with a compare-and-swap (force-with-lease) ref update. No intermediate pushes are required to complete the code changes. The feature is not production-approved until post-commit CI and field/lab checks pass.
