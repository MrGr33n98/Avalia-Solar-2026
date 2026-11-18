# C2 — DDD e limites de domínio

## Bounded contexts

- **Identidade web:** `User`/Devise; permanece fonte da autenticação existente.
- **Autorização OAuth:** Doorkeeper (`Application`, `AccessGrant`, `AccessToken`); ciclo de vida e revogação.
- **Recurso MCP:** `Mcp::Oauth::Configuration` e `ResourceAuthorization`; validação do recurso e do bearer.
- **Catálogo público:** `Mcp::PublicToolRegistry` e executores já existentes; somente leitura.

## Invariantes

1. Um token MCP deve estar ativo no Doorkeeper.
2. O recurso do token deve ser exatamente o recurso público configurado.
3. O escopo máximo do C2 é `mcp:public:read`.
4. Dados e autorização privados não entram no registro público.
5. A identidade do usuário é derivada do token, nunca de argumento MCP.

## C3

CompanyMember, Pundit, entitlements, recurso privado e isolamento multiempresa serão modelados em outra branch/PR. C2 não cria atalhos para esses conceitos.
