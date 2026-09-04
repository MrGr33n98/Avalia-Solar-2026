# CRM Avalia Solar — Auth, RBAC & Multitenancy Security Matrix

> Security audit of Authentication (JWT), Authorization Policies (Pundit), HTTP Error Handlers, and Multitenant Company Data Isolation.

---

## 1. Authentication & Token Lifecycle

- **JWT Storage:** Handled via HTTP-only `jwt_token` cookie or `Authorization: Bearer <token>` header.
- **Refresh Mechanism:** Handled by `authApi.me()` and `refreshAuth()` in `AuthContext.tsx`.
- **401 Unauthorized Handling:** Invalid/expired session triggers clear token hint, resets state, and redirects to `/login?redirect=<path>`.
- **403 Forbidden Handling:** Session remains authenticated; user is presented with a non-destructive "Acesso Negado" notification without triggering unexpected login redirects.

---

## 2. Pundit Policies & Multitenant Scoping

| Entity | Controller | Policy Class | Tenant Scoping Rule | IDOR Protection Status |
| --- | --- | --- | --- | --- |
| `Sales::Account` | `Sales::AccountsController` | `Sales::AccountPolicy` | `where(company_id: current_user.company_id)` | VERIFIED & ENFORCED |
| `Sales::Contact` | `Sales::ContactsController` | `Sales::ContactPolicy` | `where(company_id: current_user.company_id)` | VERIFIED & ENFORCED |
| `Sales::Opportunity` | `Sales::OpportunitiesController` | `Sales::OpportunityPolicy` | `where(company_id: current_user.company_id)` | VERIFIED & ENFORCED |
| `Sales::Task` | `Sales::TasksController` | `Sales::TaskPolicy` | `where(company_id: current_user.company_id)` | VERIFIED & ENFORCED |
| `Sales::Activity` | `Sales::ActivitiesController` | `Sales::ActivityPolicy` | `where(company_id: current_user.company_id)` | VERIFIED & ENFORCED |
| `Sales::EmailMessage` | `Sales::EmailsController` | `Sales::EmailMessagePolicy` | `where(company_id: current_user.company_id)` | VERIFIED & ENFORCED |
| `Sales::Quote` | `Sales::QuotesController` | `Sales::QuotePolicy` | `where(company_id: current_user.company_id)` | VERIFIED & ENFORCED |
| `EmailSequence` | `Sales::EmailSequencesController` | `Sales::EmailSequencePolicy` | `where(company_id: current_user.company_id)` | VERIFIED & ENFORCED |
| `EmailSuppression` | `Sales::EmailSuppressionsController` | `Sales::EmailSuppressionPolicy` | `where(company_id: current_user.company_id)` | VERIFIED & ENFORCED |

---

## 3. HTTP Error Response Protocol

- **401 Unauthorized:** User not authenticated / expired JWT.
- **403 Forbidden:** User authenticated but fails Pundit policy.
- **404 Not Found:** Resource ID does not exist or belongs to another tenant.
- **409 Conflict:** Resource conflict (e.g. duplicate email in suppression list or duplicate CNPJ).
- **422 Unprocessable Entity:** Validation error with field-level payload errors.
- **500 Internal Server Error:** Unexpected error; captured by Sentry and logged without exposing secrets.
