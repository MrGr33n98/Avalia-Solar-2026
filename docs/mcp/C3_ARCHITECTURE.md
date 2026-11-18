# C3 — Arquitetura

```text
MCP client
  -> Doorkeeper Authorization Server (resource privado)
  -> token opaco persistido em oauth_access_tokens
  -> PrivateResourceAuthorization
  -> User Devise ativo
  -> CompanyContext (membership ativo + empresa ativa)
  -> Mcp::Private::CompanyPolicy (Pundit + entitlement)
  -> get_my_company_overview
```

O endpoint privado é separado de `/mcp`. O parâmetro `company_id` é apenas um
seletor: ele nunca concede acesso e só é aceito quando corresponde a um
`CompanyMember` ativo do titular do token.

Não há migration C3. Usuários, empresas, memberships, planos e tokens
existentes são reutilizados.
