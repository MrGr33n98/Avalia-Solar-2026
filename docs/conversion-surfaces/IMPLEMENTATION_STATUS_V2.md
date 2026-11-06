# Conversion Omnichannel v2 — Implementation Status
**Branch**: `feat/conversion-omnichannel-entitlements-v2` · PR #67 (draft)
**Baseline**: `c2f47c67332c4ece84e9d9a049c4aad548b88d96` (main at branch creation)
**Scope**: paid quote and company WhatsApp conversion across the marketplace.

## Delivered in PR #67

- Decision: `CompanyCtaVisibilityResolver` is authoritative for quote and WhatsApp, based on plan entitlement and independently configured preferences. Free companies receive fallback `view_profile`.
- Home recommendations: segment-only `request_quote` removed. Responses expose `has_paid_plan` and `cta_visibility`, with an executable, company-targeted wizard action. Business CTA responses are `private, no-store` to avoid stale plan information.
- Category: sponsored placement no longer implies `custom_ctas` entitlement, and quote passes `preferredCompanyId`. Featured category card passes `companyId`.
- Chat recommendation: quote callback only supplied with explicit paid + effective quote decision, missing fields fail closed.
- Lead creation: directed company quote blocked when company is inactive, unapproved, or the quote CTA is not effectively enabled.
- Brand Page dashboard: legacy toggle delegates to the version-controlled, tenant-scoped `CtaVisibilitySettings`, allowing OFF→ON without self-lockout.
- Native app: public Company DTO now includes `cta_visibility`; quote CTA follows the effective decision (not `commercial_status.paid` alone).
- Registry: 24 candidate placements; code-first versions and channel/lifecycle; no promises of 24 impressions or exposure.
- Dashboard: compact IBM/Carbon-style 4-metric overview in `CompanySettings` controlled by `NEXT_PUBLIC_CONVERSION_SURFACES_DASHBOARD_ENABLED`.
- Analytics: home recommendation qualified impressions (50% visibility / 1 second) and supported clicks, plus brand hero click context, behind opt-in.
- TDD: unit/RSpec/Jest contracts and dedicated `Conversion Omnichannel` CI workflow.

## Release flags (default OFF)

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CONVERSION_SURFACES_DASHBOARD_ENABLED` | unset/false | Show conversion surfaces dashboard |
| `CONVERSION_CERTIFIED_SURFACE_IDS` | empty | Comma-separated registry IDs E2E-certified and published |
| `CONVERSION_EVENTS_V2_ENABLED` | unset/false | Enable read-model query of instrumented events |
| `NEXT_PUBLIC_CONVERSION_EVENTS_V2_ENABLED` | unset/false | Emit qualified v2 events in the public frontend |

Do not enable `CONVERSION_EVENTS_V2_ENABLED` until the Analytics Event Registry accepts the new event contract (`surface_impression`), `event_id` idempotency is validated end-to-end and LGPD consent is honored.

## Known limitations / further work

1. The 24 surfaces are **candidate code paths**, not 24 physically distinct simultaneous CTA placements. Similar responsive variants are grouped in summary.
2. Only the home recommendations and Brand Page hero are instrumented under the new surface_id standard. Do not claim full 24-channel tracking until each surface is certified.
3. Analytics `data_status: unavailable` means instrumentation is absent/not certified, **not zero**.
4. The Native App has widespread existing lint errors; investigate its complete build separately and validate navigation on physical iOS/Android devices.
5. The general RSpec baseline for main has hundreds of existing failures; run focused contracts, assess new versus baseline, then drive regression.
6. Invalidation of cached SSR directory/category/company cards on *subscription downgrade* needs a dedicated audit of plan lifecycle callbacks and real-time public response; quote creation is protected by the backend, but prior cached WhatsApp links may remain until refresh. **Do not activate wide rollout until this is solved.**
7. E2E Playwright flows for every paid/free/sponsored/sunset combination are not complete. PR #67 must remain **draft**, no merge.
8. No production deployment, entitlement backfill or database changes were intentionally made by this PR.

## Definition of done / certification

- Paid+effective and Free/expired/sponsored state verified for quote AND WhatsApp on home, category, search, brand profile, related, compare, product, chat, and native mobile.
- User preferences OFF→ON; optimistic lock conflicts 409; tenant isolation.
- Cache invalidation on plan entitlement transition, category/feed/home/brand, including CDN; no expired WhatsApp links.
- No frontend capability can bypass Rails at directed quote submission.
- Actual CTA actions (navigation/wizard/WA) match label, company destination, analytics source.
- No fabricated impression, CTR, conversion, WhatsApp conversation or lead counts.
- Focused and general CI green or baseline waivers explicitly explained; visual QA 320/360/390/430/768/1440.
- Performance and LGPD checked; no lead-sale product or guarantee.
