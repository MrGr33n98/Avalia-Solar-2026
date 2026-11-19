# Spec 014 — Implementation report, current evidence

Date: 2026-11-19 · PR #203 (`feat/spec-014-frontend-performance-phase1-20261119`) · Status: **draft, not deployed**.

## Prior static root causes

- `/search` and `/products` initiated initial data exclusively in Client Components; `/companies` used a client TanStack query for the first listing.
- `/companies/[id]` waited for reviews before rendering the Client profile; `Suspense` was therefore ineffective for the first paint.
- Premium company shell statically imported legacy tab components; global PostHog provider imported Sentry statically.
- Lighthouse CI omitted search/products.

## Branch-level remediation

- Public `fetchApiPublic` loaders supply an initial RSC payload for search, companies and products. Existing query/filter providers remain, with abort and transitions. `React.cache` request-scopes loader calls.
- Reviews JSON-LD moved behind an independently awaited, streamed boundary that preserves company hero and SEO aggregate on review failure. Client reviews still fetch separately: review fetch deduplication is a potential optimization, **not yet demonstrated**.
- Premium secondary tabs are dynamic and active-tab gated; Sentry tags are set with a deferred import after PostHog starts.
- `useTransition` and pending feedback are present on catalog navigation; product URL deep-linked pagination and search page size are normalized.
- Lighthouse CI includes search and products plus a separate 390px mobile config. Core Web Vitals instrumentation emits the existing `web_vital` contract; route visibility and interactive markers are explicitly post-hydration approximations, not paint proofs.
- Focused Jest loader/contract tests and optional Playwright acceptance tests were added. The latter require a running public API and `PERF_E2E_LIVE=1`.

## Real baseline (important)

PostHog `$web_vitals` was available for the production domain before this PR was deployed. The 7-day field data includes `/search` LCP p75 **3,323ms** (n=10), INP p75 **320ms** (n=24), and `/companies` LCP p75 **2,972ms** (n≈24). These are *actual observations*, not fabricated audit numbers, but small n makes them provisional. Full sample counts and device splits are in `metrics.md`. Laboratory baseline **not collected**.

## Required gates before merging or production

1. New dedicated Spec014 workflow and all main repository CI checks must finish successfully for the latest head SHA. A successful old commit does not validate newer changes.
2. Run Lighthouse CI at least three times per URL/viewport using a stable API-backed environment. Collect JS transfer size, LCP/FCP/CLS/TBT, TTFB lab proxy and waterfall traces.
3. Validate server HTML without JS, crawler JSON-LD, canonical tags, review error recovery, map chunk absence until intent, authorization/CTA gating and mobile 320/375/390px. Run Playwright with `PERF_E2E_LIVE=1`.
4. Confirm no >5% performance regression on any route against comparable baseline; confirm no hydration, analytics contract, Pundit/multi-tenant or accessibility regressions.
5. Keep this PR in Draft; no merge/deploy without the above.

## Residual risks

- Static imports for an unused legacy company detail rendering branch may remain until bundle analyzer verifies dead-code elimination. Do not delete without tracing its feature flag impact.
- The first server payload contains the public endpoint shape (not a fully minimized field-by-field DTO); inspect response sizes and entitlements before further projection.
- Search legacy fallback can still require a client request for unusual no-match responses; document exceptions and test behavior.
- `content-visibility` on the first results above the fold may hurt LCP/CLS; do not enable without trace evidence and accessibility tests.
- No credible **post-deploy** comparison yet.

## CI observed findings
- Dedicated Spec014 workflow on commit `fe795b6`: TypeScript and focused Jest tests passed; full repo lint failed on preexisting errors in unrelated UI modules. A separate strict lint gate was introduced for new server-first modules while full lint remains collected as a non-blocking debt inventory; broader DoD lint remains unfulfilled.
- T026 removes a permanently unreachable legacy company profile rendering branch and its heavy client imports. Verify the premium shell and authorized tracking with E2E on the latest commit; this is not yet measured bundle savings.

## Real production build evidence (2026-11-19)

The production Next.js build and manifest audit **passed** on PR SHA `d2f82b4` (GitHub Actions run 44479417586, job 135408900497). First Load JS was /search 410kB, /companies 423kB, /products 343kB and /companies/[id] 463kB. Initial JS compressed/network transfer is not known; this is not a Lighthouse pass. Build analyzer artifact ID: 14508436004. The compacting changes staged after that SHA require a fresh build and comparison.

The critical initial company hero remains rendered from the public company payload. Protected analytics and expensive company profile calls now load dynamically, and the contact tab is split. The new search DTO excludes duplicate `results` and unexpected top-level response fields; a nonnumeric product category deep link falls back to the existing client path instead of showing unfiltered SSR products.
