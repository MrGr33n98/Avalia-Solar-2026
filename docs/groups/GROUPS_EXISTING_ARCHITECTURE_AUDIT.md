# Auditoria da arquitetura existente para Groups

**Data:** 2026-08-24  
**Fonte:** `docs/groups/group.md` + código atual do monorepo  
**Escopo:** discovery obrigatório antes de criar tabelas, endpoints ou UI de comunidades.

## 1. Conclusão executiva

O repositório já possui um Social Core parcialmente implementado, mas não possui domínio `Group`, membership, posts contextualizados, topics, rules ou moderation específica de grupos. A implementação deve ser incremental e protegida por feature flag.

**Decisão segura para a primeira fase:** não alterar `ReviewerPublication` de forma destrutiva e não reutilizar `Post`/`ForumQuestion` como aggregate. Criar `Group` como aggregate root e, após ADR, criar um post social contextualizado separado ou um vínculo não destrutivo. A escolha final de post exige uma fase própria porque `ReviewerPublication` tem regras e callbacks específicos de creator.

Não habilitar `/groups` nem menu ActiveAdmin antes de migrations, contrato de schema, policies e smoke tests passarem.

## 2. Backend existente

### 2.1 Models sociais

| Área | Implementação | Observação |
|---|---|---|
| Publicação | `ReviewerPublication` | Publicação pertence a `User`; tipos atuais `article`, `case_study`, `tip`, `project`; status `draft`, `published`, `archived`; attachments via ActiveStorage; evento de publicação. Acoplada ao creator. |
| Comentários | `Comment` | Polimórfico via `commentable`; suporta replies; status `active`, `hidden`, `deleted`; há também `ReviewerPublicationComment`, legado/específico. |
| Reações | `Reaction` | Polimórfico, uma reação por usuário/item; controller hoje aceita apenas `ReviewerPublication` e `Review`. |
| Salvamentos | `SavedItem` | Polimórfico; controller whitelist atual inclui publicação, review, company e product. |
| Seguir | `SocialFollow` | Polimórfico; controller whitelist atual inclui company, reviewer profile e category; group exigirá extensão explícita. |
| Feed | `FeedItem` | Actor e subject polimórficos; visibility permite `public`, `authenticated`, `followers`, `group`, `private`. |
| Eventos | `DomainEvent` | Aggregate type/id, payload JSONB, status e tentativas; não há catálogo/enforcement de nomes. |
| Conteúdo legado | `Post`, `ForumQuestion` | Domínios antigos, não são Social Core; não usar como base de Groups. |

### 2.2 Migrations sociais

As migrations sociais recentes ficam em `AB0-1-back/db/migrate/`:

- `20260819153000_create_feed_items.rb`: feed polimórfico, verb, visibility e published_at.
- `20260819153100_create_social_follows.rb`: follows polimórficos, unique por follower/followable.
- `20260819153200_create_reactions.rb`: reactions polimórficos, unique por usuário/item.
- `20260819153300_add_social_fields_to_comments.rb`: evolução idempotente/condicional da tabela `comments`, incluindo commentable, parent, body, status e timestamps de moderação.
- `20260819153400_create_saved_items.rb`: saved items polimórficos, unique por usuário/item.
- `20260819153500_create_publication_entities.rb`: entidades ligadas a `ReviewerPublication`.
- `20260819153600_create_domain_events.rb`: eventos de domínio com retry metadata.
- `20260819153000_create_feed_items.rb` usa `visibility = group` como valor possível, mas não há resolução de autorização de grupos.

### 2.3 Feed

