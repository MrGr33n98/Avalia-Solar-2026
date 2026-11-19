# Spec 014 — Implementation report (2026-11-19)

**Baseline:** not measured. **Result:** pending CI and lab/field comparison.

## Static audit verified

- /search and /products: initial public result fetched by client after hydration.
- /companies: existing Server Component preserves SEO and canonical redirect, but client owns initial results.
- /companies/[id]: page awaited reviews before constructing JSX; primary shell imported secondary tabs statically.
- Lighthouse budgets existed for scripts ≤450000 bytes and Lighthouse perf ≥0.80; /search and /products were not included in route matrix.
- PostHog provider had static `@sentry/nextjs` import.

## Delivery evidence

See PR description and commits on branch `feat/spec-014-frontend-performance-foundation-20261119`. Do not mark tasks complete without CI, Lighthouse and web vitals measurements.

## Open decisions / risks

1. Confirm backend's initial /search/all payload and whether filter facets are complete.
2. Confirm products/filters API caching and category URL compatibility.
3. Review JSON-LD review aggregation consistency under streaming.
4. Capture percentage of public sessions using map in above-the-fold viewport.
5. Confirm the existing 450000 B Lighthouse script budget applies per collected page rather than per JS chunk.

## Signoffs

- Typecheck / Jest / lint / build: pending.
- Lighthouse before/after: pending.
- RUM p75 by route + device: pending.
- SEO / accessibility / real commercial CTA tests: pending.
- Production release: **not approved** until above gates pass.
