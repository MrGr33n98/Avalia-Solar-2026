# Spec 020 — Agent Intelligence & Evidence Infrastructure

**Status:** Draft (auditoria somente leitura concluída) · **Data:** 2026-11-25 · **Base:** `31583d20f`

## Problema

O MCP do Avalia Solar entrega dados honestos sobre proveniência (`source_type`, `limitations`), mas suas respostas **não são identificáveis nem verificáveis** (F-22). Os artefatos que sustentam a experiência do agente (bundles MCP UI, contrato OpenAPI, evidências de PWA) **não são auditáveis por máquina** (F-44, F-50, F-60). Agentes clientes também não recebem orientação de fluxo, porque não há prompts nem completions (F-26).

## Objetivo

Criar uma infraestrutura de evidência incremental, barata e com flag, em que:

1. toda resposta MCP pública e privada carregue um `evidence_id` determinístico;
2. todo release dos widgets MCP UI e do contrato de API gere um **bundle de evidência** comparável com o anterior;
3. agentes clientes tenham **Guided Prompts** read-only e **completion** de argumentos públicos;
4. o REA seja usado só como **ferramenta de geração de evidência** em dev e CI.

## Não-objetivos

- Expor tools do REA a clientes MCP.
- Rodar o REA na VM de produção.
- Mudar o catálogo das 5 tools públicas, as quotas, OAuth, Pundit ou o canary.
- Reescrever widgets ou trocar Playwright, axe ou Yabeda.
- Persistir ledger em Postgres na fase 1.

## Escopo por fase

| Fase | Entrega | Gaps |
|---|---|---|
| **F0 — quick wins** (≤ 3 dias) | contrato OpenAPI válido + gate; job `evidence-lab` (Node 22) com REA sobre `dist-analysis/`; correção do registro REA no dev | G-03, G-04, G-11, G-14 |
| **F1 — evidência no produto** | `_meta.evidence` + log `mcp.evidence` com flag; tracking de profile v2 | G-01, G-06, G-12, G-13 |
| **F2 — guided agent** | `prompts/*` e `completion/complete` | G-02 |
| **F3 — quality lab** | host MCP Apps de referência + comparação entre releases; evidência de browser para a 019 | G-07, G-08, G-09, G-10 |
| F4 (opcional) | avaliar o bundle compartilhado | G-05 |

## Métricas de sucesso

| Métrica | Baseline | Meta |
|---|---|---|
| Respostas MCP com `evidence_id` (flag on) | 0% (F-22) | 100% |
| Operações no OpenAPI válido | 0 válidas (F-50) | ≥ endpoints consumidos pelos services MCP |
| Widgets com análise estática REA concluída | 0/5 (F-44) | 5/5 |
| Releases com diff visual e de artefato anexado | 0 | 100% dos PRs que tocam `packages/mcp-ui/**` |
| Overhead p95 de `tools/call` com evidência | — | ≤ 2 ms (ver `PERFORMANCE_BUDGET.md`) |
| Tempo do job `evidence-lab` | — | ≤ 12 min |

Documentos relacionados: `PDR.md`, `REQUIREMENTS.md`, `USER_STORIES.md`, `ACCEPTANCE_CRITERIA.md`, `TASKS.md`.
