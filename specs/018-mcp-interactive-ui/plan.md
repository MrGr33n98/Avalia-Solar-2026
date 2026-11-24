# Plano Técnico — 018 MCP Interactive UI Experience (R1)

- **Feature:** `018-mcp-interactive-ui`
- **ADRs Associados:** `docs/mcp/ADR-004-mcp-ui-static-bundles-and-brand-alignment.md`

---

## 1. Arquitetura Real Adotada

```text
ChatGPT Host (inline / fullscreen, Light / Dark)
  ↕ MCP Apps Bridge (@modelcontextprotocol/ext-apps 2.0.4) + capability detection window.openai
React Widgets Isolados (packages/mcp-ui -> Vite singlefile HTML estático)
  ↕ JSON-RPC via Host (tools/call, resources/list, resources/read) — zero credencial no iframe
Rails 7 MCP Server (AB0-1-back)
  ├── Api::V1::Mcp::RemoteTransportController (2025-11-25) & Mcp::ModernPreviewProtocol (2026-07-28)
  ├── Mcp::Canary::Guard (allowlist client_id, subject, methods incl. resources/list & resources/read)
  ├── Mcp::PublicToolRegistry + Mcp::Ui::ResourceRegistry (versionado + CSP + feature flags)
  └── Mcp::Public::{DirectoryService, ReputationService, ComparisonService, OutputValidator}
```

### Estrutura de Diretórios

* `packages/mcp-ui/`:
  * `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`
  * `src/bridge/` (`host-adapter.ts`, `types.ts`, `capabilities.ts`, `errors.ts`)
  * `src/design/` (`tokens.css`, `theme.tsx`, `primitives/*`)
  * `src/contracts/` (`schemas.ts` com Zod alinhado ao `PublicToolRegistry`)
  * `src/fixtures/` (`staging-fixtures.ts` cobrindo 0/1/1000 reviews, nomes longos, missing logo, nulls)
  * `src/analytics/` (`telemetry.ts` opt-in/host-safe, sem PII)
  * `src/widgets/` (`search/`, `profile/`, `reputation/`, `compare/`, `categories/`)
  * `entries/` (`search.html`, `profile.html`, `reputation.html`, `compare.html`, `categories.html`)
  * `scripts/build.mjs` (compila as 5 entries via `vite-plugin-singlefile` e gera `dist/manifest.json` com SHA256/bytes/URI)
  * `tests/unit/`, `tests/e2e/`
* `AB0-1-back/`:
  * `app/services/mcp/ui/resource_registry.rb` (catálogo versionado de UI resources + leitor seguro baseado no `manifest.json`)
  * `app/services/mcp/ui/text_summary_formatter.rb` (fallback textual rico em português para `content[0].text`)
  * `app/services/mcp/public_tool_registry.rb` (`_meta.ui.resourceUri` condicional a `MCP_UI_ENABLED` e flags granulares)
  * `app/services/mcp/public/directory_service.rb` (`preload(:categories)` já corrigido + campo opcional `logo_url` público)
  * `app/controllers/api/v1/mcp/remote_transport_controller.rb` & `app/services/mcp/modern_preview_protocol.rb` (`capabilities.resources`, `resources/list`, `resources/read`)
  * `app/services/mcp/canary/guard.rb` & `app/services/mcp/remote_telemetry.rb` (allowlist `resources/list` e `resources/read`)
  * `public/mcp-ui/` (artefatos estáticos copiados no build Docker/script para runtime Rails; não requer Node no servidor HTTP)

---

## 2. Política de Feature Flags e CSP

* **Flags (todas default `false` em produção; seletivamente `true` em staging):**
  * `MCP_UI_ENABLED` (kill switch global da UI MCP; quando `false`, oculta `_meta.ui` e `resources/*`)
  * `MCP_UI_SEARCH_ENABLED` (`list_integrators`)
  * `MCP_UI_PROFILE_ENABLED` (`show_integrator_profile`)
  * `MCP_UI_REPUTATION_ENABLED` (`get_integrator_reputation`)
  * `MCP_UI_COMPARE_ENABLED` (`compare_integrators`)
  * `MCP_UI_CATEGORIES_ENABLED` (`list_solar_categories`)
* **CSP Mínima nos Resources (`_meta.ui.csp`):**
  * `connectDomains: []` (toda comunicação ocorre pela bridge MCP; zero `fetch` direto no iframe)
  * `resourceDomains`: apenas origem configurada de imagens públicas (`https://www.avaliasolar.com.br`, `https://mcp-staging.avaliasolar.com.br` ou Spaces CDN quando `ENV['MCP_UI_RESOURCE_DOMAINS']` definido), sem wildcards; fallback de iniciais ativo sempre que imagem falhar.
  * `frameDomains: []`.

---

## 3. Orçamento de Performance, Observabilidade e Rollback

* **Orçamento por Entry HTML:** < 120 KB gzip por widget autocontido (React + `@modelcontextprotocol/ext-apps` + Zod + CSS tokens; sem Tailwind runtime CDN, sem Framer Motion).
* **Latência Alvo (SLOs em Staging):**
  * `tools/call` p95 < 400 ms; `resources/read` p95 < 50 ms (leitura em memória com cache do arquivo estático versionado).
  * Render inicial do widget p95 < 150 ms.
* **Telemetria sem PII:** `Mcp::RemoteTelemetry` registra `resources/list` e `resources/read` além de `tools/call`; nunca registra tokens, argumentos brutos, queries livres ou IDs pessoais.
* **Rollback:** Setar `MCP_UI_ENABLED=false` no ambiente restaura instantaneamente resposta 100% textual sem redeploy; rollback completo restaura tag Docker anterior (`5babce764`).
