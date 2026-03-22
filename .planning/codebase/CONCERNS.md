# Concerns / Debt

## Frontend (AB0-1-front)
- Missing or inconsistent Types generic mappings on nested data elements (`(rev as any)?.rating` etc) forcing bypass of TypeScript protections.
- Potential performance degradation with overly heavy components (`app/companies/[id]/CompanyDetailClient.tsx`). The use of multiple Next.js Dynamic components with arbitrary Skeletons helps mitigate initially, but could be cleaner if server rendered logic completely.
- Managing dynamic UI state related to `Image` paths returning HTTP `404` errors silently without safe fallbacks (although some have `zap` generic placeholders to mitigate this issue natively).

## Backend (AB0-1-back)
- Ensuring `Sidekiq/Redis` processes do not hang on heavy bulk Trust Score recalculations across highly active tables.
- Complex Schema validations or ActiveAdmin dashboard query performance degradations without caching mechanisms over large datasets.
- Syncing API routes cleanly with TS models on the frontend (`TrustHealth`, `IntentSummary`) without creating divergent logic.
