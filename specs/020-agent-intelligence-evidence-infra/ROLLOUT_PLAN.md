# Spec 020 — ROLLOUT PLAN

## 1. Princípios

- Uma flag por capacidade, todas **OFF** em produção por padrão (RNF-08).
- A ordem segue os ambientes: dev → CI → staging (`cd-mcp-staging.yml`) → canary (`MCP_CANARY_*`) → produção.
- Nenhum deploy nesta etapa. Este plano vale para a fase de implementação.

## 2. Ondas

| Onda | Conteúdo | Ambiente | Gate de saída | Rollback |
|---|---|---|---|---|
| W0 | T-000..T-004 (dev REA, OpenAPI, build de análise, `evidence-lab`) | dev + CI | AC-00, AC-06, AC-06b, AC-07, AC-09, AC-11 | reverter o PR; o job não afeta runtime |
| W1 | T-010..T-016 com flags OFF | prod (código inerte) | AC-03 verde; deploy padrão com healthcheck | rollback automático do `cd-production` |
| W2 | `MCP_EVIDENCE_META_ENABLED`, `MCP_EVIDENCE_LOG_ENABLED` em staging | staging | AC-01, AC-04, AC-05, AC-08 com tráfego do smoke C4 | flag OFF |
| W3 | As mesmas flags no canary | prod canary | 7 dias sem erro novo no Sentry; p95 de `mcp.request_duration_seconds` com Δ ≤ 2 ms | flag OFF (sem deploy) |
| W4 | Flags ON em 100% | prod | métricas W3 estáveis por mais 7 dias | flag OFF |
| W5 | `MCP_PROMPTS_ENABLED`, `MCP_COMPLETIONS_ENABLED` em staging → canary → prod | idem | AC-13, AC-14, AC-15 | flag OFF |
| W6 | Lab e diff de release (T-030..T-034) não bloqueantes | CI | AC-16, AC-17 em 20 PRs | desativar o job |
| W7 | Diff vira gate | CI | falso positivo < 5% em 20 PRs | voltar para não bloqueante |

## 3. Observabilidade do rollout

- Métricas existentes: `mcp.requests_total` e `mcp.request_duration_seconds` (F-30), sem labels novas.
- Log: contagem de eventos `mcp.evidence` por `tool` e `status` no agregador (consulta ad hoc).
- Alertas: nenhum novo na W2–W4; reaproveitar os de erro e latência MCP, se existirem (não verificado nesta auditoria).

## 4. Comunicação

- Clientes MCP: nenhuma ação necessária, porque `_meta` é aditivo. Documentar o campo em `docs/` e no `server/discover`, se houver campo de descrição.
- Interno: o resumo do `evidence-lab` aparece em todo PR que toca `packages/mcp-ui/**` ou `swagger/**`.

## 5. Critério de abortar a Spec

Se, ao fim da W0, o T-003 (spike) mostrar que nem o `dist-analysis/` é analisável pelo REA em ≤ 3 min por widget, a parte REA de análise estática sai do escopo. Lab visual, contrato e evidência no produto seguem, porque não dependem disso.
