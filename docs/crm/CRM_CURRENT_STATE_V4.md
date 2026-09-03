# Audit & Architecture State — Avalia Solar CRM V4

**HEAD SHA:** `f8cef10720e46c6eabe105ec22b633dc27a0c114`  
**Production URL:** `https://crm.avaliasolar.com.br`

---

## 1. Directory Structure Audit

### 1.1 App Routes (`AB0-1-front/app/dashboard/sales`)
- `/dashboard/sales`: Dashboard principal / Overview comercial
- `/dashboard/sales/today`: Fila Diária (Today Work Queue)
- `/dashboard/sales/prospects`: Fila de Prospecção (Prospecting Queue)
- `/dashboard/sales/pipeline`: Pipeline Kanban de Vendas
- `/dashboard/sales/accounts`: Catálogo de Contas & Empresas (Sales::Account)
- `/dashboard/sales/accounts/[id]`: Ficha da Empresa (Company 360)
- `/dashboard/sales/people`: Pessoas & Decisores (Sales::Contact)
- `/dashboard/sales/emails`: Central de E-mails & Outreach
- `/dashboard/sales/import`: Importador de Leads em Lote (CSV)
- `/dashboard/sales/quotes`: Gestão de Propostas Comerciais & Quotes
- `/dashboard/sales/tasks`: Central de Tarefas & Follow-ups
- `/dashboard/sales/reports`: Central de Relatórios Analytics
- `/dashboard/sales/reports/forecast`: Forecast Comercial
- `/dashboard/sales/reports/attribution`: Relatório de Atribuição de Campanhas
- `/dashboard/sales/settings`: Configurações do CRM (RBAC, Integrations, Tracking)

### 1.2 Sales Components Tree (`AB0-1-front/components/sales`)
- `layout/CRMSidebar.tsx`: Sidebar Navy escuro B2B (`#0c1a30`)
- `layout/SalesLayoutWrapper.tsx`: Wrapper principal de layout do CRM
- `layout/SettingsSubSidebar.tsx`: Sub-sidebar para menu de configurações
- `SalesCommandCenter.tsx`: Pipeline Kanban & modal de criação de oportunidade
- `AccountList.tsx`: Lista de empresas com visual Nutshell CRM
- `PeopleList.tsx`: Lista de contatos com visual Nutshell CRM
- `Company360View.tsx`: Ficha 360 da Empresa
- `Contact360View.tsx`: Ficha 360 do Contato
- `CallLoggerModal.tsx`: Modal para registrar chamadas
- `EmailComposerModal.tsx`: Compositor de e-mails B2B
- `QuoteBuilder.tsx`: Criador de propostas comerciais
- `QuoteItemsBuilder.tsx`: Editor de itens de propostas
- `CRMCommandPalette.tsx`: Palette de busca rápida global (`Ctrl+K`)
- `ProspectingQueue.tsx`: Fila de prospecção e engajamento
- `SalesAnalyticsReport.tsx`: Relatório analítico visual
- `SalesImportWizard.tsx`: Assistente de importação de CSV

---

## 2. Canonical Backend Domain (`Sales::*`)

| Modelo | Tabela PostgreSQL | Propósito Comercial |
| --- | --- | --- |
| `Sales::Account` | `sales_accounts` | Empresa / Cliente comercial PJ |
| `Sales::Contact` | `sales_contacts` | Pessoa / Decisor da conta |
| `Sales::Opportunity` | `sales_opportunities` | Oportunidade / Venda potencial no pipeline |
| `Sales::Pipeline` | `sales_pipelines` | Funil de vendas ativo |
| `Sales::Stage` | `sales_stages` | Estágio do pipeline (prospect, qualified, proposal, etc.) |
| `Sales::Task` | `sales_tasks` | Tarefa ou follow-up com data limite |
| `Sales::Activity` | `sales_activities` | Registro de ligação, reunião ou nota |
| `Sales::EmailMessage` | `sales_email_messages` | E-mail enviado ou recebido |
| `Sales::Quote` | `sales_quotes` | Proposta comercial e orçamentos |
| `Sales::QuoteItem` | `sales_quote_items` | Itens e serviços da proposta |
| `Sales::StageHistory` | `sales_stage_histories` | Histórico de transição de estágios |
| `Sales::IntelligenceSignal` | `sales_intelligence_signals` | Sinais de intenção e IA |

---

## 3. Endpoints da API REST (`/api/v1/sales`)

| Verbo | Endpoints | Controller | Função |
| --- | --- | --- | --- |
| `GET` | `/api/v1/sales/pipelines` | `PipelinesController#index` | Retorna pipelines e estágios ativos ordenados |
| `GET/POST` | `/api/v1/sales/opportunities` | `OpportunitiesController` | Listagem e criação atômica com relations |
| `GET/POST` | `/api/v1/sales/accounts` | `AccountsController` | Busca e criação de empresas |
| `GET/POST` | `/api/v1/sales/contacts` | `ContactsController` | Busca e criação de contatos |
| `GET/POST` | `/api/v1/sales/tasks` | `TasksController` | Gestão de tarefas |
| `GET/POST` | `/api/v1/sales/activities` | `ActivitiesController` | Registro de chamadas e interações |
| `GET/POST` | `/api/v1/sales/quotes` | `QuotesController` | Gestão de propostas comerciais |
| `GET` | `/api/v1/sales/search` | `SearchController#index` | Busca rápida global |
| `GET` | `/api/v1/sales/today` | `TodayController#index` | Dados da Fila Diária do vendedor |
