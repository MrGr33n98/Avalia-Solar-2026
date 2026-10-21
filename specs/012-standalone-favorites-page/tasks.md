# Tasks 012 — Standalone Favorites Page (`/favorites`)

- [x] Task 1: Blindar componentes de card e grid contra dados nulos
  - [x] 1.1 Em `FavoriteCompanyCard.tsx`, adicionar checagem se `favorite?.item` existe antes de ler `slug`, `name` ou `id`.
  - [x] 1.2 Em `FavoriteProductCard.tsx`, adicionar checagem se `favorite?.item` existe antes de ler propriedades do item.
  - [x] 1.3 Em `FavoritesGrid.tsx`, filtrar itens com `item == null` ou tipos desconhecidos.

- [x] Task 2: Criar componente de estado de visitante `FavoritesVisitorState.tsx`
  - [x] 2.1 Criar `components/favorites/FavoritesVisitorState.tsx` com visual acolhedor, ícone de coração, CTAs de login (`/login?redirect=/favorites`), registro (`/register?redirect=/favorites`) e links para empresas e produtos.

- [x] Task 3: Criar componente orquestrador `FavoritesClient.tsx`
  - [x] 3.1 Criar `components/favorites/FavoritesClient.tsx` integrado com `useAuth()`.
  - [x] 3.2 Implementar busca via `favoritesApi.list({ per_page: 100 })` com sanitização defensiva dos dados.
  - [x] 3.3 Implementar abas de filtro ('all', 'companies', 'products') e contadores de itens.
  - [x] 3.4 Implementar estado de erro com botão "Tentar Novamente" e estado vazio com `FavoritesEmptyState`.
  - [x] 3.5 Disparar telemetria `favorites_page_viewed` e `favorites_filter_changed`.

- [x] Task 4: Criar páginas e rotas em `app/favorites/`
  - [x] 4.1 Criar `app/favorites/page.tsx` com metadados SEO (`noindex, nofollow`) e renderizar `FavoritesClient`.
  - [x] 4.2 Criar `app/favorites/loading.tsx` para feedback visual durante transições de rota.
  - [x] 4.3 Criar `app/favorites/error.tsx` com reporte ao Sentry (`errorBoundary: 'favorites-page'`) e UI de recuperação local.

- [x] Task 5: Atualizar `app/review-dashboard/favorites/page.tsx`
  - [x] 5.1 Atualizar a página do painel do avaliador para utilizar a sanitização defensiva e manter compatibilidade com testes existentes.

- [x] Task 6: Testes e Garantia de Qualidade
  - [x] 6.1 Atualizar e expandir testes unitários existentes em `__tests__` ou `components/favorites/`.
  - [x] 6.2 Executar `npm test -- favorite` e verificar 100% de aprovação.
  - [x] 6.3 Executar `npm run typecheck` e ESLint.
