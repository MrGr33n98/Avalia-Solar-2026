# Spec 014 — Reproducible baseline quickstart

1. Check out the target commit and install using the committed lockfile: `cd AB0-1-front && npm ci`.
2. Build production mode with required public API configuration: `npm run build`. Start `npm run start` separately; verify API reachability and HTML status before collecting.
3. Run `npm run perf:lhci` after ensuring no competing server holds port 3000. Current config collects three desktop runs for each listed route; keep logs and artifacts. Record Lighthouse version and environment.
4. Collect **separate** mobile runs at 360×800 and 390×844 with the mobile preset and equivalent network/CPU settings. The current desktop preset does not constitute mobile evidence.
5. Open each route in a fresh browser context for cold-load tests; use performance navigation entries and DevTools waterfall. Verify public results are in the server HTML/RSC rather than only after a hydration-triggered request.
6. Run client-side navigation and interactions (type, filter, paginate, change tab) separately; record input delay, paint and `PerformanceObserver` Web Vitals or production RUM. Do not infer INP from TBT.
7. Export HAR (redact authorization/cookies), script summary and `.next` analyzer data. Categorize critical, secondary, intent-triggered requests, including map/Leaflet chunks and analytics.
8. Enter the **observed** figures into `metrics.md`. Run at least 3 comparable executions before and after each route migration.

Command: `cd AB0-1-front && npm run perf:lhci`.

Rollback: revert the route-specific commit/feature flag only after observing error rates and metric deterioration, then compare with the original measurement conditions.

## Mobile collection and scope
- Desktop: `npm run perf:lhci` uses the existing 1350px desktop preset, three runs per URL.
- Mobile: `npm run perf:lhci:mobile` uses a separate 390x844 viewport, 4x CPU slowdown and simulated mobile throttling, three runs per URL. Record these preset differences in `metrics.md`; never compare desktop and mobile scores as the same series.
- `server-response-time` is a lab proxy and a **warning**; the defined TTFB p75 target still requires real-user instrumentation.
- Report emitted `web_vital` with `metric_name`, `metric_value`, `route` and `source`, using the preexisting analytics contract. A page event from a post-hydration effect is not proof of a pre-hydration paint.
- Do not enable hard pass/fail regression thresholds before a comparable measured baseline is available. The original 450KB script metric remains a warning until owners approve enforcement.

## Current production RUM source
PostHog project 336078 → Web analytics → Web vitals. Use event `$web_vitals`, domain `$host=www.avaliasolar.com.br`, `p75`, 7-day window and segment by `$device_type`. Include sample counts (`countIf` per metric) before declaring p75 stable. See the observed data in metrics.md. Never treat current-production RUM or a low-n percentile as proof that this draft PR has improved anything.

## Spec 014 acceptance
- `npm run perf:test` runs focused structural and loader tests.
- `PERF_E2E_LIVE=1 npx playwright test tests/e2e/spec014-public-performance.spec.ts` only with a real stable API.
- `npm run analyze` builds the webpack analyzer artifacts; inspect whether Leaflet and inactive tabs are absent from the initial client entrypoints. Structural tests alone cannot prove chunk isolation.
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm run perf:lhci` and `npm run perf:lhci:mobile` are separate required checks. The dedicated Spec014 workflow runs typecheck, focused Jest and lint; build and Lighthouse require a configured app runtime.

## Verified production-build audit artifact

- GitHub Actions run: https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44479417586
- Job `135408900497`: production build + route manifest audit passed on `d2f82b4`.
- Artifact `spec014-build-bundle-report` contains `spec014-route-bundles.md`, `app-build-manifest.json` and the webpack analyzer client/edge/server HTML files.
- Re-run `npm run build` and `npm run perf:bundle` against the FINAL single commit; previous build evidence cannot validate new lazy imports.
