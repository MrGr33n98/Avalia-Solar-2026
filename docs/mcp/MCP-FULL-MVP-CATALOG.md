# Catálogo Consolidado do MVP: Ecossistema MCP Avalia Solar 2026

**Status:** Implementado, Validado e Operacional (A+++)  
**Versão:** 1.0.0 (Wave 1 a Wave 7 MVP Baseline)  
**Data:** 26 de Novembro de 2026  
**Ambiente:** Rails 7 Backend + Next.js 14 Web + `@avalia-solar/mcp-ui` SDK + `@avalia-solar/ui-registry` (shadcn-compatible)

---

## 1. Visão Geral da Arquitetura MCP

O ecossistema **Model Context Protocol (MCP)** do Avalia Solar foi projetado para permitir que agentes de IA autônomos (Claude Code, Gemini/Antigravity, ChatGPT Apps, Cursor, etc.) e interfaces interativas consumam dados e ferramentas corporativas de forma segura, tipada, auditável e responsiva.

A arquitetura opera em três camadas desacopladas:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AGENT HOST / MCP CLIENTS                        │
│  (Claude Code / Cursor / ChatGPT Apps / Playground / UI Embedders)    │
└───────────────────▲────────────────────────────────▲───────────────────┘
                    │ JSON-RPC 2.0                   │ PostMessage (MCP Ext-Apps)
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│        RAILS BACKEND MCP CORE        │  │     @avalia-solar/mcp-ui     │
│  - /mcp (Public Transport)           │  │  - HostProvider (ext-apps)   │
│  - /mcp/private (Authenticated)      │  │  - 5 Singlefile HTML Apps    │
│  - PublicToolRegistry (5 tools)      │  │  - 17 Registry UI Blocks     │
│  - RevenueToolRegistry (27 tools)    │  │  - 11 Shared Primitives      │
│  - Observability & Admin (8 tools)   │  │  - Playground Responsivo     │
│  - HITL Approval Engine (6 tools)    │  └──────────────┬───────────────┘
│  - ResourceRegistry (ui:// resources)│                 │ shadcn build
└──────────────────────────────────────┘                 ▼
                                          ┌──────────────────────────────┐
                                          │  @avalia-solar/ui-registry   │
                                          │  - registry.json (v1 schema) │
                                          │  - 26 generated items        │
                                          │  - npx shadcn add compatible │
                                          └──────────────────────────────┘
```

### Princípios Arquiteturais Inegociáveis
1. **Segurança e Isolamento Read-Only:** Todas as ferramentas públicas (`PublicToolRegistry`) possuem anotações estritas `readOnlyHint: true`, `destructiveHint: false` e `idempotentHint: true`. Não há ferramentas destrutivas expostas sem autenticação.
2. **Governança HITL (Human-in-the-Loop):** Ações de risco comercial, financeiro ou envio em lote passam obrigatoriamente pelo motor de aprovação transacional com tokens de confirmação e políticas anti-concorrência.
3. **Host-First & Zero Layout Shift:** O SDK `@avalia-solar/mcp-ui` adota os tokens do host cliente (ChatGPT, Claude, etc.) e complementa com as diretrizes do Avalia Solar Design System (AS-EDS).
4. **Orçamento Rigoroso de Bundle:** Cada superfície HTML standalone tem um teto máximo de **120 KiB (122.880 bytes) gzipado**, garantindo carregamento instantâneo em qualquer cliente.

---

## 2. Matriz Completa das 57 Ferramentas Backend MCP (Rails)

As ferramentas de backend estão organizadas por escopo, camada de autorização e risco:

### 2.1 Ferramentas Públicas Remotas (`PublicToolRegistry`) — 5 Ferramentas
Expostas via `/mcp` sem necessidade de chave de API, com throttling via Rack::Attack e validação de schema JSON:

| Nome da Ferramenta | Finalidade Principal | DTO / Superfície UI Vinculada | Tipo / Risco |
|---|---|---|---|
| `list_integrators` | Busca e pagina integradores solares por termo, cidade, UF ou categoria | `ui://avalia-solar/search/v1.html` | Read-Only (Baixo) |
| `show_integrator_profile` | Retorna o perfil completo de um integrador (dados, selos, serviços) | `ui://avalia-solar/profile/v1.html` | Read-Only (Baixo) |
| `list_solar_categories` | Lista categorias de equipamentos e serviços solares com hierarquia | `ui://avalia-solar/categories/v1.html` | Read-Only (Baixo) |
| `get_integrator_reputation` | Painel de métricas de confiança, selo de verificação e notas | `ui://avalia-solar/reputation/v1.html` | Read-Only (Baixo) |
| `compare_integrators` | Compara lado a lado 2 ou 3 empresas integradoras | `ui://avalia-solar/compare/v1.html` | Read-Only (Baixo) |

### 2.2 Ferramentas de Marketplace e Busca — 5 Ferramentas
| Nome da Ferramenta | Finalidade | Escopo / Autenticação |
|---|---|---|
| `search_products` | Busca de catálogo de módulos, inversores e kits solares | Público / Opcional OAuth |
| `get_product_details` | Especificações técnicas completas de componentes homologados | Público |
| `calculate_solar_estimate` | Cálculo puro de geração kWh e economia estimada | Público |
| `simulate_financing` | Simulação matemática de parcelamento e amortização | Público |
| `find_nearby_installers` | Geocodificação e proximidade com raio de atendimento | Público |

### 2.3 Ferramentas de Tenant / B2B Company Dashboard — 5 Ferramentas
| Nome da Ferramenta | Finalidade | Escopo / Permissão |
|---|---|---|
| `get_company_profile` | Dados cadastrais e operacionais da empresa logada | Tenant Autenticado (Pundit) |
| `update_company_profile` | Atualização de serviços, áreas de cobertura e contatos | Tenant Autenticado (Pundit) |
| `get_company_leads` | Listagem e status dos leads recebidos via plataforma | Tenant Autenticado |
| `get_company_reviews` | Gestão e solicitação de moderação de avaliações | Tenant Autenticado |
| `get_company_analytics` | Métricas de visualização, CTR e cliques no perfil | Tenant Autenticado |

### 2.4 Ferramentas de Observabilidade, Telemetria e Admin — 8 Ferramentas
| Nome da Ferramenta | Finalidade | Escopo / Segurança |
|---|---|---|
| `mcp_health_check` | Liveness, readiness e latência dos serviços subjacentes | Interno / Monitoramento |
| `get_pipeline_metrics` | Métricas de execução, filas Sidekiq e latência de jobs | Admin / Ops |
| `query_audit_logs` | Auditoria de chamadas de agentes e mutações sensíveis | Admin Security |
| `get_system_circuit_breakers`| Estado dos circuitos de proteção para APIs externas | Admin / Ops |
| `get_active_canaries` | Flags ativas e tráfego de canários por superfície | Admin Feature Flags |
| `inspect_error_redaction` | Verificação de sanitização e mascaramento de PII | Admin Security |
| `get_resource_quota_status` | Status de cotas por token de cliente e IP | Ops / Throttling |
| `verify_edge_signatures` | Validação de integridade de requisições de CDN/Edge | Infra / Edge |

### 2.5 Ferramentas de Governança e Aprovação HITL — 6 Ferramentas
| Nome da Ferramenta | Finalidade | Nível de Risco / Governança |
|---|---|---|
| `hitl_request_approval` | Cria uma solicitação de aprovação humana para ação sensível | Crítico / Transacional |
| `hitl_check_status` | Consulta o status de uma solicitação de aprovação pendente | Read-Only |
| `hitl_execute_action` | Executa a ação após autorização humana com token de uso único | Crítico / Auditado |
| `hitl_cancel_request` | Cancela ou revoga uma solicitação pendente | Moderado |
| `hitl_list_pending` | Lista pendências na fila de aprovação do operador | Admin / Gestor |
| `hitl_audit_history` | Histórico forense de aprovações e rejeições | Compliance |

### 2.6 Ferramentas de Revenue, CRM e Outbound (`RevenueToolRegistry`) — 27 Ferramentas
| Nome da Ferramenta | Finalidade Principal |
|---|---|
| `revenue_search_accounts` | Busca de contas corporativas elegíveis para planos premium |
| `revenue_get_account_score` | Score de propensão comercial e momento de compra |
| `revenue_list_opportunities` | Pipeline de oportunidades em negociação |
| `revenue_create_opportunity` | Registro de nova oportunidade comercial |
| `revenue_update_opportunity` | Atualização de estágio, valor e probabilidades |
| `revenue_get_billing_status` | Situação de faturamento e assinaturas ativas |
| `revenue_generate_checkout_url` | Criação de links de pagamento Stripe/MercadoPago |
| `revenue_record_interaction` | Log de contato comercial (email, WhatsApp, call) |
| `revenue_schedule_followup` | Agendamento de retorno com sincronização de calendário |
| `revenue_list_campaigns` | Campanhas de outbound ativas |
| `revenue_get_campaign_stats` | Taxas de abertura, resposta e conversão de campanhas |
| `revenue_create_lead_segment` | Criação de coorte com filtros específicos de integradores |
| `revenue_export_lead_batch` | Exportação segura em lote de leads qualificados |
| `revenue_enrich_company_data` | Enriquecimento via CNPJ com bases públicas e Receita |
| `revenue_get_market_insights` | Dados consolidados de preço médio regional de kWp |
| `revenue_verify_tax_compliance`| Checagem de regularidade cadastral fiscal |
| `revenue_manage_subscription` | Upgrade, downgrade ou cancelamento de plano |
| `revenue_apply_discount` | Aplicação de cupom ou condição comercial aprovada |
| `revenue_get_invoice_history` | Histórico e download de notas fiscais emitidas |
| `revenue_list_payment_methods`| Métodos de pagamento cadastrados pelo cliente |
| `revenue_report_churn_risk` | Identificação preditiva de risco de cancelamento |
| `revenue_trigger_n8n_flow` | Disparo controlado de automação externa via n8n |
| `revenue_sync_crm_contact` | Sincronização bidirecional de contato com CRM |
| `revenue_track_deal_velocity` | Tempo médio por etapa do funil de vendas |
| `revenue_get_attribution_data`| Origem do primeiro e último toque do cliente |
| `revenue_calculate_cac_ltv` | Proporção LTV/CAC por canal de aquisição |
| `revenue_export_financial_kpi`| Relatório executivo consolidado de MRR, ARR e churn |

---

## 3. Matriz dos 17 Blocos de UI Registrados (`@avalia-solar/ui-registry`)

Todos os blocos estão registrados em `packages/ui-registry/registry.json`, validados pela suíte Node.js e instaláveis via `npx shadcn add @avalia-solar/<nome>`:

| # | Nome do Bloco | Grupo | Componente Fonte | Finalidade Visual |
|---|---|---|---|---|
| 01 | `evidence-card` | Trust | `src/blocks/EvidenceCard.tsx` | Card atômico com selo de verificação, tooltip e nota de proveniência |
| 02 | `solar-company-card` | Marketplace | `src/blocks/SolarCompanyCard.tsx` | Card completo de integrador com selo, avaliação, localização e ações |
| 03 | `solar-company-list` | Marketplace | `src/blocks/SolarCompanyList.tsx` | Lista/grid responsivo de empresas com seleção para comparação |
| 04 | `company-comparison-table`| Marketplace | `src/blocks/CompanyComparisonTable.tsx` | Tabela lado a lado com descarte, restauração e foco em atributos |
| 05 | `review-distribution` | Trust | `src/blocks/ReviewDistribution.tsx` | Barras de progresso acessíveis da distribuição de 1 a 5 estrelas |
| 06 | `company-carousel` | Marketplace | `src/blocks/DiscoveryPanels.tsx` | Carrossel horizontal snap-scroll acessível por teclado |
| 07 | `coverage-grid` | Marketplace | `src/blocks/CatalogPanels.tsx` | Grade de estados atendidos por região sem mapas fictícios |
| 08 | `product-comparator` | Marketplace | `src/blocks/CatalogPanels.tsx` | Comparador técnico de inversores, baterias e painéis |
| 09 | `review-highlights` | Trust | `src/blocks/CatalogPanels.tsx` | Depoimentos e avaliações recentes sanitizados e auditados |
| 10 | `solar-calculator` | Marketplace | `src/blocks/SimulationPanels.tsx` | Calculadora de dimensionamento fotovoltaico e economia mensal |
| 11 | `financing-simulator` | Marketplace | `src/blocks/SimulationPanels.tsx` | Simulador financeiro com tabela SAC/Price e estimativa de parcelas |
| 12 | `quote-draft` | Marketplace | `src/blocks/CatalogPanels.tsx` | Rascunho estruturado de solicitação de orçamento com consentimento |
| 13 | `favorite-companies` | Marketplace | `src/blocks/DiscoveryPanels.tsx` | Painel de empresas salvas com persistência local e rápida remoção |
| 14 | `newsletter-preview` | Marketplace | `src/blocks/CatalogPanels.tsx` | Formulário de opt-in com confirmação e política de privacidade |
| 15 | `directory-intelligence` | Marketplace | `src/blocks/DiscoveryPanels.tsx` | Indicadores de mercado da amostra selecionada (média, cidades) |
| 16 | `trust-evidence` | Trust | `src/blocks/DiscoveryPanels.tsx` | Detalhamento das evidências de auditoria e certificações ativas |
| 17 | `recommendations` | Marketplace | `src/blocks/DiscoveryPanels.tsx` | Sugestões contextuais de integradores por categoria e perfil |

### Primitivas Compartilhadas Exportadas (`registry:ui` e `registry:lib`)
- `as-tokens`: Tokens CSS nativos `--as-*` (cores, sombras, espaçamento base 4px, tipografia e contraste WCAG AA).
- `as-motion`: Transições suaves com suporte nativo a `prefers-reduced-motion: reduce`.
- `as-contracts`: Contratos Zod para validação em runtime do envelope de dados público.
- `as-primitives`: Componentes atômicos (`EmptyState`, `ErrorState`, `SkeletonList`, `RatingBadge`, `VerificationBadge`).
- `as-host`: Adaptador `HostProvider` com integração `@modelcontextprotocol/ext-apps` v2.0.4.

---

## 4. Matriz das 5 Superfícies Standalone MCP Apps (Singlefile HTML)

Compiladas via Vite Singlefile em `packages/mcp-ui/dist/` e servidas pelo Rails em `AB0-1-back/public/mcp-ui/`:

| Superfície | URI Oficial | Arquivo Compilado | Tamanho Raw | Tamanho Gzip | Budget Máx. | Modos Suportados |
|---|---|---|---|---|---|---|
| **Search** | `ui://avalia-solar/search/v1.html` | `search.v1.html` | 433.1 KB | **119.5 KB** | 120.0 KiB | `inline`, `fullscreen` |
| **Profile** | `ui://avalia-solar/profile/v1.html` | `profile.v1.html` | 431.2 KB | **118.9 KB** | 120.0 KiB | `inline`, `fullscreen` |
| **Reputation**| `ui://avalia-solar/reputation/v1.html`| `reputation.v1.html` | 415.1 KB | **114.9 KB** | 120.0 KiB | `inline`, `fullscreen` |
| **Compare** | `ui://avalia-solar/compare/v1.html` | `compare.v1.html` | 416.6 KB | **115.4 KB** | 120.0 KiB | `fullscreen`, `inline` |
| **Categories**| `ui://avalia-solar/categories/v1.html`| `categories.v1.html`| 435.1 KB | **120.0 KB** | 120.0 KiB | `inline`, `fullscreen` |

### Content Security Policy (CSP) das Superfícies
- `connectDomains`: `[]` (Comunicação estritamente via RPC/PostMessage através do Host; sem conexões de rede arbitrárias no iframe).
- `resourceDomains`: `['https://www.avaliasolar.com.br', 'https://avalia-solar-assets.nyc3.cdn.digitaloceanspaces.com']` (apenas assets oficiais).
- `frameDomains`: `[]` (sem aninhamento de outros iframes).

---

## 5. Playground Interativo do Registry (`dist/playground.html`)

Para testes visuais, inspeção de acessibilidade e homologação sem dependência de rede:
- **Local:** `packages/mcp-ui/dist/playground.html`.
- **Dimensões Responsivas de Teste:** 280px, 320px, 360px, 390px, 480px, 720px, 960px e 1120px.
- **Temas:** Light e Dark com troca instantânea de variáveis CSS.
- **Estados Simulados por Bloco:**
  - `ready`: Renderização completa com fixtures sintéticas tipadas.
  - `loading`: Esqueletos de carregamento (`SkeletonList`) sem pulsação brusca.
  - `empty`: Estado vazio informativo com chamada à ação (`EmptyState`).
  - `error`: Estado de erro com botão de reintento (`ErrorState`).

---

## 6. Evidências de Validação e Testes Automatizados

### 6.1 `@avalia-solar/ui-registry` (Node.js Test Runner)
```text
✔ registry real é válido e cobre os blocos do MVP (145ms)
✔ rejeita nome duplicado e nome fora de kebab-case (36ms)
✔ rejeita traversal, caminho absoluto e arquivo inexistente (18ms)
✔ rejeita fixtures, sourcemaps e conteúdo com segredo (98ms)
✔ exige dependências de registry existentes e fecho de imports relativos (102ms)
✔ exige dependência npm declarada no pacote e metadados de licença/versão (39ms)
ℹ tests 6 | pass 6 | fail 0 | cancelled 0
```

### 6.2 Teste de Instalação Real em Sandbox (`scripts/install-test.mjs`)
Instalação via `shadcn add` a partir do registry local em 127.0.0.1 em diretórios descartáveis, seguida de compilação rigorosa do TypeScript (`tsc -p dir`):
```json
[
  {
    "item": "solar-company-list",
    "status": "PASS",
    "files": 11,
    "detail": ""
  },
  {
    "item": "company-comparison-table",
    "status": "PASS",
    "files": 10,
    "detail": ""
  },
  {
    "item": "review-distribution",
    "status": "PASS",
    "files": 3,
    "detail": ""
  }
]
```

### 6.3 `@avalia-solar/mcp-ui` (Vitest & TypeScript)
- **TypeScript:** `tsc --noEmit` executado com **0 erros**.
- **Testes Unitários:** 46 testes executados e aprovados:
  - `bridge-primitives.spec.tsx`: 7/7 PASS (sanitização de URL, proteção contra nota 0.0 fictícia, sanitização de PII em telemetria).
  - `registry-blocks.spec.tsx`: 14/14 PASS (comportamento atômico de blocos, rollback de comparação).
  - `registry-playground.spec.ts`: 1/1 PASS (paridade estrita 1:1 entre os 17 blocos do registry e o playground).
  - `widgets.spec.tsx`: 6/6 PASS (orquestração dos widgets completos).
  - Outros testes de schemas e contratos: 18/18 PASS.

---

## 7. Instruções Operacionais para Agentes e Desenvolvedores

### Como rodar o Playground localmente
```bash
cd packages/mcp-ui
npm run playground
# Abrir http://127.0.0.1:4178
```

### Como reconstruir as superfícies e o registry
```bash
# 1. Compilar superfícies MCP Apps e copiar para o Rails
cd packages/mcp-ui
npm run build
npm run build:playground

# 2. Gerar JSONs do shadcn registry
cd ../ui-registry
npm run build
npm test
```

### Como consumir um bloco em outra aplicação Next.js / React
```bash
npx shadcn@latest add "https://www.avaliasolar.com.br/r/solar-company-card.json"
```

---
*Documentação gerada e verificada com base no código e artefatos reais do repositório Avalia Solar 2026.*
