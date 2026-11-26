# Spec 020 — TASKS

Ordem por valor/custo. `[P]` = paralelizável. Cada tarefa referencia gaps (G), requisitos (RF/RNF) e critérios de aceite (AC). **Nenhuma tarefa foi executada nesta etapa (somente leitura).**

## F0 — Quick wins (≤ 3 dias)

| ID | Tarefa | Arquivos | Gap / Req | AC | Esforço |
|---|---|---|---|---|---|
| T-000 | Dev local: remover o symlink `~/.claude/skills/reverse-engineer-anything`, rodar `rea setup` marcando Claude Code e Antigravity, conferir com `rea doctor` (registrations OK) | config local (fora do repo) | G-14 | AC-00 | 0,5 h |
| T-001 [P] | Regenerar `swagger/v1/swagger.json` como JSON válido equivalente ao `.yaml`; revisar `swagger_format` no `swagger_helper` | `AB0-1-back/swagger/v1/*`, `spec/swagger_helper.rb` | G-03, RF-09 | AC-09 | 2 h |
| T-002 [P] | `packages/mcp-ui`: flag `--analysis` no `build.mjs` que gera `dist-analysis/` (sem minify, `sourcemap: true`) sem alterar `dist/` | `packages/mcp-ui/scripts/build.mjs` | G-04, RF-06 | AC-06 | 3 h |
| T-003 | Spike: medir o REA em `dist-analysis/search` e validar o orçamento ≤ 90 s, findings > 0 e semântica `complete` ou `limited`. **Se falhar, reavaliar G-04 antes do T-021** | — | G-04 | AC-06b | 2 h |
| T-004 | Workflow `evidence-lab.yml` (Node 22.23.x, sem secrets, paths filtrados) com `inspect-api-contract` + `analyze-javascript-application` + upload do artifact | `.github/workflows/evidence-lab.yml`, `scripts/evidence/*.mjs` | G-11, RF-07 | AC-07, AC-11 | 1 d |

## F1 — Evidência no produto (flag OFF por padrão)

| ID | Tarefa | Arquivos | Gap / Req | AC | Esforço |
|---|---|---|---|---|---|
| T-010 | `Mcp::Evidence::Canonical` (JSON canônico + sha256) com teste de propriedade | `app/services/mcp/evidence/canonical.rb`, spec | RF-01, RNF-02 | AC-02 | 4 h |
| T-011 | `Mcp::Evidence::Envelope`, ligado nos pontos de resposta `tools/call` de `remote_transport_controller`, `modern_preview_protocol` e `private/protocol` | services + controllers MCP | G-01, RF-01, RF-02 | AC-01, AC-03 | 1 d |
| T-012 | `Mcp::Evidence::Logger` (evento `mcp.evidence`, allowlist de campos) + verificação da retenção do agregador de logs existente | `app/services/mcp/evidence/logger.rb` | G-12, G-13, RF-03, RNF-03 | AC-04, AC-05 | 4 h |
| T-013 | Incluir `ui_manifest_sha256` (lido do `manifest.json` em boot e memoizado) | `ui/resource_registry.rb` | G-07 | AC-04 | 2 h |
| T-014 | Benchmark RSpec de overhead (1.000 iterações, payload de 20 itens) | spec | RNF-01 | AC-08 | 2 h |
| T-015 [P] | Decidir profile v2: arquivo próprio no manifest **ou** ADR curto justificando o reuso | `resource_registry.rb` ou `docs/adr/` | G-06, RF-10 | AC-10 | 2 h |
| T-016 | Teste de contrato: `tools/list` público e privado ∩ nomes REA = ∅ | spec | S-01 | AC-12 | 1 h |

## F2 — Guided agent

| ID | Tarefa | Gap / Req | AC | Esforço |
|---|---|---|---|---|
| T-020 | `Mcp::PromptRegistry` com 3 prompts públicos + 1 privado; handlers `prompts/list` e `prompts/get` nos dois protocolos; capability condicionada à flag | G-02, RF-04 | AC-13 | 1 d |
| T-021 | `Mcp::CompletionService` para `category_slug` (cache de 1 h) e `state`, respeitando `context.arguments` | G-02, RF-05 | AC-14 | 4 h |
| T-022 | Estender `mcp-c4-sdk-interop-staging` para cobrir prompts e completion com os SDKs python e ts (staging, `STAGING_ONLY`) | RNF-09 | AC-15 | 4 h |

## F3 — Quality lab e comparação entre releases

| ID | Tarefa | Gap / Req | AC | Esforço |
|---|---|---|---|---|
| T-030 | Página `lab/host.html` (ou host do ext-apps) que injeta fixtures por postMessage | G-09 | AC-16 | 1 d |
| T-031 | Verificar se o `@modelcontextprotocol/ext-apps@2.x` traz um host de referência utilizável; registrar a decisão | G-09 | — | 1 h |
| T-032 | Cenários L-01..L-06 (`validate-browser-scenario` + `capture-browser-scenario`) no `evidence-lab` | G-08, G-09 | AC-16 | 1 d |
| T-033 | `release-diff.mjs`: baixar o artifact da main e rodar `compare-web-screenshots` + `compare-artifacts`, gerando `diff.md` no job summary | G-07, RF-08 | AC-17 | 1 d |
| T-034 | Lab da Spec 019 (`next build && next start` + compose test + seed sintético) para desbloquear T007/T042/T043 | G-10 | AC-18 | 1–2 d |

## F4 — Opcional

| ID | Tarefa | Condição |
|---|---|---|
| T-040 | Medir a composição do bundle (React, ext-apps, zod) via sourcemap | após T-002 |
| T-041 | Avaliar um bundle multi-surface | só se T-040 mostrar > 60% de código comum **e** houver evidência de cache por URI no host |

## Dependências

`T-002 → T-003 → T-004 → T-032 → T-033` · `T-010 → T-011 → T-012 → T-013` · `T-011 → T-020 → T-021 → T-022` · `T-030/T-031 → T-032`
