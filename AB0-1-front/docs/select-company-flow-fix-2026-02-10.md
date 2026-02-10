# Select Company Flow - Investigation and Fixes (2026-02-10)

## Scope
Fixes for company listing/search/selection on `/select-company` after login, plus approval request flow integration with admin.

## Root causes found
1. Frontend page listed only `companies/mine` and used only client-side filtering by name.
2. "Suggested companies" section was static and disabled (not connected to API).
3. `GET /company_access/context` did not support query params (`q`, `limit`) for partial search.
4. Role gate in context/create flow did not consistently allow review users in the same way as company users.
5. Namespaced constant resolution could map `Company` to `Api::V1::Company` instead of the model (`::Company`) in API controllers.
6. `GET /company_access/context` was not defensive against schema/runtime differences (missing columns, nil associations), which could trigger `500` for specific users/environments.
7. Home category rendering depended on remote category endpoints and, in total API failure scenarios, fallback returned empty arrays, leaving category cards/search in a broken loading/empty state.

## Backend changes
- `AB0-1-back/app/controllers/api/v1/company_access_controller.rb`
  - Added role authorization for `company` and `review`.
  - Added query params handling (`q`, `limit`) in `context`.
  - Added partial match filter (LIKE/contains) for company name and slug.
  - Added limit guard (`safe_limit`) and deterministic ordering.
  - Returned `city`, `state`, `verified`, `query`, `limit` in payload.
  - Fixed model reference to global constant (`::Company`).
  - Added defensive schema handling:
    - Conditional filtering/order/select only when columns exist.
    - Nil-safe serialization for memberships/requests/companies.
  - Added structured rescue with API error code `COMPANY_ACCESS_CONTEXT_FAILED` and server logging.
- `AB0-1-back/app/controllers/api/v1/company_access_requests_controller.rb`
  - Fixed model reference to global constant (`::Company`).
- `AB0-1-back/spec/requests/api/v1/company_access_spec.rb`
  - Updated expectations for review users.
  - Added query filter/limit test.
  - Added helper to create valid active companies according to current activation validations.

## Frontend changes
- `AB0-1-front/lib/api.ts`
  - Extended `CompanyAccessContext` and `CompanyAccessSuggestedCompany` typings.
  - Updated `companyAccessApi.context` to send optional params `{ q, limit }`.
  - Added stronger retry/timeout defaults and client-side cache fallback (`localStorage`) for context fetches without search query.
- `AB0-1-front/app/select-company/page.tsx`
  - Added remote search with debounce.
  - Added loading, error and success states.
  - Added request access action (`POST /company_access_requests`).
  - Added pending request handling/disabled state.
  - Kept owned company selection flow and redirect to dashboard with selected company id.
- `AB0-1-front/contexts/AuthContext.tsx`
  - Hardened post-login route check with retries/timeouts and context cache fallback before redirect decisions.
- `AB0-1-front/lib/constants/fallback-categories.ts`
  - Added static fallback categories for hard API outages.
- `AB0-1-front/lib/server/home-fallback-cache.ts`
  - Kept retry with backoff and switched terminal fallback from empty list to static fallback categories.
- `AB0-1-front/components/landing/LandingHeroSearch.tsx`
  - Added local cache read/write for categories.
  - Added robust fallback chain: API -> local cache -> static fallback.
  - Added contingency UI message instead of broken loading state.
- `AB0-1-front/components/landing/LandingCategoryChips.tsx`
  - Added fallback chips and contingency indicator when API list is empty.
- `AB0-1-front/components/landing/CategoryCardsErrorBoundary.tsx`
  - Added render error boundary for category card section.
- `AB0-1-front/app/page.tsx`
  - Wrapped category card grid with `CategoryCardsErrorBoundary` and fallback status messaging.

## End-to-end tests
- `AB0-1-front/tests/select-company-flow.spec.ts`
  - Added/updated scenarios:
    - Search by name + request approval.
    - Select a different owned company.
  - Validated on desktop/mobile and cross-browser projects.

## Unit tests added
- `AB0-1-front/components/landing/__tests__/LandingHeroSearch.test.tsx`
  - Validates fallback categories, cache write, and navigation by category slug.
- `AB0-1-front/components/landing/__tests__/LandingCategoryChips.test.tsx`
  - Validates fallback rendering and API-data rendering.
- `AB0-1-front/components/landing/__tests__/CategoryCardsErrorBoundary.test.tsx`
  - Validates visual fallback when category card rendering throws.

## Validation run
- Front unit tests (new files): passed (6 tests).
- Backend request spec file: passed (7 examples, 0 failures).
- Playwright flow spec:
  - chromium-desktop: passed
  - chromium-mobile: passed
  - firefox: passed
  - webkit: passed
- `npm run lint`: not clean due pre-existing unrelated repository issues (e.g. missing `motion` imports in dashboard files).

## Monitoring and prevention
- Backend:
  - `company_access/context` now returns deterministic error code (`COMPANY_ACCESS_CONTEXT_FAILED`) and logs contextual metadata for faster incident triage.
  - Added metric counter `ab0_company_access_context_requests_total{status="success|error"}` in Yabeda/Prometheus.
  - Keep observing `/metrics` and app logs for spikes in `5xx` on `company_access/context`.
  - Added ready-to-apply Prometheus alert rules at `AB0-1-back/docs/monitoring/company-access-context-alerts.yml`.
- Frontend:
  - Category/search experience now survives API outages through local cache + static fallback categories.
  - Select-company context fetch uses retries with exponential backoff and local cache fallback.
- Suggested Prometheus alert (if Prometheus/Alertmanager is enabled):
  - Trigger when `5xx` ratio for `company_access/context` exceeds 5% for 5 minutes.
  - Trigger when home category fallback usage remains high for >10 minutes (derived from app logs/Sentry tags).

## Note
`AB0-1-front/.cache/home-fallback-cache.json` can change during local Next.js/Playwright runs as generated cache output.
