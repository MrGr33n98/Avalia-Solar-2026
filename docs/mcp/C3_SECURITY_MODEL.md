# C3 — Modelo de segurança

## Decisões

- Token de acesso opaco do Doorkeeper; não aceitar JWT de sessão, ID token ou
  token público no recurso privado.
- Audience exata: `MCP_PRIVATE_OAUTH_RESOURCE`.
- Scope mínimo: `mcp:company:read`.
- Recurso, scope, expiração, revogação, aplicação e usuário são verificados no
  Resource Server.
- O usuário precisa estar ativo no Devise, possuir membership ativo e a
  empresa precisa estar ativa.
- A policy exige o entitlement existente `advanced_analytics`.
- Resultado contém apenas id, nome, slug, status, segmento, cidade, estado e
  tier; não inclui leads, contatos privados, dados financeiros ou CRM.

## Falha segura

As flags `MCP_PRIVATE_REMOTE_TRANSPORT_ENABLED` e
`MCP_PRIVATE_REMOTE_OAUTH_ENABLED` são `false` por padrão. Em produção, a
flag de produção existente também precisa estar aprovada. Falhas de
autorização não redirecionam para login e não revelam se outro tenant existe.
