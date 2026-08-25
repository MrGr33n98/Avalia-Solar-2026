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
