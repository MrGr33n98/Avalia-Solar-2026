# SPEC 021 · Avalia Solar Agent-Native UI Registry
**Pacote de implementação A+++ · revisão 1 · 25/11/2026**

Objetivo: transformar o pacote MCP UI existente em um catálogo proprietário e reutilizável, inspirado no mcpcn, preservando a identidade Avalia Solar e os contratos do servidor Rails. Não é uma migração de framework.

## Começar aqui
1. Entregue o ZIP ao agente com acesso ao repositório e leia `GOAL.md` integralmente.
2. Leia `SETUP.md`, `BASELINE.md` e `DECISIONS.md`. Verifique se o número 021 está livre; se não, use o próximo identificador e registre a alteração.
3. Execute `scripts/preflight.sh` na raiz do repositório. Não execute no servidor de produção.
4. Preserve alterações locais da Spec 019/020; crie worktree/branch isolada conforme SETUP. Copie o pacote (sem substituir documentos existentes) para `specs/021-agent-native-ui-registry/`.
5. Siga `TASKS.md`, uma wave por vez, com TDD, evidências e gates de `ACCEPTANCE_CRITERIA.md`. O MVP é W0–W7; W8–W12 são evolução condicionada.

## Fonte de verdade
SPEC.md + REQUIREMENTS.md + ACCEPTANCE_CRITERIA.md. Em conflito: segurança/contratos existentes > ADRs homologadas > critérios de aceite > design proposto > inspiração mcpcn. Não inventar dados ou sucesso. Evidências locais do relatório enviado não equivalem a execução nova.

## Documentos
- GOAL, SETUP, BASELINE, MCPCN_SCAN, GAP_ANALYSIS, DECISIONS, ARCHITECTURE, SPEC, PRD, REQUIREMENTS, USER_STORIES
- DESIGN_SYSTEM, DESIGN_TOKENS, GEOMETRY, COMPONENT_CATALOG, COMPONENT_CONTRACTS, HOST_COMPATIBILITY, REGISTRY, PLAYGROUND
- SECURITY, PERFORMANCE, TEST_PLAN, ACCEPTANCE_CRITERIA, TASKS, ROLLOUT, ROLLBACK, HANDOFF, SOURCES
- templates e scripts auxiliares (não são código de produção).

Estado: especificação gerada; implementação, branch, CI, staging e publicação não executados. O nome da branch é proposto. Este pacote não contém os dumps brutos enviados, para evitar propagar caminhos locais, credenciais ou evidências alteradas.
