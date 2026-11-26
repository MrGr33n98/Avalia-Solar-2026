# Spec 020 — MCP TOOL CATALOG

Separa o que **existe** (F-21, F-23, F-25), o que é **proposto** e o que é **proibido**. Nenhuma tool nova do produto depende do REA.

## 1. Existentes (sem mudança)

| Superfície | Tools | Observação |
|---|---|---|
| Público `/mcp` | `list_integrators`, `show_integrator_profile`, `list_solar_categories`, `get_integrator_reputation`, `compare_integrators` | RO, contrato 1.0.0, UI via `ui://` (F-27) |
| Privado `/mcp/private` | `get_my_company_overview` | OAuth + Pundit (F-25, F-33) |
| Interno REST `/api/v1/mcp/tools` | 24 + 27 `revenue_*` | risk tiers r0–r3, HITL r3 (F-23, F-24) |

## 2. Propostas — público (fase 2, flag `MCP_PROMPTS_ENABLED` / `MCP_COMPLETIONS_ENABLED`)

Nenhuma **tool** nova no público. O ganho vem de prompts e completions, que não ampliam o acesso a dados.

| Tipo | Nome | Argumentos | Fluxo de tools | Dados |
|---|---|---|---|---|
| prompt | `find_local_integrator` | `state` (completion), `city`, `category_slug` (completion) | `list_solar_categories` → `list_integrators` → `show_integrator_profile` | público |
| prompt | `compare_shortlist` | `company_ids` (2–4) | `compare_integrators` → `get_integrator_reputation` | público |
| prompt | `explain_reputation` | `company_id` ou `slug` | `get_integrator_reputation` | público |
| completion | `category_slug` | prefixo | — | `Category` ativas (cache 1 h) |
| completion | `state` | prefixo | — | 27 UFs (constante) |

**Session-aware completion (avaliação):** o MCP permite `context.arguments` em `completion/complete`. Na fase 2, a completion usa só os argumentos já preenchidos no mesmo request (ex.: `state` filtra as `category_slug` com empresas naquela UF). **Não** há estado de sessão no servidor: o transporte é stateless (`GET /mcp` responde `unsupported`, F-20), e guardar sessão exigiria Redis por cliente, o que hoje não se justifica.

## 3. Propostas — privado (fase 2+, mesmo OAuth e Pundit)

| Nome | Tipo | Escopo | Justificativa |
|---|---|---|---|
| `review_my_profile_completeness` | prompt | `mcp:read` | Orienta a empresa usando `get_my_company_overview`; não cria tool nova |
| `get_evidence` | tool RO | `mcp:read` + tenant | Retorna o registro de evidência (`EVIDENCE_CONTRACTS.md`) **somente** de chamadas do próprio tenant. **Implementar só se o ledger tiver armazenamento consultável (PDR-04)** |

## 4. Propostas — internas (dev e CI, nunca expostas)

Scripts em `scripts/evidence/` que chamam o **CLI REA**:

| Script | Operações REA | Saída |
|---|---|---|
| `contract-check.mjs` | `inspect-api-contract` | `contract.evidence.json`, contagem de operações |
| `widget-static.mjs` | `analyze-javascript-application` sobre `dist-analysis/` | endpoints, sinks e unknowns por widget |
| `widget-visual.mjs` | `list-browser-targets`, `capture-web-screenshot`, `compare-web-screenshots` | PNG, Evidence IDs e diff |
| `release-diff.mjs` | `compare-artifacts` (manifest atual × anterior) | markdown de diff |
| `browser-scenario.mjs` | `validate-browser-scenario`, `capture-browser-scenario` | evidência de fluxo (lab 019) |

Guided workflows do REA úteis em dev: `compare_application_versions` e `investigate_feature` (F-06).

## 5. Proibido

- Encaminhar qualquer uma das 263 tools REA por `/mcp` ou `/mcp/private`.
- Tools que aceitem caminho de arquivo, URL arbitrária ou comando.
- Completion com nomes de empresas ou usuários (risco de enumeração).
