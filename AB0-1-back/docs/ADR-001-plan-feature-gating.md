# ADR-001: Plan Feature Gating for Company Dashboard

- Status: accepted
- Date: 2026-02-24
- Scope: AB0-1 backend and company dashboard frontend

## Context

The company dashboard failed with `NoMethodError` when serializing plan features.
Authorization rules for analytics were also mixing telemetry infrastructure with business feature access control.
The result was:

- HTTP 500 on `/api/v1/company_dashboard/stats`
- false 403 for valid analytics events
- inconsistent limits for sector questions

## Decision

1. Expose a public and safe `Company#effective_plan_features`.
2. Make all feature reads resolve through normalized helpers:
   - `effective_plan_features`
   - `resolved_plan_features`
   - `feature_value_from_plan`
3. Keep plan gating in domain methods (`has_paid_plan?`, `sector_question_limit`, `requires_paid_plan_for_sector_question?`, `sector_question_limit_reached?`).
4. Separate telemetry authorization from paid-feature authorization in `Analytics::TrackEventService`.

## Implemented In

- `AB0-1-back/app/models/company.rb`
- `AB0-1-back/app/models/plan.rb`
- `AB0-1-back/app/services/analytics/track_event_service.rb`
- `AB0-1-back/app/controllers/api/v1/company_sector_questions_controller.rb`

## Consequences

- Dashboard stats endpoint no longer crashes when feature payload is missing or malformed.
- Free and paid limits for sector questions are deterministic and test-covered.
- Internal/public analytics events are accepted with reduced false negatives.

## Rollback

Revert the files listed in "Implemented In" and redeploy backend only.
No destructive schema change is required for this ADR.

