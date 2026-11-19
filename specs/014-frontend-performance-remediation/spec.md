# Spec 014 — Performance remediation implementation contract

**Scope:** `AB0-1-front`, Next.js 14, React 18, TypeScript. Keep backend and API contracts unchanged.
**Goals:** server-render initial result for /search, /companies and /products; company hero independent of reviews and analytics; lazy-only secondary tabs; non-blocking filters; measurable budgets.

## Invariants

- Existing canonical URLs, redirects, metadata and JSON-LD remain byte-for-byte semantically equivalent for each entity.
- Server loaders are anonymous PUBLIC endpoints only, no cookies or user-private fields, and honor public cache revalidate/tags. Interaction and favorites remain client-side, multi-tenant permissions stay in Rails.
- Never infer access to pricing/quote/WhatsApp from static DTOs; let existing CTA gating decide.
- Loading, empty, error, pending, offline, mobile and authorization states are distinct.
- Initial props match the first query key, are JSON serializable, and do not cause a duplicate client fetch immediately after hydration.
- Reviews and external analytics are secondary; failures must not blank hero/identity or block CTA.
- Do not change existing page layout/visual hierarchy, analytics event names or commercial gating.
- Dynamic imports must run only for visible/active tabs. Validate that maps are absent from the baseline waterfall.
- Browser filters must cancel superseded requests (AbortSignal) when supported; stale result must not overwrite newer result.
- Lighthouse regression gate cannot substitute for field Core Web Vitals. Collect both.

## Acceptance

Independent acceptance for US1 (initial HTML/RSC + interactions), US2 (profile review failure), US3 (secondary chunk absent on first load), US4 (nonblocking navigation), US5 (CI/RUM budget + rollback). The real baseline is **pending**, therefore final performance DoD is not approved.
