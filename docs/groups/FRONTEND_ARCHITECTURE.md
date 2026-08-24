# Groups Frontend Architecture

Status: planejamento; rota `/groups` ainda não existe.

## Princípios

- Reutilizar shell e primitives do feed antes de criar markup novo.
- Criar `types/groups.ts` e `lib/api/groups.ts` como contratos únicos.
- SSR somente para identidade e metadata de grupo público; membership e timeline são user-specific.
- Client pagination usa cursor; evitar fetch duplicado e waterfalls.
- Errors locais em `error.tsx`; loading preserva geometria e evita CLS.
- Backend fornece `permissions`/capabilities; React não recalcula autorização.
- Sem dados mockados, contadores inventados ou placeholders apresentados como dados reais.

## Estrutura planejada

- `app/groups/page.tsx`
- `app/groups/[slug]/page.tsx`
- `components/groups/layout`
- `components/groups/discovery`
- `components/groups/detail`
- `components/groups/feed`
- `components/groups/members`
- `types/groups.ts`
- `lib/api/groups.ts`

## Responsividade

Desktop usa três colunas progressivas; rails desaparecem em larguras menores. Mobile/PWA mantém bottom navigation existente, safe-area e `100dvh`; não criar 7–8 itens na navegação.
