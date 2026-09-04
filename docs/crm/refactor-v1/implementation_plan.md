# Implementation Plan — Avalia Solar CRM V2.1 Master PDR (Core Certification, Security, Performance & Sales Operating System)

Comprehensive architectural design and implementation roadmap for Avalia Solar CRM V2.1, addressing all P0 data integrity and IDOR gaps, P1 reporting query optimizations, P2 sequence/campaign engines, and 3-level production certification.

---

## 1. Certification Level Hierarchy

To eliminate ambiguity between code completion and production verification, every capability must progress through three explicit verification levels:

```text
LEVEL 1 — CODE VERIFIED
File created/modified, internal contracts & interfaces code-reviewed.

LEVEL 2 — TEST VERIFIED
Automated suite (RSpec, Jest, tsc, Next build, Zeitwerk) executed with exit code 0.

LEVEL 3 — PRODUCTION VERIFIED
Deployed SHA confirmed on production, authenticated user session established,
full CRUD operation executed, post-F5 persistence verified, zero uncaught browser errors.
```

---

## 2. Baseline Real State

- **Baseline Commit**: `95039c2f27a4ac9ac7412d26fa15d24f7edc95cb` (`feat(crm): implement P0 tenant scope integrity and analytics quick wins`)
- **GH Actions Status**: Run `#33843473216` (Workflow `.github/workflows/deploy-v1.yml`) -> **SUCCESS** (Frontend Build, Backend Build, Zeitwerk/Boot, Deploy over SSH all green).
- **Deployed SHA**: `95039c2f27a4ac9ac7412d26fa15d24f7edc95cb`
- **Current Certification Level**: `LEVEL 2 — TEST VERIFIED` (Production Verified = `PENDING` until authenticated smoke test completes).

---

## 3. P0 Core Security, Tenant Safety & Data Integrity

### P0.1 Tenant Ownership Model (`docs/crm/refactor-v1/TENANT_OWNERSHIP_MODEL.md`)
- Document canonical tenant identification rules (`User.company_id` / `owner.company_id` as generic tenant scope; `Sales::Account.company_id` as optional 1-to-1 link to Marketplace Company).

### P0.2 Complete Tenant Scope (`AB0-1-back/app/services/sales/tenant_scope.rb`)
- Expand `Sales::TenantScope.for(user)` to cover 100% of private sales resources (`accounts`, `contacts`, `opportunities`, `tasks`, `activities`, `notes`, `email_messages`, `email_events`, `quotes`, `quote_items`, `tags`, `saved_views`, `sequences`, `campaigns`, `custom_field_definitions`).

### P0.3 Contact Options IDOR Protection (`ContactsController#index`)
- Ensure `params[:sales_account_id]` / `params[:account_id]` in `ContactsController#index` scopes `account_id` through `TenantScope.for(current_user).accounts.find_by(id: acc_id)`. Return `404 Not Found` (no existence leak) for foreign account IDs.

### P0.4 Contact Create Foreign Account & Owner Protection (`ContactsController#create`)
- Verify `sales_account_id` via `TenantScope.accounts.find_by(id: acc_id)`.
- Validate `owner_id`/`user_id` to ensure assignment only to users within the same tenant.

### P0.5 Eliminate `User.first` Fallbacks
- Remove all `current_user || User.first` or `@actor = actor || User.first` fallbacks across `LeadsController`, `LeadConversionService`, `Sales::Leads::Create`, `Sales::Opportunities::Create`, `AccountsController`, `ContactsController`, `TasksController`, `ActivitiesController`. Return `401 Unauthorized` for unauthenticated requests.

### P0.6 Eliminate Fake Contact Emails
- Refactor `LeadConversionService` to NEVER generate fake emails (`<generated>@contato.crm`). Only create contact records with real user/import data or convert without contact if missing.

### P0.7 Lead Conversion Tenant Safety
- Scope target pipeline stage strictly through `opportunity.pipeline.stages.find_by(...)` or tenant-scoped pipeline relations.

### P0.7B Lead Create Foreign-Reference Protection (`Sales::Leads::Create`)
- Audit `Sales::Leads::Create` to validate every foreign key (`sales_account_id`, `primary_contact_id`, `sales_pipeline_id`, `sales_stage_id`, `source_id`, `contact_ids`, `competitor_ids`) through `TenantScope`.

### P0.8 Bulk Stage Update Domain Integrity (`LeadsController#bulk`)
- Stop raw `update_all(sales_stage_id: ...)` for stage transitions. Loop through batch using `Sales::StageTransition.call(...)` to emit `StageHistory` and `DomainEvent`.

### P0.9 Bulk API Contract & Atomicity
- Enforce explicit supported actions (`assign_owner`, `change_stage`, `change_status`, `change_temperature`, `add_tag`, `remove_tag`, `archive`).
- Return `422 INVALID_BULK_ACTION` for unknown actions.
- Return partial success breakdown: `{ requested_count, matched_count, updated_count, failed_count, failures: [] }`.

### P0.10 Email Analytics Tenant Leak
- Ensure `email_metrics` uses `Sales::TenantScope.for(current_user).email_events`.

### P0.11 No Silent Analytics Failures
- Remove `rescue => e ... {}` fallbacks in reporting controllers to prevent masking infrastructure/database failures as zero data.

### P0.12 Attribution Tenant Safety (`AttributionController`)
- Scope `TrackingSession` through `TenantScope.for(current_user)` accounts and contacts.

### P0.13 Forecast SQL Optimization (`ForecastController`)
- Replace in-memory Ruby `group_by` with native PostgreSQL `DATE_TRUNC('month', expected_close_date)` and `SUM(...)` aggregation.

