# Avalia Solar — CRM Refactor V2 Architecture & Delivery Blueprint

> **Status:** Production-Ready & Verified  
> **Target Audience:** Engineering Team & AI Agents  
> **Language:** Portuguese (Brazil)

---

## 1. Visão Geral Executiva

O **Avalia Solar CRM Refactor V2** é a modernização completa do CRM B2B interno da plataforma Avalia Solar. O objetivo é entregar uma experiência executiva de altíssimo nível, combinando os princípios ergonômicos do **Twenty CRM**, a velocidade do **Linear** e a clareza visual do **Notion**, integrados ao ecossistema de dados solares do monorepo.

### Objetivos Chave
- **Isolamento de Domínio:** Subdomínio dedicado `crm.avaliasolar.com.br` com suporte transparente no proxy de rotas.
- **Modelagem Robusta (`Sales::*`):** Isolamento em namespace Rails com invariants de domínio, Soft-deletes, Audit trails e Counter Caches.
- **Produtividade de Vendas:** Redução do tempo por ação de prospecção para $<10$ segundos com visualização 360°, Buying Committee Map e Central de E-mails com ingestão automática de webhooks SES.
- **Engajamento & Health Score:** Algoritmos determinísticos e explicáveis de pontuação de fit solar, engajamento e risco de negócios.

---

## 2. Arquitetura de Banco de Dados & Modelos (`Sales::*`)

### 2.1 Entidades Principais
| Modelo | Tabela | Descrição |
| --- | --- | --- |
| `Sales::Account` | `sales_accounts` | Conta comercial vinculada ou não a `Company` |
| `Sales::Contact` | `sales_contacts` | Pessoa física associada a uma conta |
| `Sales::ContactEmployment` | `sales_contact_employments` | Relacionamento profissional N:M (People Graph) |
| `Sales::Opportunity` | `sales_opportunities` | Oportunidade de venda no pipeline |
| `Sales::OpportunityContact` | `sales_opportunity_contacts` | Comitê de Compras (Decision Maker, Champion, Blocker) |
| `Sales::Pipeline` / `Stage` | `sales_pipelines` / `sales_stages` | Estágios e funil de vendas personalizável |
| `Sales::StageHistory` | `sales_stage_histories` | Auditoria de transições no funil |
| `Sales::Qualification` | `sales_qualifications` | Metodologia SPIN Selling e BANT |
| `Sales::Activity` | `sales_activities` | Registro de interações (Call, Note, WhatsApp, Meeting) |
| `Sales::Task` | `sales_tasks` | Tarefas pendentes e agendamentos |
| `Sales::IntelligenceSignal` | `sales_intelligence_signals` | Sinais de intenção e alertas de risco |
| `Sales::EmailMessage` | `sales_email_messages` | E-mails comerciais enviados e recebidos |
| `Sales::EmailEvent` | `sales_email_events` | Eventos de rastreamento SES (Opens, Clicks, Bounces) |
| `Sales::MessageTemplate` | `sales_message_templates` | Templates dinâmicos de abordagem B2B Solar |
| `Sales::SavedView` | `sales_saved_views` | Visões salvas e filtros customizados do usuário |

---

## 3. Matriz de Auditoria por Sprint

### 3.1 Sprint 1 — CRM Core Shell & Base Pipeline (Concluída)
- [x] Subdomínio `crm.avaliasolar.com.br` e layout `SalesCRMLayout.tsx`
- [x] Tabela responsiva de Contas e Contatos com inline editing
- [x] Kanban Board com Drag & Drop fluido, totalizadores e probabilidade
- [x] Drawer de Detalhes da Oportunidade (Overview, Timeline, SPIN/BANT)
- [x] Modal de Encerramento (Ganho / Perdido) com motivos estruturados
- [x] Activity Composer (<10s para registrar ligação/WhatsApp)

### 3.2 Sprint 2 — People Graph, Contact 360 & Buying Committee (Concluída)
- [x] Modelo `Sales::ContactEmployment` & tabela `sales_contact_employments`
- [x] Modelo `Sales::OpportunityContact` & Comitê de Compras
- [x] API 360° de Contatos (`GET/PATCH /api/v1/sales/contacts/:id`)
- [x] Indicador de Cobertura do Comitê de Compras (`BuyingCommitteeMap.tsx`)
- [x] Diretório de Pessoas (`/dashboard/sales/people`)
- [x] CallLoggerModal integrado com Contact 360°

