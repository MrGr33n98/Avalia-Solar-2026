# Performance Optimization Rollout (2026-02-09)

## Baseline (GTmetrix)
- Performance grade: `64%`
- Structure grade: `95%`
- LCP: `2.5s`
- TBT: `385ms`
- CLS: `0`

## Changes Implemented
- Analytics loading simplified to `GTM-only` (removed duplicated GA script loading in app runtime).
- Added analytics feature-flag guard (`NEXT_PUBLIC_ENABLE_ANALYTICS=false` disables GTM injection).
- Added API route proxy for Web Vitals: `app/api/v1/analytics/web-vitals/route.ts`.
- Enabled anonymous acceptance of `web_vital` event type in backend analytics controller.
- Added layered fallback cache for home data (`categories` + `banners`) with:
  - timeout budget of 200ms for origin API calls
  - stale-while-revalidate behavior
  - memory + disk persistence (`.cache/home-fallback-cache.json`)
  - cache metrics endpoint at `/api/cache-metrics`
- Added cache warming script: `script/warm-home-cache.mjs` (runs in `postbuild`).
- Added auth session hint strategy to avoid anonymous bootstrap requests to `/auth/me`.
- Added in-memory cache and retry/backoff improvements in API clients for idempotent/public requests.
- Added extra code splitting on home route with dynamic imports for below-fold UI.
- Enabled image optimization by default in production (`NEXT_DISABLE_IMAGE_OPTIMIZATION=true` is explicit opt-out).
- Tightened Lighthouse budgets in `lighthouserc.json`.
- Added CI workflow for performance budget checks: `.github/workflows/performance-budget.yml`.

## Expected Impact
- Lower initial JS and third-party overhead on home.
- Reduced unauthorized request noise (`/me`, refresh loops) for anonymous sessions.
- Removed `404` for web-vitals collection endpoint.
- Better chance to meet target budgets:
  - LCP `< 1.5s`
  - TBT `< 200ms`
  - CLS `< 0.1`

## Validation Plan
1. Deploy frontend + backend changes together.
2. Run `npm run perf:lhci`.
3. Confirm in browser network:
   - No duplicated GA runtime loading.
   - Web vitals requests return `202` from `/api/v1/analytics/web-vitals`.
   - Anonymous homepage no longer triggers `/auth/me` and `/auth/refresh` noise.
4. Record new GTmetrix/Lighthouse values and compare with baseline.
5. Validate fallback behavior by simulating API latency/outage and checking:
   - cache hit rate from `/api/cache-metrics`
   - stale/fallback serving without homepage hard failures
