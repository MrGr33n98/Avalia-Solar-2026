# PDR — Remediação de Performance do Frontend
**Projeto:** Avalia Solar 2026 · **Data:** 2026-11-19 · **Escopo:** `AB0-1-front/`

## Outcome
Resultado útil acima da dobra e páginas públicas com primeiro estado renderizado via servidor. Filtros, navegação e troca de abas sem travamento; scripts secundários somente sob demanda.

## Abrangência
`/search`, `/companies`, `/products`, `/companies/[id]`. Server Components carregam conteúdo crítico; Client Components controlam interações, favoritos, filtros, paginação e analytics de intenção. React.cache por request; cache/revalidate/tags compatíveis com a API pública.

## Não objetivos
Sem redesenho, substituição de query libraries, alteração de regras comerciais, remoção de analytics ou reescrita de backend sem evidência.

## Guardrails
Preservar SEO, canonicalização, JSON-LD, Pundit, gates de CTA e domínio multi-tenant. Não inventar métricas; medir baseline e comparar por rota, dispositivo, ambiente e commit. Validar estado offline/mobile/error.

## Rollout
1. Medição e contrato de observabilidade.
2. Catálogo de empresas piloto.
3. Busca e produtos server-first.
4. Company hero progressivo, conteúdo secundário em Suspense/dynamic.
5. Transições, abort e prefetch.
6. Budget checks e lançamento gradual com rollback por rota.

## Critérios de sucesso
LCP p75 ≤2.5s · INP p75 ≤200ms · TTFB p75 ≤600ms · CLS ≤0.1 · FCP lab ≤2.0s · TBT lab ≤500ms · Lighthouse performance ≥0.8 · scripts Lighthouse ≤450000B. Evidências só após execuções reais.
