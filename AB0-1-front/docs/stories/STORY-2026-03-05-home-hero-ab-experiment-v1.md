# STORY-2026-03-05: Home Hero A/B (Fase 1 + Tracking)

## Contexto
A landing da home tinha excesso de mensagens no hero e múltiplos CTAs competindo no topo da página.  
O objetivo desta story foi implementar uma versão experimental do hero com foco em clareza, conversão e medição por variante.

## Requisito
Entregar Fase 1 da otimização: hierarquia visual mais clara, CTA primário único no hero, trust signals em destaque com claims comprováveis e rollout com experimento A/B 50/50 persistido por cookie.

## Acceptance Criteria
- [x] Existe experimento de hero com variantes `control` e `variant`.
- [x] O bucket é persistido por cookie (`as_exp_home_hero_v1`) por 30 dias.
- [x] Com flag desligada, o hero força `control`.
- [x] O hero `variant` usa CTA primário único para abrir quote wizard.
- [x] O hero `variant` remove CTA comercial concorrente da coluna direita.
- [x] Trust signals no hero `variant` usam dados comprováveis (contagem ativa/verificada) com fallback textual.
- [x] Eventos de analytics incluem `hero_variant` e `experiment_id`.
- [x] Testes unitários/componente para experimento + hero + search foram adicionados.

## Checklist de Implementação
- [x] Criar util de experimento em `lib/experiments/homeHeroExperiment.ts`.
- [x] Atualizar `middleware.ts` para setar cookie da variante na `/`.
- [x] Atualizar `app/page.tsx` para ler variante e repassar ao hero.
- [x] Reestruturar `LandingHero` com `control` vs `variant`.
- [x] Ajustar `LandingHeroSearch` para tracking com metadados da variante.
- [x] Adicionar helper de contagem em `companiesApiSafe`.
- [x] Cobrir com testes (experimento, middleware helper, hero e search).
- [x] Atualizar file list e validações da story.

## File List
- [x] `app/page.tsx`
- [x] `components/landing/LandingHero.tsx`
- [x] `components/landing/LandingHeroSearch.tsx`
- [x] `components/landing/__tests__/LandingHeroSearch.test.tsx`
- [x] `components/landing/__tests__/LandingHero.test.tsx`
- [x] `lib/experiments/homeHeroExperiment.ts`
- [x] `lib/experiments/__tests__/homeHeroExperiment.test.ts`
- [x] `lib/api-client.ts`
- [x] `lib/server/home-fallback-cache.ts`
- [x] `middleware.ts`
- [x] `__tests__/middleware.home-hero-experiment.test.ts`
- [x] `docs/stories/STORY-2026-03-05-home-hero-ab-experiment-v1.md`

## Validation
- [ ] `npm run lint`  
  Bloqueado por erros preexistentes fora deste escopo (`react/no-unescaped-entities` em `EditorialReviewCard.tsx`, `LegacyReviewCard.tsx`, `ReviewCard.tsx`) + warnings históricos de hooks e `no-img-element`.
- [ ] `node --max-old-space-size=4096 .\node_modules\typescript\bin\tsc --noEmit`  
  Bloqueado por erros preexistentes fora desta story (`AdvancedAnalytics.tsx`, `OverviewTab.tsx`, `DynamicLeadWizardModal.tsx`, `WizardRenderer.tsx`).
- [ ] `npm test`  
  Bloqueado por falhas preexistentes em suites não relacionadas (`AuthContextSync`, `analytics`, `Navbar`, OOM em `CompanyCardCarousel`).
- [x] `npm test -- LandingHeroSearch LandingHero homeHeroExperiment middleware.home-hero-experiment`

## Notas de Produto
- A variante foi desenhada para manter escopo solar + mobilidade, com uma única ação primária no hero.
- Claims numéricos são derivados de contagem paginada de empresas (`meta.pagination.total`); se indisponíveis, o hero usa fallback textual sem promessas numéricas.
- O CTA de conversão abaixo da dobra não foi alterado nesta fase (fora de escopo).

