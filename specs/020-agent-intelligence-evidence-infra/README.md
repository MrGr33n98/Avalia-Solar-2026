# Spec 020 — Agent Intelligence & Evidence Infrastructure

Pacote Spec Kit gerado por auditoria **somente leitura** em 2026-11-25 (HEAD `31583d20f`). Nenhum código de produto foi alterado.

## Como o REA foi usado

O REA 6.10.1 está instalado, mas **não estava registrado como MCP no Claude Code** (`rea doctor`: `registration:claude_code config_drift`). Todas as operações foram executadas pelo **CLI `rea`**, que roda as mesmas operações do servidor MCP. O catálogo MCP (263 tools, 6 prompts) foi levantado por handshake stdio real com `rea --mcp`. Nenhum resultado foi inferido sem execução; falhas e timeouts estão registrados como evidência.

## Leitura recomendada

1. `INVENTORY.md`: fatos `F-xx` com origem.
2. `GAP_ANALYSIS.md` → `ROOT_CAUSE_ANALYSIS.md`.
3. `ARCHITECTURE.md`, `PDR.md`, `SPEC.md`.
4. `REQUIREMENTS.md`, `USER_STORIES.md`, `MCP_TOOL_CATALOG.md`, `EVIDENCE_CONTRACTS.md`, `SECURITY_MODEL.md`.
5. `UI_SDK_QUALITY_LAB.md`, `PERFORMANCE_BUDGET.md`.
6. `TASKS.md`, `ACCEPTANCE_CRITERIA.md`, `TEST_PLAN.md`, `ROLLOUT_PLAN.md`.

## Evidências

`evidence/rea/`: saídas do REA (doctor, capabilities, catálogo MCP, guided workflows, contrato OpenAPI, análise JS e web, WebMCP, screenshots com Evidence ID e timings). Caminhos locais foram trocados por `$SCRATCH` e `~`, então os digests internos dos bundles REA **não** batem mais com os arquivos copiados. Os originais ficaram no scratchpad da sessão, que é efêmero.

## Limitações da auditoria

- O frontend Next.js não tinha build local, então seus bundles não foram analisados (F-49).
- A stack não foi subida; a Spec 019 foi avaliada só pelas evidências já registradas (F-60–F-62).
- Não houve host MCP Apps real; os widgets foram capturados standalone (skeleton, F-48).
- Medições de amostra única em máquina de dev.
- Nenhum acesso a staging ou produção.