### P0.14 Opportunity Closure Semantics & Migration
- Ensure schema includes `closed_at`, `won_at`, `lost_at` with composite indexes `(owner_id, won_at)`, `(owner_id, lost_at)`, `(status, closed_at)`.
- Update `StageTransition` to set `won_at`/`lost_at`/`closed_at` on terminal stage movements.

### P0.15 Sales Authorization Matrix (Pundit Policies)
- Enforce Pundit policies across Accounts, Contacts, Opportunities, Tasks, Activities, Emails, Reports, Exports, Campaigns, Settings, and API Keys.

### P0.16 Canonical API Error Contract
- Enforce standard JSON error response across all endpoints:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Não foi possível salvar.",
      "fields": { "email": ["inválido"] },
      "request_id": "req-12345"
    }
  }
  ```

### P0.17 Archive Strategy
- Implement `archived_at`, `archived_by_id`, `archive_reason` for Accounts, Contacts, Opportunities, Campaigns, Templates, and Sequences instead of destructive `destroy_all`.

---

## 4. P1 Reporting, Query Optimization & Workspace Shell

### P1.1 Extract Reporting Query Objects (`app/queries/sales/reporting/`)
- `team_performance_query.rb` (Single SQL `GROUP BY owner_id` query instead of loop-per-owner).
- `loss_reasons_query.rb` (Single SQL aggregation on `lost_reason`).
- `email_metrics_query.rb` (Tenant-scoped email event count breakdown).
- `overview_query.rb`, `funnel_query.rb` (Max 2 SQL queries for funnel), `revenue_query.rb`, `forecast_query.rb`, `attribution_query.rb`.

### P1.2 Reporting Previous-Period Deltas & Contract V2
- Include `previous_value`, `delta_absolute`, `delta_percent`, `trend` (`up`/`down`/`flat`) in executive KPI payload.

### P1.3 Shared CRM DataGrid & Backend Contract (`components/sales/grid/`)
- Universal `CRMDataGrid` supporting server-side search (`q`), filtering (`filters`), sorting (`sort`, `direction`), pagination (`page`, `per_page`), and URL state persistence.

### P1.4 Canonical Timeline Query (`Sales::TimelineQuery`)
- Unified timeline query aggregating `StageHistory`, `Activity`, `Task`, `Note`, `EmailMessage`, `EmailEvent`, `Quote`, and `DomainEvent`. Refactor `Account360`, `Contact360`, and `Opportunity360` to use this single query object.

### P1.5 Redis Caching & Invalidation Matrix
- Cache taxonomies (10m), pipelines (5m), reports (30-60s), forecast (30s), and funnel (30s) using key format `crm:v2:tenant:<id>:<resource>:<digest>`. Invalidate automatically on domain mutations.

---

## 5. P2 Sequence Runtime, Campaign Engine & Safety

### P2.1 Sequence Runtime (`sales_sequence_enrollments`)
- Track status (`active`, `paused`, `completed`, `stopped`), current step, next run time, auto-stop triggers (reply, bounce, complaint, suppression).
- Background worker `Sales::ExecuteSequenceStepJob`.

### P2.2 Campaign Engine & LGPD Consent Gate
- `Sales::Campaign`, `Sales::Segment`, `Sales::CampaignRecipient`.
- Audience snapshot freezing prior to launch, preflight checks, SES rate-limiting, and centralized LGPD suppression/consent gate.

---

## 6. Verification & Quality Gates

### Automated Verification Gates
- **Backend Quality**:
  ```bash
  bundle exec rails zeitwerk:check
  bundle exec rails db:migrate:status
  bundle exec rspec spec/services/sales/tenant_scope_spec.rb
  ```
- **Frontend Quality**:
  ```bash
  cd AB0-1-front
  npm run typecheck
  npm run test -- --runInBand
  npm run build
  ```

### Production Authenticated Smoke Test
Upon deployment of HEAD commit, execute authenticated browser/API smoke test on `https://crm.avaliasolar.com.br`:
1. **Accounts**: Create -> List -> Edit -> F5 reload.
2. **Contacts**: Create -> Link Account -> Edit -> F5 reload.
3. **Leads / Pipeline**: Create -> Convert -> Drag-and-drop Stage change -> F5 reload.
4. **Reports**: Load -> Change Period -> Verify Tenant Isolation -> Export CSV.
5. **Browser Audit**: 0 uncaught exceptions, 0 unhandled promise rejections, 0 critical 404/5xx.

---

## 7. Implementation Progress & Matrix Status

| Capability | File paths | Implementation | Test Status | Production Smoke | Certification Level |
|---|---|---|---|---|---|
| Tenant Scoping Canonical | `AB0-1-back/app/services/sales/tenant_scope.rb` | IMPLEMENTED | VERIFIED | PENDING | LEVEL 2 |
| Contact Options IDOR | `app/controllers/api/v1/sales/contacts_controller.rb` | IMPLEMENTED | VERIFIED | PENDING | LEVEL 2 |
| Lead Conversion Safety | `app/services/sales/lead_conversion_service.rb` | IMPLEMENTED | VERIFIED | PENDING | LEVEL 2 |
| Bulk Stage Transition | `app/controllers/api/v1/sales/leads_controller.rb` | IMPLEMENTED | VERIFIED | PENDING | LEVEL 2 |
| Analytics & Reports | `app/controllers/api/v1/sales/analytics_controller.rb` | IMPLEMENTED | VERIFIED | PENDING | LEVEL 2 |
| Reporting Query Objects | `app/queries/sales/reporting/` | IMPLEMENTED | VERIFIED | PENDING | LEVEL 2 |
| Canonical Timeline | `app/queries/sales/timeline_query.rb` | IMPLEMENTED | VERIFIED | PENDING | LEVEL 2 |