- `Api::V1::FeedController#index` autoriza `:feed`, aceita `view`, `cursor` e `limit`, e retorna `{ data, meta: { next_cursor, has_more, trending_topics } }`.
- `Feed::Query` usa `Feed::CandidateBuilder`, `Feed::Ranker` e `Feed::Cursor`.
- `Feed::CandidateBuilder` atualmente considera apenas publicações e reviews; `following` filtra creators/companies.
- `Feed::Ranker` calcula score por reactions, comments e saves somente para `ReviewerPublication` e `Review`.
- `Feed::Serializer` serializa actor/subject e engagement, mas faz consultas de `Reaction`, `Comment` e `SavedItem` por subject; Groups não deve ser conectado diretamente sem uma etapa de otimização/N+1.
- A primeira integração segura é adicionar candidates de `FeedItem` com `visibility = group` somente após policy query garantir membership ativa e excluir grupos privados de candidates públicos.

### 2.4 API e autorização

- API usa `Api::V1::BaseController`, sem CSRF, Pundit, JWT/cookie e resposta de erro padronizada `{ code, message, details? }`.
- `BaseController` trata `RecordNotFound`, `RecordInvalid`, `ParameterMissing` e `Pundit::NotAuthorizedError`.
- `ApplicationPolicy` é admin-oriented por padrão. Policies de Groups precisarão ser específicas e incluir `Scope#resolve` para visibilidade.
- Policies existentes: `ReviewerPublicationPolicy`, `CommentPolicy`, `ReactionPolicy`, `SavedItemPolicy`; nenhuma policy cobre groups.
- `Paginatable` existe, mas timeline de Groups deve usar `Feed::Cursor` ou cursor dedicado; não introduzir offset.
- Rotas sociais ficam em `/api/v1`: `feed`, `follows`, `reactions`, `comments`, `saved_items`. A nova API deve ficar dentro de `namespace :api do namespace :v1`.

### 2.5 ActiveAdmin

- Há recursos para `ReviewerPublication`, `ReviewerPublicationComment`, `ReviewerProfile` e reviews.
- ActiveAdmin usa configurações diretamente nos arquivos `app/admin`; lógica sensível deve ser delegada a services.
- O incidente recente de schema drift em Creator Leads/Tree Blocks gerou contrato em `AB0-1-back/script/schema_contract_check.rb` e gate no deploy. Groups deve ser incluído no contrato somente quando suas migrations existirem.
- Menu/recursos Groups devem ficar atrás de confirmação de schema e smoke specs; não criar menu apontando para tabelas ausentes.

## 3. Frontend existente

### 3.1 Feed compartilhável

Arquivos relevantes:

- `components/feed/FeedShell.tsx`: shell principal.
- `FeedLeftRail.tsx`, `FeedRightRail.tsx`, `FeedTabs.tsx`: estrutura visual e navegação.
- `FeedComposer.tsx`, `FeedComposerDialog.tsx`: composer existente a avaliar para adaptação.
- `InfiniteFeed.tsx`: carregamento client-side e cursor.
- `PublicationFeedCard.tsx`, `ReviewFeedCard.tsx`, `FeedItemRenderer.tsx`: cards e dispatch de tipos.
- `lib/api/feed.ts`: fetch, reactions, saves, follows, comments.
- `types/feed.ts`: contrato de actor, subject, engagement, cursor e feed item.

Não duplicar markup antes de extrair primitives realmente compartilhadas. A primeira fase de Groups deve reaproveitar somente contratos estáveis, sem refatorar cards globais de forma arriscada.

### 3.2 Rota, loading e PWA

- Existe `app/feed/page.tsx` com metadata e `app/feed/loading.tsx`.
- Não existe rota `app/groups` no estado auditado.
- Existe `app/manifest.ts`; não há implementação frontend de Groups.
- Navegação mobile deve ser analisada em `AB0-1-mobile`, não presumida a partir do frontend web.
- Erros de Groups devem usar `error.tsx` local e nunca deixar tela branca.

### 3.3 Data fetching e tipos

- O cliente atual constrói URL por `buildApiUrl` e injeta headers com `getApiRequestHeaders`.
- Tipos são mantidos em `types/feed.ts`; Groups deve ter `types/groups.ts` para evitar shapes duplicados.
- Client de Groups deve centralizar list/show/join/leave/posts/members/topics/rules e tratar envelopes de erro da API.

