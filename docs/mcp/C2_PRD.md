# C2 — PRD de integração OAuth do MCP

## Problema

O MCP Remote precisa aceitar autorizações emitidas pelo Authorization Server Rails sem expor o dispatcher interno, dados comerciais ou ferramentas privadas.

## Objetivo

Integrar Devise + Doorkeeper ao Resource Server `/mcp`, com tokens opacos vinculados ao recurso MCP, escopo `mcp:public:read`, expiração, refresh/revogação nativos do Doorkeeper e execução pública ainda controlada por flags.

## Escopo

- Authorization Code + PKCE S256 já fornecidos pelo Doorkeeper/C1.
- Parâmetro `resource` persistido em grants e tokens.
- Validação Doorkeeper no `/mcp`.
- Metadata do Authorization Server e do Protected Resource.
- Cinco ferramentas públicas no registro existente.
- Testes de integração, negativos e regressão.

## Fora do escopo

JWKS/JWT RFC 9068, MCP privado/CompanyMember/Pundit, DNS/TLS real, clientes externos e ativação em produção. JWT permanece apenas como modo legado explicitamente opt-in para os testes existentes.

## Critérios de aceite

Um token opaco Doorkeeper válido, com `resource` exato e `mcp:public:read`, lista somente as cinco ferramentas públicas. Token expirado, revogado, de outro recurso ou sem escopo é rejeitado. Nenhum endpoint interno é usado como fallback.

## Estado

Implementação local C2 validada em 23 exemplos RSpec focados. Homologação externa e produção permanecem pendentes.
