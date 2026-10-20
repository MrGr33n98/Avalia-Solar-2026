# Registro de Alterações (Changelog) e Plano de Rollback

**Branch de Trabalho:** `feature/related-companies-geo-protection`  
**Base:** `main` (SHA `d2c5409560103dc7bd0ab26bc661cc1107baa7ee`)  
**Estratégia de Deploy:** Não aplicável (ambiente local de desenvolvimento e testes controlados)  

---

## 1. Inventário Detalhado dos Arquivos Modificados

### Backend (`AB0-1-back/`)
1. [`app/controllers/api/v1/recommendations_controller.rb`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/app/controllers/api/v1/recommendations_controller.rb)
   - Permite parâmetros `:category_id`, `:exclude_company_id`, `:context_company_id`.
   - Adiciona cabeçalho `Cache-Control: public, max-age=120, stale-while-revalidate=300`.
2. [`app/services/recommendation/context.rb`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/app/services/recommendation/context.rb)
   - Adiciona atributos `category_id`, `exclude_company_id`, `context_company_id` à struct de contexto.
3. [`app/services/recommendation/context_builder.rb`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/app/services/recommendation/context_builder.rb)
   - Resolve context_company a partir do ID da empresa visitada, derivando categoria, segmento e local de sede como fallback natural.
4. [`app/services/recommendation/eligibility_query.rb`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/app/services/recommendation/eligibility_query.rb)
   - Adiciona cláusula `.where.not(id: context.exclude_company_id)` e filtragem por `category_id`.
5. [`app/services/recommendation/placement_resolver.rb`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/app/services/recommendation/placement_resolver.rb)
   - Se `context_company` possuir plano pago (`has_paid_plan?`), zera anúncios de concorrentes (`sponsored: [], pinned: []`).
6. [`app/serializers/recommendation_serializer.rb`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/app/serializers/recommendation_serializer.rb)
   - Expõe `rating_avg`, `rating_count`, `city`, `state`, SLA e projetos entregues para cards enriquecidos.
7. [`app/controllers/api/v1/banners_controller.rb`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/app/controllers/api/v1/banners_controller.rb)
   - Permite parâmetros `:block_competitors`, `:profile_company_id`, `:context_company_id` e inclui no hash determinístico do Redis.
8. [`app/services/banners/banner_delivery_query.rb`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/app/services/banners/banner_delivery_query.rb)
   - Aplica `apply_competitor_protection`, garantindo no banco que perfis protegidos nunca recebam anúncios de outras empresas.
9. [`spec/services/banners/banner_delivery_query_spec.rb`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/spec/services/banners/banner_delivery_query_spec.rb)
   - Especificações RSpec testando isolamento de campanhas concorrentes vs. institucionais.

### Frontend (`AB0-1-front/`)
1. [`app/companies/[id]/components/RelatedCompaniesCarousel.tsx`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-front/app/companies/[id]/components/RelatedCompaniesCarousel.tsx)
   - Discrimina modos visuais (`protected`, `hidden`, `loading`, `results`, `empty`, `error`).
   - Remove `<CompanyVerifiedBadge />` do card comercial de proteção.
   - Adiciona Skeleton, Card de Erro com Retry e Empty State honesto. Suporte a WCAG 2.1 (reduced-motion, focus/touch pause).
2. [`app/companies/[id]/components/RelatedCompaniesCarousel.spec.tsx`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-front/app/companies/[id]/components/RelatedCompaniesCarousel.spec.tsx)
   - 7 testes unitários exaustivos cobrindo 100% da matriz de proteção e estados.
3. [`app/companies/[id]/components/OverviewTab.tsx`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-front/app/companies/[id]/components/OverviewTab.tsx)
   - Integra com `publicCompaniesApi.getRecommendations`, `useLocation()` e `AbortController`.
4. [`lib/api-public.ts`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-front/lib/api-public.ts)
   - Expande `RecommendationItem` e parâmetros de `getRecommendations`.
5. [`components/banners/BannerSlot.tsx`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-front/components/banners/BannerSlot.tsx)
   - Encaminha `profile_company_id` e `block_competitors` para o hook de consulta.
6. [`hooks/useBannersQuery.ts`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-front/hooks/useBannersQuery.ts)
   - Serializa `profile_company_id` e `block_competitors` na query string da API.

---

## 2. Procedimento de Rollback

Como todas as alterações foram executadas em uma branch de feature dedicada (`feature/related-companies-geo-protection`) sem migrações irreversíveis no banco de dados e sem push para branches protegidas:

1. **Rollback Imediato via Git:**
   ```bash
   git checkout main
   # Todas as alterações permanecem isoladas na branch da feature
   ```

2. **Rollback Parcial por Módulo (se necessário):**
   - **Reverter apenas Governança de Banners:**
     ```bash
     git checkout main -- AB0-1-back/app/services/banners/banner_delivery_query.rb AB0-1-front/components/banners/BannerSlot.tsx
     ```
   - **Reverter apenas Integração com Recomendações:**
     ```bash
     git checkout main -- AB0-1-front/app/companies/[id]/components/OverviewTab.tsx
     ```
