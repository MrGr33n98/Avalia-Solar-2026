# CRM Avalia Solar — Route Source of Truth Matrix

> Audit of all CRM frontend routes, canonical status, redirects, auth protection, and rendering states.

| Route | Exists | Canonical? | Redirect Destination | Component | API Connected | Auth | RBAC | Loading State | Empty State | Error State | Mobile Responsive | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/dashboard` | Yes | No | `/dashboard/sales/leads` | Middleware Redirect | N/A | JWT | Yes | N/A | N/A | N/A | Yes | PASS |
| `/dashboard/sales` | Yes | No | `/dashboard/sales/leads` | Middleware Redirect | N/A | JWT | Yes | N/A | N/A | N/A | Yes | PASS |
| `/dashboard/sales/leads` | Yes | **YES** | None | `LeadsPage` / `OpportunityBoard` | `/api/v1/sales/leads` | JWT | Yes | Skeleton | Skeleton/CTA | Banner | Yes | PASS |
| `/dashboard/sales/today` | Yes | **YES** | None | `TodayPage` | `/api/v1/sales/today` | JWT | Yes | Skeleton | Empty list | Banner | Yes | PASS |
| `/dashboard/sales/prospects` | Yes | **YES** | None | `ProspectsQueue` | `/api/v1/sales/contacts` | JWT | Yes | Skeleton | Empty list | Banner | Yes | PASS |
| `/dashboard/sales/pipeline` | Yes | No | `/dashboard/sales/leads?view=kanban` | Middleware Redirect | `/api/v1/sales/pipelines` | JWT | Yes | Skeleton | Empty board | Banner | Yes | PASS |
| `/dashboard/sales/accounts` | Yes | **YES** | None | `CompaniesPage` | `/api/v1/sales/accounts` | JWT | Yes | Skeleton | Empty list | Banner | Yes | PASS |
| `/dashboard/sales/accounts/:id` | Yes | **YES** | None | `Account360FullView` | `/api/v1/sales/accounts/:id` | JWT | Yes | Skeleton | 404 View | Banner | Yes | PASS |
| `/dashboard/sales/companies` | Yes | No | Re-exports `CompaniesPage` | `CompaniesPage` | `/api/v1/sales/accounts` | JWT | Yes | Skeleton | Empty list | Banner | Yes | PASS |
| `/dashboard/sales/people` | Yes | **YES** | None | `PeoplePage` | `/api/v1/sales/contacts` | JWT | Yes | Skeleton | Empty list | Banner | Yes | PASS |
| `/dashboard/sales/people/:id` | Yes | **YES** | None | `Person360FullView` | `/api/v1/sales/contacts/:id` | JWT | Yes | Skeleton | 404 View | Banner | Yes | PASS |
| `/dashboard/sales/emails` | Yes | **YES** | None | `EmailCenterPage` | `/api/v1/sales/emails` | JWT | Yes | Skeleton | Empty inbox | Banner | Yes | PASS |
| `/dashboard/sales/import` | Yes | **YES** | None | `ImportLeadsPage` | `/api/v1/sales/import` | JWT | Yes | Spinner | Dropzone | Banner | Yes | PASS |
| `/dashboard/sales/quotes` | Yes | **YES** | None | `QuotesPage` | `/api/v1/sales/quotes` | JWT | Yes | Skeleton | Empty list | Banner | Yes | PASS |
| `/dashboard/sales/tasks` | Yes | **YES** | None | `TasksPage` | `/api/v1/sales/tasks` | JWT | Yes | Skeleton | Empty tasks | Banner | Yes | PASS |
| `/dashboard/sales/reports` | Yes | **YES** | None | `ReportsDashboard` | `/api/v1/sales/analytics` | JWT | Yes | Skeleton | Zero chart | Banner | Yes | PASS |
| `/dashboard/sales/reports/forecast` | Yes | **YES** | None | `ForecastReport` | `/api/v1/sales/forecast` | JWT | Yes | Skeleton | Zero chart | Banner | Yes | PASS |
| `/dashboard/sales/reports/attribution` | Yes | **YES** | None | `AttributionReport` | `/api/v1/sales/attribution` | JWT | Yes | Skeleton | Zero chart | Banner | Yes | PASS |
| `/dashboard/sales/settings` | Yes | **YES** | None | `CRMSettingsPage` | `/api/v1/sales/settings` | JWT | Yes | Spinner | Form default | Banner | Yes | PASS |
