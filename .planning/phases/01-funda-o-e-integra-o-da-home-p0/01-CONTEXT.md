# Phase 01: Fundação e Integração da Home (P0) - Context

**Gathered:** 16 de junho de 2026
**Status:** Ready for planning
**Source:** PRD Express Path (mobile-task.md)

<domain>
## Phase Boundary

Esta fase foca na transformação da Home do estágio de protótipo mockado para uma aplicação de produção real. O objetivo central é implementar a conexão com a API GraphQL (Apollo) para carregar Categorias, Banners, Empresas em Destaque e Produtos, eliminando todos os dados hardcoded.

</domain>

<decisions>
## Implementation Decisions

### Data Infrastructure
- **Apollo Client:** Toda a busca de dados da Home deve ser migrada de mocks locais para queries GraphQL.
- **Single Source of Truth:** O backend Rails é a única fonte da verdade para ativos (banners, logos, ícones).

### Home Features (P0.4)
- **Banners Reais:** Implementar carrossel de banners dinâmico vindo da API. Remover `mockBanners`.
- **Categorias Reais:** Listar categorias reais com nomes, slugs e ícones oficiais.
- **Empresas em Destaque:** Exibir cards de empresas reais (logo, nota, verificação).
- **Produtos em Destaque:** Carregar lista de produtos reais com imagens do storage.
- **Blog/Posts:** Integrar feed de posts reais do blog.

### Mock Removal (P0.1)
- **Auditoria:** Mapear e remover sistematicamente `mockBanners`, `bannersMock`, `fakeBanners`, `categoryIcons` hardcoded.
- **Fallbacks:** Implementar fallbacks neutros para logos ausentes (iniciais com fundo neutro) e imagens de produtos indisponíveis.

### User Experience
- **Skeletons:** Adicionar estados de carregamento (Skeleton Loaders) consistentes para todos os blocos dinâmicos.
- **Error States:** Implementar estados de erro com botão de 'Retry'.

### the agent's Discretion
- Estrutura exata das queries GraphQL (Fragments para reutilização).
- Configuração do cache do Apollo para melhorar a performance de navegação.
- Detalhes de animação na transição entre Skeletons e Conteúdo Real.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Visão geral e stack.
- `.planning/codebase/ARCHITECTURE.md` — Estrutura Expo Router.
- `.planning/codebase/STACK.md` — Versões de bibliotecas.

### Backend Contract
- `AB0-1-back/app/graphql/types/query_type.rb` — Queries disponíveis (companies, banners, categories, articles).

### UI/UX
- `mobile-task.md` Section 8 — Design System e Identidade Visual (Cores e Tipografia).

</canonical_refs>

<specifics>
## Specific Ideas
- Usar `Expo Image` para carregamento otimizado de logos e banners.
- Implementar Pull-to-Refresh na Home para revalidar o cache do Apollo.

</specifics>

<deferred>
## Deferred Ideas
- Autenticação Real (Fase 2).
- Dashboard da Empresa (Fase 2+).
- Scanner/OCR real (Fase 2+).

</deferred>

---

*Phase: 01-funda-o-e-integra-o-da-home-p0*
*Context gathered: 16 de junho de 2026 via PRD Express Path*
