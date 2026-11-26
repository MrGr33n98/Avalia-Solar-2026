# Spec 020 — INVENTORY

**Data da coleta:** 2026-11-25 · **HEAD:** `31583d20f` (main) · **Modo:** somente leitura

Este inventário registra o que foi **observado**. Cada linha tem um ID de fato (`F-xx`) usado pelos outros documentos do pacote. Quando algo não foi verificado, isso está dito explicitamente.

## 1. Como o REA foi acessado

| ID | Fato | Evidência | Limitação |
|---|---|---|---|
| F-01 | REA `rea-agents@6.10.1` instalado globalmente via npm (`~/.nvm/.../bin/rea`). | `npm ls -g rea-agents` | Instalação local de desenvolvimento, não CI. |
| F-02 | **O MCP do REA não está registrado no Claude Code desta sessão.** Não há tools `mcp__rea__*`. `rea doctor` marca `registration:claude_code` como `config_drift`. | `evidence/rea/doctor-summary.txt` | Por isso todas as operações foram executadas pelo **CLI `rea`**, que expõe as mesmas operações que o servidor MCP (mesma build, mesmo provider). Nenhuma tool foi inventada. |
| F-03 | O servidor MCP do REA foi interrogado diretamente por stdio (`rea --mcp`): `serverInfo rea 6.10.1`, `protocolVersion 2025-06-18`, capabilities `tools`, `prompts`, `completions`. | `evidence/rea/mcp-stdio-discovery.json` | Handshake feito fora do cliente Claude Code. |
| F-04 | O MCP do REA expõe **263 tools**, **6 prompts** e **0 resources** (`resources/list` responde `Method not found`). | `mcp-stdio-discovery.json`, `rea-mcp-tools.json` | — |
| F-05 | Anotações das 263 tools: 9 `readOnlyHint`, 35 `destructiveHint+openWorldHint`, 7 `destructiveHint`, 106 `openWorldHint`, 106 sem hint. | `rea-mcp-tools.json` | As anotações são declaradas pelo REA e não foram auditadas tool a tool. |
| F-06 | Prompts do REA (Guided Workflows): `investigate_feature`, `compare_application_versions`, `verify_reconstruction`, `trace_crash`, `audit_residual_unknowns`, `prepare_bounded_process_capture`. | `guided-workflows.md` | — |
| F-07 | `rea doctor`: `healthy: false`. Node 22.23.5 e Ubuntu 24.04 estão OK. Hopper, Ghidra, IDA, jadx e Kuna estão ausentes (`missing_analysis_engine`). | `doctor-summary.txt` | Os engines nativos são irrelevantes para JS/web; servem para binários. |
| F-08 | `rea doctor` acusa `skill:identity config_drift` porque `~/.claude/skills/reverse-engineer-anything` é um symlink criado nesta sessão. | `doctor-summary.txt` | Efeito colateral da configuração de skills; ver TASKS T-000. |
| F-09 | Há um processo `rea mcp` rodando a partir do cache `npx` (registro do Antigravity), com RSS ocioso de **~256 MB**. | `ps` | Medição pontual. |
| F-10 | Providers disponíveis no host: `rea-artifact-graph` e `rea-dotnet-static`. Os grupos `native-macos` (5) estão indisponíveis (`unsupported_host`); 1 grupo está `unsupported_version`. As operações web/JS (CDP, analisador JS) funcionaram sem provider externo. | `capabilities-summary.txt` | — |

## 2. MCP do Avalia Solar — tools, resources, prompts e capabilities

