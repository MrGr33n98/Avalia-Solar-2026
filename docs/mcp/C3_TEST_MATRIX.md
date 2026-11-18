# C3 — Matriz de testes

| Caso | Resultado esperado |
| --- | --- |
| Token privado + membership A + empresa A | Permitir overview |
| User A + empresa B | Negar |
| Token público em `/mcp/private` | 401 |
| Scope privado ausente | 403 |
| Token revogado | 401 |
| Empresa inativa | Negar |
| Membership revogado | Negar |
| Múltiplas empresas sem seletor | Negar |
| Múltiplas empresas com seletor autorizado | Permitir |
| Endpoint com flag desligada | 404 |
| Metadata privada configurada | 200 sem segredos |

Comando focado:

```bash
RAILS_ENV=test bundle exec rspec spec/requests/api/v1/mcp/private_transport_spec.rb
```
