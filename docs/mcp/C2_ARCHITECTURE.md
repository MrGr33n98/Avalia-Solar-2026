# C2 — Arquitetura

```text
Cliente MCP
    │ Authorization Code + PKCE S256
    ▼
Rails + Devise + Doorkeeper (Authorization Server)
    │ token opaco hashado; resource persistido
    ▼
POST /mcp (Resource Server)
    │ by_token + accessible? + resource + scope
    ▼
Mcp::PublicToolRegistry → serviços públicos existentes
```

## Decisão principal

O formato C2 é token opaco nativo do Doorkeeper. A versão instalada (`5.9.9`) mantém tokens com hash e não oferece, no contrato utilizado, Resource Indicators/JWKS/RFC 9068 completos. Criar um emissor JWT paralelo quebraria a autoridade de revogação e duplicaria o ciclo de vida. O Resource Server consulta `Doorkeeper::AccessToken.by_token`, verifica `accessible?`, recurso, escopo e aplicação.

`MCP_OAUTH_TOKEN_FORMAT=jwt` continua disponível somente para compatibilidade com a suíte JWT legada; não é o padrão nem uma emissão C2.

## Fronteiras

- `/mcp`: adaptador remoto público, sem dispatcher administrativo.
- `/api/v1/mcp/tools/:tool_name`: contrato interno legado, não é publicado como MCP.
- `/oauth/*`: Authorization Server Doorkeeper, usando a sessão Devise para consentimento.
- C3 privado terá recurso, scopes e políticas separados.

## Configuração

`MCP_OAUTH_ISSUER` e `MCP_OAUTH_RESOURCE` são HTTPS explícitos. O recurso deve terminar em `/mcp`; nenhum valor é derivado de `Host` ou `Forwarded`. O padrão operacional continua desligado.
