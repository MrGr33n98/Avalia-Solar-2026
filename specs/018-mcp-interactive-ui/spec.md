# Especificação 018 — Avalia Solar MCP Interactive UI Experience (PDR/PRD)

- **Feature:** `018-mcp-interactive-ui`
- **Branch:** `feat/018-mcp-interactive-ui`
- **Baseline SHA:** `5babce764`
- **Status:** R0 Auditado → R1 Em Implementação (TDD-first)
- **Escopo Ativo:** **R1 exclusivamente leitura**. R2 e R3 permanecem bloqueados até aprovação explícita dos gates de R1.

---

## 1. Problema, Público e Proposta de Valor

Consumidores B2C residenciais, rurais e comerciais procuram empresas integradoras de energia solar confiáveis no ChatGPT sem dominar termos técnicos. A experiência MCP Interactive UI renderiza interfaces leves, nativas ao host ChatGPT, diretamente alimentadas pelos serviços públicos verificados do Avalia Solar (`Mcp::Public::DirectoryService`, `ReputationService`, `ComparisonService`), preservando 100% de fallback textual para clientes sem suporte a UI.

---

## 2. Escopo por Release

- **R0 (Concluído em Read-Only):** Inventário do repositório, SHA, specs, tokens oficiais (`AB0-1-front/tailwind.config.ts`, `globals.css`), assets oficiais, gem/SDK (`@modelcontextprotocol/ext-apps@2.0.4`, `@openai/apps-sdk-ui@0.2.2`), validação dos 5 contratos públicos, correção de query por categoria (`preload(:categories)`), matriz de skills e ADRs.
- **R1 (P0 — Ativo Agora, Exclusivamente Leitura):**
  - **W01 `IntegratorSearch` + W02 `IntegratorCard`** (`ui://avalia-solar/search/v1.html`): busca por cidade/UF, categoria ou texto; ordenação transparente (`relevance`, `rating`, `review_count`); 3 cards iniciais + paginação por cursor; seleção local de 2–3 empresas para comparação.
  - **W03 `BrandProfile` + W05 `TrustVerification`** (`ui://avalia-solar/profile/v1.html`): perfil público sanitizado com sede separada de cobertura declarada, selo explicando que verificação não é garantia de qualidade, serviços e link oficial validado.
  - **W04 `ReputationScore` + W05 `TrustVerification`** (`ui://avalia-solar/reputation/v1.html`): distribuição 1–5 estrelas, tamanho de amostra explícito, `average_rating: null` exibido como `"Sem avaliações"` (nunca `0,0`).
  - **W06 `IntegratorComparison`** (`ui://avalia-solar/compare/v1.html`): matriz semântica de 2–3 empresas ativas únicas, modo fullscreen preferencial, diferença explícita entre `"Não informado"` e `false`, sem declarar vencedor absoluto.
  - **W07 `SolarCategoryExplorer`** (`ui://avalia-solar/categories/v1.html`): grade responsiva 2–3 colunas com categorias ativas reais e navegação filtrada para busca por `category_slug`.
  - **Fallback Textual & Bridge Padrão:** `content[0].text` estruturado e legível para toda tool; `_meta.ui.resourceUri` controlado por feature flag `MCP_UI_ENABLED` (default `false` em produção).
- **R2 (P1 — Bloqueado até aprovação de R1):** Cobertura CEP, ranking oficial elegível, simulador solar (`SolarSavingsCalculator`), payback (`SolarPaybackChart`), contato e pedido de orçamento idempotente (`QuoteRequestForm`).
- **R3 (P2 — Bloqueado até aprovação de R2):** Analisador de fatura, comparação de propostas, catálogo de equipamentos/garantias, acompanhamento (`QuoteTracker`) e `ReviewComposer`.

---

## 3. User Stories R1 e Critérios de Aceite

| ID | Prioridade | Story | Critério Given–When–Then |
|---|---|---|---|
| US01 | P0 | Como consumidor quero pesquisar empresas por cidade, UF, categoria ou nome | **Given** filtros válidos, **When** `list_integrators` executa, **Then** exibe somente empresas ativas em cards até 3 iniciais com paginação por cursor e distinção clara entre sede (`headquarters`) e cobertura declarada (`declared_coverage`). |
| US02 | P0 | Como consumidor quero consultar o perfil público de uma empresa | **Given** `company_id` ou `slug` ativo, **When** `show_integrator_profile` executa, **Then** exibe dados públicos, status de verificação com tooltip/nota de limite, categorias, serviços e link externo seguro (`profile_url`). |
| US03 | P0 | Como consumidor quero validar a reputação real da empresa | **Given** empresa com 0, 1 ou N reviews aprovadas, **When** `get_integrator_reputation` executa, **Then** exibe `null` como `"Sem avaliações"` (nunca `0`), amostra pequena sinalizada e barras de distribuição sem inventar texto de avaliação. |
| US04 | P0 | Como consumidor quero comparar 2 a 3 integradores lado a lado | **Given** 2 ou 3 IDs/slugs únicos ativos, **When** `compare_integrators` executa, **Then** exibe tabela semântica alinhada com critérios válidos (`reputation`, `categories`, `headquarters`, `declared_coverage`, `services`), campos ausentes como `"Não informado"` e zero viés de vencedor/patrocinador. |
| US05 | P0 | Como consumidor quero explorar categorias de energia solar | **Given** taxonomia ativa em `Category.active`, **When** `list_solar_categories` executa, **Then** exibe grid navegável que aciona `list_integrators` com `category_slug` real sem perder contexto. |

---

## 4. Requisitos Funcionais e Invariantes (R1)

* **FR01:** Preservar os 5 contratos JSON-RPC e schemas de `Mcp::PublicToolRegistry` sem regressão quando `MCP_UI_ENABLED=false`.
* **FR02:** Implementar `resources/list` e `resources/read` no servidor Rails (`/mcp`, legacy `2025-11-25` e moderno `2026-07-28`), liberando-os no `Mcp::Canary::Guard` quando `MCP_UI_ENABLED=true`.
* **FR03:** Servir HTML autocontido com MIME `text/html;profile=mcp-app`, versão explícita (`ui://avalia-solar/<surface>/v1.html`) e leitura exclusiva via allowlist de manifesto estático (sem path traversal).
* **FR04:** Todos os widgets usam `@modelcontextprotocol/ext-apps` primeiro (`ui/notifications/tool-result`, `ui/notifications/host-context-changed`, `tools/call`, `ui/message`) e `window.openai` apenas via detecção de capacidade com fallback seguro.
* **FR05:** Preservar superfícies, fonte e tema light/dark do host ChatGPT; aplicar tokens reais Avalia Solar (`#2563EB`, `#047857`, `#0F172A`, `#F59E0B` estrela + SVG oficial) exclusivamente como accents e identidade pontual.
* **FR06:** Nunca atribuir nota a empresa com 0 avaliações; nunca inferir cobertura pela sede; nunca apresentar `sort=rating` ou `review_count` como "ranking oficial".
* **FR07:** Todo tool result continua emitindo `content` textual humano-legível e `structuredContent` validado por `Mcp::Public::OutputValidator` (<= 64 KB, sem PII).
* **FR08:** Manter todas as flags `MCP_UI_*` e `MCP_REMOTE_PRODUCTION_ENABLED` desabilitadas (`false`) em produção.

