# Avalia Solar — Conquistas | GAP analysis & rollout

## Evidence (19 Nov 2026)

- Reference: G2 Achievements screenshot supplied by the product owner.
- Current production screenshot: review dashboard /achievements shows **0/0**, with no badges.
- API path: `GET /api/v1/review_dashboard/achievements`.
- Backend catalog source: `db/seeds/achievements.yml` (17 definitions, 14 enabled).
- Read model: `AchievementBadge.active.ordered`. Empty/disabled database rows produce `summary.total_count: 0`.
- Original payload asset paths were relative, e.g. `cards/01_review_approved_1.svg`, not browser-ready URLs.
- Rendering added an artificial 4% minimum width even when progress was zero.
- Existing front-end page tests used an obsolete context contract instead of the live React Query API.

## Target design — G2 composition, original Avalia Solar brand assets

- Top white information surface (instead of a large dark hero), short lead copy, small KPI cells.
- Four equal columns at desktop (`lg`), three at tablet (`sm`), two on mobile/PWA.
- Compact near-square-corner cards, original first-party SVG emblems in a neutral inset well.
- Earned = full-color SVG; locked = first-party locked SVG, desaturated state.
- Name below illustration, maximum two lines. Earned cards show a small LinkedIn share CTA.
- Clicking the badge opens a compact details dialog with requirements and a link to the associated action.
- No generic achievement/trophy/lock icon substituted for first-party badge art.
- 0% shows an empty progress track, with no fabricated minimum.
- Empty catalog is labelled as unpublished/unavailable, **not** as all achievements complete.

## Root cause and deployment

The catalog is loaded by `db:seed`, but typical production releases run only `db:migrate`. The additive migration `20261119070000_backfill_reviewer_achievement_catalog.rb` creates **only missing slugs** from the canonical YAML. It does not overwrite manually curated records or user achievements. Its down migration preserves referenced data.

The same patch corrects API asset URLs to `/assets/achievements/...`, and updates the grid, header, FAQ, modal and regression tests.

### Verification sequence

1. Merge only after frontend Jest, TypeScript build and backend RSpec pass.
2. Run migrations in the backend release:
   `docker compose exec backend bundle exec rails db:migrate`
3. Check populated catalog without modifying anything:
   `docker compose exec backend bundle exec rails runner 'puts({total: AchievementBadge.count, active: AchievementBadge.active.count}.to_json)'`
   Expected if starting empty: 17 catalog rows, 14 active.
4. Sign in with a reviewer and check `/review-dashboard/achievements` displays 14 entries on "Todas" and that SVGs load without 404. Do **not** substitute mock badges for production data.
5. Check zero-progress rendering, filtering, PWA at 320/375/390 px and desktop at 1280/1440 px, keyboard focus, modal, sharing, dark mode.
6. Existing reviewers may require a one-time **controlled** re-evaluation of earned badges; do not grant XP by changing the UI. After approval and with Sidekiq running, enqueue `Gamification::ReevaluateUserJob` for affected reviewer IDs in batches, then confirm ledger idempotency and XP totals.
7. Monitor API 503, front-end image 404, pending jobs and `X-Request-ID`. If there are zero active rows after migration, inspect manually disabled catalog records and verify release database selection; this migration intentionally does not reactivate existing inactive rows.

### Files changed

- `AB0-1-front/app/review-dashboard/achievements/page.tsx`
- `AB0-1-front/components/review-dashboard/achievements/AchievementCard.tsx`
- `AB0-1-front/components/review-dashboard/achievements/AchievementSummaryHeader.tsx`
- `AB0-1-front/components/review-dashboard/achievements/AchievementDetailModal.tsx`
- `AB0-1-front/components/review-dashboard/achievements/AchievementFaqAccordion.tsx`
- `AB0-1-front/app/review-dashboard/achievements/page.spec.tsx`
- `AB0-1-back/app/services/gamification/read_model_service.rb`
- `AB0-1-back/db/migrate/20261119070000_backfill_reviewer_achievement_catalog.rb`
- `AB0-1-back/spec/requests/api/v1/review_dashboard/achievements_spec.rb`

### Non-goals

No redesign of the global brand page; no fake XP, no access-control changes, no mass re-evaluation inside database migrations, and no replacement of original badge SVGs.
