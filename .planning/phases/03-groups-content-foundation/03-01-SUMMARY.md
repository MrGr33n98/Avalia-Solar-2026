---
phase: 03-groups-content-foundation
plan: 01
subsystem: groups
tags: [groups, grouppost, feed, moderation, rails, nextjs]
requires: [groups-frontend-discovery, groups-backend-foundation]
provides: [group-post-model, group-post-api, group-post-feed, group-post-policy]
affects: [group-detail, group-topics]
tech-stack:
  added: []
  patterns: [pundit-scoped-visibility, paginated-api, domain-events]
key-files:
  created:
    - AB0-1-back/db/migrate/20260825130000_create_group_posts.rb
    - AB0-1-back/app/models/group_post.rb
    - AB0-1-back/app/policies/group_post_policy.rb
    - AB0-1-back/app/controllers/api/v1/groups/posts_controller.rb
    - AB0-1-back/app/serializers/group_post_serializer.rb
    - AB0-1-front/components/groups/GroupFeed.tsx
    - AB0-1-front/components/groups/GroupPostCard.tsx
    - AB0-1-front/components/groups/GroupPostComposer.tsx
  modified:
    - AB0-1-back/app/models/group.rb
    - AB0-1-back/app/models/group_topic.rb
    - AB0-1-back/app/models/user.rb
    - AB0-1-back/app/policies/group_policy.rb
    - AB0-1-back/app/serializers/group_compact_serializer.rb
    - AB0-1-back/config/routes.rb
    - AB0-1-front/app/groups/[slug]/page.tsx
    - AB0-1-front/lib/api/groups.ts
    - AB0-1-front/types/groups.ts
    - docs/groups/API_CONTRACT.md
decisions:
  - "GroupPost usa status published/hidden/removed; comments e reactions ficam fora do escopo."
  - "Listagem usa Pundit Scope e paginação page/per_page; ordem padrão pinned, created_at desc, id desc."
  - "Criação incrementa posts_count e publica DomainEvent em mesma transação."
metrics:
  duration: "~45 min"
  completed: 2026-08-25
  tasks: 1
  files: 20
---

# Phase 3/4 Plan 1: GroupPost and feed foundation Summary

Fundação de conteúdo Groups entregue com posts vinculados a grupo, autor e tópico, feed paginado, composer simples, lifecycle inicial e endpoints explícitos de moderação.

## Delivered

- `GroupPost` com migration, constraints, índices e validação de tópico ativo pertencente ao grupo.
- Associações `Group`, `User` e `GroupTopic`.
- `GroupPostPolicy` com scope privado, author/member checks e moderation capabilities.
- API nested para list, detail, create, update, soft delete, hide/restore, pin/unpin e abrir/fechar comentários.
- Serializer limitado ao contrato público solicitado.
- `DomainEvent` para criação, atualização, hide, restore, pin e unpin; sem body integral.
- Feed frontend em `/groups/[slug]`, composer sem upload/rich text, cards, skeleton e empty/error states.
- Cliente centralizado atualizado com leitura e criação de posts.

## Verification

- ESLint direcionado frontend — passou.
- `npm run typecheck` — passou antes do último ajuste backend.
- `npm run build` — build anterior passou; execução posterior foi interrompida/afetada por ambiente durante geração e DNS externo, sem erro de compilação Groups registrado.
- Ruby/RSpec/boot Rails — não executável localmente: `ruby`/`bundle` ausentes e Docker sem permissão para `/var/run/docker.sock`.
- Nenhum teste novo criado, conforme escopo da task.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Security] Protegido detalhe e scope contra posts ocultos**

- **Encontrado durante:** revisão de autorização backend.
- **Problema:** scope público poderia permitir acesso indevido a status não publicado.
- **Correção:** `GroupPostPolicy::Scope` e `load_post` restringem viewer não moderador a `published`; scope `visible` também ficou publicada-only.
- **Commit:** `a18f476e`, `85bf5911`.

**2. [Rule 2 - Security] Autor não edita post após perder membership ativa**

- **Encontrado durante:** revisão de lifecycle leave.
- **Correção:** policy exige usuário ativo e membership ativa para autorização de autor.
- **Commit:** `a18f476e`.

## Known Stubs

- Não existem comentários/reactions nesta fase, conforme escopo explícito.
- Ações de moderação existem na API, mas não possuem UI frontend nesta task.
- Build local depende de backend/DNS para dados de outras páginas; warnings externos não são causados por Groups.

## Self-Check: PASSED

- Migration, model, policy, controller, serializer, routes, frontend feed e API client existem.
- Commits verificados: `72ab9f4b`, `bb7fb62b`, `a18f476e`, `85bf5911`.
- Working tree limpo antes da criação deste resumo.