| ID | Superfície | Observação | Origem |
|---|---|---|---|
| F-20 | Rotas | `POST /mcp` (público remoto), `POST /mcp/private`; GET/DELETE retornam `unsupported`; os `.well-known` OAuth são `oauth-protected-resource`, `oauth-authorization-server` e `openid-configuration`. | `AB0-1-back/config/routes.rb:39-52` |
| F-21 | Catálogo **público** | 5 tools, todas `readOnlyHint: true`, `openWorldHint: false`: `list_integrators`, `show_integrator_profile`, `list_solar_categories`, `get_integrator_reputation`, `compare_integrators`. Contrato `1.0.0`, `MAX_LIMIT 20`. | `app/services/mcp/public_tool_registry.rb` |
| F-22 | Envelope de saída público | `schema_version`, `data_as_of`, `source_type` (`company_declared, platform_verified, review_aggregate, platform_derived, unknown`), `data`, `limitations`. **Não existe `evidence_id`, digest de conteúdo nem `request_id` no envelope.** | `public_tool_registry.rb#envelope` |
| F-23 | Registry **interno/REST** (`TOOL_REGISTRY`) | 24 tools (public/company/admin, incluindo observabilidade e approvals) + 27 tools `revenue_*` = **51**. | `app/controllers/api/v1/mcp/tools_controller.rb:8-32`, `revenue_tool_registry.rb` |
| F-24 | Tiers de risco do revenue | r0 (leitura), r1 (`mcp:analyze`), r2 (`mcp:write`, idempotência), r3 (`revenue_request_campaign_send`, HITL obrigatório). | `revenue_tool_registry.rb` |
| F-25 | Transporte **privado** | 1 tool: `get_my_company_overview`; capabilities `{ tools: {} }`; protocolos legacy e modern. | `app/services/mcp/private/executor.rb:6`, `private/protocol.rb` |
| F-26 | Métodos JSON-RPC públicos | `initialize`, `ping`, `server/discover`, `tools/list`, `tools/call`, `resources/list`, `resources/read`. **Não há `prompts/list`, `prompts/get` nem `completion/complete`.** | `remote_transport_controller.rb`, `modern_preview_protocol.rb` |
| F-27 | Resources UI (MCP Apps) | 5 superfícies `ui://avalia-solar/{search,profile,reputation,compare,categories}/v1.html`, MIME `text/html;profile=mcp-app`, flag global + uma flag por superfície; `profile/v2.html` é ativada por qualquer uma das flags `MCP_BRAND_PROFILE_*`. | `app/services/mcp/ui/resource_registry.rb` |
| F-28 | Profile V2 | `PROFILE_V2` faz `merge` só da `uri` sobre a entrada v1, então **serve o mesmo arquivo `profile.v1.html`** sob a URI v2. | `resource_registry.rb:61-63` |
| F-29 | Quotas | preview `20/20/60/200`, oauth `30/60/120/500`, private `20/40/80/300` + tenant `100/min` (identity/client/ip/dia). Redis atômico; falha → `unavailable`. | `remote_quota_policy.rb:20-24` |
| F-30 | Telemetria | `Yabeda.mcp.requests_total`, `request_duration_seconds` via `mcp.remote.request` / `mcp.private.request`. | `config/initializers/yabeda.rb:131-250` |
| F-31 | Approvals/HITL | Tabela `mcp_approval_requests` com `request_uuid` (único), `payload_digest`, `execution_id`, `risk_tier`, `status`, `expires_at`. **É o embrião natural de um ledger.** | `db/schema.rb:2956` |
| F-32 | Flags MCP | 30 variáveis `MCP_*`, entre elas `MCP_PUBLIC_TOOLS_EXECUTION_ENABLED`, `MCP_REMOTE_*`, `MCP_PRIVATE_*`, `MCP_CANARY_*`, `MCP_UI_*` e `MCP_BRAND_PROFILE_*`. | grep em `app/` e `config/` |
| F-33 | Authz | Doorkeeper (OAuth), `Mcp::OAuth::ResourceAuthorization`, `Mcp::Private::CompanyPolicy` (Pundit), `Mcp::Canary::Guard`. | `app/services/mcp/oauth/*`, `app/policies/mcp/private/company_policy.rb` |

## 3. Bundles JavaScript próprios

| ID | Fato | Evidência |
|---|---|---|
| F-40 | `packages/mcp-ui`: Vite + `vite-plugin-singlefile`, `minify: 'esbuild'`, **`sourcemap: false`**. Dependências: `@modelcontextprotocol/ext-apps ^2.0.4`, `react ^18.2`, `zod ^4.2`. | `packages/mcp-ui/scripts/build.mjs:8,44-45`, `package.json` |
| F-41 | 5 HTMLs entre 424.871 e 444.978 bytes (raw) e 117.666 e 122.680 bytes (gzip). Cada um tem **1 script inline de 417–437 KB** e 7.332 bytes de CSS. Não há script externo. | `manifest.json`; extração em scratch |
| F-42 | `packages/mcp-ui/dist` e `AB0-1-back/public/mcp-ui` são **idênticos** (SHA-256 iguais, manifest igual). Ambos são gitignored e são gerados em `Dockerfile.backend:37-41`. | `sha256sum`, `.gitignore:39-40` |
| F-43 | `rea analyze-javascript-application` sobre os HTMLs: 6 arquivos relevantes, **0 JS parseados**, porque o script inline em HTML não é analisado. 15 s, RSS 188 MB. | `analyze-js-app.dist-html.summary.json`, `timing-mcpui-time.txt` |
| F-44 | Mesmo comando sobre o JS extraído (5 × ~420 KB): **`provider_timeout` em 300.000 ms por fonte**; 0 parseados, 5 pulados; 5 min 25 s; RSS **654 MB**. | `analyze-js-app.extracted-js.timeout.json`, `timing-mcpuijs-time.txt` |
| F-44b | Nova execução só com `search.v1.js` e `--analysis-timeout-ms 900000`: concluiu em **4 min 47 s**, RSS **748 MB**, sintaxe `complete`, mas semântica `not-examined`, **0 findings** e 60 semantic unknowns. `ev_1a0bc70a…` | `analyze-js-app.search-900s.summary.json`, `timing-search-900s.txt` |
| F-45 | `rea analyze-web-bundle` (CDP, Chrome 151 headless, loopback) em `search.v1.html`: 1 script observado, **deadline de 30.000 ms por script estourado**, 0 parseados; 47 s; RSS 194 MB. `evidence_id ev_5f13730b…` | `analyze-web-bundle.search.summary.json`, `timing-webbundle4-time.txt` |
| F-46 | `rea discover-webmcp-tools`: 0 tools. Os widgets usam a ponte MCP Apps (postMessage), não WebMCP. | `discover-webmcp-tools.search.json` |
| F-47 | `rea inspect-web-page`: 59 nós DOM, nenhuma requisição de rede. As seções `accessibility`, `script_sources` e `storage_keys` ficam `policy_filtered` por padrão (precisam de aprovação explícita). | `ev_8799c5f0…` (scratch) |
| F-48 | `rea capture-web-screenshot` das superfícies profile, reputation, compare e categories em viewport 780×493: PNGs de 11–13 KB com Evidence IDs. Fora do host, o widget fica em **skeleton** (ex.: "Montando matriz comparativa…"). | `evidence/rea/screenshots/*` |
| F-49 | Frontend Next.js: não há build local (`.next/static` com 132 KB e só polyfills). **Os bundles do Next não foram analisados.** | `du AB0-1-front/.next/static` |

