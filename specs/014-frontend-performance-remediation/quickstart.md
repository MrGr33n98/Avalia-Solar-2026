# Spec 014 — Measurement quickstart

1. Checkout a SHA and save it in metrics.md. Use a **real** backend data source; record its version and timezone.
2. Build: `cd AB0-1-front && npm ci && npm run build`; start with `npm run start`. Ensure correct PUBLIC API host.
3. Run Lighthouse CI `npm run perf:lhci` (desktop config); run separate mobile collection with Chrome DevTools / mobile LHCI overrides. Three runs per route minimum.
4. Test `/`, `/search?q=solar`, `/companies`, `/products` and `/companies/weg`. Run cold cache and warm in-app navigation separately. Export JSON, HAR and request initiators.
5. Measure user interactions in DevTools Performance (search typing, filters, pagination, detail tabs); use PostHog/GA RUM for INP p75 segmented by route and device. Record real data window and sample size.
6. Extract HTML response: inspect whether first company/product card is in server HTML, not only displayed after hydration. Record first_data_visible as client observation (hydration timing) rather than a substitute for element paint.
7. Export JS resource-summary bytes and inspect leaflets, Sentry, maps and heavy gallery chunks only when corresponding feature activated.
8. Measure after changes with identical controls. Fill metrics.md with numbers and compare, then approve or roll back in REPORT.md.

No metric should be inferred from static source, mocks, screenshots or an unexecuted CI workflow.
