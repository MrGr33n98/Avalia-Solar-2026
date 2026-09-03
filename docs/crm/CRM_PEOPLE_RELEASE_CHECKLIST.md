# CRM People Release Checklist & Verification

## Release Gate Criteria
- [x] Zero Mocks / Synthetic Fallbacks: `bash scripts/check-sales-zero-mock.sh` PASS.
- [x] Typecheck Clean: `npm run typecheck` 0 errors.
- [x] Real Owner Filtering (`user_id` / `owner_id`).
- [x] Real Last Contact (resolver via activities/tasks, no `updated_at` fallback).
- [x] Real Next Action (resolver via pending tasks).
- [x] Person 360 Workspace (`/dashboard/sales/people/[id]`).
- [x] Canonical Timeline V2 (`TimelineBuilder`).
- [x] Write Note real persistence.
- [x] Playwright E2E spec (`crm-people.spec.ts`).
