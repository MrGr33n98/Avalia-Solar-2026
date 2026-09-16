# CI Stabilization Report

## Baseline

- Run: `35139052157`
- Job: `104939494829`
- SHA: `3d2f1f0f7dcf56847a03011e659a05f9f99fda95`
- RSpec: 1911 examples, 426 failures, 38 pending

## Environment

- Ruby 3.2.2 / Bundler 2.4.22 via `infra/docker/Dockerfile.backend.test`.
- `RAILS_ENV=test` confirmed.
- Isolated PostgreSQL database: `ab0_test_ci_d` on the dedicated test compose network.
- Isolated Redis container used; no production/development container reused.
- The image contains a local ignored `.env`; `G4_ANALYTICS_STRICT_MODE=false` is set explicitly to match CI checkout behavior.

## Progress

| Checkpoint | Examples | Failures | Pending |
|---|---:|---:|---:|
| Baseline | 1911 | 426 | 38 |
| AnalyticsEvent target | 4 | 0 | 0 |
| Analytics integration + related | 12 | 0 | 0 |
| Campaign focused before batch repair | 7 | 2 | 0 |
| Campaign combined before scheduler fixture repair | 10 | 1 | 0 |
| Scheduler after fixture repair | 3 | 0 | 0 |
| Campaign combined after repair | 10 | 0 | 0 |
| Corrected regression clusters | 22 | 0 | 0 |
| Full RSpec checkpoint | 1911 | 426 or fewer (count capture pending) | 38 |

The full suite exited with code 1. Its summary count was not retained by the container wrapper, so no percentage delta is claimed until a machine-readable capture is available.

## Root Cause Clusters

| ID | Category | Evidence / Cause | Fix | Status | Confidence |
|---|---|---|---|---|---|
| D | TEST_FACTORY_ERROR | `AnalyticsEvent` stores `company_id`/`user_id`; factory called unsupported `company=` | Align factory with ID-only model contract | Fixed | PROVEN |
| C | TEST_FIXTURE_ERROR | Company activation requires at least one category | Add category only to the integration fixture requiring activation | Fixed | PROVEN |
| G | TEST_FACTORY_ERROR | `sales_email_messages.sender_user_id` is NOT NULL | Build same-tenant sender user in the message factory | Fixed | PROVEN |
| I | TEST_CONTRACT_DRIFT | Canonical suppression reason is `unsubscribe`, not `unsubscribed` | Align targeted spec fixture with model taxonomy | Fixed | PROVEN |
| H | BACKGROUND_JOB_FAILURE | Processor converted a campaign pause/cancel observed after send failure into recipient `failed` | Preserve real send failure; leave recipient pending when campaign stops dispatching | Fixed | HIGH CONFIDENCE |
| Scheduler | TEST_FIXTURE_ERROR / TEST_CONTRACT_DRIFT | Scheduled fixture lacked template and valid same-tenant audience | Add explicit template, account, and contact setup | Fixed | PROVEN |
| Remaining | UNKNOWN | Full-suite summary capture incomplete | Extract signatures before next edit | Open | UNKNOWN |

## Changes

- `AB0-1-back/spec/factories/analytics_events.rb`: use explicit IDs and optional same-tenant user.
- `AB0-1-back/spec/integration/analytics_async_integration_spec.rb`: provide the category required for activation.
- `AB0-1-back/spec/factories/sales_factories.rb`: provide a sender user belonging to the message company.
- `AB0-1-back/spec/jobs/sales/send_email_job_spec.rb`: use canonical `unsubscribe` suppression reason.
- `AB0-1-back/app/jobs/sales/campaign_batch_processor_job.rb`: do not mark a recipient failed after campaign leaves `dispatching`.
- `AB0-1-back/spec/jobs/sales/campaign_scheduler_job_spec.rb`: create a valid same-tenant template and audience.

## Safety

- Validations not weakened.
- Authentication and authorization not bypassed.
- Tenant scope preserved; campaign, template, account, contact, sender, and user share the fixture company.
- DB constraints preserved; no migration or schema change.
- No tests removed or skipped; no `|| true` or new `continue-on-error`.

## Git / GitHub

- No commit or push made yet.
- Final GitHub run pending a stable local full-suite result.

