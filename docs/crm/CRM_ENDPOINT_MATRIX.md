# Matriz de Endpoints do CRM Sales — Avalia Solar 2026

## Endpoints Ativos (`/api/v1/sales`)

| Verbo | Rota | Controller & Método | Request Body / Params | Status Esperados | Envelope de Erro Canônico |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/v1/sales/pipelines` | `PipelinesController#index` | — | 200 OK | Sim |
| `GET` | `/api/v1/sales/opportunities` | `OpportunitiesController#index` | `status`, `account_id` | 200 OK | Sim |
| `POST` | `/api/v1/sales/opportunities` | `OpportunitiesController#create` | `{ opportunity: { sales_account_id, primary_contact_id, name, stage_key, value_cents } }` | 201 Created / 422 | Sim |
| `PATCH` | `/api/v1/sales/opportunities/:id` | `OpportunitiesController#update` | `{ opportunity: { stage_key, name, value_cents } }` | 200 OK / 422 | Sim |
| `GET` | `/api/v1/sales/accounts` | `AccountsController#index` | `q` | 200 OK | Sim |
| `POST` | `/api/v1/sales/accounts` | `AccountsController#create` | `{ account: { name, domain, city, state, phone, email } }` | 201 Created / 422 | Sim |
| `GET` | `/api/v1/sales/contacts` | `ContactsController#index` | `q`, `sales_account_id` | 200 OK | Sim |
| `POST` | `/api/v1/sales/contacts` | `ContactsController#create` | `{ contact: { sales_account_id, first_name, last_name, email, phone, job_title } }` | 201 Created / 422 | Sim |
| `GET` | `/api/v1/sales/tasks` | `TasksController#index` | `status`, `q` | 200 OK | Sim |
| `POST` | `/api/v1/sales/tasks` | `TasksController#create` | `{ task: { title, task_type, priority, due_at, sales_account_id } }` | 201 Created / 422 | Sim |
| `GET` | `/api/v1/sales/analytics` | `AnalyticsController#show` | `period` | 200 OK | Sim |
| `GET` | `/api/v1/sales/taxonomies` | `TaxonomiesController#index` | — | 200 OK | Sim |
