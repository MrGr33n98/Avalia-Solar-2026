# Implementation Plan: CRM Tenant Isolation & Referential Integrity Hardening

**Branch**: `002-crm-tenant-integrity`
**Spec**: `specs/002-crm-tenant-integrity/spec.md`
**Status**: Planning / Design

## Technical Context

- **Stack**: Ruby 3.2.2, Rails 7.0.8, PostgreSQL 14+, Sidekiq 7, RSpec 6.
- **Location**: `AB0-1-back/app/controllers/api/v1/sales/`, `AB0-1-back/app/services/sales/`, `AB0-1-back/app/models/sales/`, `AB0-1-back/app/policies/sales/`.
- **Core Abstractions**: `Sales::TenantScope`, `Sales::AuthorizationService`, `Sales::BaseController`.
- **Primary Goal**: Ensure zero cross-tenant data leaks and enforce strict multi-entity referential integrity across all internal Sales CRM endpoints without breaking brownfield contracts.

## Architecture & Governance Checks

1. **Tenant Anchor**: `Company` (`company_id`) is the canonical empresarial tenant anchor. `Sales::Account` is the primary commercial anchor.
2. **Lookup Pattern**: Scoped lookups (`TenantScope` + `.find` / parent association) replace global `.find`.
3. **Multi-Entity Referential Checks**: Every mutation payload (Task, Activity, Email, Lead, Opportunity, Qualification, Consent, Note, Employment, Committee) must validate that all referenced FKs belong to the same authorized commercial account/tenant.
4. **Error Uniformity**: Return 404 for nonexistent or hidden out-of-scope resources to prevent ID enumeration. Return 403 for unauthorized actions on visible resources. Return 422 for unresolvable cross-entity reference mismatches.
5. **No Migration Policy**: Gate 0 refactors application-level lookups, policy gates, and service validations without structural DB migrations.

## Phase 0: Research & Findings Summary

- **Today Queue**: Scope overdue, today, upcoming, no_next_action, and stale queries by authorized account/tenant.
- **Activities & Tasks**: Validate account/contact/opportunity trios. Enforce owner = current_user for Tasks.
- **Qualification & Consent**: Chain lookups directly through authorized parent Opportunity/Contact.
- **Contacts & Employments**: Validate primary account and secondary employments within same tenant.
- **Leads & Opportunities**: Validate account, primary contact, secondary contacts, owner, and stage-pipeline parity.

## Phase 1: Artifacts

- Data Model & Integrity Rules: `specs/002-crm-tenant-integrity/data-model.md`
- Quickstart & Validation Guide: `specs/002-crm-tenant-integrity/quickstart.md`
- Task Execution Plan: `specs/002-crm-tenant-integrity/tasks.md`
