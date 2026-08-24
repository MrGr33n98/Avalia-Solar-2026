---
phase: 07
plan: 01
subsystem: backend-release
tags: [rails, activeadmin, postgresql, migrations, sentry, github-actions]
requires: []
provides: [schema-contract-check, creator-admin-smoke-specs, release-schema-gate]
affects: [production-deploy, creator-leads, creator-tree-blocks]
tech-stack:
  added: []
  patterns: [schema contract validation, migration-before-deploy, request-context observability]
key-files:
  created:
    - AB0-1-back/script/schema_contract_check.rb
    - AB0-1-back/spec/requests/admin/creator_leads_spec.rb
    - AB0-1-back/spec/requests/admin/creator_tree_blocks_spec.rb
  modified:
    - .github/workflows/deploy-v1.yml
    - .github/workflows/enterprise-pr-pipeline.yml
    - AB0-1-back/config/initializers/lograge.rb
    - AB0-1-back/config/initializers/sentry.rb
    - AB0-1-back/app/admin/creator_tree_blocks.rb
    - Dockerfile.backend
    - docker-compose.yml
    - docker-compose.backend-test.yml
decisions:
  - Keep the previous web containers serving traffic until migration and schema contract checks pass.
  - Treat creator tables, operational fields, indexes, foreign keys, and four related migrations as a release contract.
metrics:
  duration: "ongoing session"
  completed: 2026-08-24
---

# Phase 7 Plan 1: Creator Admin Schema Release Safety Summary

Implemented a production release gate that applies migrations once and aborts before replacing web containers when the Creator Leads/Creator Tree schema contract is incomplete.

## Completed Tasks

1. Added `script/schema_contract_check.rb` validating required tables, columns, indexes, foreign keys, and migrations.
2. Wired the contract into CI and production deploy after `db:migrate`.
3. Added authenticated ActiveAdmin request smoke specs for both affected indexes.
4. Added request/schema metadata to Sentry and Lograge diagnostics.
5. Hardened the Creator Tree admin display against missing associated reviewer/user records.
6. Fixed the dedicated backend test Compose file so its declared database and Redis dependencies exist.

## Commits

- `5ef4d327`: enforce release schema contract
- `8ffb764c`: require creator performance migration
- `e6b9511f`: harden creator admin diagnostics
- `047b0b81`: validate indexes after migrations
- `a82b4992`: preserve previous web during release
- `92417dae`: normalize Sentry request context
- `5308c596`: define backend test dependencies
- `8547d5ad`: guard schema metadata lookup

## Verification

- `git diff --check`: passed.
- `docker compose config`: passed, with expected warnings for unset local environment variables.
- Ruby/RSpec execution: not available on host because Ruby and Bundler are not installed.
- Docker-backed RSpec execution: blocked by local permission denied on `/var/run/docker.sock`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Added foreign-key and performance-index checks.**
- **Found during:** schema contract implementation.
- **Issue:** validating only tables and columns would not enforce the stated operational schema contract.
- **Fix:** validate Creator foreign keys, the inbox index, and generated Rails indexes.
- **Files modified:** `AB0-1-back/script/schema_contract_check.rb`.

**2. [Rule 3 - Blocking issue] Fixed the dedicated backend test Compose dependencies.**
- **Found during:** attempting smoke specs.
- **Issue:** `docker-compose.backend-test.yml` referenced undefined `db` and `redis` services.
- **Fix:** defined isolated Postgres and Redis services with healthchecks.
- **Files modified:** `docker-compose.backend-test.yml`.

## Known Limitations

- Production migration status and exception logs still require execution against the actual production backend container; no production credentials or access were available in this session.
- Full Ruby/RSpec verification must run in CI or an environment with Docker socket access.

## Self-Check: PASSED

- All created files exist in the working tree and are committed.
- All listed commit hashes exist in the local Git history.
- Working tree is clean after the implementation commits.