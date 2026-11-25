# Baseline e proveniência

- Pacote-fonte: `docs/Avalia-Solar-Spec-019-Pack/specs/019-pwa-geographic-filter-performance/`.
- Cópia de implementação: `specs/019-pwa-geographic-filter-performance/`; o pacote-fonte foi preservado.
- Branch criada: `feat/019-pwa-geographic-filter-performance`.
- HEAD de partida e HEAD atual antes de commit: `f1d6f42586d1614a54cc975bdc3ca9b62c62de57`.
- Worktree inicial estava limpo antes de criar a branch e copiar os artefatos. Não há commit, push, PR ou deploy.
- O branch foi criado sobre a base local `origin/feat/018a-mcp-full-brand-experience` disponível no checkout. A referência de imagens não pôde ser confirmada como imagem publicada da implementação atual.

## Estado de baseline

Não havia baseline quantitativo comparável do refactor. O ambiente local continha imagens GHCR antigas sem labels de revisão/SHA que provassem correspondência com o HEAD. Nessa imagem, foram observados `/` e `/companies` com 500, `/companies/count` com 404 e endpoint de cidades com 200. Estes resultados não são baseline válido da branch nem podem ser atribuídos ao código alterado.

Não foram obtidos screenshots/HAR de baseline. Não comparar produção com os números locais de `after.md`.

## Bloqueios de ambiente

O backend de benchmark foi executado em Compose isolado na porta local 23001. O Next dev foi iniciado com chaves locais descartáveis e chegou a `Ready`, mas a compilação de `/companies` não terminou antes do timeout do Playwright; os três cenários E2E abortaram na navegação. Não foi alterada chave de produção e nenhum secret foi registrado nos artefatos.

O script de prerequisite/validação Spec Kit referido no fluxo não está presente no checkout e `.specify/extensions.yml` não existe. A análise de artefatos foi manual; isso não substitui a convergência completa do Spec Kit.