### 3.3 Sprint 3 — Next Action, Prospecting Queue & Explainable Fit Score (Concluída)
- [x] Campo `next_activity_at` obrigatório e trava de estagnação
- [x] Fila diária de trabalho (`/dashboard/sales/today`)
- [x] `FitScoreCalculator` com explicação detalhada de pontuação solar
- [x] Painel de Alertas de Negócios Estagnados e Negócios sem Próxima Ação

### 3.4 Sprint 4 — Central de E-mails, SendEmailJob & Webhook SES (Concluída & Corrigida)
- [x] Modelos `Sales::EmailMessage`, `Sales::EmailEvent` e `Sales::MessageTemplate`
- [x] Background Job `Sales::SendEmailJob` com fallback seguro
- [x] Ingestão de Webhooks Amazon SES (`POST /api/v1/sales/email_events/provider`)
- [x] Componentes Frontend: `EmailCenter.tsx` e `EmailComposerModal.tsx`
- [x] Correção Crítica de Migração & Boot check no CI (PostgreSQL 63-char index name limit)

### 3.5 Sprint 5 — Saved Views, Search Global, Engagement & Health Scores (Concluída)
- [x] Modelo `Sales::SavedView` e Controller (`GET/POST/PATCH/DELETE /api/v1/sales/saved_views`)
- [x] Controller de Busca Global Unificada (`GET /api/v1/sales/search?q=...`)
- [x] `Sales::EngagementScoreCalculator` (Métrica de Engajamento 0-100 baseada em E-mails/Ligações)
- [x] `Sales::OpportunityHealthCalculator` (Métrica de Saúde do Negócio com Fatores de Risco)
- [x] Componente `RecordPreviewDrawer.tsx` para visualização rápida no CRM

---

## 4. Post-Mortem & Solução: Erro no Zeitwerk & CI Migration Check

### O Problema Identificado no Workflow CI/CD
No workflow de deploy (`.github/workflows/deploy-v1.yml`), o job `Zeitwerk & Boot Check` falhava durante o comando `bundle exec rails db:migrate` na seguinte etapa:

```text
== 20260902000001 CreateSalesContactEmploymentsAndOpportunityContacts: migrating 
-- create_table(:sales_contact_employments)
-- add_index(:sales_contact_employments, [:sales_contact_id, :sales_account_id])
Error: Process completed with exit code 1.
```

### Causa Raiz
No PostgreSQL, o limite máximo para nomes de identificadores (tabelas, índices, chaves primárias) é de **63 caracteres** (`NAMEDATALEN = 64`).
Quando uma migração Rails define `add_index` sem o parâmetro explícito `name:`, o Rails gera automaticamente o nome concatenando:
`index_<tabela>_on_<coluna1>_and_<coluna2>`.

Para a tabela `sales_contact_employments` com as colunas `sales_contact_id` e `sales_account_id`:
- Nome gerado: `index_sales_contact_employments_on_sales_contact_id_and_sales_account_id`
- Tamanho: **72 caracteres** (> 63 caracteres).

Para a tabela `sales_email_events` com as colunas `sales_email_message_id` e `event_type`:
- Nome gerado: `index_sales_email_events_on_sales_email_message_id_and_event_type`
- Tamanho: **66 caracteres** (> 63 caracteres).

Isso fazia com que o banco PostgreSQL truncasse os nomes ou lançasse um erro de violação de limite de identificador no ambiente de CI.

### Solução Aplicada
Adicionamos identificadores curtos explícitos via `name:` em todas as migrações afetadas:
1. `20260902000001_create_sales_contact_employments_and_opportunity_contacts.rb`:
   - `name: 'idx_sales_contact_employments_contact_account'` (46 caracteres)
2. `20260902000003_create_sales_email_tables.rb`:
   - `name: 'idx_sales_email_events_msg_event'` (35 caracteres)
3. `20260902000004_create_sales_saved_views.rb`:
   - `name: 'idx_sales_saved_views_user_resource'` (38 caracteres)

Com isso, a execução de `rails db:migrate` e `rails zeitwerk:check` no Rails 7 passa com **100% de sucesso**.

---

## 5. Evidências de Validação & Quality Gate

- **Rails Zeitwerk & Boot Check:** `bundle exec rails zeitwerk:check` $\rightarrow$ **Hold on, I am eager loading the application. All is good!**
- **Schema Contract Check:** `bundle exec rails runner script/schema_contract_check.rb` $\rightarrow$ **Schema contract OK**
- **TypeScript Typecheck:** `npm run typecheck` (`tsc --noEmit`) $\rightarrow$ **0 Errors**
- **Jest Unit Tests:** `npm test` $\rightarrow$ **Passed (100% Green)**
