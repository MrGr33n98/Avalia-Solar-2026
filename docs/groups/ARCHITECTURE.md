# Arquitetura de Groups

## Estado atual

Groups ainda não está habilitado. O inventário da Social Core está em `GROUPS_EXISTING_ARCHITECTURE_AUDIT.md`.

## Arquitetura alvo incremental

```text
Group
├── GroupMembership
├── GroupPost
├── GroupTopic
├── GroupRule
└── GroupReport
```

`Group` é aggregate root. Forum é experiência de discussão, não entidade raiz.

### Limites

- `ReviewerPublication` continua no domínio Creator.
- `GroupPost` é conteúdo de grupo e não altera o contrato existente de Creator.
- `Comment`, `Reaction` e `SavedItem` permanecem recursos polimórficos compartilhados, com whitelists e policies explícitas.
- `Membership` não é `SocialFollow`.
- `FeedItem` só representa conteúdo de grupo após filtragem de visibilidade e membership.

## Sequência de release

1. Migration expand sem alteração destrutiva.
2. Models e policies publicados com `GROUPS_ENABLED=false`.
3. Schema contract e smoke specs aprovados.
4. API de leitura pública e membership habilitada gradualmente.
5. Posts/moderação publicados depois de testes de autorização e rate limit.
6. Feed, ActiveAdmin, frontend e PWA habilitados separadamente.

## Segurança

- Policy scope deve filtrar grupo privado antes de carregar dados.
- Slug recebido nunca substitui autorização.
- Serializers não retornam ActiveRecord cru.
- Body, attachments e reports passam por validação/sanitização.
- Events carregam IDs e estado mínimo, sem PII desnecessária.

## Performance

- Discovery usa PostgreSQL inicialmente.
- Timeline usa cursor `(published_at, id)`.
- Queries usam `includes/preload` conforme medição.
- Contadores são cacheados somente quando necessários.
- Feed global não recebe todos os posts de grupo automaticamente.