# Groups API Contract

Status: planejamento. Nenhum endpoint Groups está implementado no estado auditado.

## Regras

- Namespace obrigatório: `/api/v1/groups`.
- Resposta de erro segue `Api::V1::BaseController`: `{ code, message, details? }`.
- Respostas devem usar serializers, nunca ActiveRecord cru.
- Posts usam cursor: `data`, `meta.next_cursor`, `meta.has_more`.
- Requests autenticadas usam JWT/cookie conforme `Api::V1::BaseController`.
- Private groups exigem policy scope e não podem vazar em discovery, feed, cache ou metadata.

## Endpoints planejados

- `GET /api/v1/groups`
- `GET /api/v1/groups/:slug`
- `POST /api/v1/groups/:slug/join`
- `DELETE /api/v1/groups/:slug/join`
- `GET /api/v1/groups/:slug/membership`
- `GET /api/v1/groups/:slug/members`
- `GET /api/v1/groups/:slug/posts`
- `POST /api/v1/groups/:slug/posts`
- `GET /api/v1/groups/:slug/topics`
- `GET /api/v1/groups/:slug/rules`

Criação, alteração, moderação e convites entram somente após policies, rate limits e audit log definidos.
