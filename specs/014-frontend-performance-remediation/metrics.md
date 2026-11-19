# Spec 014 — Performance baseline and before/after

**Status: NOT MEASURED (2026-11-19).** Static code inspection is NOT a baseline. Do not enter fabricated values.

## Experimental controls

- Git SHA:
- Environment / region:
- URL and representative query:
- Cache: cold document + repeat navigation (record separately)
- Browser + Lighthouse CLI version:
- Device / viewport / network / CPU:
- Authentication state: logged out
- Repetitions: at least 3 per route / viewport, identical settings.
- Capture HAR, Lighthouse JSON, screenshot and LCP element.
- Record field RUM p75 only where a statistically meaningful sample exists.

| Route | Device | Commit | Runs | LCP p75 RUM | INP p75 RUM | TTFB p75 RUM | CLS | FCP lab median | LCP lab median | TBT lab median | Lighthouse median | JS bytes | Notes |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| / | mobile | pending | 0 | — | — | — | — | — | — | — | — | — | baseline pending |
| /search?q=solar | mobile | pending | 0 | — | — | — | — | — | — | — | — | — | baseline pending |
| /companies | mobile | pending | 0 | — | — | — | — | — | — | — | — | — | baseline pending |
| /products | mobile | pending | 0 | — | — | — | — | — | — | — | — | — | — | baseline pending |
| /companies/weg | mobile | pending | 0 | — | — | — | — | — | — | — | — | — | — | baseline pending |
| / | desktop | pending | 0 | — | — | — | — | — | — | — | — | — | baseline pending |
| /search?q=solar | desktop | pending | 0 | — | — | — | — | — | — | — | — | — | — | baseline pending |
| /companies | desktop | pending | 0 | — | — | — | — | — | — | — | — | — | baseline pending |
| /products | desktop | pending | 0 | — | — | — | — | — | — | — | — | — | — | baseline pending |
| /companies/weg | desktop | pending | 0 | — | — | — | — | — | — | — | — | — | — | — | — | baseline pending |

## Gate

Targets: field LCP p75 ≤2.5s, INP p75 ≤200ms, TTFB p75 ≤600ms (cacheable routes), CLS ≤0.1; lab FCP ≤2s, TBT ≤500ms; Lighthouse perf ≥0.80; lighthouse script transfer ≤450000 bytes per page. Before/after deviation must be ≤5% unless explicitly approved. Lighthouse does not provide real field INP; measure it separately with RUM. Never treat Lighthouse simulated TTFB as field p75.
