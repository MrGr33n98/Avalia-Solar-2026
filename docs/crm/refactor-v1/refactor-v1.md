# Avalia Solar — Sales Operating System (Master Architecture & Refactor Blueprint)

> **Status:** TARGET ARCHITECTURE APPROVED | IMPLEMENTATION IN PROGRESS | PRODUCTION CERTIFICATION PENDING  
> **Versão:** v2.0.0 (Target Architecture Blueprint)  
> **Data:** 04 de Setembro de 2026  
> **Repositório:** `MrGr33n98/Avalia-Solar-2026`  
> **Ambiente:** `https://crm.avaliasolar.com.br`  

---

## 1. Visão Geral da Arquitetura TO-BE MASTER

O **Avalia Solar Sales Operating System** foi projetado para operar como um sistema operacional comercial de alta velocidade, densidade executiva e confiabilidade empresarial para o mercado de energia solar B2B.

```text
                     AVALIA SOLAR
                SALES OPERATING SYSTEM

┌──────────────────────────────────────────────────────────────────────────────┐
│                            EXPERIENCE LAYER                                 │
│                                                                              │
│ Next.js CRM                                                                  │
│                                                                              │
│ DataGrid │ Kanban │ Map │ Search │ Reports │ 360 Views │ Timeline │ Inbox   │
│ Tasks    │ Campaigns │ Email │ Settings │ Command Palette │ Global Create   │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND APPLICATION                                │
│                                                                              │
│ Query State │ URL State │ Cache │ Optimistic UI │ Forms │ Validation        │
│ Permissions │ Feature Flags │ Error Boundary │ Analytics │ Design System    │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION EDGE                                   │
│                                                                              │
│ REST Commands              GraphQL Read Models                               │
│                                                                              │
│ Authentication │ RBAC │ Tenant Isolation │ Rate Limit │ Idempotency         │
│ API Versioning │ Request ID │ Validation │ Pagination │ OpenAPI             │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        SALES APPLICATION CORE                               │
│                                                                              │
│ Accounts        Contacts       Opportunities      Pipeline                  │
│ Leads           Activities     Tasks              Timeline                  │
│ Notes           Tags           Saved Views        Custom Fields             │
│                                                                              │
│ Messaging       Templates      Sequences          Campaigns                  │
│ Consent         Suppression    Inbox              Communication             │
│                                                                              │
│ Products        Quotes         Geography          Search                    │
│                                                                              │
│ Reporting       Forecast       Attribution        Intelligence               │
│ Scoring         Next Action    Audit              Data Quality               │
└───────────────┬───────────────────┬───────────────────┬──────────────────────┘
                │                   │                   │
                ▼                   ▼                   ▼
┌──────────────────────┐ ┌─────────────────────┐ ┌────────────────────────────┐
│ DOMAIN SERVICES      │ │ QUERY / READ MODEL  │ │ AUTOMATION ENGINE          │
│                      │ │                     │ │                            │
│ Account Merge        │ │ Account360          │ │ Sequence Runner            │
│ Deduplication        │ │ Contact360          │ │ Campaign Scheduler         │
│ Stage Transition     │ │ Opportunity360      │ │ Follow-up Scheduler        │
│ Qualification        │ │ Kanban ReadModel    │ │ Reminder Engine            │
│ Lead Conversion      │ │ Map ReadModel       │ │ SLA Engine                 │
│ Engagement Score     │ │ Reports             │ │ Retry                      │
│ Fit Score            │ │ Search              │ │ DLQ                        │
└──────────┬───────────┘ └──────────┬──────────┘ └─────────────┬──────────────┘
           │                        │                          │
           └────────────────────────┼──────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
│                                                                              │
│ PostgreSQL                                                                  │
│ ├ Source of Truth                                                           │
│ ├ Constraints / FK                                                          │
│ ├ Tenant keys                                                               │
│ ├ Indexes                                                                   │
│ ├ Full-text / geo                                                           │
│ ├ Materialized Views                                                        │
│ └ Reporting Snapshots                                                       │
│                                                                              │
│ Redis                                                                       │
│ ├ Cache                                                                     │
│ ├ Distributed Locks                                                         │
│ ├ Job Coordination                                                          │
│ └ Short-lived State                                                         │
│                                                                              │
│ Object Storage                                                              │
│ ├ Attachments                                                               │
│ ├ Quote PDFs                                                                │
│ ├ Email Files                                                               │
│ └ Imports / Exports                                                         │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         EVENT ARCHITECTURE                                   │
│                                                                              │
│ Transactional Outbox                                                        │
│ Domain Events                                                               │
│ Event Dispatcher                                                            │
│ Event Consumers                                                             │
│                                                                              │
│ account.created                                                              │
│ contact.created                                                              │
│ opportunity.created                                                          │
│ stage.changed                                                                │
│ task.completed                                                               │
│ email.sent                                                                   │
│ email.opened                                                                 │
│ email.replied                                                                │
│ quote.created                                                                │
│ deal.won                                                                     │
│ deal.lost                                                                    │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           ASYNC / WORKERS                                    │
│                                                                              │
│ Sidekiq                                                                     │
│                                                                              │
│ Email Jobs │ Webhook Jobs │ Geocode │ Scoring │ Campaign │ Sequence        │
│ Reporting │ Cache Invalidation │ Export │ Import │ Notifications           │
│                                                                              │
│ Retry │ Backoff │ Idempotency │ Dead Letter Queue │ Monitoring             │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        INTEGRATION PLATFORM                                  │
│                                                                              │
│ SES / SNS               Gmail              Microsoft                         │
│ Webhooks                Calendar           WhatsApp                         │
│ VOIP                    Forms              Website Tracking                 │
│ PostHog                 Marketplace        External Enrichment              │
│                                                                              │
│ Integration Registry │ OAuth │ Credentials │ Sync State │ Retry             │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                       OBSERVABILITY / SECURITY                               │
│                                                                              │
│ Logs │ Metrics │ Traces │ Request ID │ Sentry │ Prometheus                  │
│                                                                              │
│ RBAC │ Tenant Isolation │ Audit Log │ API Keys │ Secrets                    │
│ Encryption │ LGPD │ Consent │ Retention │ Data Export │ Data Deletion       │
│                                                                              │
│ SLA │ SLO │ Alerts │ Health │ Readiness │ Queue Health │ Provider Health    │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         DELIVERY / QUALITY                                   │
│                                                                              │
│ GitHub Actions │ CI │ RSpec │ Jest │ Playwright │ Contract Tests            │
│                                                                              │
│ Migration Gate │ Zero Mock Gate │ Security Gate │ Performance Gate          │
│ API Contract Gate │ Typecheck │ Build │ Deployment │ Rollback               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detalhamento das Camadas do Sistema (10 Layers)

### Layer 1: Experience Layer (Next.js CRM)
- **DataGrid & Kanban:** Tabelas densas de Contas (`AccountList.tsx`) e Contatos (`PeopleList.tsx`) com inline editing, busca live e Kanban fluido com cálculo de estágio e probabilidade.
- **Views 360°:** Visão consolidada de Empresa (`Company360View.tsx`), Contato (`Contact360View.tsx`) e Oportunidade (`Opportunity360View.tsx`).
- **People Graph & Buying Committee:** Mapeamento visual do comitê de compras (`BuyingCommitteeMap.tsx`) com papéis de decisão (*Economic Buyer, Champion, Blocker, Decision Maker*).
- **Outreach & Communication:** Central de e-mails integrada (`EmailCenter.tsx`, `EmailComposerModal.tsx`) e registrador de chamadas (`CallLoggerModal.tsx`).
- **Command Palette & Global Create:** Atalho de teclado `Cmd+K` (`CRMCommandPalette.tsx`) e modais globais de criação rápida (`CreateCompanyModal`, `CreateContactModal`, `CreateOpportunityModal`).
- **Reports & Intelligence:** Dashboards executivos de Analytics (`SalesAnalyticsReport.tsx`), Engajamento (`SalesEngagementReport.tsx`) e Marketing (`SalesMarketingReport.tsx`).

---

### Layer 2: Frontend Application Layer
- **Gerenciamento de Estado:** TanStack Query v5 (cache server-side) + Zustand v5 (estado global reativo).
- **Formulários & Validação:** Zod + React Hook Form com mensagens de erro contextualizadas.
- **Design System:** Design Tokens AS-EDS, Tailwind CSS 3.3, Lucide Icons e Radix UI primitives.
- **Erro & Resiliência:** Error Boundaries dedicados por módulo e fallbacks visuais gracioso.

---

### Layer 3: Application Edge & Routing
- **Isolamento de Subdomínio:** Tráfego para `crm.avaliasolar.com.br` roteado transparentemente para o ecossistema Sales.
- **REST Commands & GraphQL Read Models:** APIs REST (`/api/v1/sales/*`) para mutations/comandos de alta velocidade + GraphQL (`/graphql`) para queries complexas de leitura.
- **Autenticação & Segurança:** Autenticação via JWT + Devise, autorização RBAC via Pundit e controle de taxa com `Rack::Attack`.

---

### Layer 4: Sales Application Core (Dominio `Sales::*`)
- **Entidades Principais:**
  - `Sales::Account`: Conta B2B com escopo por donos do tenant (`owner_id`) e vínculo opcional a perfil de Marketplace.
  - `Sales::Contact`: Contato comercial com suporte a múltiplos vínculos (`Sales::ContactEmployment`) e associação opcional a conta.
  - `Sales::Opportunity` & `Sales::StageHistory`: Oportunidades no funil de vendas com rastreamento completo de histórico de estágios.
  - `Sales::Qualification`: Metodologia de qualificação SPIN Selling & BANT.
  - `Sales::Activity` & `Sales::Task`: Interações comerciais (Call, Note, WhatsApp, Meeting) e fila diária de trabalho (`/dashboard/sales/today`).
  - `Sales::EmailMessage` & `Sales::EmailEvent`: Mensagens de e-mail e rastreamento de engajamento SES (Opens, Clicks, Bounces).
  - `Sales::SavedView` & `Sales::Quote`: Visões salvas do usuário e propostas comerciais com cálculo BRL.

---

### Layer 5: Domain Services, Query Read Models & Automation Engine
- **Calculadoras de Inteligência:**
  - `Sales::FitScoreCalculator`: Pontuação de aderência solar baseada em consumo kWh e perfil corporativo.
  - `Sales::EngagementScoreCalculator`: Score de engajamento multicanal (0-100).
  - `Sales::OpportunityHealthCalculator`: Algoritmo de risco e saúde do negócio.
- **Builders de Timeline:**
  - `Sales::TimelineBuilder` & `Sales::Contacts::TimelineBuilder`: Agregação canônica e ordenada de eventos na linha do tempo.

---

### Layer 6: Data Layer
- **PostgreSQL 14+:** Fonte da verdade com suporte a transações ACID, restrições FK, índices otimizados e conformidade com o limite de 63 caracteres no nome de índices do PG.
- **Redis 7:** Cache curto, Sidekiq job queues e travas distribuídas (`00_redis_disable.rb` fallback).
- **Object Storage (DigitalOcean Spaces / S3):** Armazenamento seguro de anexos, uploads de imagens e PDFs de propostas.

---

### Layer 7 & 8: Event Architecture & Async Workers (Sidekiq)
- **Domain Events:** Emissão de eventos de domínio (`sales.account.created`, `sales.contact.created`, `sales.opportunity.created`, `email.sent`, `email.opened`).
- **Sidekiq Workers:** `Sales::SendEmailJob`, `TrustScoreUpdateWorker` e processamento de webhooks Amazon SES/SNS em background.

---

### Layer 9 & 10: Integration Platform, Observability & Quality Gates
- **Integrações:** Amazon SES/SNS, PostHog Analytics, Sentry Error Tracking, New Relic APM.
- **Observabilidade:** Logs estruturados, métricas Prometheus (`/metrics`) e alertas de integridade.
- **Quality Gates no CI/CD:**
  - `npm run typecheck` (`tsc --noEmit`) $\rightarrow$ **PASS**
  - `npm run test` (Jest test suite) $\rightarrow$ **PASS**
  - `bundle exec rubocop` + `brakeman` + `rswag` $\rightarrow$ **PASS**

---

## 3. Matriz de Auditoria & Evidências de Validação

| Componente / Módulo | Estado Auditado | Validação | Status |
| --- | --- | --- | --- |
| **Criar Empresa (`POST /accounts`)** | `AccountsController#create` limpo sem colisão em `company_id=372` | PG::UniqueViolation resolvido | **PASS** |
| **Criar Pessoa (`POST /contacts`)** | `Sales::Contact` com `optional: true` e resolução de `company_name` | Erro 422 resolvido | **PASS** |
| **Nutshell UX Componentes** | `CRMCompanySelect.tsx` & `CRMPersonSelect.tsx` integrados | Busca live & criação dinâmica | **PASS** |
| **Propostas (`/quotes`)** | `QuotesController#index` global & `SalesQuotesPage` corrigido | Propostas listadas e link PDF corrigido | **PASS** |
| **Relatórios Analytics** | `/dashboard/sales/engagement` & `/marketing` implementados | 0 rotas 404 no CRM | **PASS** |
| **Compilação TypeScript** | `npm run typecheck` no frontend Next.js | 0 erros de compilação | **PASS** |
| **Suíte de Testes** | Execução de `npm run test` em `AB0-1-front` | 100% dos testes passando | **PASS** |
| **Commit Git em Produção** | `6bf6b48c` enviado para `origin/main` | Deployed | **PASS** |
