# C2 — Contratos HTTP

## Authorization Server

| Método | Rota | Contrato |
|---|---|---|
| GET/POST | `/oauth/authorize` | Doorkeeper + sessão Devise + consentimento + `resource` exato. |
| POST | `/oauth/token` | Authorization Code/PKCE e refresh conforme Doorkeeper. |
| POST | `/oauth/revoke` | Revogação Doorkeeper. |
| GET | `/.well-known/oauth-authorization-server` | Metadata somente quando issuer/resource HTTPS estão configurados. |

## Protected Resource

| Método | Rota | Contrato |
|---|---|---|
| GET | `/.well-known/oauth-protected-resource/mcp` | Resource, authorization server e scope. |
| POST | `/mcp` | JSON-RPC protegido por bearer; `tools/list` público autorizado. |

## Erros

- 401 com `WWW-Authenticate` para bearer ausente/inválido.
- 403 com `insufficient_scope` para scope insuficiente.
- 400 `invalid_target` para `resource` ausente/incorreto no Authorization Server.
- 404 quando o recurso não está configurado ou os switches estão desligados.

O endpoint interno `/api/v1/mcp/tools/:tool_name` não faz parte deste contrato.
