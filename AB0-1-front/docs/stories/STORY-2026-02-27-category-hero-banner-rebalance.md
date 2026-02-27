# STORY-2026-02-27: Reequilibrar hero e banner da página de categoria

## Contexto
O hero atual da rota `/categories/[slug]` ficou alto demais e com pouca presença visual do banner da categoria. A referência anterior tinha uma faixa panorâmica melhor resolvida em proporção horizontal, enquanto a versão nova trouxe uma hierarquia de conteúdo mais rica.

## Requisito
Combinar o melhor dos dois layouts: manter a clareza do hero novo, mas com banner panorâmico dominante, altura reduzida e leitura mais próxima da referência antiga.

## Acceptance Criteria
- [x] O hero de categoria usa um banner panorâmico com proporção mais horizontal.
- [x] A imagem da categoria ganha mais presença visual sem deixar o topo excessivamente alto.
- [x] O conteúdo do hero usa a descrição real da categoria quando disponível.
- [x] As validações relevantes foram executadas e qualquer bloqueio remanescente foi documentado.

## Checklist de Implementação
- [x] Refatorar `components/categories/CategoryHero.tsx`.
- [x] Passar descrição real da categoria a partir da página cliente.
- [x] Reduzir a escala visual dos elementos internos do hero sem perder legibilidade.
- [x] Compactar o espaçamento vertical entre hero, chips e conteúdo principal.
- [x] Rodar lint do frontend.
- [x] Rodar validação adicional disponível para o frontend ou documentar bloqueio.

## File List
- [x] `components/categories/CategoryHero.tsx`
- [x] `components/categories/DecisionChips.tsx`
- [x] `app/categories/[slug]/CategoryPageClientV2.tsx`
- [x] `app/categories/[slug]/__tests__/category-client-banners.test.tsx`
- [x] `docs/stories/STORY-2026-02-27-category-hero-banner-rebalance.md`

## Validation
- [x] `npm run lint`
- [x] `npx tsc --noEmit`
- [ ] `npm test -- category-client-banners --runInBand` (bloqueado por configuração atual do Jest com ESM em `better-auth`)
