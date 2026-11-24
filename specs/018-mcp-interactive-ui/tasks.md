# Backlog e Tarefas — 018 MCP Interactive UI Experience

- **Estratégia:** TDD-first (testes de contrato, schema, unitários e UI precedem/acompanham cada incremento).
- **Regra de Gate:** **R2 e R3 estão bloqueados** até entrega, smoke staging, evidência no ChatGPT e aprovação formal de **R1**.

| Task | SP | Fase | Status | Descrição & Entregáveis | Critério de Aceite / Verificação |
|---|---:|---|---|---|---|
| T001 | 3 | R0 | `[x]` | Auditoria read-only paths, SHA, skills, tokens reais, workflows, ADRs (`ADR-004`..`007`) | Relatório R0 + `specs/018-mcp-interactive-ui/` + branch `feat/018-mcp-interactive-ui` |
| T002 | 3 | R0 | `[x]` | Baseline 5 tools + correção `preload(:categories)` em `DirectoryService` | RSpec baseline verde + staging query por categoria 200 OK |
| T003 | 3 | R0 | `[x]` | Extração e validação AA dos tokens reais (`AB0-1-front`) + logo SVG oficial | `research.md` com valores exatos e razões de contraste |
| T004 | 5 | R1 | `[ ]` | Scaffold `packages/mcp-ui/` (Vite singlefile + React 18 + TS + `@modelcontextprotocol/ext-apps` + Zod + Vitest + Playwright + `axe-core`) e `scripts/build.mjs` gerando `dist/manifest.json` | `npm run typecheck && npm run test && npm run build` geram 5 bundles < 120 KB gzip cada |
| T005 | 5 | R1 | `[ ]` | Bridge Adapter (`HostProvider`, `ext-apps` + capability detection `window.openai`, `requestId` anti-race, fallback offline/standalone) + Harness simulado + testes unitários | Unit tests cobrindo `tool-result`, `host-context-changed`, `tools/call`, erro e standalone |
| T006 | 5 | R1 | `[ ]` | Design tokens host-first + Primitives acessíveis (`AppFrame`, `LogoAvatar`, `Badge`, `CategoryChip`, `Metric`, `RatingInline`, `Button`, `Select`, `Checkbox`, `Skeleton`, `EmptyState`, `ErrorState`, `SourceNote`, `Pagination`, `LiveRegion`, `BridgeErrorBoundary`) + fixtures R1 | Testes de renderização, contraste, `prefers-reduced-motion`, 0/1/1000 reviews e logos ausentes |
| T007 | 5 | R1 | `[ ]` | Rails `Mcp::Ui::ResourceRegistry`, `TextSummaryFormatter`, `_meta.ui.resourceUri` flag-gated em `PublicToolRegistry`, `resources/list` & `resources/read` em `RemoteTransportController` + `ModernPreviewProtocol` + `Guard` + `RemoteTelemetry` | RSpec TDD: `MCP_UI_ENABLED=false` preserva contrato 100%; `true` expõe 5 resources MIME `text/html;profile=mcp-app`, CSP, anti-path-traversal |
| T008 | 8 | R1 | `[ ]` | **W01 `IntegratorSearch` + W02 `IntegratorCard`** (filtros, debounce 300ms, 3 cards iniciais, cursor `"Ver mais"`, seleção até 3 para comparar, estados loading/refreshing/empty/error) | Vitest + Playwright responsividade + fluxo buscar→paginar→selecionar→comparar |
| T009 | 5 | R1 | `[ ]` | **W03 `BrandProfile` + W04 `ReputationScore` + W05 `TrustVerification`** (perfil público, sede vs cobertura declarada, 0 reviews = `"Sem avaliações"`, barras 1–5, link oficial via host/âncora segura) | Vitest + Playwright verificando ausência de nota fictícia e clareza de verificação |
| T010 | 5 | R1 | `[ ]` | **W06 `IntegratorComparison`** (2–3 empresas, fullscreen preferencial, critérios alinhados, `"Não informado"` distinto de `false`, remover empresa, zero vencedor absoluto) | Vitest + Playwright validando 2 e 3 colunas, wraps de nomes longos e scroll mobile |
| T011 | 3 | R1 | `[ ]` | **W07 `SolarCategoryExplorer`** (grid 2–3 cols de categorias ativas, filtro por `category_slug` disparando `list_integrators` via bridge) | Vitest + Playwright validando seleção e fallback sem categoria |
| T012 | 3 | R1 | `[ ]` | Telemetria de widget sem PII + alinhamento a `RemoteTelemetry` e taxonomia `BuyerIntentActivity` (sem forjar `company_id`) | Testes unitários validando payload sem PII nem duplicação |
| T013 | 5 | R1 | `[ ]` | QA Visual, Playwright E2E + `@axe-core/playwright` nos viewports `320/375/480/640/768/1024px`, Light & Dark Mode, zoom 200%, `prefers-reduced-motion`, bundle size gate | 0 violações críticas/sérias axe; screenshots revisados |
| T014 | 5 | R1 | `[ ]` | Integração `Dockerfile.backend`, workflow CI `mcp-remote-contract-gate.yml`, deploy em **staging isolado** (`mcp-staging.avaliasolar.com.br`), smoke end-to-end (texto + UI) e comprovação no ChatGPT real | CI verde + smoke staging + evidências finais R1 (produção OFF) |
| T015+ | — | R2/R3 | `[ ]` | **BLOQUEADO:** Cobertura CEP, ranking oficial, estimador solar, orçamento, fatura, tracking | Requer aprovação explícita pós-R1 |
