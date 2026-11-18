# C3 — DDD

## Bounded contexts

- **Identity:** `User`/Devise e Doorkeeper são a fonte de identidade e token.
- **Tenant:** `Company` e `CompanyMember` determinam o contexto empresarial.
- **Autorização:** `Mcp::Private::CompanyPolicy` combina vínculo, estado e
  entitlement.
- **Interface:** `PrivateTransportController`, `Protocol` e `Executor` são a
  fronteira MCP privada.

O domínio MCP privado não cria cópia de usuário, empresa, membership ou plano.
