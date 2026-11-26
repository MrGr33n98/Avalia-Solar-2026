> V1.2: antes de implementar, cumprir `performance-engineering/00-START-HERE.md`, A0–A3 e gate D0. A extensão é vinculante para performance e ordem de execução; Tremor inspiração only permanece.

# Setup — agente autorizado no repo
```bash
# Na raiz existente; não apagar arquivos ou fazer reset
 git status --short
 git worktree list
 git fetch origin main
 git branch -a --list '*spec-022*'
 git log -1 --oneline origin/main
 # Somente se branch/worktree ainda não existem e dependências verificadas:
 git worktree add -b feat/spec-022-dashboard-tremor-a-plus ../avalia-solar-spec022 origin/main
 cd ../avalia-solar-spec022
 git rev-parse HEAD
```
Se branch existe, inspecionar e reutilizar sem sobrescrever. Confirmar Specs 017–021, PRs e diffs não mergeados; não aplicar cherry-pick sem verificar dependências. Se pacote recebido ZIP, extraia em `specs/022-dashboard-tremor-a-plus` após validar ID disponível. Não incluir arquivos privados. Leia AGENTS.md e .specify/constitution se presentes.

```bash
cd AB0-1-front
node -v; npm -v
npm ci
npm run typecheck
npm run lint
npm run test:ci
npm run build
# descobrir config e projetos antes de executar
npx playwright test --list
```
Use Node do CI/.nvmrc; não alterar lockfile só para baseline. Se falhas preexistentes, anotar saída e separar do diff. Testes E2E com baseURL local/staging e contas sintéticas, nunca produção por default. `npm run perf:bundle` e Lighthouse existentes devem ser adaptados para auth com storageState fora repo; confirmar scripts.

## Referências visuais — sem instalação
Consulte as demos e a documentação pública https://blocks.tremor.so/templates#template-database e https://blocks.tremor.so/blocks. Catalogue padrões de hierarquia, densidade, geometria, tabelas, filtros, gráficos, navegação e estados. Não clone, instale, compre nem copie templates ou código Tremor. Prototipe os padrões selecionados no checkout isolado usando os componentes existentes e tokens próprios. Registre fonte visual, decisão, componente interno e teste em templates/block-provenance.csv. Compare package.json e lockfile com o baseline: nenhuma dependência nova para a estética.

Use scripts/preflight.sh (somente leitura) e scripts/inventory.py (gera lista estática do checkout). Mudanças de dependência por necessidade funcional independente exigem ADR e aprovação separados; não são parte deste redesign.

## Execução
W0 baseline + auditoria autenticada; W1–W7 MVP; W8–W10 extensão; W11 staging/release gates. Commits pequenos e mensagens com T-ID; PRs por wave. Sem deploy/merge automático.
