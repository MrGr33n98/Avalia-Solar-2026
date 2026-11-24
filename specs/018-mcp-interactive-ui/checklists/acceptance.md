# Checklist de Aceite e Release Gate A+++ — 018 MCP Interactive UI (R1)

## Contratos & Backend Rails
- [x] Todos os 5 contratos existentes (`list_integrators`, `show_integrator_profile`, `list_solar_categories`, `get_integrator_reputation`, `compare_integrators`) preservados integralmente com `MCP_UI_ENABLED=false`.
- [x] `list_integrators` com `category_slug` corrigido com `preload(:categories)` (sem erro PostgreSQL `json`, validado via `SEARCH_BY_CAT` em staging).
- [x] `resources/list` e `resources/read` implementados em `RemoteTransportController` (`2025-11-25`) e `ModernPreviewProtocol` (`2026-07-28`), autorizados em `Mcp::Canary::Guard` apenas quando `MCP_UI_ENABLED=true`.
- [x] MIME type `text/html;profile=mcp-app`, URI versionado (`ui://avalia-solar/<surface>/v1.html`), CSP mínima (`connectDomains: []`, sem wildcards) e proteção contra path traversal.
- [x] `content[0].text` textual legível em humano para todas as 5 tools quando UI está desabilitada ou cliente é text-only.
- [x] `OutputValidator` continua validando `structuredContent` sem chaves privadas (`PRIVATE_KEYS`) e abaixo de 64 KB.

## Bridge, UI & Design System Real
- [x] Bridge `@modelcontextprotocol/ext-apps` padrão implementada com `requestId` anti-corrida e detecção opcional de `window.openai`.
- [x] Cores oficiais Avalia Solar (`#2563EB` / `#60A5FA`, `#047857` / `#34D399`, `#0F172A`, `#F59E0B` com label) aplicadas como accents sobre superfícies e tipografia do host ChatGPT.
- [x] Logo oficial (`avalia-solar-logo-horizontal.svg` / `logo_url` HTTPS público) com fallback seguro por iniciais; sem shell/navbar duplicada.
- [x] Invariantes de domínio visíveis: sede ≠ cobertura, 0 reviews => `"Sem avaliações"` (nunca `0.0`), verificação ≠ garantia, comparação sem vencedor absoluto.
- [x] Estados completos em cada widget: `loading` (skeleton), `ready`, `refreshing`, `empty`, `partial`, `error`, `offline`.

## Qualidade, Acessibilidade, Performance & Staging
- [x] Vitest unit/schema/bridge 100% passando (`16/16` em 3 arquivos).
- [x] RSpec MCP specs 100% passando (`332 examples, 0 failures`), RuboCop limpo nos novos arquivos e Brakeman sem alertas.
- [x] Playwright E2E + `@axe-core/playwright` (`18 passed`, 0 violações críticas/sérias) em `320`, `375`, `480`, `640`, `768`, `1024px`, Light & Dark Mode, `prefers-reduced-motion`.
- [x] Orçamento de bundle medido abaixo de 120 KiB (`122,880 B`) gzip por entry HTML (`117,485 B` a `122,503 B`).
- [x] Flags `MCP_UI_*` default `false` em produção; staging `mcp-staging.avaliasolar.com.br` testado com sucesso via HTTPS (`2025-11-25` + `2026-07-28`).
- [ ] Evidência visual dentro do cliente web `chatgpt.com` em sessão autenticada do usuário (aguardando refresh do conector `MCP Staging Interop` e execução de consulta no ChatGPT pelo usuário).
