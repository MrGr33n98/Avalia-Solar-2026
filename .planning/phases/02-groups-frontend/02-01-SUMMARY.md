---
phase: 02-groups-frontend
plan: 01
subsystem: frontend
tags: [groups, nextjs, react-query, membership, pwa]
requires: [backend-groups-api]
provides: [groups-discovery, group-detail, membership-ux, groups-api-client]
affects: [frontend-navigation, feature-flags]
tech-stack:
  added: []
  patterns: [centralized-api-client, react-query-mutations, parallel-detail-fetching]
key-files:
  created:
    - AB0-1-front/app/groups/page.tsx
    - AB0-1-front/app/groups/[slug]/page.tsx
    - AB0-1-front/components/groups/GroupsDiscovery.tsx
    - AB0-1-front/components/groups/GroupMembershipButton.tsx
    - AB0-1-front/lib/api/groups.ts
    - AB0-1-front/types/groups.ts
    - docs/groups/GROUPS_FRONTEND_DISCOVERY_MAP.md
  modified:
    - AB0-1-front/lib/feature-flags/index.ts
    - .gitignore
decisions:
  - "Usar apenas payloads existentes de Group, membership, members, topics e rules; category_id não é renderizado como nome porque API não fornece nome."
  - "Não alterar MobileBottomNav ou criar navegação paralela; rotas usam shell global existente."
  - "Feature flag pública desligada retorna notFound para evitar shell incompleto."
metrics:
  duration: "~35 min"
  completed: 2026-08-25
  tasks: 1
  files: 17
---

# Phase 2 Plan 1: Groups frontend discovery and detail Summary

Experiência frontend de comunidades com discovery responsivo, detalhe, tópicos, regras, membros e ciclo de membership integrado à API Rails existente.

## Delivered

- Rota `/groups` com busca, filtros, cards, empty state, error state e skeletons.
- Rota `/groups/[slug]` com hero, navegação interna, tópicos, regras, membros e sidebar desktop.
- Cliente único em `lib/api/groups.ts` para todos endpoints de Groups, com erros HTTP padronizados e proteção de 401/404.
- Tipos derivados dos serializers reais do backend.
- Join/leave com `useMutation`, estados `pending`/`active`, login redirect e invalidação de queries.
- Registro da feature flag `GROUPS`; MobileBottomNav permaneceu intacto.
- Mini mapa de auditoria em `docs/groups/GROUPS_FRONTEND_DISCOVERY_MAP.md`.

## Quality Closeout

- Feature flag alinhada em fail-closed: `NEXT_PUBLIC_GROUPS_ENABLED === 'true'`; `.env.example` mantém `false`.
- SSR detail e metadata encaminham somente cookie atual ao backend; requests Groups usam `cache: 'no-store'`.
- `npm run build` — passou. Warnings permanecem fora do escopo: DNS indisponível durante warm cache e warning de dependência Prisma/OpenTelemetry.
- Validação manual desktop/mobile ainda pendente neste ambiente.

## Verification

- `npx eslint app/groups components/groups lib/api/groups.ts types/groups.ts lib/feature-flags/index.ts` — passou.
- `npm run typecheck` — passou.
- Teste Jest representativo `components/categories/DecisionChips.test.tsx` — passou: 2 testes.
- `npm run lint` global — falha por problemas preexistentes fora de Groups; não corrigidos fora do escopo.
- `npm run build` — passou; warm cache registrou falhas de DNS externas tratadas pelo fallback existente.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrigida interpretação de 404 em membership**

- **Encontrado durante:** implementação do cliente API.
- **Problema:** 404 de membership poderia mascarar erro de grupo privado e contradizer proteção de existência.
- **Correção:** somente 401 vira ausência de membership; 404 permanece erro.
- **Commit:** `1a5c5513`.

**2. [Rule 3 - Performance] Removida consulta duplicada de membership por card**

- **Encontrado durante:** revisão de requests da discovery.
- **Problema:** cards poderiam disparar uma consulta individual de membership, criando N+1 no frontend.
- **Correção:** card usa membership já serializada; estado local atualiza após mutation e queries são invalidadas.
- **Commit:** `359e9c35`.

## Known Stubs

- `GroupsDiscovery.tsx`: `placeholder` no input é texto nativo de acessibilidade/UX, não conteúdo de dados.
- Inicial de nome e `Descrição não informada.` são fallbacks visuais seguros quando API retorna dados opcionais ausentes; não representam conteúdo fake.

## Self-Check: PASSED

- Rotas, componentes, cliente, tipos e mapa existem.
- Commits verificados: `0af74526`, `1a5c5513`, `359e9c35`, `de2af8db`, `83948b71`.
- Árvore Git limpa após commits.

## PENDENTE

- Test coverage
- E2E
- Staging smoke
- Validação visual desktop/mobile