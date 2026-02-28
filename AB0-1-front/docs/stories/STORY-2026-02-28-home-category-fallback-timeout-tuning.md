# STORY-2026-02-28: Reduzir falso fallback de categorias na home e normalizar imagens

## Contexto
Após o backend voltar a subir corretamente, a home pública continuou exibindo o aviso de contingência nas categorias e repetindo a imagem placeholder. Os logs mostraram o endpoint `/api/v1/categories` respondendo perto de 5 segundos em produção, enquanto a camada `home-fallback-cache` abortava as tentativas nesse mesmo limite, empurrando a home para as categorias estáticas.

## Requisito
Evitar que a home entre em contingência desnecessariamente quando a API de categorias ainda responde, apenas um pouco mais lenta. Também garantir que o card da landing normalize URLs relativas/absolutas de banner antes de cair no placeholder.

## Acceptance Criteria
- [x] A home tolera respostas mais lentas da API de categorias antes de cair para fallback estático.
- [x] O timeout da camada de fallback pode ser ajustado por variável de ambiente sem novo patch.
- [x] O card de categoria da landing resolve `banner_url`/`logo.url` com `getFullImageUrl` antes de usar placeholder local.

## Checklist de Implementação
- [x] Aumentar o timeout default do `home-fallback-cache`.
- [x] Permitir override por `HOME_FALLBACK_API_TIMEOUT_MS`.
- [x] Normalizar a imagem da `LandingCategoryCard`.
- [x] Rodar lint do frontend.
- [x] Rodar teste relevante ou documentar bloqueio.

## File List
- [x] `lib/server/home-fallback-cache.ts`
- [x] `components/landing/LandingCategoryCard.tsx`
- [x] `docs/stories/STORY-2026-02-28-home-category-fallback-timeout-tuning.md`

## Validation
- [x] `npm run lint` (passou com warnings preexistentes fora deste ajuste)
- [x] `npm test -- LandingCategoryChips LandingHeroSearch`
