# 03 — Inventário Consolidado de Rotas, Componentes e Contratos

## 1. Mapeamento Arquitetural End-to-End (Frontend ↔ Backend)

| Rota Frontend (Next.js) | Componente UI Principal | Hook / Client State | Endpoint REST | Controller Rails | Modelos de Domínio |
|-------------------------|-------------------------|---------------------|---------------|------------------|-------------------|
| `/dashboard/sales` | `SalesCommandCenter.tsx` | `useSalesAnalytics`, `usePipelines` | `GET /api/v1/sales/summary`, `/pipelines` | `SalesController#summary`, `PipelinesController#index` | `Sales::Opportunity`, `Sales::Stage` |
| `/dashboard/sales/today` | `app/dashboard/sales/today/page.tsx` | `useSalesToday` | `GET /api/v1/sales/today` | `Sales::TodayController#index` | `Sales::Task`, `Sales::Activity`, `Sales::Opportunity` |
| `/dashboard/sales/pipeline` | `PipelineBoard.tsx`, `PipelineColumn.tsx` | `usePipelineBoard`, `useChangeStage` | `GET /api/v1/sales/pipelines/board`, `PATCH /opportunities/:id` | `Pipelines::BoardsController#show`, `OpportunitiesController#update` | `Sales::Pipeline`, `Sales::Stage`, `Sales::Opportunity` |
| `/dashboard/sales/accounts` | `AccountList.tsx`, `CompaniesPage.tsx` | `useSalesAccounts` | `GET /api/v1/sales/accounts` | `Sales::AccountsController#index` | `Sales::Account`, `Company` |
| `/dashboard/sales/accounts/[id]` | `Company360View.tsx` | `useAccountDetails`, `useAccountTimeline` | `GET /api/v1/sales/accounts/:id`, `/:id/timeline` | `Sales::AccountsController#show`, `TimelineController#show` | `Sales::Account`, `Sales::Contact`, `Sales::Opportunity` |
| `/dashboard/sales/people` | `PeopleList.tsx`, `PeoplePage.tsx` | `useSalesContacts` | `GET /api/v1/sales/contacts` | `Sales::ContactsController#index` | `Sales::Contact`, `Sales::ContactEmployment` |
| `/dashboard/sales/people/[id]` | `Person360FullView.tsx`, `Contact360View.tsx` | `useContactDetails`, `useContactTimeline` | `GET /api/v1/sales/contacts/:id`, `/:id/timeline` | `Sales::ContactsController#show` | `Sales::Contact`, `Sales::Activity` |
| `/dashboard/sales/tasks` | `tasks/page.tsx` | `useSalesTasks` | `GET/PATCH /api/v1/sales/tasks` | `Sales::TasksController#index, #update` | `Sales::Task` |
| `/dashboard/sales/quotes` | `quotes/page.tsx`, `QuoteBuilder.tsx` | `useSalesQuotes` | `GET/POST /api/v1/sales/quotes` | `Sales::QuotesController#index, #create` | `Sales::Quote`, `Sales::QuoteItem` |
| `/dashboard/sales/reports` | `reports/page.tsx`, `SalesAnalyticsReport.tsx` | `useSalesReports` | `GET /api/v1/sales/analytics` | `Sales::AnalyticsController#index` | `Sales::Opportunity`, `Sales::Account` |
| `/dashboard/sales/prospects` | `ProspectingQueue.tsx` | `useProspectingQueue` | `GET /api/v1/sales/accounts?status=prospect` | `Sales::AccountsController#index` | `Sales::Account` |

---

## 2. Inventário de Modais Globais e Concorrência

| Modal / Dialog | Arquivo | Acionador | Rota API Invocada | Risco / Observação |
|----------------|---------|-----------|-------------------|--------------------|
| **CallLoggerModal** | `components/sales/CallLoggerModal.tsx` | Botão "Registrar Chamada" | `POST /api/v1/sales/accounts/:id/activities` | **P0:** Exibia falso sucesso sem validar resposta ou quando `accountId` faltava. |
| **CreateActivityModal** | `components/sales/create/CreateActivityModal.tsx` | Host Global `+` / Perfil 360° | `POST /api/v1/sales/activities` | **P0:** Rota requer suporte direto com `sales_account_id` permitido. |
| **CreateTaskModal** | `components/sales/create/CreateTaskModal.tsx` | Host Global `+` | `POST /api/v1/sales/tasks` | Estável. Suporta `opportunityId` e `accountId`. |
| **CreateCompanyModal** | `components/sales/create/CreateCompanyModal.tsx` | Host Global `+` | `POST /api/v1/sales/accounts` | Estável. Impede criação de contas duplicadas. |
| **CreateContactModal** | `components/sales/create/CreateContactModal.tsx` | Host Global `+` | `POST /api/v1/sales/contacts` | Estável. Vincula a empresa selecionada. |
| **CreateOpportunityDialog** | `components/sales/opportunities/CreateOpportunityDialog.tsx` | Host Global `+` / Pipeline | `POST /api/v1/sales/opportunities` | Estável. Revalida estágios do pipeline. |
| **CRMCommandPalette** | `components/sales/CRMCommandPalette.tsx` | Ctrl/Cmd+K / Topbar Search | `GET /api/v1/sales/search?q=` | Estável. Debounce 300ms, abort controller ativo. |
