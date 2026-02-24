# Runbook - Company Dashboard 500

Date: 2026-02-24
Owner: backend team

## Symptoms

- Frontend shows "Erro no Dashboard" or "Erro Critico".
- API call to `/api/v1/company_dashboard/stats` returns 500.
- Logs include feature or policy exceptions.

## Fast Checks

1. Health endpoint:
   - `curl -fsS https://api.avaliasolar.com.br/health`
2. Stats endpoint with valid token:
   - `GET /api/v1/company_dashboard/stats`
3. Route checks:
   - `bundle exec rails routes -g company_dashboard`
   - `bundle exec rails routes -g sector_ratings`

## Common Root Causes and Fix

### 1) Plan feature serialization crash

- Validate company methods in console:
  - `Company.find(COMPANY_ID).effective_plan_features`
  - `Company.find(COMPANY_ID).sector_question_limit`
- If exception occurs, inspect:
  - `AB0-1-back/app/models/company.rb`
  - `AB0-1-back/app/models/plan.rb`

### 2) Forbidden update due policy mismatch

- Verify policy:
  - `CompanyPolicy.new(user, company).update?`
- Verify active membership role:
  - owner/editor/manager required for update.

### 3) Sector questions not visible on frontend

- Confirm route exists:
  - `/api/v1/companies/:id/sector_ratings/questions`
  - `/companies/:id/sector_ratings/questions` (legacy)
- Confirm CORS allows frontend origin.
- Confirm company has:
  - `sector_ratings_enabled = true`
  - at least one enabled `company_sector_question`.

## Regression Commands

Run from `AB0-1-back`:

- `bundle exec rails routes -g sector_ratings`
- `bundle exec ruby C:/Users/Bobi/.gem/ruby/3.2.0/gems/rspec-core-3.13.6/exe/rspec spec/models/company_plan_features_spec.rb spec/policies/company_policy_spec.rb spec/services/analytics/track_event_service_spec.rb spec/requests/api/v1/company_sector_questions_spec.rb spec/requests/api/v1/sector_ratings_spec.rb spec/requests/api/v1/company_dashboard_stats_notifications_spec.rb`

## Exit Criteria

- stats endpoint returns 200 for authenticated company owner/member.
- no 500 in logs for dashboard requests for 30 minutes after deploy.
- review page loads sector questions without CORS or route errors.

