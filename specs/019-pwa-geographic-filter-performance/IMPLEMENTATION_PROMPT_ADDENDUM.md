# Complemento do prompt de implementação — sessão Spec 019

Use este complemento junto do `AGENT_PROMPT.md` copiado do pacote. Ele registra decisões e condições observadas nesta execução; o `AGENT_PROMPT.md` e os demais arquivos da Spec continuam sendo a fonte de requisitos.

## Branch e origem

- Branch local: `feat/019-pwa-geographic-filter-performance`.
- HEAD de partida: `f1d6f42586d1614a54cc975bdc3ca9b62c62de57`.
- Pacote original preservado: `docs/Avalia-Solar-Spec-019-Pack/`.
- Artefatos de execução: `specs/019-pwa-geographic-filter-performance/`.
- Estado neste ponto: alterações não commitadas; sem push, PR ou deploy.

## Regras complementares para continuar

1. Leia `evidence/task-status.md` antes de retomar e preserve os status `TODO`, `IN_PROGRESS`, `BLOCKED` e `VALIDATED`. A tasklist não autoriza transformar resultado local em aceite de staging/produção.
2. Resolva o bloqueio do Next `/companies` em ambiente local controlado antes de repetir Playwright. Depois valide desktop, tablet e mobile e grave screenshots reais com viewport, URL e resultado em `evidence/screenshots/`.
3. Não publique nem altere secrets de produção. O smoke atual usou apenas chaves locais descartáveis; a imagem encontrada não tinha proveniência do SHA atual.
4. Colete baseline comparável em ambiente identificável antes de declarar melhoria. Os valores de `evidence/after.md` são medições reais após mudança em loopback; não provam ganho contra baseline nem os orçamentos de produção.
5. Mantenha o cache HTTP público estritamente limitado às rotas geográficas anônimas allowlisted. Antes de aceite, execute todos os casos negativos de proxy/SW, valide CDN real e confirme isolamento de cookies/auth.
6. Complete as tasks independentes enquanto um gate estiver bloqueado. Não marque `GOAL_COMPLETE` com Playwright/staging/CDN/CI ou outro gate P0 pendente.
7. A criação da branch foi pedida; push/PR/deploy seguem sem execução automática. Abra PR apenas depois de completar e revisar um diff concreto e confirmar a autorização de publicação.

## Skills efetivamente aplicadas

O inventário exato, finalidade e limites está em `evidence/task-status.md`. A skill `performances` não foi localizada; foi selecionada `performance-tuning` quando aplicável. As demais skills listadas no prompt original não foram presumidas como instaladas nem declaradas como usadas.
