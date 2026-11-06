# ADR-001: Política de Indexabilidade de Categorias e Tratamento de Inventário Vazio

- **Status:** Aceito
- **Data:** 2026-11-06
- **Contexto:** Category Discovery & Search Infrastructure (`CDSI-021`..`CDSI-030`)

## Contexto e Problema

No Avalia Solar, páginas de categoria (`/categories/[slug]`) podem encontrar-se em quatro estados distintos:

1. **Categoria inexistente ou removida** (slug nunca existiu ou não possui redirecionamento histórico).
2. **Categoria inativa operacionalmente** (`status = 'inactive'`).
3. **Categoria ativa com empresas ou conteúdo editorial substancial** (`status = 'active'`, `companies_count > 0` ou texto editorial/FAQs/tipos de solução publicados).
4. **Categoria ativa, porém temporariamente sem empresas e sem conteúdo editorial substancial** (`status = 'active'`, `companies_count == 0`, descrição curta repetindo apenas o nome).

Anteriormente:
- A ausência da categoria no frontend retornava um componente `<CategoryErrorState>` com **HTTP 200 (Soft 404)**.
- O backend em `GET /api/v1/categories/by_slug/:slug` retornava categorias `inactive` com **HTTP 200**.
- Não havia distinção formal entre **acessibilidade HTTP (`200` vs `404`)** e **indexabilidade para motores de busca (`index,follow` vs `noindex,follow`)**.

## Decisão

Centralizamos a decisão no Value Object imutável [`CategoryDiscovery::IndexabilityDecision`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/app/domain/category_discovery/indexability_decision.rb) e na política de domínio [`CategoryDiscovery::IndexabilityPolicy`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/app/domain/category_discovery/indexability_policy.rb):

1. **Categoria Inexistente, Slug Inválido ou `status != 'active'`:**
   - `publicly_accessible: false`
   - `indexable: false`, `include_in_sitemap: false`, `robots_directive: 'noindex,nofollow'`
   - Rota SSR responde **HTTP 404** (`notFound()`).

2. **Categoria Ativa sem Empresas (`companies_count == 0`):**
   - **Nunca retorna HTTP 404** se `status == 'active'` (`publicly_accessible: true`), pois a taxonomia existe e usuários humanos podem navegar por subcategorias, conteúdos ou solicitar orçamento.
   - **Modo `:shadow` (padrão seguro — `CATEGORY_INDEXABILITY_GATE_ENFORCED=false`):**
     - Permanece `indexable: true` e `include_in_sitemap: true` (`reason_codes: [:legacy_active_fallback]`), emitindo `advisory_warnings` (`:thin_editorial_copy`, `:empty_without_editorial_utility`) para auditoria sem desindexar páginas legadas em massa.
   - **Modo `:enforced` (`CATEGORY_INDEXABILITY_GATE_ENFORCED=true`, ativado apenas após revisão editorial):**
     - Se a categoria não tiver empresas **nem** utilidade editorial substancial (descrição ≥ 70 caracteres distinta do nome, FAQs publicadas ou tipos de solução ativos), recebe `publicly_accessible: true` (HTTP 200), mas `indexable: false`, `include_in_sitemap: false` e `robots_directive: 'noindex,follow'`.

## Consequências

- Elimina Soft 404 para slugs inexistentes/inativos sem quebrar URLs legadas ativas.
- Evita desindexação acidental em massa durante a transição do catálogo editorial.
- Fornece contrato único (`category.indexability`) consumido tanto pelo SSR Next.js (`generateMetadata`) quanto pelo exportador de Sitemap e painel administrativo.

