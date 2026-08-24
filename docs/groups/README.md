# Groups / Comunidades

Módulo de comunidades profissionais do Avalia Solar.

## Estado

A arquitetura foi auditada em `GROUPS_EXISTING_ARCHITECTURE_AUDIT.md`. O domínio ainda não está habilitado nem possui tabelas Groups. Implementação deve seguir fases pequenas, com feature flag fechada por padrão e schema contract antes de tráfego.

## Ordem obrigatória

1. ADR do post model.
2. Schema mínimo: `groups` e `group_memberships`.
3. Models e validações.
4. Policies e scopes.
5. Services de membership/discovery.
6. API de discovery/show/join/leave.
7. Serializers e request specs.
8. Posts/topics/rules somente após decisão e testes.
9. ActiveAdmin após schema verification.
10. Frontend, PWA, feed, analytics, notifications e E2E progressivamente.

## Guardrails

- Não criar `/forum` paralelo.
- Não reutilizar `ReviewerPublication` sem nova decisão arquitetural.
- Não expor grupos privados em feed, cache, metadata ou serializers públicos.
- Não retornar ActiveRecord cru.
- Não adicionar menu ActiveAdmin antes de migrations e smoke specs.
- Não criar seed de grupos em produção.
- Não habilitar `GROUPS_ENABLED` sem validação em staging.

## Documentos

- `GROUPS_EXISTING_ARCHITECTURE_AUDIT.md` — inventário e lacunas.
- `../adr/ADR_GROUP_POST_MODEL.md` — decisão de modelo de posts.
- `API_CONTRACT.md` — contrato a ser preenchido antes da API.
- `AUTHORIZATION_MATRIX.md` — matriz de autorização.
- `MODERATION.md` — regras de moderação.
- `FRONTEND_ARCHITECTURE.md` — arquitetura frontend.
- `PWA.md` — integração PWA.
