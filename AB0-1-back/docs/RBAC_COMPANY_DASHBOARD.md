# RBAC Matrix - Company Dashboard

Date: 2026-02-24

## Access Matrix

| Role | View dashboard | Update company | Manage sector questions | Track analytics events | ActiveAdmin |
| --- | --- | --- | --- | --- | --- |
| admin | yes (all) | yes (all) | yes (all) | yes | yes |
| company owner | yes (own) | yes (own) | yes (if sector ratings enabled) | yes | no |
| company editor member | yes (member) | yes (active member) | yes (if sector ratings enabled) | yes | no |
| company viewer member | yes (member) | no | no | public events only | no |
| review user | review flows only | no | no | yes (review/public/internal telemetry) | no |
| regular user | public pages only | no | no | public events only | no |

## Enforcement Points

- Policy: `AB0-1-back/app/policies/company_policy.rb`
  - `update?` allows admin, direct owner, active owner/editor/manager memberships.
  - `show?` allows admin, owner, active membership.
- Dashboard sector questions: `AB0-1-back/app/controllers/api/v1/company_sector_questions_controller.rb`
  - Requires auth.
  - Requires company context.
  - Requires `sector_ratings_enabled`.
  - Enforces free vs paid limits.
- Analytics auth: `AB0-1-back/app/services/analytics/track_event_service.rb`
  - Internal telemetry events are allowlisted.
  - Public company events are allowlisted.
  - Restricted cross-company events are blocked.

## Maintenance Rules

1. Any new company role must update:
   - `CompanyPolicy`
   - request specs under `spec/policies` and `spec/requests/api/v1`
2. Any new gated feature must have:
   - a model method in `Company`
   - one request or service spec validating free and paid behavior
3. Keep policy and UI in sync:
   - dashboard buttons must be disabled if backend denies the action

