# Plano Arquitetural: SPEC 026 — Agentic Storefront MVP

**Versão:** 0.1.0  
**Status:** Planejamento Arquitetural (EGM Phase 02 / Spec Kit)  
**Data:** 26 de Novembro de 2026  

---

## 1. Visão Arquitetural

A implementação do Storefront segue o princípio de **mínima complexidade acidental (37signals Rails)** e **desacoplamento agent-native (MCP Apps SDK)**:

```
[Cliente Web / PWA Next.js 14]       [Agente MCP / ChatGPT / Claude]
             │                                      │
             │ GET /storefront/:slug                │ tools/call: show_storefront_profile
             ▼                                      ▼
     [Storefront Route Handler]            [Rails McpController (/mcp)]
             │                                      │
             └───────────────┬──────────────────────┘
                             ▼
               [Mcp::PublicToolRegistry / Rails API]
                             │
                             ▼
            [Storefront::DiscoveryService (PORO)]
            ├── Entitlement Check (Pundit / Tier)
            ├── Company Profile & Verification Badges
            ├── Curated Catalog & Projects
            └── Aggregated Reviews & Trust Evidence
                             │
                             ▼
                 [PostgreSQL 14 / Redis Cache]
```

---

## 2. Fases de Execução (Ondas W0 a W6)

### W0: Discovery & Baseline
- Auditoria das tabelas existentes (`companies`, `products`, `leads`, `reviews`, `projects`).
- Verificação de rotas e controllers atuais do dashboard B2B.
- Registro do baseline de latência e consumo de memória.

### W1: Modelagem DDD e Contratos de Backend
- Contexto delimitado `Storefront`:
  - `Storefront::Profile` (agregação do perfil público e configurações).
  - `Storefront::ShowcaseItem` (módulos, inversores e kits em destaque).
  - `Storefront::InstallationProject` (projetos executados pela empresa).
- DTOs serializados via ActiveModelSerializers com versionamento v1.
- Schemas Zod em `@avalia-solar/mcp-ui` e `@avalia-solar/ui-registry`.

### W2: Ferramenta Pública MCP & Superfície Standalone
- Nova ferramenta pública: `show_storefront_profile` em `Mcp::PublicToolRegistry`.
- Anotações: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`.
- Superfície HTML standalone: `ui://avalia-solar/storefront/v1.html` em `packages/mcp-ui`.
- Orçamento de bundle: $\le 120\text{ KiB}$ gzip.

### W3: Front-end Web & PWA (/storefront/[slug])
- Página pública em Next.js 14 App Router com ISR (`unstable_cache` com revalidação sob demanda).
- Header institucional, catálogo, carrossel de projetos e calculadora solar embutida.
- Metatags dinâmicas para SEO, OpenGraph e dados estruturados Schema.org (`LocalBusiness`, `Product`).

### W4: Gestão no Company Dashboard (SPEC 022)
- Aba de configuração da vitrine dentro do portal B2B.
- Upload de imagens de projetos, seleção de marcas homologadas e customização de chamada.
- Feature gating por plano (Free vs Pro vs Enterprise).

### W5: Testes Multi-Camada (TDD / BDD / E2E)
- RSpec 6 cobrindo services, serializers e authorization policies.
- Vitest cobrindo componentes do storefront e schemas Zod.
- Playwright E2E validando jornada de ponta a ponta (descoberta → simulação → orçamento).

### W6: Revisão EGM Goldfish & Drift Report
- Execução de `egm-review` e `egm-drift-report`.
- Resolução de blockers e homologação final.
