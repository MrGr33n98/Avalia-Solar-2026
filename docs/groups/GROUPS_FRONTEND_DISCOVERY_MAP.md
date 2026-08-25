# Mapa de descoberta frontend de Groups

**Data:** 2026-08-25

## Contrato existente

- API base: `/api/v1/groups`.
- Listagem: `GET /groups`, com `search`, `category`, `featured` e `view`.
- Detalhe: `GET /groups/:slug`.
- Membership: `GET /groups/:slug/membership`, `POST|DELETE /groups/:slug/join`.
- Membros: `GET /groups/:slug/members`.
- Tópicos: `GET /groups/:slug/topics`.
- Regras: `GET /groups/:slug/rules`.
- Envelopes: `{ data: ... }`; erros seguem `{ code, message, details? }`.

## Serializers reais

- `GroupCompactSerializer`: identidade, visibilidade, flags, `stats.members/posts`, membership e permissions.
- `GroupSerializer`: adiciona descrição, modos, status, `category_id` e timestamps.
- `GroupMembershipSerializer`: status, role, notificações e timestamps.
- `GroupMemberSerializer`: usuário com `id`, `name` e `avatar_url`, role e data de entrada.
- `GroupTopicSerializer`: nome, slug, descrição, posição e posts.
- `GroupRuleSerializer`: título, descrição e posição.

## Integração frontend

- Cliente centralizado em `AB0-1-front/lib/api/groups.ts`.
- Tipos em `AB0-1-front/types/groups.ts`, sem campos além dos serializers.
- React Query já é global via `lib/QueryProvider.tsx`; mutations invalidam detalhe, membership e discovery.
- `Navbar`, `MobileBottomNav` e `AppContentFrame` já são globais; nenhuma navegação duplicada será criada.
- Feature flag frontend usa `NEXT_PUBLIC_GROUPS_ENABLED`; página retorna `notFound()` quando não está explicitamente em `true`.

## Decisões de escopo

- Sem feed, posts, comentários, criação ou moderação frontend.
- Categoria nominal não é exibida: backend retorna apenas `category_id`.
- Grupo privado continua protegido pelo backend; respostas `404` são apresentadas sem revelar existência.
- SSR encaminha somente cookie da requisição atual, com `cache: 'no-store'`, preservando membership sem vazar headers internos.