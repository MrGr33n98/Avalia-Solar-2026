# C3 — MCP privado empresarial

## Objetivo

Adicionar uma segunda fronteira MCP para leitura empresarial, sem reutilizar o
dispatcher público nem expor CRM, leads ou operações administrativas.

## Escopo

- `POST /mcp/private` com OAuth Doorkeeper opaco.
- Escopo `mcp:company:read` e audience exclusiva `MCP_PRIVATE_OAUTH_RESOURCE`.
- Uma ferramenta inicial: `get_my_company_overview`.
- Membership ativo, empresa ativa, policy Pundit e entitlement `advanced_analytics`.
- Flags desligadas por padrão em todos os ambientes.

## Fora do escopo

CRM, leads, mutações, client registration aberto, produção, infraestrutura,
novos usuários e novas tabelas.

## Aceite

User A acessa somente empresas com membership ativo e empresa ativa; tokens
públicos, scopes incorretos, tokens revogados e empresas não autorizadas são
rejeitados.
