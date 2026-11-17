# Carrossel compacto de categorias do catálogo

## Objetivo e escopo
Apenas a faixa de categorias de `/products` (web/PWA), sem alterar a navegação global, banner, grade de resultados, API ou banco. Componentes: `ProductCategoryRail.tsx`, `ProductCategoryCard.tsx`; resolver: `lib/products/quick-product-categories.ts`.

## Contrato
- Exatamente seis categorias visuais, na ordem: Inversores, Baterias, Estruturas, Carregadores, Cabos e acess., Microinversores.
- A imagem é ilustrativa, nunca foto certificada de SKU ou marca. Quatro assets vêm de `public/3d-refined` e duas ilustrações 3D de `public/images/product-categories`.
- `categoriesMeta` chega pelo hook `useProducts`. ID e contador nunca usam mock ou fallback numérico. Categoria sem ID é desabilitada e apresenta **Indisponível**.
- Um toque aplica o filtro usando `handleFilterChange('category', id)`; um segundo toque limpa. Os parâmetros de URL e a ordenação são preservados pelo fluxo existente.
- Há evento `product_category_selected` (para seleção e limpeza); o evento `filter_applied` permanece sob responsabilidade do handler existente.

## Design e responsividade
- Mobile: uma faixa sem quebra, cada item com 108 px visíveis de largura, 108 px de altura, imagem 40 px e gap de 8 px.
- Tablet: 124 px úteis de largura, 112 px de altura e imagem de 44 px.
- Desktop (≥ 1024 px): seis cards completos no mesmo alinhamento, altura 116 px e imagem 48 px.
- Swipe touch no mobile, botões de seta para overflow em tablet e dots de 6 px baseados nos snaps reais. Não há autoplay.
- Foco visível, aria-pressed no item selecionado, botão indisponível desabilitado e `prefers-reduced-motion` respeitado.
- A bottom navigation e as safe areas permanecem sob responsabilidade dos componentes globais existentes.

## Como testar
```bash
cd AB0-1-front
npm run typecheck
npm run lint
npm test -- --runInBand quick-product-categories ProductCategoryCard
npx playwright test tests/e2e/products-category-rail.spec.ts
npm run build
```

**QA manual indispensável:** 320, 360, 375/390, 430, 768, 1024 e 1440 px; Safari iOS standalone; Chrome Android PWA; zoom 200%; imagem quebrada; categoria sem mapeamento; filtros preexistentes; layout em ambas as opções lista/grade.

## Rollback
Reverter os commits deste PR; a integração é exclusivamente no frontend da página `/products`, sem necessidade de migração ou rollback de dados.
