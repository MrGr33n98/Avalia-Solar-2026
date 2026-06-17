# Phase 1: Fundação e Integração da Home (P0) - Research

**Researched:** 16 de junho de 2026
**Domain:** Mobile Frontend (Expo/React Native) + GraphQL Integration
**Confidence:** HIGH

## Summary

Esta fase consiste em transformar a Home do aplicativo Avalia Solar de um protótipo com dados estáticos para uma aplicação integrada ao backend via GraphQL. A pesquisa confirmou que a infraestrutura básica do Apollo Client já está configurada em `AB0-1-mobile/src/lib/apolloClient.ts`, mas a `HomeScreen` (`index.tsx`) ainda depende fortemente de fallbacks e mocks locais para categorias e empresas.

**Primary recommendation:** Migrar as queries de TanStack Query para usar exclusivamente o `apolloClient.query` (com cache-first) e implementar os blocos dinâmicos de Banners e Blog que ainda estão ausentes no código mobile.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Apollo Client:** Toda a busca de dados da Home deve ser migrada de mocks locais para queries GraphQL.
- **Single Source of Truth:** O backend Rails é a única fonte da verdade para ativos (banners, logos, ícones).
- **Home Features (P0.4):** Implementar carrossel de banners, categorias reais, empresas e produtos em destaque, e feed do blog.
- **Mock Removal (P0.1):** Auditoria e remoção sistemática de `mockBanners`, `bannersMock`, `fakeBanners`, `categoryIcons`.
- **Skeletons:** Adicionar estados de carregamento consistentes.

### the agent's Discretion
- Estrutura exata das queries GraphQL (Fragments para reutilização).
- Configuração do cache do Apollo para melhorar a performance de navegação.
- Detalhes de animação na transição entre Skeletons e Conteúdo Real.

### Deferred Ideas (OUT OF SCOPE)
- Autenticação Real (Fase 2).
- Dashboard da Empresa (Fase 2+).
- Scanner/OCR real (Fase 2+).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOME-01 | Integrar a Home real via GraphQL consumindo Categorias, Banners e Empresas em Destaque. | Queries básicas já mapeadas em `index.tsx`. `QueryType.rb` no backend suporta `banners`, `categories` e `companies`. |
| MOCK-01 | Auditoria e remoção completa de mocks e dados hardcoded em telas de produção. | Mapeados mocks `mockReferencedCompanies`, `displayCategories` e `getPriceEstimate` em `index.tsx`. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @apollo/client | ^4.2.3 | GraphQL Client | Padrão da indústria para cache e gestão de estado GQL. |
| @tanstack/react-query | ^5.101.0 | Server State | Usado como wrapper em `index.tsx` para gerenciar o ciclo de vida das queries. |
| lucide-react-native | - | Ícones | Conjunto de ícones oficial do projeto. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| expo-image | - | Imagens Otimizadas | Recomendado para banners e logos com cache nativo. |
| react-native-reanimated | - | Animações | Para transições suaves entre Skeletons e Conteúdo. |

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── index.tsx            # Home Screen principal
├── components/
│   ├── home/                # Componentes específicos da Home
│   │   ├── banner-carrousel.tsx
│   │   ├── category-grid.tsx
│   │   └── blog-feed.tsx
│   └── skeleton/            # Skeletons reutilizáveis
│       ├── home-skeleton.tsx
│       └── company-card-skeleton.tsx
├── lib/
│   ├── apolloClient.ts      # Configuração global (verificada)
│   └── queries/             # Fragments e Queries GQL centralizadas
│       └── home.ts
```

### Pattern 1: GraphQL Fragments
**What:** Centralizar a definição dos campos de `Company` e `Category` para garantir que a Home e a busca usem os mesmos dados.
**When to use:** Sempre que um objeto for retornado em múltiplas queries.

### Anti-Patterns to Avoid
- **Fetch no componente:** Não usar `fetch` ou `axios` diretamente; usar o `apolloClient`.
- **Hardcoded IDs:** Evitar usar IDs de categorias hardcoded (ex: `case 1: return <Sun />`). Usar slugs ou metadados da API.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Carrossel | Swiper manual | `react-native-reanimated-carousel` | Performance e suporte a gestos nativos. |
| Skeleton | View cinza simples | `react-native-linear-gradient` + animação | Proporciona uma percepção de performance muito superior (shimmer effect). |

## Common Pitfalls

### Pitfall 1: Apollo Cache Invalidation
**What goes wrong:** O usuário muda de cidade/estado, mas o Apollo retorna os dados da cidade anterior do cache.
**How to avoid:** Incluir `state` e `city` nas variáveis da query e usar `fetchPolicy: 'cache-and-network'` para garantir atualização em background.

### Pitfall 2: Localhost no Emulador
**What goes wrong:** O app falha ao conectar no backend rodando em `localhost`.
**How to avoid:** No Android Emulator, usar `10.0.2.2`. No iOS, usar o IP da máquina na rede local. (Verificado em `apolloClient.ts`).

## Code Examples

### Query Recomendada para a Home
```typescript
// src/lib/queries/home.ts
import { gql } from '@apollo/client';

export const GET_HOME_DATA = gql`
  query GetHomeData($state: String, $city: String) {
    banners(position: "home_top", state: $state, city: $city) {
      id
      title
      imageUrl
      linkUrl
    }
    categories(featured: true, limit: 10) {
      id
      name
      slug
      # icon_url (Adicionar no backend se necessário)
    }
    featuredCompanies: companies(state: $state, featured: true, limit: 6) {
      nodes {
        id
        name
        logoUrl
        ratingAvg
        isVerified
      }
    }
    latestArticles: articles(per_page: 3) {
      nodes {
        id
        title
        slug
        # cover_url
      }
    }
  }
`;
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Apollo Client | Data Fetching | ✓ | 4.2.3 | — |
| GraphQL API | Backend | ✓ | — | Mock local (parcial) |
| Expo SecureStore | Auth Token | ✓ | 56.0.4 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + Testing Library |
| Config file | `jest.config.js` |
| Quick run command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| HOME-01 | Home carrega dados reais sem erros | Integration | `npm test src/app/index.test.tsx` |
| MOCK-01 | Verificação de ausência de variáveis `mock*` | Static Scan | `grep -r "mock" src/app/index.tsx` |

## Open Questions

1. **Produtos em Destaque:** O `QueryType.rb` do backend não possui um campo `products` no nível superior, apenas dentro de `search_suggestions`. 
   - *Recomendação:* Adicionar `field :products` no `QueryType.rb` ou decidir se os produtos serão buscados via `companies` (produtos da empresa).
2. **Ícones de Categorias:** O backend retorna nomes e slugs, mas não a URL do ícone ou o nome do componente Lucide.
   - *Recomendação:* Criar um mapeamento robusto no frontend baseado em `slug` ou adicionar `icon_name` ao modelo de Categoria no backend.

## Sources

### Primary (HIGH confidence)
- `AB0-1-mobile/src/lib/apolloClient.ts` - Configuração verificada.
- `AB0-1-mobile/src/app/index.tsx` - Mapeamento de mocks atuais.
- `AB0-1-back/app/graphql/types/query_type.rb` - Auditoria de endpoints disponíveis.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Bibliotecas já instaladas e configuradas.
- Architecture: HIGH - Estrutura de rotas e serviços clara.
- Pitfalls: MEDIUM - Cache do Apollo sempre exige atenção em mobile.

**Research date:** 16 de junho de 2026
**Valid until:** 16 de julho de 2026
