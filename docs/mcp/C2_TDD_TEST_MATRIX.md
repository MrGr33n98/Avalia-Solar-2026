# C2 — Matriz TDD

| Área | Cobertura | Evidência local |
|---|---|---|
| Authorization Code/PKCE | emissão, refresh rotation, revogação | `spec/requests/oauth/doorkeeper_authorization_server_spec.rb` |
| JWT legado | issuer, audience, assinatura, expiração, scope, typ | `spec/requests/api/v1/mcp/oauth_resource_spec.rb` |
| Token Doorkeeper | token opaco, hash lookup, resource, revogação | `spec/requests/api/v1/mcp/oauth_doorkeeper_resource_spec.rb` |
| Metadata | issuer, endpoints, S256, ausência de PEM | spec C2 de recurso |
| Regressão MCP | transportes, quotas, registry e ferramentas públicas | workflow `mcp-remote-contract-gate.yml` |

## Execução registrada

Com PostgreSQL/Redis temporários isolados, Ruby 3.2.2 e Doorkeeper 5.9.9:

```text
23 examples, 0 failures
```

O guard de `rails_helper` foi respeitado; nenhum banco de produção foi usado.

## Pendentes

Adicionar ao gate CI a execução C2, validar suíte MCP ampliada no GitHub Actions e realizar testes externos de PKCE/discovery com dois clientes independentes em staging isolado.
