# Spec 012 — Standalone Favorites Page (`/favorites`)
**Prioridade:** P0 · Resolução de Falha Crítica de Navegação em Produção  
**Plataforma:** Web / PWA (`AB0-1-front`)  
**Autor:** Antigravity / Avalia Solar

---

## 1. Visão Geral e Contexto

Ao clicar no botão "Favoritos" na barra de navegação da Landing Page (`HomeLocationBar.tsx`), os usuários se deparavam com a tela fatal "Erro Crítico" (`app/global-error.tsx`).

### Causa Raiz Identificada
1. **Acoplamento Inadequado com o Reviewer Dashboard:** A rota `app/favorites/page.tsx` realizava um `redirect('/review-dashboard/favorites')`. A rota `/review-dashboard` é envolvida por `DashboardDataProvider` (`DashboardLayoutClient.tsx`), que exige perfil autenticado do tipo `review` ou `admin` e dispara 5 requisições de dados não relacionadas (`reviewDashboardApi.getSummary`, `reviewsApi.listMine`, `leadsApi.mine`, `reviewerSolutionsApi.list`). Usuários anônimos e usuários do tipo `company` eram rejeitados ou causavam exceções fatais.
2. **Fragilidade a Dados Órfãos (`item: null`):** Se um registro de favorito no banco apontar para um item excluído (`Company` ou `Product`), `item` é retornado como `null`. Os componentes de card tentavam acessar `item.slug`, gerando `TypeError: Cannot read properties of null` que estourava até o `global-error.tsx` devido à ausência de error boundary local.

---

## 2. Requisitos Funcionais

### RF-01: Rota `/favorites` Desacoplada e Independente
- A rota `/favorites` deve ser uma página autônoma de primeiro nível, renderizada dentro do layout padrão público (`app/layout.tsx`).
- Não deve redirecionar para `/review-dashboard/favorites`.
- Não deve depender de nenhum contexto do painel (`useDashboardContext`).

### RF-02: Experiência para Visitantes Não Autenticados
- Quando o usuário não estiver autenticado (`!isAuthenticated`), deve ser apresentada uma tela informativa e convidativa:
  - Título claro (ex.: "Salve seus favoritos").
  - Mensagem explicativa ("Faça login para salvar e consultar empresas e produtos solares que chamaram sua atenção.").
  - Botão de ação primário: "Entrar para ver meus favoritos" direcionando para `/login?redirect=%2Ffavorites`.
  - Ação secundária: "Criar uma conta" (`/register?redirect=%2Ffavorites`).
  - Botões de exploração rápida: "Explorar empresas" (`/companies`) e "Explorar produtos" (`/products`).

### RF-03: Experiência para Usuários Autenticados (Todos os Papéis)
- Usuários autenticados (`review`, `company`, `admin` ou qualquer outro) podem acessar seus favoritos diretamente pela API `/api/v1/favorites`.
- Carregamento de até 100 itens na listagem inicial.
- Filtros rápidos por abas: "Todos", "Empresas", "Produtos", com contadores atualizados.
- Remoção reativa: ao desmarcar o coração em um card, o item é removido da lista local sem necessidade de recarregar a página.

### RF-04: Estado Vazio
- Se o usuário autenticado não possuir nenhum item salvo, exibir o componente `FavoritesEmptyState` com CTAs para explorar empresas e produtos.

### RF-05: Resiliência de Dados e Tratamento de Erros
- **Validação defensiva:** Filtrar estritamente registros válidos:
  `items = response.data.filter(fav => fav?.item && ['Company', 'Product'].includes(fav.favoritable_type))`
- **Proteção nos cards:** `FavoriteCompanyCard` e `FavoriteProductCard` devem checar `if (!item) return null;` para evitar `TypeError`.
- **Tratamento de erro de rede:** Exibir mensagem amigável local com botão "Tentar Novamente", sem derrubar a aplicação.
- **Error Boundary Local (`app/favorites/error.tsx`):** Capturar qualquer erro imprevisto na subárvore de favoritos, enviar ao Sentry com a tag `errorBoundary: 'favorites-page'` e oferecer botão "Tentar Novamente" e "Voltar para a Home", preservando o layout da aplicação.
- **Loading State (`app/favorites/loading.tsx`):** Exibir esqueleto/spinner consistente com o design system durante a carga inicial.

### RF-06: Manutenção da Rota do Dashboard
- A rota `/review-dashboard/favorites` continuará funcionando para os links internos existentes no menu do avaliador, utilizando os mesmos componentes resilientes.

---

## 3. Requisitos Não Funcionais

- **SEO:** `robots: { index: false, follow: false }` definido na rota `/favorites` para evitar indexação de páginas de favoritos de usuários.
- **Performance:** Evitar chamadas a APIs desnecessárias de dashboard (economia de até 5 requisições HTTP por visita).
- **Acessibilidade:** Botões e abas com papéis ARIA corretos (`role="tab"`, `aria-selected`, `aria-label`).
