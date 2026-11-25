# Avalia Solar — Spec 019 | Pacote de implementação A+++

Este pacote é uma proposta pronta para o agente executar, não uma implementação já realizada. Base: auditoria forense local de 24/11/2026 fornecida pelo usuário. Não substitui a inspeção do HEAD e dos ambientes reais.

## Como usar
1. Envie este pacote ao agente com acesso ao repositório. Leia `AGENT_PROMPT.md` primeiro.
2. Verifique se 019 está livre; se houver colisão, adote o próximo número e atualize referências sem sobrescrever specs existentes.
3. Copie/adapte os arquivos de `specs/019-pwa-geographic-filter-performance/` ao padrão Spec Kit existente, preservando a constitution.
4. Execute as tarefas na ordem e mantenha as evidências em `evidence/`. Não marque concluído sem prova.

## Conteúdo
- `spec.md`: PRD, histórias, requisitos e métricas.
- `plan.md`: PDR, decisões arquiteturais, DDD, contratos, UX e rollout.
- `tasks.md`: backlog executável, fases, dependências, evidências.
- `research.md`: gaps, baseline e limites da auditoria.
- `data-model.md`: contratos e cache.
- `contracts.md`: API e segurança.
- `quickstart.md`: roteiro de testes, CI/CD e validação.
- `checklists/acceptance.md`: gates de qualidade e DoD.
- `AGENT_PROMPT.md`: instrução mestre para Codex/Antigravity.

Escopo: PWA primeiro; desktop, tablet, home, categorias, busca e consumidores legados sem regressão. MCP Apps, novos recursos comerciais, alterações de design e reescrita ampla de infraestrutura ficam fora do escopo.

## Complemento desta execução

O pacote-fonte original permanece em `docs/Avalia-Solar-Spec-019-Pack/`. Esta cópia está em `specs/019-pwa-geographic-filter-performance/` e inclui este README e o `AGENT_PROMPT.md` original. O estado real da implementação, evidências por task, medições e blockers ficam em [`evidence/task-status.md`](evidence/task-status.md). Não trate os artefatos de auditoria como prova de ambiente ou aceite; veja [`evidence/baseline.md`](evidence/baseline.md).
