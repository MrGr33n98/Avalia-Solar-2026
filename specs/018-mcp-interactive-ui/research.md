# Pesquisa Técnica R0 — Evidências do Repositório e Tokens Reais

- **Data:** 2026-11-24
- **SHA base:** `5babce764` (`feat/018-mcp-interactive-ui`)

## 1. Tokens Oficiais vs Mockup

Divergência crítica identificada em `docs/Avalia-Solar-Spec-Kit/avalia-solar-spec-kit/design-system.md`: o mockup listava `#123E36`, `#2E706E`, `#E9C34B`. A inspeção de `AB0-1-front/tailwind.config.ts` e `AB0-1-front/app/globals.css` comprovou os tokens oficiais vigentes:

| Papel | Token Frontend Real | Valor Hex / HSL | Uso no Widget MCP (sobre superfícies do host) | Contraste AA |
|---|---|---|---|---|
| Primary Accent | `brand.blue` (`--primary`) | `#2563EB` (`221 83% 53.3%`) | Botão primário, foco de filtro ativo, links destacados | > 5.1:1 com texto branco `#FFFFFF` |
| Primary Hover | `brand.blue.hover` | `#1D4ED8` | Hover de botão primário e links | > 6.6:1 com texto branco |
| Secondary / Trust | `brand.green.dark` (`brand.green`) | `#047857` (`#10B981` apenas bg soft `#ECFDF5`) | Texto/selo de empresa verificada | `#047857` em branco > 5.4:1 (AA validado; `#10B981` reservado a ícone/borda) |
| Solar Accent | `--as-amber-400` / SVG Logo | `#F59E0B` (`38 92% 50%`) | Estrelas de avaliação sempre acompanhadas de texto numérico | Decorativo + label textual acessível |
| Ink / Surface Fallback | `brand.navy` / `brand.bg` | `#0F172A` / `#F8FAFC` | Fallback apenas quando o host não injeta variáveis CSS semânticas | > 15:1 |

**Assets oficiais reutilizados:**
- `AB0-1-front/public/images/avalia-solar-logo-horizontal.svg` (1.7 KB, marca vetorial original).
- `AB0-1-front/public/avalia_symbol.png` (7.7 KB).

## 2. Correção Prévia Validada em Staging

Durante auditoria ao vivo no ambiente staging (`mcp-staging.avaliasolar.com.br`), `list_integrators` com `category_slug` falhava com HTTP 500 (`PG::UndefinedFunction: ERROR: could not identify an equality operator for type json` devido à coluna `categories.permissions_config` tipo `json` selecionada via `includes(:categories)` + `distinct`). Corrigido para `Company.active.preload(:categories)` em `AB0-1-back/app/services/mcp/public/directory_service.rb`.

## 3. Versões SDK Verificadas

- `@modelcontextprotocol/ext-apps`: `2.0.4` (via `npm view`)
- `@openai/apps-sdk-ui`: `0.2.2` (via `npm view`)
- `node`: `v22.23.5`, `npm`: `10.9.9`
- Ruby/Rails backend: Ruby `3.2.2`, Rails `7.0.8` (sem gem MCP em runtime; transporte custom JSON-RPC).
