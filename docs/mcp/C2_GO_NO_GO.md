# C2 — Go/No-Go

## Estado do código (18/11/2026)

A PR **#175** foi integrada à `main`. O Authorization Server
Doorkeeper e a integração de resource server público estão implementados
e possuem testes de CI. Tokens opacos, PKCE S256, resource e scope são
contratos efetivos no código, mas **integração não equivale a aprovação de
ativação pública**.

## Decisão operacional: NO-GO

Permanece pendente:

- Staging Rails/Devise/Doorkeeper com HTTPS real, DNS e origem aprovada.
- Login de usuário, consentimento e authorization code + PKCE ponta a ponta.
- Resource, scope, refresh, revogação e isolamento verificados externamente.
- Dois clientes MCP independentes e homologação do protocolo atual.
- Instrumentação/quotas, alertas e rollback testados em staging.
- Revisões AppSec, Privacidade/DPO, Produto e SRE.

Ver `docs/mcp/C4_IMPLEMENTATION_AND_RELEASE_GATES.md` e
`docs/mcp/ADR-002-C2-DOORKEEPER-OPAQUE-TOKENS.md`.

Até GO explícito: `MCP_REMOTE_TRANSPORT_ENABLED=false`,
`MCP_PUBLIC_TOOLS_EXECUTION_ENABLED=false` em produção. Não executar
testes live com segredos de produção.