## 4. Contratos de API

| ID | Fato | Evidência |
|---|---|---|
| F-50 | `AB0-1-back/swagger/v1/swagger.json` **não é JSON válido**: o conteúdo é YAML. O REA rejeita o arquivo com `invalid_format`. | `rea inspect-api-contract` |
| F-51 | `swagger.yaml` declara **3 operações** (`/health`, `/api/v1/review_dashboard/achievements`, `/api/v1/companies/{id}/widget_data`); o `.json` declara `/api/v1/trust/profile`. Os dois divergem. `routes.rb` tem ≥278 linhas de rota com verbo explícito, além de `resources`. | `inspect-api-contract.swagger-yaml.json` (`ev_aa207d8c…`) |

## 5. PWA — filtros geográficos (Spec 019)

| ID | Fato | Evidência |
|---|---|---|
| F-60 | A Spec 019 foi mergeada (`31583d20f`, #239), mas o `task-status.md` tem T007, T033, T035, T042 e T043 **BLOCKED** (Playwright não abriu `/companies`; CDN inacessível) e T004, T015, T023 e T050–T055 em **TODO**. | `specs/019-.../evidence/task-status.md` |
| F-61 | Benchmark local (container, loopback, UF `SC`, 30 amostras): GET anônimo com TTFB p95 78,20 ms; GET condicional 304 com p95 **95,60 ms**; corpo de 4.241 bytes. Não há baseline "before". | `specs/019-.../evidence/after.md` |
| F-62 | Sem LCP/INP/CLS, sem medição de bundle gzip, sem HIT/MISS de CDN e sem request-count before/after. | idem |

## 6. CI/CD e runtime

| ID | Fato | Evidência |
|---|---|---|
| F-70 | 24 workflows. `ci-web-backend.yml` usa `NODE_VERSION: "20.x"`; `mcp-remote-contract-gate.yml` usa Node `'22'`; `ci-mobile` e outros gates usam Node 20. | `.github/workflows/*` |
| F-71 | O REA exige Node `^22.23.4 \|\| ^24.22.1 \|\| >=26.12.1`. **É incompatível com os jobs Node 20.** | `rea-agents/package.json#engines` |
| F-72 | `mcp-c4-sdk-interop-staging.yml`: `workflow_dispatch` com confirmação `STAGING_ONLY`, matriz de SDK python/typescript, `permissions: contents: read`. | arquivo |
| F-73 | `packages/mcp-ui/tests/e2e/widgets.spec.ts`: axe WCAG AA, screenshots, fluxo search→compare com host bridge simulado, Playwright em `127.0.0.1:4177`. | arquivo |

## 7. Licença e dependências do REA

| ID | Fato | Evidência |
|---|---|---|
| F-80 | Licença **MIT**; `THIRD_PARTY_NOTICES.md` com 118 linhas; diretório `licenses/` presente. | `rea-agents/LICENSE`, `package.json` |
| F-81 | `npm-shrinkwrap.json` com **175 pacotes**; instalação de **324 MB**. | `du`, shrinkwrap |
| F-82 | O `DISCLAIMER.md` restringe o uso a software próprio ou autorizado. Proíbe contornar DRM e autenticação, além de copiar software proprietário. | `DISCLAIMER.md` |
