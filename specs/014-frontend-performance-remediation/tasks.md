# Spec 014 — Registro de execução das 42 tasks

**Branch:** `feat/spec-014-frontend-performance-foundation-20261119` | **PR:** #202 (draft)
**Data:** 2026-11-19 | **Status geral:** implementação parcial, gate final NÃO aprovado.

Os itens [x] indicam alteração aplicada ao código/documentação da branch, **não** comprovam êxito de performance. Somente métricas reais e CI verdes permitem fechar a Spec 014. Não tratar tasks como concluídas quando a aceitação depende de evidência ainda não medida.

- [ ] **T001** — Criar o registro de baseline por rota, viewport, commit, ambiente e execução em metrics.md. _Parcial na PR #202; pendente de confirmação/entrega específica._
- [x] **T002** — Adicionar /search e /products à matriz de URLs do Lighthouse CI. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [x] **T003** — Definir os eventos route_shell_visible, first_data_visible e route_interactive. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [x] **T004** — Documentar coleta cold load, navegação interna e interação. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [x] **T005** — Criar loaders server-side normalizados para busca, empresas e produtos. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [x] **T006** — Adicionar memoização por request com React.cache. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [ ] **T007** — Definir DTOs mínimos da primeira renderização. _Parcial na PR #202; pendente de confirmação/entrega específica._
- [x] **T008** — Criar fixtures success, empty, error e pending. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [x] **T009** — Registrar critérios SEO, JSON-LD, tracking e acessibilidade. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [x] **T010** — Refatorar /search para Server Component com primeiros resultados. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [x] **T011** — Preservar fallback, empty state, paginação e tracking da busca. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [ ] **T012** — Adicionar testes da primeira renderização e filtros em /search. _Parcial na PR #202; pendente de confirmação/entrega específica._
- [x] **T013** — Refatorar /companies e CompaniesPageClient para dados server-side. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [x] **T014** — Preservar keepPreviousData, AbortSignal, prefetch e cache das empresas. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [ ] **T015** — Adicionar testes da primeira página, filtros, paginação e erro de empresas. _Parcial na PR #202; pendente de confirmação/entrega específica._
- [x] **T016** — Separar dados iniciais de produtos e interações client-side. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [x] **T017** — Preservar filtros, URL, empty state, paginação e loading de produtos. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [ ] **T018** — Adicionar testes da página de produtos e filtros. _Parcial na PR #202; pendente de confirmação/entrega específica._
- [x] **T019** — Separar loader da empresa e loader de reviews no perfil. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [ ] **T020** — Criar boundary independente de reviews com CompanyReviewsSection. _Parcial na PR #202; pendente de confirmação/entrega específica._
- [x] **T021** — Remover Suspense inefetivo ao redor do perfil já aguardado. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [x] **T022** — Separar requests críticos e analytics secundários. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [ ] **T023** — Criar testes de streaming, erro de reviews e erro de analytics. _Parcial na PR #202; pendente de confirmação/entrega específica._
- [x] **T024** — Substituir imports estáticos de abas por next/dynamic no shell ativo. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [x] **T025** — Renderizar componentes de abas somente quando a aba estiver ativa. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [ ] **T026** — Remover imports legados não usados e alinhar caminhos de renderização. _Parcial na PR #202; pendente de confirmação/entrega específica._
- [x] **T027** — Isolar import estático de @sentry/nextjs no PostHogProvider. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [ ] **T028** — Verificar chunks de mapa e galeria com bundle analyzer. _Parcial na PR #202; pendente de confirmação/entrega específica._
- [ ] **T029** — Testar ausência de download inicial do mapa. _Parcial na PR #202; pendente de confirmação/entrega específica._
- [x] **T030** — Usar useTransition nas atualizações de URL da busca. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [x] **T031** — Usar useTransition em filtros, busca e paginação das empresas. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [x] **T032** — Usar useTransition nos filtros e URL de produtos. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [x] **T033** — Consolidar listeners globais de interação. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [x] **T034** — Mover activeSpecFilters para fora do callback por produto. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [ ] **T035** — Avaliar content-visibility/virtualização de listas. _Parcial na PR #202; pendente de confirmação/entrega específica._
- [ ] **T036** — Adicionar assertions de TTFB, INP/RUM e budget por rota. _Parcial na PR #202; pendente de confirmação/entrega específica._
- [ ] **T037** — Registrar comparação real before/after. _Pendente de execução ou evidência real._
- [ ] **T038** — Criar dashboard ou consulta Web Vitals por rota. _Parcial na PR #202; pendente de confirmação/entrega específica._
- [x] **T039** — Documentar rollback por rota/feature flag. _Código/documentação na PR #202; ainda sujeito a CI e aceitação._
- [ ] **T040** — Executar Jest focado, typecheck, lint, build e LHCI. _Parcial na PR #202; pendente de confirmação/entrega específica._
- [ ] **T041** — Validar mobile/desktop/teclado/leitor de tela/erros. _Pendente de execução ou evidência real._
- [ ] **T042** — Atualizar relatório com métricas reais e decisão de rollout. _Pendente de execução ou evidência real._

## Resumo

- Implementadas na branch: 25 tasks.
- Parciais, com código ou contrato inicial: 14 tasks.
- Pendentes sem entrega/evidência: 3 tasks.
- Percentual de sucesso de performance: **não mensurável** sem baseline e medições pós-merge.
- Testes de qualidade e release: consultar GitHub Actions da PR #202; builds cancelados por commits subsequentes não contam como aprovação.
- Não fazer merge/deploy de alto risco nem afirmar LCP/INP/TTFB aprovados até validação de staging, dados reais e rollout gradual.

## Ordem remanescente para aceite

1. Fechar gates da PR #202 (testes focados, typecheck, lint e build).
2. Medir baseline **real em commit main anterior ao rollout** (desktop/mobile, três execuções por rota; dados RUM p75).
3. Fechar T007, T012, T015, T018, T020, T023, T026, T028, T029, T035/T036/T038 sem mascarar problemas de payload/SEO.
4. Validar T037/T040/T041/T042: before/after nas mesmas condições, limite de regressão 5%, SEO, a11y e rollback.
