# C2 — Contrato de token OAuth

## Formato adotado

Access token opaco, gerado e persistido pelo Doorkeeper. O valor armazenado permanece protegido pela configuração `hash_token_secrets`; o valor claro só é retornado no response OAuth inicial e nunca é logado pelo MCP.

## Vínculo obrigatório

| Campo | Regra |
|---|---|
| resource | Igual a `MCP_OAUTH_RESOURCE`, exatamente; `/mcp` obrigatório. |
| scope | Contém `mcp:public:read`. |
| owner | `users.id` existente; sujeito interno exposto ao MCP como `user:<id>`. |
| client | `oauth_applications.uid`, usado somente no contexto de autorização/quota. |
| validade | `accessible?` do Doorkeeper e expiração limitada. |
| revogação | `revoked_at`/métodos Doorkeeper; token revogado falha no Resource Server. |

O identificador `sub` pertence apenas ao modo JWT legado e não é emitido pelo C2 opaco. E-mail, senha, cookies e JWT de login nunca autorizam `/mcp`.

## Refresh e revogação

Refresh rotation e `previous_refresh_token` continuam sob Doorkeeper/C1. A integração C2 não cria tabela paralela nem substitui o endpoint `/oauth/revoke`.

## Claims JWT legados

Quando explicitamente habilitado para compatibilidade, a validação exige RS256, `typ=at+jwt`, issuer, audience, `sub`, `jti`, `iat`, `exp` e scope. Isso não comprova emissão JWT pelo Authorization Server C2.
