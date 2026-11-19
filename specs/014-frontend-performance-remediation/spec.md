# Spec 014 — Remediação de performance do frontend
**Projeto:** Avalia Solar 2026 · **Data:** 2026-11-19 · **Escopo:** `AB0-1-front/` · **Status:** implementação em revisão na PR #203

## Decisão
Rotas públicas `/search`, `/companies`, `/products` e `/companies/[id]` devem enviar shell e conteúdo útil no HTML/RSC, antes da hidratação completa. Atualizações subsequentes de filtros, busca, paginação e favoritos permanecem interativas, sem expor conteúdo privado. Analytics, mapas e abas secundárias devem ser diferidos.

## Contratos
- App Router Next.js 14, React 18 e TypeScript preservados.
- API Rails pública, JSON-LD/FAQ, canonical, SEO, tracking, CTAs e comercial gating inalterados.
- `React.cache` para desduplicação intra-request, `fetch` público com revalidate e tags.
- Dados iniciais serializados apenas a partir de endpoints públicos. `fields=card` em empresas. Campos precisam ser revistos antes de projeção de DTO ainda menor.
- `keepPreviousData`, `staleTime`, `gcTime`, AbortSignal e prefetch não devem regredir.
- Estados: `initial`, `pending`, `success`, `empty`, `error` e `secondary-loading`. Falha de reviews/analytics não pode ocultar o hero.
- Não substituir autenticação ou gates do Rails/Pundit.

## Definição de concluído
1. Primeira listagem disponível no RSC/HTML por rota; exceções documentadas.
2. Perfil da empresa não depende do await de reviews para hero/identidade.
3. Mapa e abas secundárias ausentes dos chunks de abertura quando inativos.
4. Transições de filtro não bloqueantes e requests obsoletos cancelados.
5. Testes Jest, typecheck, lint, build, Lighthouse CI, e regressões de SEO/a11y/tracking passam.
6. Baseline REAL em desktop/mobile por rota, cold load e client navigation e comparação ≥ 3 execuções.
7. Rollback, owners, monitoramento, riscos e KPIs relatados sem valores inventados.

## Metas de produto
LCP p75 ≤2.5 s, INP p75 ≤200ms, TTFB p75 ≤600ms para documentos públicos cacheáveis, CLS ≤0.1, FCP lab ≤2s, TBT lab ≤500ms, Lighthouse ≥0.8, scripts Lighthouse ≤450000 bytes (advertência atual). São **metas**, não medições.

## Questões em aberto
- Busca: compatibilidade total do retorno inicial/fallback de empresas precisa de E2E.
- Produtos: filtros SSR são fornecidos pelo endpoint `products/filters`; verificar consumo/shape no browser.
- Reviews no JSON-LD: o HTML final da resposta de streaming precisa ser comparado com antes.
- Percentual de uso do mapa acima da dobra não está medido.
- Orçamento de 450KB é script summary por coleta Lighthouse, não orçamento rigoroso por chunk.

## Decisão de rollout
PR isolada em Draft, sem merge/deploy até todos os gates com dados reais.

## Decisions as of 2026-11-19

1. `/search` has a public endpoint with companies/products/category/article arrays. A conditional public companies fallback is retained; runtime parity with filters is covered by client code plus focused unit tests.
2. `/products` supports a public first-page response and public filter metadata. Invalid numeric catalog selectors are not silently converted to unfiltered server results.
3. Company hero/identity is independent of the review list. JSON-LD LocalBusiness reviews are streamed through an isolated Server Component, preserving the aggregate schema on failures.
4. The proportion of above-the-fold map engagement is not measured. **Default = no map prefetch until user intent**, with future data-driven adjustment.
5. The 450KB budget is the Lighthouse **script resource transfer total**, not the Next.js CLI “First Load JS” sum or uncompressed webpack manifest bytes. Per-route/chunk budgets must be added only after a comparable Lighthouse baseline.
