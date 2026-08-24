# ADR: modelo de post para Groups

- **Status:** aceito para planejamento
- **Data:** 2026-08-24
- **Escopo:** primeira implementação de Groups

## Contexto

`ReviewerPublication` é parte do domínio Creator. Possui validações específicas (`publication_type`, slug por usuário, status próprio), attachments e callback de invalidação de cache Creator. `Post` e `ForumQuestion` são modelos legados e não integram o Social Core. O feed atual usa `FeedItem` com `subject` polimórfico, enquanto comments, reactions e saves já usam polimorfismo.

Alterar `ReviewerPublication` para representar posts de grupo misturaria dois domínios e aumentaria risco de regressão, vazamento de visibilidade e incompatibilidade com o feed atual.

## Decisão

Groups terá `GroupPost` como entidade própria de conteúdo na primeira fase. `GroupPost` pertencerá a `Group` e `User`, terá status/moderação, tipo e timestamps próprios. O vínculo com `FeedItem` será criado apenas para posts publicados em grupos públicos ou visíveis ao membro autorizado, com `subject_type = GroupPost` e `visibility` coerente.

Comments, reactions e saved items continuarão compartilhados por meio dos respectivos polymorphic associations, após whitelists e policies aceitarem `GroupPost`. Membership continuará distinta de follow.

## Alternativas avaliadas

### Reutilizar `ReviewerPublication`

Rejeitada para primeira fase. Reduz tabelas, mas mantém semântica Creator, exige ampliar tipos/status e pode quebrar callbacks, slugs, métricas e telas existentes.

### Estender `ReviewerPublication` com `context_type/context_id`

Adiada. Pode ser uma evolução futura se o conteúdo se tornar realmente unificado, mas exige migração expand/contract, revisão de todas as queries e garantia de que cada publicação existente permaneça com contexto Creator válido.

### Reutilizar `Post` ou `ForumQuestion`

Rejeitada. São modelos legados, têm contratos diferentes e não participam do Feed::Query/Serializer nem das associações sociais polimórficas atuais.

### Criar `SocialPost` genérico

Adiada. É uma opção válida para convergência futura, mas criaria uma abstração ampla antes de haver segundo caso de uso estável além de Groups.

## Estratégia de migração e zero downtime

1. Criar tabelas `groups`, memberships e `group_posts` sem alterar tabelas existentes.
2. Publicar models, policies, serializers e endpoints atrás de `GROUPS_ENABLED=false`.
3. Adicionar suporte polimórfico a `GroupPost` em comments/reactions/saves somente com testes de autorização e sem modificar dados existentes.
4. Criar `FeedItem` de grupo apenas no momento da publicação, dentro de transação ou outbox segura.
5. Liberar leitura de Groups para grupos públicos depois de schema contract e smoke tests.
6. Habilitar criação e integração ao feed progressivamente.
7. Qualquer futura unificação com `ReviewerPublication` deve usar expand/contract, backfill verificável e release separada para remoção de código antigo.

## Invariantes de segurança

- Group privado nunca entra em candidate público.
- `GroupPost` só é serializado quando viewer tem autorização para o Group.
- O frontend recebe capabilities do backend; não recalcula policy.
- Payload de DomainEvent não inclui body, email, token ou PII desnecessária.
- Nenhuma migration ou menu ActiveAdmin será habilitado antes de schema verification.
