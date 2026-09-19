# Golden SaaS Architecture — Estado AS-IS (Avalia Solar)

**Data da Auditoria:** 18 de Setembro de 2026
**Status do Repositório:** Monorepo Rails 7 (API/Admin/GraphQL) + Next.js 14 App Router + Expo Mobile + Hermes Outbound Agent

---

## 1. Visão Geral Arquitetural Atual

O **Avalia Solar** opera primariamente como uma plataforma transacional de marketplace B2B/B2C, avaliação e inteligência solar, complementada por módulos em evolução de CRM interno de vendas, publicidade contextual/banners e gestão de criadores.

```
                                  ┌────────────────────────┐
                                  │   Cloudflare / Edge    │
                                  └───────────┬────────────┘
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
        ┌─────────────────────────┐                       ┌─────────────────────────┐
        │   AB0-1-front (Next.js) │                       │  Nginx Reverse Proxy    │
        │   App Router / React 18 │                       └────────────┬────────────┘
        └────────────┬────────────┘                                    │
                     │ (Proxy /api/v1, /cable, /graphql)              │
                     └────────────────────────┬────────────────────────┘
                                              ▼
                                 ┌─────────────────────────┐
                                 │   AB0-1-back (Rails 7)  │
                                 │  REST + GraphQL + Admin │
                                 └──────┬────────────┬─────┘
                                        │            │
                    ┌───────────────────┴──┐      ┌──┴───────────────────┐
                    ▼                      ▼      ▼                      ▼
           ┌─────────────────┐   ┌───────────────┐ ┌────────────────┐ ┌────────────────┐
           │ PostgreSQL 14+  │   │ Redis 7 Cache │ │ Sidekiq Worker │ │ Hermes Agent   │
           │ (260 tabelas)   │   │ & Filas/Locks │ │ (Background)   │ │ (Growth Engine)│
           └─────────────────┘   └───────────────┘ └────────────────┘ └────────────────┘
```

---

## 2. Diagnóstico por Camadas Técnicas

### 2.1 Identity, Authentication & Tenancy
- **Identity:** Model `User` centraliza autenticação via Devise (`:database_authenticatable`, `:registerable`, `:validatable`, `:confirmable`, `:omniauthable`).
- **Roles:** `ROLES = %w[admin company review]`. Existem também papéis específicos no módulo Sales (`Sales::Role`, `Sales::UserRole`, `Sales::Permission`).
- **Tenancy:** Modelo Pool-First centrado em `Company` com associações `CompanyMember` (roles: `owner`, `manager`, `editor`; status: `pending`, `active`, `rejected`, `revoked`).
- **Gaps de Tenancy:** Não existe uma abstração canônica única de `TenantScope` ou `CurrentTenant` aplicada uniformemente em todos os controllers e jobs. Certos controllers recebem `company_id` diretamente dos parâmetros ou dependem exclusivamente do `current_user.company`.

### 2.2 Control Plane & Entitlements
- **Planos e Assinaturas:** Tabelas `plans`, `subscription_plans`, `sponsored_plans`, `company_subscriptions`, `banner_subscriptions`.
- **Entitlement Engine:** Implementado parcialmente via `CompanyFeatureAccessResolver`, `PlanFeatureCatalog` e `EntitlementService`.
- **Gaps:** Não há medição de uso contínuo padronizada (`UsageMeter`/`QuotaEngine`) unificada; limites são checados pontualmente (ex: `company_upload_limits`, `company_service_area_limit_service`).

### 2.3 Sales CRM Domain
- **Estrutura de Modelos:** `Sales::Account`, `Sales::Opportunity`, `Sales::Contact`, `Sales::Pipeline`, `Sales::Stage`, `Sales::Task`, `Sales::Activity`, `Sales::Qualification` (SPIN/BANT), `Sales::EmailMessage`, `Sales::EmailSequence`.
- **Gaps de Isolamento:** `SalesController` restringe acesso apenas a usuários admin (`require_internal_sales` -> `current_user&.admin?`), sem suporte multi-tenant nativo para empresas clientes utilizarem o CRM com isolamento lógico completo.

### 2.4 Event-Driven Architecture & Async Processing
- **Domain Events:** Model `DomainEvent` existe com status `pending`, `processing`, `completed`, `failed`.
- **Dispatcher:** `EventDispatcher` implementado com tratamento pontual para `review.published` e `lead.captured`.
- **Gaps:** Falta um **Transactional Outbox Pattern** estrito com worker de drenagem atômica garantida e idempotência universal em jobs do Sidekiq.

### 2.5 Data & Storage Architecture
- **PostgreSQL:** 260 tabelas no `schema.rb`. Rico em índices e chaves estrangeiras, mas com acoplamento em God Models (`Company` e `User`).
- **Active Storage:** Integrado com DigitalOcean Spaces (S3 compatible) e fallback local em desenvolvimento.

### 2.6 Observabilidade & Performance
- **APM & Erros:** Sentry, New Relic, Scout APM, Yabeda / Prometheus (`/metrics`).
- **Logs:** ActiveSupport TaggedLogging com saída em STDOUT. Falta correlação sistemática de `tenant_id`, `trace_id` e `actor_type` em todos os payloads de log.