## 4. Lacunas contra o PRD

Ainda ausentes:

1. Aggregate/model `Group`.
2. `GroupMembership`, status/role e unique group/user.
3. Modelo de post contextualizado para group.
4. Topics, rules, reports, invitations e audit log de moderação de Groups.
5. Policies e scopes de Groups.
6. Services `Groups::*`.
7. Endpoints `/api/v1/groups`.
8. Serializers de Groups.
9. Cursor query de posts por grupo.
10. Feature flag `GROUPS_ENABLED` com fail-closed.
11. ActiveAdmin de Groups.
12. Frontend web/PWA de Groups.
13. Analytics, notificações e integração segura ao feed.
14. Rswag/OpenAPI e testes específicos.

## 5. Riscos de compatibilidade

### Alto

- Alterar `ReviewerPublication` para permitir conteúdo de grupo pode quebrar validações, slugs por usuário, callbacks de creator e feed existente.
- Adicionar Group ao feed sem filtrar `visibility` pode vazar grupos privados.
- Reutilizar `Comment`, `Reaction` e `SavedItem` exige ampliar whitelists e policies sem abrir IDs arbitrários.
- Migrations recentes demonstraram risco de schema drift; toda fase deve usar migration release + schema contract.

### Médio

- `Feed::Serializer` tem risco de N+1 ao adicionar novo subject.
- `SocialFollow` atual assume followables conhecidos; seguir groups exige decisão de semântica: membership não é follow.
- ActiveStorage exige validação de content type, tamanho e autorização do owner/admin.
- `DomainEvent` aceita payload livre; eventos de Groups precisam payload mínimo sem PII.

### Baixo

- UI pode reaproveitar shell visual do feed.
- Cursor existente pode ser adaptado se ordenação permanecer `(published_at, id)`.

## 6. Decisões recomendadas para próxima fase

1. `Group` será aggregate root; “Forum” será apenas experiência.
2. Membership será distinta de follow.
3. Não criar `Forum` paralelo.
4. Não alterar `ReviewerPublication` nesta fase sem ADR e teste de compatibilidade.
5. Criar primeiro schema mínimo: `groups` e `group_memberships`; posts/topics/rules entram após decisão do post model.
6. Usar `ApplicationPolicy::Scope` específico e fail-closed para private groups.
7. Liberar discovery com `GROUPS_ENABLED=false` por padrão.
8. Ativar frontend somente depois de backend contract, schema verification e smoke tests.
9. Adicionar Groups ao `schema_contract_check.rb` apenas junto com migration e specs correspondentes.
10. Não criar seed de produção; seed Mercado Livre somente em dev/staging.

## 7. Ordem segura de implementação

1. ADR do post model.
2. Migrations mínimas e contrato de schema.
3. Models + validations.
4. Policies + policy specs.
5. Services membership/discovery.
6. API show/discovery/join/leave.
7. Serializers e request specs.
8. ActiveAdmin somente após schema verification.
9. Front types/client/routes, inicialmente disabled.
10. UI discovery/detail com dados reais.
11. Posts e integração social.
12. Moderation, analytics, notifications, PWA e E2E.

## 8. Fora de escopo seguro imediato

Não implementar diretamente a partir deste documento sem planos menores:

- polls/events/opportunities;
- recomendações ML;
- OpenSearch;
- billing/monetização;
- WebSocket;
- troca destrutiva de `ReviewerPublication`;
- todos os rails/abas da mockup em uma única entrega.

## 9. Evidência e validação pendente

A auditoria foi feita por leitura do código versionado. Não foi executado banco Rails/RSpec local nesta etapa porque o host não possui Ruby/Bundler e Docker local está sem permissão para `/var/run/docker.sock`. CI deve validar boot, migrations, contrato e request specs antes de merge.
