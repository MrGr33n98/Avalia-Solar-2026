# Spec 014 — Real-world and laboratory performance evidence

Updated: **2026-11-19**, prior to deployment of PR #203.

## Baseline provenance

- **Field data:** PostHog project `336078` (linked to `www.avaliasolar.com.br`), `$web_vitals` event, 7-day rolling window on 2026-11-19 (approximately Nov 12–19), domain filter `$host = www.avaliasolar.com.br`, test accounts filtered for the typed p75 query.
- **Method:** PostHog `query-web-vitals` p75 grouped by path, plus HogQL sample count broken down by `$device_type`. Raw events may arrive asynchronously; counts are snapshots and can vary slightly between queries.
- **Status:** production before branch deployment. The installed code in `main` is not necessarily unchanged for the entire 7-day window; no release SHA dimension was verified in PostHog. These measurements are **not** a same-commit Lighthouse baseline.
- **Interpretation:** p75 estimates with fewer than 100 samples are provisional, especially samples below 30. Absence of a metric is not evidence of meeting its threshold.

## Observed production RUM (not lab), past 7 days

| Public route | LCP p75 | LCP samples | INP p75 | INP samples | FCP p75 | FCP samples | CLS p75 | CLS samples |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | 2,914 ms | 123 | 240 ms | 84 | 2,239 ms | 156 | 0.09365 | 4 |
| `/search` | 3,323 ms | 10 | 320 ms | 24 | 1,864 ms | 16 | — | 0 |
| `/companies` | 2,972 ms | ~24–25 | — | 32 | 880 ms | 30 | — | 0 |
| `/products` | — | 2 | — | 4 | 1,957 ms | 3 | — | 0 |
| `/companies/weg` | — | 20 | 256 ms | 29 | — | 32 | — | 0 |

**Caution:** a dash means not surfaced as a reliable figure in the page breakdown; it is *not* zero. Per-route percentile is a one-off PostHog web analytics calculation, not a saved governed metric.

### Observed sample counts by device

| Route | Desktop LCP / INP samples | Mobile LCP / INP samples |
|---|---:|---:|
| `/` | 36 / 32 | 87 / 52 |
| `/search` | 3 / 19 | 7 / 5 |
| `/companies` | ~2–3 / 4 | 22 / 28 |
| `/products` | 0 / 0 | 2 / 4 |
| `/companies/weg` | 5 / 11 | 15 / 18 |

Do not publish numerical device p75 as stable until each device/route combination has sufficient samples. In particular, the desktop LCP at `/companies` is based on only ~2–3 observations.

## Laboratory baseline required before rollout (no values fabricated)

| Route | Device | Cold-load runs | Navigation runs | FCP median/worst | LCP median/worst | TBT median/worst | CLS median/worst | Script bytes median/worst | Lab TTFB proxy |
|---|---|---:|---:|---|---|---|---|---|---|
| `/` | Desktop / mobile | 0 | 0 | — | — | — | — | — | — |
| `/search?q=solar` | Desktop / mobile | 0 | 0 | — | — | — | — | — | — |
| `/companies` | Desktop / mobile | 0 | 0 | — | — | — | — | — | — |
| `/products` | Desktop / mobile | 0 | 0 | — | — | — | — | — | — |
| `/companies/weg` | Desktop / mobile | 0 | 0 | — | — | — | — | — | — |

Collection: `cd AB0-1-front && npm run perf:lhci` and `npm run perf:lhci:mobile`. After collecting actual `.report.json` files: `npm run perf:report -- --input .lighthouseci --environment staging --commit <sha>`. Three comparable runs minimum per route/device. Lighthouse desktop and mobile presets use different CPU/network profiles.

## Success targets (not measured outcomes)

LCP p75 ≤2,500ms; INP p75 ≤200ms; TTFB p75 ≤600ms for cacheable public documents; CLS p75 ≤0.1; lab FCP ≤2,000ms; TBT ≤500ms; Lighthouse performance ≥0.8; script resource transfer audit ≤450,000 bytes (currently warning). Route-level `server-response-time` is a lab proxy, not p75 field TTFB. INP is field-only and cannot be asserted through ordinary Lighthouse lab runs.

## After-deployment comparison

**Pending**. The code on PR #203 has not been deployed. A measured before/after of the same deployment population and commit cannot be claimed. Keep actual before/after evidence and the >5% regression gate once the candidate is on staging/canary.

## Observed Next.js production-build JS totals (PR #203 before final compacting, commit d2f82b4)

Measured by GitHub Actions job `135408900497`, run `44479417586`, `npm run build` with `ANALYZE=true` on 2026-11-19. Archive `spec014-build-bundle-report` ID `14508436004`.

| Public route | Next.js First Load JS | Build manifest initial JS files | On-disk uncompressed JS bytes |
|---|---:|---:|---:|
| `/` | 381 kB | 32 | 1,276,497 |
| `/search` | 410 kB | 33 | 1,342,003 |
| `/companies` | 423 kB | 35 | 1,389,245 |
| `/products` | 343 kB | 29 | 1,124,137 |
| `/companies/[id]` | 463 kB | 37 | 1,534,621 |

**Metric distinction:** Next.js “First Load JS” and manifest on-disk byte totals are NOT Lighthouse `resource-summary:script:size` transfer bytes. The 450,000-byte budget applies to the measured script transfer summary. Do not treat the above values as equivalent or as passing/failing Lighthouse. No before-build comparison or unused-JS waterfall proof has been collected.

The company profile’s First Load JS is highest, so this consolidated revision also makes the company-detail public API client and contact tab dynamically imported. Re-run the analyzer on the final commit to check for any actual reduction.
