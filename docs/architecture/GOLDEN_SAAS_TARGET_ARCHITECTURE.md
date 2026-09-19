# Golden SaaS Architecture — Arquitetura Alvo (Target Architecture)

**Projeto:** Avalia Solar 2026
**Padrão Arquitetural:** Modular Monolith (Pool-First + Bridge-Ready + Rest-First + Agent-Ready)

---

## 1. Princípios Fundamentais

1. **POOL-FIRST + BRIDGE-READY:** Isolamento lógico rigoroso por tenant no banco PostgreSQL compartilhado, estruturado para permitir migração para schema ou banco isolado por tenant enterprise no futuro sem alteração de contratos de domínio.
2. **MODULAR-MONOLITH-FIRST + SERVICE-READY:** Domínios desacoplados dentro do backend Rails (`Identity`, `Tenancy`, `Billing`, `Sales`, `Marketplace`, `Reviews`, `SolarIntelligence`), com boundaries claros baseados em Service Objects e Query Objects.
3. **REST-FIRST + MCP-READY:** Todos os fluxos de agentes de IA consomem exatamente as mesmas rotas REST ou Service Objects que a UI humana consome, garantindo auditoria, autorização (RBAC/Pundit) e invariantes de domínio idênticos.
4. **WEB-FIRST + CROSS-PLATFORM-CONTRACTS:** Next.js 14 App Router como interface web primária, compartilhando contratos de dados tipados com Expo Mobile via serializadores REST/OpenAPI padronizados.
5. **RAILS DOMAIN = CANONICAL SOURCE OF TRUTH:** Regras de negócio, cálculo de pontuação de confiança (TrustScore), entitlements e precificação residem unicamente no backend. Frontend é apenas visualização e orquestração de experiência.
6. **POSTGRESQL = SYSTEM OF RECORD:** Todas as transações de negócio, histórico de auditoria e outbox persistem no Postgres. Redis atua exclusivamente como cache efêmero, fila assíncrona e locks distribuídos.

---

## 2. Diagrama da Arquitetura Alvo

```
                               ┌────────────────────────┐
                               │   Cloudflare / Edge    │
                               └───────────┬────────────┘
                                           │
                  ┌────────────────────────┴────────────────────────┐
                  ▼                                                 ▼
     ┌─────────────────────────┐                       ┌─────────────────────────┐
     │  Human Web / PWA        │                       │  AI Agents / MCP Layer  │
     │  (Next.js App Router)   │                       │  (Hermes, Growth, MCP)  │
     └────────────┬────────────┘                       └────────────┬────────────┘
                  │                                                 │
                  │ (HTTP / Bearer Token / Edge Signature)          │ (MCP / REST API)
                  └────────────────────────┬────────────────────────┘
                                           ▼
                              ┌─────────────────────────┐
                              │    API Gateway / Edge   │
                              │  Rack::Attack / Throttl │
                              └────────────┬────────────┘
                                           ▼
               ┌─────────────────────────────────────────────────────────┐
               │              RAILS MODULAR MONOLITH (CORE)              │
               │                                                         │
               │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐  │
               │  │ Identity &    │ │ Tenancy &     │ │ Billing &     │  │
               │  │ Auth (Devise) │ │ RBAC (Pundit) │ │ Entitlements  │  │
               │  └───────┬───────┘ └───────┬───────┘ └───────┬───────┘  │
               │          │                 │                 │          │
               │  ┌───────┴───────┐ ┌───────┴───────┐ ┌───────┴───────┐  │
               │  │ Marketplace & │ │ Sales CRM     │ │ Solar Intel & │  │
               │  │ Reviews Core  │ │ (Multi-Tenant)│ │ Scoring Eng.  │  │
               │  └───────┬───────┘ └───────┬───────┘ └───────┬───────┘  │
               │          │                 │                 │          │
               │          └─────────────────┼─────────────────┘          │
               │                            ▼                            │
               │                Transactional Outbox / Bus               │
               └────────────────────────────┬────────────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
         ┌─────────────────────┐                         ┌─────────────────────┐
         │ PostgreSQL (Pool)   │                         │ Redis 7 (Sidekiq)   │
         │ - Schema & Tenants  │                         │ - Queues / DLQ      │
         │ - Audit Log Trails  │                         │ - Distributed Locks │
         │ - Outbox Messages   │                         │ - Ephemeral Cache   │
         └─────────────────────┘                         └─────────────────────┘
```

---

## 3. Especificação dos Domínios Alvo

| Domínio | Responsabilidade | Boundaries e Contratos |
|---|---|---|
| **Identity & Access** | Usuários, Autenticação, MFA, Sessões | `User`, `Devise`, `JwtService`, `SessionRevocation` |
| **Tenancy & Roles** | Empresas, Espaços de Trabalho, Membros e Papéis | `TenantScope`, `CompanyMember`, `RolePermission`, `CurrentTenant` |
| **Billing & Quota** | Assinaturas Stripe/MercadoPago, Planos, Quotas | `EntitlementEngine`, `CompanySubscription`, `UsageMeter` |
| **Sales & CRM** | Leads, Oportunidades, Pipelines, Atividades | `Sales::Opportunity`, `Sales::Pipeline`, `Sales::StageHistory` |
| **Marketplace** | Empresas, Catálogo, Produtos, Comparações | `Company`, `Product`, `Category`, `CompanyBadge` |
| **Reviews & Trust** | Avaliações, Moderação, TrustScore, Evidências | `Review`, `TrustScoreService`, `AiModerationWorker` |
| **Solar Intelligence** | Tarifas, Radiação Solar, Cálculos de ROI/Payback | `SolarCalculationEngine`, `TariffProvider`, `ExternalTariffCache` |
| **Audit & Event Bus** | Trilha de Auditoria Universal, Transactional Outbox | `AuditLog`, `TransactionalOutboxWorker`, `DomainEvent` |
