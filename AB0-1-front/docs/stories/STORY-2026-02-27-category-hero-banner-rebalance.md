# STORY-2026-02-27: Reequilibrar hero e banner da página de categoria

## Contexto
O hero atual da rota `/categories/[slug]` ficou alto demais e com pouca presença visual do banner da categoria. A referência anterior tinha uma faixa panorâmica melhor resolvida em proporção horizontal, enquanto a versão nova trouxe uma hierarquia de conteúdo mais rica.

## Requisito
Combinar o melhor dos dois layouts: manter a clareza do hero novo, mas com banner panorâmico dominante, altura reduzida e leitura mais próxima da referência antiga.

## Acceptance Criteria
- [x] O hero de categoria usa um banner panorâmico com proporção mais horizontal.
- [x] A imagem da categoria ganha mais presença visual sem deixar o topo excessivamente alto.
- [x] O conteúdo do hero usa a descrição real da categoria quando disponível.
- [x] O selo de ranking no canto direito mantém contraste alto e o mesmo destaque amarelo do hero.
- [x] As validações relevantes foram executadas e qualquer bloqueio remanescente foi documentado.

## Checklist de Implementação
- [x] Refatorar `components/categories/CategoryHero.tsx`.
- [x] Passar descrição real da categoria a partir da página cliente.
- [x] Reduzir a escala visual dos elementos internos do hero sem perder legibilidade.
- [x] Compactar o espaçamento vertical entre hero, chips e conteúdo principal.
- [x] Alinhar a faixa de filtros rápidos com o mesmo grid do hero.
- [x] Remover os stats do hero enquanto os dados da categoria ainda não sustentam esse bloco.
- [x] Ajustar o selo de ranking para o mesmo destaque amarelo e melhorar a legibilidade no banner.
- [x] Rodar lint do frontend.
- [x] Rodar validação adicional disponível para o frontend ou documentar bloqueio.

## File List
- [x] `components/categories/CategoryHero.tsx`
- [x] `components/categories/CategoryHero.test.tsx`
- [x] `components/categories/DecisionChips.tsx`
- [x] `app/categories/[slug]/CategoryPageClientV2.tsx`
- [x] `app/categories/[slug]/__tests__/category-client-banners.test.tsx`
- [x] `docs/stories/STORY-2026-02-27-category-hero-banner-rebalance.md`

## Validation
- [x] `npm run lint` (passou; restam warnings preexistentes de hooks e `no-img-element` em arquivos fora deste ajuste)
- [x] `node --max-old-space-size=4096 .\node_modules\typescript\bin\tsc --noEmit`
- [x] `npm test -- CategoryHero` (novo teste do selo de ranking passou)
- [ ] `npm test` (bloqueado no estado atual do repo por estouro de memória em múltiplos workers do Jest e falhas `TransformStream is not defined` em specs com Playwright)
- [ ] `npm run build` (bloqueado no ambiente atual com `RangeError: Array buffer allocation failed` durante `next build`)
