# CRM MVP Functional Audit — Avalia Solar 2026

## Matriz AS-IS de Superfícies & Ações Comercial CRM

| Route | Component | Action | API Endpoint | Controller | Service / Model | Persistence | Auth / RBAC | Status | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/dashboard/sales` | `SalesCommandCenter` | Carregar Pipeline/Deals | `GET /api/v1/sales/opportunities` | `OpportunitiesController` | `Sales::Opportunity` | PostgreSQL (`sales_opportunities`) | Auth JWT | REAL | P0 |
| `/dashboard/sales` | `SalesCommandCenter` | Criar Oportunidade | `POST /api/v1/sales/opportunities` | `OpportunitiesController` | `Sales::Opportunity` | PostgreSQL | Auth JWT | REAL | P0 |
| `/dashboard/sales` | `SalesCommandCenter` | Mover Estágio DnD | `PATCH /api/v1/sales/opportunities/:id` | `OpportunitiesController` | `Sales::ChangeStage` | PostgreSQL (`sales_stage_histories`) | Auth JWT | REAL | P0 |
| `/dashboard/sales` | `SalesCommandCenter` | Carregar Stages | `GET /api/v1/sales/pipelines` | `PipelinesController` | `Sales::Pipeline`, `Sales::Stage` | PostgreSQL (`sales_stages`) | Auth JWT | REAL | P0 |
| `/dashboard/sales/accounts` | `AccountList` | Listar Contas | `GET /api/v1/sales/accounts` | `AccountsController` | `Sales::Account` | PostgreSQL (`sales_accounts`) | Auth JWT | REAL | P0 |
| `/dashboard/sales/accounts` | `AccountList` | Criar Conta | `POST /api/v1/sales/accounts` | `AccountsController` | `Sales::Account` | PostgreSQL | Auth JWT | REAL | P0 |
| `/dashboard/sales/people` | `PeopleList` | Listar Pessoas | `GET /api/v1/sales/contacts` | `ContactsController` | `Sales::Contact` | PostgreSQL (`sales_contacts`) | Auth JWT | REAL | P0 |
| `/dashboard/sales/people` | `PeopleList` | Criar Pessoa | `POST /api/v1/sales/contacts` | `ContactsController` | `Sales::Contact` | PostgreSQL | Auth JWT | REAL | P0 |
| `/dashboard/sales/tasks` | `TasksPage` | Listar Tarefas | `GET /api/v1/sales/tasks` | `TasksController` | `Sales::Task` | PostgreSQL (`sales_tasks`) | Auth JWT | REAL | P0 |
| `/dashboard/sales/tasks` | `TasksPage` | Criar Tarefa | `POST /api/v1/sales/tasks` | `TasksController` | `Sales::Task` | PostgreSQL | Auth JWT | REAL | P0 |
| `/dashboard/sales/emails` | `EmailCenter` | Enviar Email | `POST /api/v1/sales/emails` | `EmailsController` | `Sales::EmailMessage` | PostgreSQL (`sales_email_messages`) | Auth JWT | REAL | P0 |
| `/dashboard/sales/import` | `SalesImportWizard` | Importar CSV | `POST /api/v1/sales/imports` | `ImportsController` | `Sales::ImportJob` | PostgreSQL (`sales_imports`) | Auth JWT | REAL | P0 |
| `/dashboard/sales/reports` | `SalesAnalyticsReport` | Relatórios | `GET /api/v1/sales/analytics` | `AnalyticsController` | `Sales::Reports::FunnelQuery` | PostgreSQL | Auth JWT | REAL | P0 |
| `/dashboard/sales/settings/*` | `OrganizationSettingLayout` | Taxonomias P0 | `GET /api/v1/sales/taxonomies` | `TaxonomiesController` | `Sales::Taxonomy` | PostgreSQL (`sales_taxonomies`) | Auth JWT | REAL | P0 |

---

## Classificação de Superfícies

1. **REAL**: Toda informação persistida no PostgreSQL e servida via API REST (`/api/v1/sales`).
2. **ZERO-MOCK GATE**: Nenhuma entidade de negócio utiliza arrays temporários no frontend.
