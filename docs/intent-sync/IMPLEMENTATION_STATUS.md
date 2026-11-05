# Avalia Solar — Intent Sync (company-facing) implementation status

**Branch:** `feat/intent-sync-company-saas-foundation`  
**Target:** review via draft PR; NOT production-ready.  
**Scope:** initial Rails/API + compact Next.js/PWA implementation.  
**No CRM dependency:** no `Sales::Audience`, `Sales::Contact`, `Sales::Account` reads are allowed from the `DemandActivation` domain.

## What exists in this branch

- Separate `DemandActivation` tables: sources, audience segments, provider connections, sync jobs and metadata-only audit events.
- Scoped company APIs to create and archive draft audiences, register unverified company-owned source metadata, read safe status/history and list sources.
- Closed-by-default `intent_sync` entitlement in `PlanFeatureCatalog` and second environment gate `INTENT_SYNC_ENABLED=true` (defaults OFF).
- CompanyMember checks on ALL actions; owner/manager restrictions for source registration, audience updates and archival. Editor may create draft only.
- Provider connections are placeholder metadata with no credential fields; all real sync attempts return `INTENT_SYNC_NOT_READY` (409) even with the flag ON.
- Integration entry inside Track Your Prospects > Integrações, preserving existing GA4 and Custom IDs.
- IBM/Carbon-inspired compact responsive UI, source metadata form, draft wizard, paginated list, audit and execution history, explicit locked states.
- Basic RSpec/Jest coverage for isolation, feature gates, fail-closed sync and company-scoped API calls.

## Prerequisites for local review

1. Run the new Rails migration `20261106000100_create_demand_activation_foundation` **in a disposable development database**.
2. Leave `INTENT_SYNC_ENABLED` unset for ordinary use; the customer sees a non-operational informational view.
3. To test gated draft-only flow, set `INTENT_SYNC_ENABLED=true` in local development AND grant the `intent_sync` entitlement explicitly to a test company plan. This never enables provider transmission.
4. Navigate to company Dashboard > Track Your Prospects > Integrações > Intent Sync, keeping company context.
5. Confirm all integrations still behave normally when returning to the parent tab.

### Suggested local verification (not claimed as executed)

```bash
cd AB0-1-back
bundle exec rails db:migrate
bundle exec rspec spec/requests/api/v1/demand_activation_spec.rb

cd ../AB0-1-front
npm run typecheck
npm test -- --runInBand lib/api/intent-sync.spec.ts
npm run lint
```

## Explicitly NOT implemented

- Live OAuth/token vault and provider account management.
- LinkedIn partner approval, Meta permission approval, Google API eligibility.
- Real Customer Match / Custom Audiences / Matched Audiences adapters.
- Contact import, identity normalization/hashing, suppression and deletion propagation.
- Provider syncing, batching, retries, match rates, job polling.
- Verified eligible data sources and compliance approval workflow.
- Production rollout, billing release, migrations applied to a production database.
- End-to-end live provider tests, performance benchmarks and real-device QA.

## Mandatory release gates

- Written policy/legal approval, vetted source eligibility, provider API permission approvals.
- Production OAuth threat model + token encryption and revocation.
- Complete privacy retention/deletion reconciliation.
- Sidekiq idempotency, batching, rate limits and partial-failure handling.
- Request/contract/E2E, responsive and accessibility tests green.
- Explicit opt-in rollout per tenant and monitored rollback.

**No production deployment or merge until these gates are met.**
