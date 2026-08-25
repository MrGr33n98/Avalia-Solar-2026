# Groups — contrato frontend para próxima fase

Status: contrato preliminar; frontend não implementado nesta fase.

## Endpoints

| Método | Endpoint | Auth | Uso |
|---|---|---|---|
| GET | `/api/v1/groups` | opcional | discovery de grupos públicos ativos |
| GET | `/api/v1/groups/:slug` | opcional | identidade e capabilities |
| POST | `/api/v1/groups` | JWT | criar grupo autorizado |
| PATCH | `/api/v1/groups/:slug` | JWT | owner atualizar dados não administrativos |
| POST | `/api/v1/groups/:slug/join` | JWT | entrar em grupo público |
| DELETE | `/api/v1/groups/:slug/join` | JWT | sair sem apagar histórico |
| GET | `/api/v1/groups/:slug/membership` | JWT | membership do usuário atual |
| GET | `/api/v1/groups/:slug/members` | opcional | membros ativos; resposta inicial limitada |

`GET /api/v1/groups` aceita `search`, `category`, `featured` e `view=new|active|featured`. A lista retorna grupos `active/public`.

## Estados de resposta

- `200`: leitura, join idempotente, leave.
- `201`: criação de grupo.
- `401`: endpoint autenticado sem JWT válido.
- `403`: ação não permitida, grupo invite-only/privado ou owner tentando sair.
- `404`: feature desligada ou grupo não visível no policy scope; não distinguir grupo privado inexistente.
- `422`: validação de domínio.

## Shape

`GET /groups/:slug` retorna `data` com identidade, `stats`, `membership` contextual e `permissions` calculadas pelo backend. Frontend não recalcula capabilities.

`GET /groups` retorna `data[]` compacto com `id`, `name`, `slug`, `short_description`, visibilidade pública, badges, stats e capabilities.

## Membership states

- `null`: usuário sem membership.
- `pending`: solicitação aguardando aprovação.
- `active`: participante; join deve ficar idempotente.
- `left`: histórico preservado após leave.
- `banned`: não mostrar ação de reentrada.

Para grupo `open`, join retorna `active`; para `approval`, retorna `pending`; `invite_only` retorna `403`.

## Loading/error

- loading: skeleton da geometria final; sem spinner bloqueante grande.
- API indisponível: `Não foi possível carregar as comunidades.` com retry.
- `404`: `Comunidade não encontrada.`
- `403`: `Este conteúdo está disponível somente para membros.`

## Rollout

Não criar rota, chamada ou menu frontend até `GROUPS_ENABLED=true` em staging e CI/RSpec/schema contract passarem. Production default permanece `false`.

Não implementar posts, topics, rules, feed, reactions, saves, PWA ou menu adicional nesta fase.
# Groups — contrato para Fase 2 frontend

Status: contrato preliminar; frontend não implementado nesta fase.

## Endpoints

| Método | Endpoint | Auth | Resultado |
|---|---|---|---|
| GET | `/api/v1/groups` | opcional | grupos `active/public`; suporta `search`, `category`, `featured`, `view=new\|active\|featured` |
| GET | `/api/v1/groups/:slug` | opcional | grupo público ou grupo privado autorizado |
| POST | `/api/v1/groups` | User | cria grupo ativo e membership owner |
| PATCH | `/api/v1/groups/:slug` | User owner/admin | altera apenas campos de apresentação/configuração permitidos |
| POST | `/api/v1/groups/:slug/join` | User | `active` em `open`; `pending` em `approval`; `invite_only` bloqueado |
| DELETE | `/api/v1/groups/:slug/join` | User | membership vira `left`; owner não pode sair |
| GET | `/api/v1/groups/:slug/membership` | User | membership contextual ou `data: null` |
| GET | `/api/v1/groups/:slug/members` | opcional | membros ativos somente se viewer puder ver o grupo |

## Envelopes

Sucesso:

```json
{ "data": {}, "meta": {} }
```

Erros seguem `{ "code": "...", "message": "...", "details": {} }`.

Feature desligada retorna `404 NOT_FOUND`, sem stacktrace ou indicação de tabela existente.

## Group

```json
{
  "id": 1,
  "name": "Mercado Livre de Energia",
  "slug": "mercado-livre-de-energia",
  "short_description": "...",
  "description": "...",
  "visibility": "public",
  "membership_mode": "open",
  "posting_mode": "members",
  "status": "active",
  "official": false,
  "verified": false,
  "featured": false,
  "stats": { "members": 0, "posts": 0 },
  "membership": null,
  "permissions": {
    "can_join": true,
    "can_leave": false,
    "can_post": false,
    "can_invite": false,
    "can_moderate": false,
    "can_manage_members": false
  }
}
```

Frontend deve consumir `permissions`; não reconstruir policy por role/status.

## Loading e erros

- Loading: skeleton com geometria final; sem spinner dominante.
- `404`: “Comunidade não encontrada.”
- `403`: “Este conteúdo está disponível somente para membros.”
- Falha de API: “Não foi possível carregar as comunidades.” + retry.
- Lista vazia: “Nenhum grupo encontrado.”
- Join `pending`: “Solicitação enviada”.
- Join `active`: “Participando”.
- Leave: atualizar estado somente após resposta confirmada ou rollback seguro.

## Restrições

Não implementar posts, topics, rules, feed, reactions, saves, PWA ou menu adicional nesta fase. Esses contratos entram após backend correspondente.
