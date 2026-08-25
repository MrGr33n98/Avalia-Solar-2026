# Groups Phase 4 — mapa de descoberta

**Data:** 2026-08-25  
**Escopo:** auditoria pré-implementação de governança, administração, discovery e growth.

## Resumo

O domínio Groups base atual existe somente até `Group`, `GroupMembership`, `GroupTopic` e `GroupRule`, com discovery, membership lifecycle, API de leitura e ActiveAdmin básico. A maior parte do escopo Phase 4 é ausente. Não criar `Community`, `Forum` ou agregados paralelos.

## Inventário por área

| Área | Existe | Parcial | Ausente | Reutilizável | Não necessário agora |
| --- | --- | --- | --- | --- | --- |
| Aggregate | `Group`, `GroupMembership`, `GroupTopic`, `GroupRule` | — | `GroupPost`, `GroupComment`, `GroupReaction` | `FeedItem` somente após policy de visibilidade | Novo domínio Community/Forum |
| Schema | migrations de Groups com constraints e índices básicos | contadores `members_count/posts_count` sem entidades de post | posts, reports, invitations, audit log específico | `DomainEvent` para eventos mínimos | migration antes de contrato |
| API | list/show/join/leave/membership/members/topics/rules | erro/visibility dependem de policy atual | management, approval actions, moderation, invitations, analytics Groups | `Api::V1::BaseController`, Pundit | endpoints fake para preencher UI |
| Serializers | compact, detail, membership, member, topic, rule | sem paginação de membros | post/report/invitation/analytics | serializers existentes | ActiveRecord cru |
| Policies | Group, GroupMembership, GroupTopic, GroupRule | autorização de leitura/membership coberta; management limitado | post/report/invitation/analytics policies | `ApplicationPolicy::Scope` | esconder botão como segurança |
| Services | `Groups::Feature`, `MembershipService`, `ModerationService`, `GroupCreationService`, `DiscoveryQuery` | moderation somente reject/approve membership | recommendation, report, invite, analytics, notification orchestration | services existentes de search/recommendation/notification | lógica pesada em controller |
| Admin | ActiveAdmin `Group` e `GroupMembership` | CRUD/configuração limitada; sem ações de governança | topics/rules moderation queue, audit views | ActiveAdmin existente | novo dashboard separado |
| Frontend | `/groups`, `/groups/[slug]`, cards, hero, topics/rules/members, join/leave | management/create/recommendations/notifications/SEO ausentes | `/manage`, `/new`, moderation, approvals, analytics | shell global, React Query, `lib/api/groups.ts`, `MobileBottomNav` | segunda bottom nav |
| Notifications | `Notification`, `Noticed`, API, preferences globais | `community` category existe, Groups events não existem; preferences não têm Group events | approval/invite/moderation delivery | `NotificationService`, `NotificationPreference` | `GroupNotification` paralelo |
| Analytics | `AnalyticsEvent`, `Analytics::TrackEventService`, PostHog frontend | tracking global e recommendation events existentes | catálogo/queries específicas de Groups | `lib/analytics`, registry atual | PII/body em eventos |
| Search | Search API, `CompanySearchService`, SQL/OpenSearch fallback | Groups não entram no search | busca de Groups/topics | query SQL e visibility scope | tornar Searchkick obrigatório |
| SEO | metadata Next, sitemap builders e sections | Groups fora de sitemap | public Group sitemap/OG canonical | `app/sitemap.ts`, `sitemap-builders.ts` | indexar privados |
| Growth | recomendações de empresas, cross-links existentes | nenhum loop Group real | links Group/company/product/category/creator baseados em dados | recommendation infrastructure | badges/trending inventados |
| Feature flag | backend `GROUPS_ENABLED`, frontend `NEXT_PUBLIC_GROUPS_ENABLED` fail-closed | rollout operacional não comprovado | flags por grupo/segmento | `Groups::Feature`, `isGroupsEnabled` | fallback `true` |
| RBAC | roles membership `owner`, `admin`, `moderator`, `member` | policies atuais tratam admin/owner/moderator | matriz completa de ações Phase 4 | Pundit + membership role | novos roles sem necessidade |

## Entidades reais confirmadas

- `Group`: status, visibility, membership mode, posting mode, owner/category, counters e flags.
- `GroupMembership`: role, status, notifications level, approval metadata e `muted_until`.
- `GroupTopic`: active, position, slug, descrição e `posts_count`.
- `GroupRule`: active, position, título e descrição.
- Não existem no código `GroupPost`, `GroupComment`, `GroupReaction`, `GroupReport` ou `GroupInvitation`, apesar de serem entidades previstas nos documentos de arquitetura.

## Endpoints atuais

`/api/v1/groups` expõe list/show/create/update. Nested endpoints expõem join, membership, members, topics e rules. Não existem rotas de management, posts, reports, invitations, analytics ou Group-specific notifications.

## Guardrails para planejamento

1. Criar primeiro contratos e decisões para posts/reports/invitations/audit log; são mudanças arquiteturais, não correções locais.
2. Toda mutation nova exige Policy, scope, validação de ownership/group e audit/event mínimo.
3. Private groups nunca entram em discovery, search, metadata ou sitemap sem autorização.
4. Reutilizar `Notification`, `NotificationPreference`, PostHog e search fallback; não criar domínios paralelos.
5. Discovery determinístico só depois de definir dados disponíveis; trending não pode ser badge arbitrário.
6. Phase 4 deve ser dividida em planos pequenos: governance, management, membership/invites, creation, discovery/search, notifications/analytics, SEO/growth, testes e relatório.

## Bloqueios arquiteturais

- Moderar posts exige `GroupPost` e endpoints/policies ausentes.
- Reports exigem confirmar se mecanismo genérico existente atende conteúdo Groups; `ConversationReport` não é genericamente reutilizável sem decisão.
- Analytics de membros/posts/comments/reactions exige fonte de dados correspondente; não inferir métricas de counters incompletos.
- Invitations não têm modelo, token, expiração ou fluxo existente.
- Category/topic discovery só pode usar nomes reais; Groups serializer atual fornece apenas `category_id`.

## Próximo passo recomendado

Planejar primeiro um contrato técnico de `GroupPost` + moderation/report lifecycle. Sem isso, não implementar UI de governança que só simula operações inexistentes.