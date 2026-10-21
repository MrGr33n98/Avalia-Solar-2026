# Implementation Plan 012 — Standalone Favorites Page (`/favorites`)

## Arquitetura de Componentes

```
app/
  favorites/
    page.tsx              <- Server component com SEO Metadata & BreadcrumbSchema
    loading.tsx           <- Loading state (Skeleton/Spinner)
    error.tsx             <- Error Boundary com captura Sentry local e fallback UI
components/
  favorites/
    FavoritesClient.tsx   <- Client component orquestrador (Auth, Fetch, Tabs, Filters, Erros)
    FavoritesVisitorState.tsx <- Estado amigável para visitante deslogado com CTAs de login/cadastro/descoberta
    FavoritesEmptyState.tsx   <- Estado vazio para usuário autenticado sem favoritos (já existente, refinar se preciso)
    FavoritesGrid.tsx         <- Grid com proteção defensiva de favoritos válidos
    FavoriteCompanyCard.tsx   <- Card com verificação defensiva de item != null
    FavoriteProductCard.tsx   <- Card com verificação defensiva de item != null
    FavoriteButton.tsx        <- Botão de favoritar (já existente)
```

## Etapas de Execução

1. **Defesas nos Componentes de Card e Grid:**
   - Adicionar checagem `if (!item) return null;` em `FavoriteCompanyCard.tsx` e `FavoriteProductCard.tsx`.
   - Adicionar filtro defensivo em `FavoritesGrid.tsx` para garantir que apenas itens com `item != null` e tipo permitido sejam renderizados.

2. **Criação do `FavoritesVisitorState.tsx`:**
   - Componente polido e convidativo com ícone de coração, título explicativo, botão de login ("Entrar na minha conta") com `redirect=/favorites`, botão de cadastro ("Criar uma conta") e botões de exploração para empresas e produtos.

3. **Criação do `FavoritesClient.tsx`:**
   - Utiliza `useAuth()` para verificar `isAuthenticated` e `loading`.
   - Se `authLoading`, exibe spinner de carregamento.
   - Se `!isAuthenticated`, renderiza `FavoritesVisitorState`.
   - Se `isAuthenticated`, carrega `favoritesApi.list({ per_page: 100 })`:
     - Aplica filtro de validação defensivo: `item => item?.item && ['Company', 'Product'].includes(item.favoritable_type)`.
     - Gerencia estados: carregando, erro (com botão Tentar Novamente), filtros ('all', 'companies', 'products'), remoção reativa.
     - Suporta query param `?type=` via URL para pré-selecionar aba.
     - Envia evento de telemetria `favorites_page_viewed` e `favorites_filter_changed`.

4. **Criação de `app/favorites/page.tsx`, `loading.tsx` e `error.tsx`:**
   - `page.tsx`: Define metadados com `robots: { index: false, follow: false }`, título "Meus Favoritos | Avalia Solar" e renderiza `FavoritesClient`.
   - `loading.tsx`: Componente de carregamento para streaming Next.js.
   - `error.tsx`: Componente de captura de erro com Sentry e botões de recuperação sem derrubar o shell global.

5. **Ajuste em `app/review-dashboard/favorites/page.tsx`:**
   - Reutilizar `FavoritesClient` com prop opcional `insideDashboard` ou aplicar a mesma validação defensiva para manter compatibilidade com testes existentes.

6. **Validação e Testes:**
   - Executar suite Jest para favoritos (`npm test -- favorite`).
   - Criar novos testes unitários para `FavoritesVisitorState`, `FavoritesClient` e `app/favorites/page.tsx`.
   - Executar `npm run typecheck` e lint.
