# Resultados de validação

## Passaram

- Frontend Jest focado: 6 suites/27 testes aprovados em catálogo, pesquisa, hook, API client, proxy e service worker; em uma segunda execução, 2 suites/14 testes de filtros mobile/tablet passaram. Total observado nas duas execuções focadas: 8 suites e 41 testes.
- Backend RSpec focado: 10 exemplos, 0 falhas, em specs de request de cidades e serviço de locais.
- `npm run typecheck -- --pretty false`: exit 0.
- ESLint escopado aos arquivos compartilhados e componentes atualizados: exit 0.
- RuboCop escopado a quatro arquivos alterados: sem offenses.
- `node --check AB0-1-front/public/sw.js`: exit 0.
- `git diff --check`: exit 0.

## Falharam ou não foram concluídos

- Playwright: 3 cenários tentados; falharam na navegação para `/companies` porque a compilação da rota no Next dev ultrapassou o timeout. Nenhum screenshot foi produzido. Ver `screenshots/README.md`.
- ESLint amplo executado no conjunto de arquivos legado: reportou 61 erros e 17 warnings; não se declara lint global limpo. O escopo focado nos arquivos centrais alterados passou.
- RuboCop sobre o controller grande completo reportou 84 offenses; a execução focada nos quatro arquivos alterados passou. O estado baseline dessas offenses não foi determinado.
- Prettier check incluindo `FilterSidebar.tsx`, `LocationFilter.tsx` e `LocationSearch.tsx` não passou. Não foi aplicado format em massa a componentes legados.
- Build Next completo, CI remoto, Lighthouse, E2E válido, audit completo de mobile/tablet/desktop e suíte inteira não executados.
- Tentativa posterior do novo `companies_count_spec.rb`: bloqueada antes dos exemplos pelo guard de `spec/rails_helper.rb`, que detectou test DB com mesmo host/database de produção. Nenhum bypass foi usado e o spec não foi validado; containers isolados foram parados. Reexecutar somente com configuração comprovadamente isolada.
- Durante a inicialização interrompida, `db/schema.rb` apareceu com um dump parcial após erro de conexão. O arquivo foi restaurado byte a byte ao conteúdo do HEAD inicial e `git diff --check` voltou a passar; não há mudança de schema na branch.

## RED → GREEN

Specs backend foram executadas inicialmente antes da implementação e apresentaram falhas esperadas de contrato/cache; depois da implementação e correção do header vazio, os 10 exemplos passaram. O registro não cobre RED individual para cada critério da tasklist. Os testes Jest finais são evidência GREEN; não se afirma RED reproduzível para toda a matriz de concorrência/UX.
