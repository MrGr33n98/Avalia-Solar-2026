# C3 — Contratos de API

## Resource metadata

`GET /.well-known/oauth-protected-resource/mcp/private` retorna o resource
HTTPS privado, o issuer do Rails, `mcp:company:read` e bearer por header quando
as flags de private OAuth estão configuradas.

## MCP

`POST /mcp/private` aceita JSON-RPC `initialize`, `ping`, `tools/list` e
`tools/call`. A única ferramenta C3 é `get_my_company_overview`. O payload é
read-only e não contém contatos, leads, CRM ou segredos.

## Erros

Bearer ausente/inválido: HTTP 401. Scope ausente: HTTP 403. Falha de vínculo,
empresa ou entitlement: erro JSON-RPC de autorização sem revelar outro tenant.
