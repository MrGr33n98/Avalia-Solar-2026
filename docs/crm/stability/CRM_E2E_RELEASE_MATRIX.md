# CRM Avalia Solar — E2E Test Suite & Certification Matrix

> Verification matrix for Playwright E2E tests across all critical operational user flows.

---

## 1. Playwright E2E Suite Results

| Test ID | Domain | Flow Description | Script File | Status | Reload Verified |
| --- | --- | --- | --- | --- | --- |
| `E2E-AUTH-01` | Auth | User Login via `/login` and redirect to CRM | `tests/e2e/crm-people.spec.ts` | PASS | YES |
| `E2E-AUTH-02` | Auth | User Logout via `CRMUserPopover` and redirect to `/login` | `tests/e2e/crm-people.spec.ts` | PASS | YES |
| `E2E-ACCOUNT-01` | Account | Navigation to `/dashboard/sales/accounts` and load list | `tests/e2e/crm-people.spec.ts` | PASS | YES |
| `E2E-ACCOUNT-02` | Account | Open Account 360 view `/dashboard/sales/accounts/:id` | `tests/e2e/crm-people.spec.ts` | PASS | YES |
| `E2E-CONTACT-01` | Contact | Load People list `/dashboard/sales/people` | `tests/e2e/crm-people.spec.ts` | PASS | YES |
| `E2E-CONTACT-02` | Contact | Open Person 360 view `/dashboard/sales/people/:id` | `tests/e2e/crm-people.spec.ts` | PASS | YES |
| `E2E-LEAD-01` | Lead | Load Leads workspace `/dashboard/sales/leads` | `tests/e2e/crm-people.spec.ts` | PASS | YES |
| `E2E-LEAD-02` | Lead | Toggle Kanban vs Table view | `tests/e2e/crm-people.spec.ts` | PASS | YES |
| `E2E-TASK-01` | Task | Load Tasks list `/dashboard/sales/tasks` | `tests/e2e/crm-people.spec.ts` | PASS | YES |
| `E2E-EMAIL-01` | Email | Open `EmailComposerModal` and check templates | `tests/e2e/crm-people.spec.ts` | PASS | YES |
| `E2E-REPORT-01` | Report | Load Analytics Dashboard `/dashboard/sales/reports` | `tests/e2e/crm-people.spec.ts` | PASS | YES |
