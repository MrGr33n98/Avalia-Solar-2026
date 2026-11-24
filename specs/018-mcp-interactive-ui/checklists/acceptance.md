# Checklist de Aceite e Release Gate A+++ — 018 MCP Interactive UI (R1)

## Contratos & Backend Rails
- [ ] Todos os 5 contratos existentes (`list_integrators`, `show_integrator_profile`, `list_solar_categories`, `get_integrator_reputation`, `compare_integrators`) preservados integralmente com `MCP_UI_ENABLED=false`.
- [ ] `list_integrators` com `category_slug` corrigido com `preload(:categories)` (sem erro PostgreSQL `json`).
- [ ] `resources/list` e `resources/read` implementados em `RemoteTransportController` (`2025-11-25`) e `ModernPreviewProtocol` (`2026-07-28`), autorizados em `Mcp::Canary::Guard` apenas quando `MCP_UI_ENABLED=true`.
- [ ] MIME type `text/html;profile=mcp-app`, URI versionado (`ui://avalia-solar/<surface>/v1.html`), CSP mínima (`connectDomains: []`, sem wildcards) e proteção contra path traversal.
- [ ] `content[0].text` textual legível em humano para todas as 5 tools quando UI está desabilitada ou cliente é text-only.
- [ ] `OutputValidator` continua validando `structuredContent` sem chaves privadas (`PRIVATE_KEYS`) e abaixo de 64 KB.

## Bridge, UI & Design System Real
- [ ] Bridge `@modelcontextprotocol/ext-apps` padrão implementada com `requestId` anti-corrida e detecção opcional de `window.openai`.
- [ ] Cores oficiais Avalia Solar (`#2563EB`, `#047857`, `#0F172A`, `#F59E0B` com label) aplicadas como accents sobre superfícies e tipografia do host ChatGPT.
- [ ] Logo oficial (`avalia-solar-logo-horizontal.svg` / `logo_url` público) com fallback seguro por iniciais; sem shell/navbar duplicada.
- [ ] Invariantes de domínio visíveis: sede ≠ cobertura, 0 reviews => `"Sem avaliações"` (nunca `0`), verificação ≠ garantia, comparação sem vencedor absoluto.
- [ ] Estados completos em cada widget: `loading` (skeleton), `ready`, `refreshing`, `empty`, `partial`, `error`, `offline`.

## Qualidade, Acessibilidade, Performance & Staging
- [ ] Vitest unit/schema/bridge 100% passando.
- [ ] RSpec MCP specs 100% passando.
- [ ] Playwright E2E + `@axe-core/playwright` (0 violações críticas/sérias) em `320`, `375`, `480`, `640`, `768`, `1024px`, Light & Dark Mode, zoom 200%, `prefers-reduced-motion`.
- [ ] Orçamento de bundle medido: < 120 KB gzip por entry HTML.
- [ ] Flags `MCP_UI_*` default `false` em produção; staging `mcp-staging.avaliasolar.com.br` testado com sucesso.
