# Changelog - Dashboard Stability and Sector Questions

Date: 2026-02-24

## Goal

Stabilize company dashboard, restore sector question flow end-to-end, and align plan gating, policy, and analytics authorization.

## Backend Changes

- `AB0-1-back/app/models/company.rb`
  - Added public `effective_plan_features`.
  - Removed circular feature resolution path.
  - Hardened feature parsing and normalized feature reads.
  - Fixed free/paid question limits with explicit helpers.
- `AB0-1-back/app/models/plan.rb`
  - Added `feature_flags` parser for `features` and `features_json`.
- `AB0-1-back/app/policies/company_policy.rb`
  - `update?` now supports admin, owner, active owner/editor/manager membership.
  - `show?` and scope aligned with active memberships.
- `AB0-1-back/app/services/analytics/track_event_service.rb`
  - Added internal/public event allowlists.
  - Normalized event type handling (supports labels like "Theme Changed").
- `AB0-1-back/app/controllers/api/v1/sector_ratings_controller.rb`
  - API auth flow normalized.
  - Company lookup supports both `:id` and `:company_id`.
  - Legacy score hydration for custom answers.
- `AB0-1-back/app/controllers/api/v1/company_sector_questions_controller.rb`
  - Added strict access check and plan-limit checks.
  - Improved metadata payload for frontend decisions.
- `AB0-1-back/config/routes.rb`
  - Fixed sector ratings route structure.
  - Added legacy fallback routes without `/api/v1`.
- `AB0-1-back/config/initializers/cors.rb`
  - Added CORS resources for legacy sector ratings paths.
- `AB0-1-back/config/sidekiq.yml`
  - Timeout aligned to 30s.
- `AB0-1-back/docker-compose.yml`
  - Redis maxmemory updated to 512mb with sample tuning.

## Frontend Changes

- `AB0-1-front/components/company/SectorRatingForm.tsx`
  - Moved API access to shared `fetchApi`.
  - Preserved custom/default question submit flow.
  - Kept render focused on question prompts.
- `AB0-1-front/app/dashboard/components/SectorQuestionsManager.tsx`
  - Reimplemented with:
    - create/edit/delete/toggle
    - modal to list all questions
    - plan-limit and enabled-state UX feedback

## Infra/Docker

- `Dockerfile.backend`
  - Added `libvips` packages to improve ActiveStorage image analysis.
- `docker-compose.yml`
  - Redis maxmemory aligned with backend compose.

## Tests Added or Updated

- Added:
  - `AB0-1-back/spec/models/company_plan_features_spec.rb`
  - `AB0-1-back/spec/policies/company_policy_spec.rb`
  - `AB0-1-back/spec/services/analytics/track_event_service_spec.rb`
  - `AB0-1-back/spec/requests/api/v1/company_sector_questions_spec.rb`
- Updated:
  - `AB0-1-back/spec/requests/api/v1/sector_ratings_spec.rb`

## Validation Executed

- Route validation:
  - `bundle exec rails routes -g sector_ratings`
- Regression specs (targeted):
  - 21 examples, 0 failures

## Known Remaining Gaps

- Frontend lint currently has pre-existing global issues unrelated to this patch.
- WebSocket availability still depends on production proxy/runtime setup.

