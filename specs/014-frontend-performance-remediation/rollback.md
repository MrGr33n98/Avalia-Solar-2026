# Spec 014 — Rollback

**Owner**: frontend release owner / on-call; **approver**: product owner. Record the actual names during rollout.

- Changes are isolated to `feat/spec-014-frontend-performance-foundation-20261119` until CI and performance review pass.
- Use a per-route feature flag where server-first cutover introduces rollout risk. Never switch user-specific data to public cache.
- If HTML differs from expected client state, if SEO/canonical/JSON-LD regresses, or if LCP/INP/CLS/bundle regresses >5%, stop rollout. Revert the affected PR/route to last green SHA, redeploy, and verify the health endpoint.
- Preserve observability and baseline documentation during rollback.
- Monitor Sentry errors, hydration mismatch messages, request duplication, JS/download volume, TTFB and conversion events by release SHA.
- Never disable Pundit or API authorization to repair performance.
- Re-run Lighthouse and smoke routes after rollback; record evidence in REPORT.md.
