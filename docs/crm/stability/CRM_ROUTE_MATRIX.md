# CRM Avalia Solar — Route Source of Truth Matrix

> Audit of all CRM frontend routes, canonical status, redirects, auth protection, and rendering states.
> **Certification Date:** 2026-09-04 | **Result:** ZERO 404 DEAD LINKS

| Href / Route | Menu Source | page.tsx Exists? | Canonical? | API Needed | Auth | RBAC | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/dashboard/sales` | Sidebar / Logo | Yes (Middleware Redirect) | No -> `/dashboard/sales/leads` | N/A | JWT | Yes | **PASS** |
| `/dashboard/sales/leads` | Sidebar | Yes (`app/dashboard/sales/leads/page.tsx`) | **YES** | `/api/v1/sales/leads` | JWT | Yes | **PASS** |
| `/dashboard/sales/today` | Sidebar | Yes (`app/dashboard/sales/today/page.tsx`) | **YES** | `/api/v1/sales/today` | JWT | Yes | **PASS** |
| `/dashboard/sales/quotes` | Sidebar | Yes (`app/dashboard/sales/quotes/page.tsx`) | **YES** | `/api/v1/sales/quotes` | JWT | Yes | **PASS** |
| `/dashboard/sales/tasks` | Sidebar | Yes (`app/dashboard/sales/tasks/page.tsx`) | **YES** | `/api/v1/sales/tasks` | JWT | Yes | **PASS** |
| `/dashboard/sales/accounts` | Sidebar | Yes (`app/dashboard/sales/accounts/page.tsx`) | **YES** | `/api/v1/sales/accounts` | JWT | Yes | **PASS** |
| `/dashboard/sales/people` | Sidebar | Yes (`app/dashboard/sales/people/page.tsx`) | **YES** | `/api/v1/sales/contacts` | JWT | Yes | **PASS** |
| `/dashboard/sales/reports` | Sidebar | Yes (`app/dashboard/sales/reports/page.tsx`) | **YES** | `/api/v1/sales/analytics` | JWT | Yes | **PASS** |
| `/dashboard/sales/settings` | Settings Sidebar | Yes (`app/dashboard/sales/settings/page.tsx`) | **YES** | `/api/v1/sales/settings` | JWT | Yes | **PASS** |
| `/dashboard/sales/settings/email` | Settings Sidebar | Yes (`app/dashboard/sales/settings/email/page.tsx`) | **YES** | `/api/v1/sales/email_signatures` | JWT | Yes | **PASS** |
| `/dashboard/sales/settings/email/templates` | Settings Sidebar | Yes (`app/dashboard/sales/settings/email/templates/page.tsx`) | **YES** | `/api/v1/sales/email_templates` | JWT | Yes | **PASS** |
| `/dashboard/sales/settings/access` | Settings Sidebar | Yes (`app/dashboard/sales/settings/access/page.tsx`) | **YES** | `/api/v1/sales/rbac` | JWT | Yes | **PASS** |
| `/dashboard/sales/settings/custom-fields` | Settings Sidebar | Yes (`app/dashboard/sales/settings/custom-fields/page.tsx`) | **YES** | `/api/v1/sales/custom_field_definitions` | JWT | Yes | **PASS** |
| `/dashboard/sales/settings/api-keys` | Settings Sidebar | Yes (`app/dashboard/sales/settings/api-keys/page.tsx`) | **YES** | `/api/v1/sales/api_keys` | JWT | Yes | **PASS** |
| `/dashboard/sales/settings/integrations` | Settings Sidebar | Yes (`app/dashboard/sales/settings/integrations/page.tsx`) | **YES** | `/api/v1/sales/integrations` | JWT | Yes | **PASS** |
| `/dashboard/sales/settings/activity-types` | Settings Sidebar | Yes (`app/dashboard/sales/settings/activity-types/page.tsx`) | **YES** | `/api/v1/sales/taxonomies` | JWT | Yes | **PASS** |
| `/dashboard/sales/settings/company-types` | Settings Sidebar | Yes (`app/dashboard/sales/settings/company-types/page.tsx`) | **YES** | `/api/v1/sales/taxonomies` | JWT | Yes | **PASS** |
| `/dashboard/sales/settings/industries` | Settings Sidebar | Yes (`app/dashboard/sales/settings/industries/page.tsx`) | **YES** | `/api/v1/sales/taxonomies` | JWT | Yes | **PASS** |
| `/dashboard/sales/settings/markets` | Settings Sidebar | Yes (`app/dashboard/sales/settings/markets/page.tsx`) | **YES** | `/api/v1/sales/taxonomies` | JWT | Yes | **PASS** |
| `/dashboard/sales/settings/tags` | Settings Sidebar | Yes (`app/dashboard/sales/settings/tags/page.tsx`) | **YES** | `/api/v1/sales/tags` | JWT | Yes | **PASS** |
| `/dashboard/sales/settings/territories` | Settings Sidebar | Yes (`app/dashboard/sales/settings/territories/page.tsx`) | **YES** | `/api/v1/sales/taxonomies` | JWT | Yes | **PASS** |

---

## Unimplemented / Dead Hrefs Removed

- `/dashboard/sales/engagement` -> REMOVED from navigation (Zero 404s)
- `/dashboard/sales/marketing` -> REMOVED from navigation (Zero 404s)
