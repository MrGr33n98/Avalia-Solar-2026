# Spec 014 — Rollback and operational signals

Owner: frontend maintainer; release approver: repository maintainers. No production cutover without CI and baseline.

Gate signals: hydration mismatches, JavaScript runtime errors, unexpected 401/403, canonical/JSON-LD drift, stale company data, double requests, RUM LCP/INP/CLS, API 5xx, broken empty/error/pending states, script bytes and Lighthouse checks.

For each route, keep an independent PR and rollback commit. Use a named feature flag only if already present or added with a tested default-off branch. Reverting to client data fetching is acceptable as a temporary mitigator if authorization/SEO remains correct. Avoid blanket `db:seed` or database changes during frontend rollback.

When rolling back, preserve telemetry and add a release note with incident timestamp, commit, route, device and confirmed evidence. Never remove authorization gates in the course of performance optimization.
