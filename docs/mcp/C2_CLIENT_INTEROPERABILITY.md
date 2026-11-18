# C2 — Interoperabilidade

## Resultado atual

Não há evidência de conexão real com SDK MCP independente, ChatGPT ou Claude nesta PR. Os testes locais usam request specs Rails e não devem ser apresentados como homologação de cliente externo.

## Plano de prova

- Cliente independente 1: discovery, PKCE, token, `initialize`, `tools/list`, refresh e revoke.
- Cliente independente 2: repetir com negociação de versão e erros de audience/scope.
- ChatGPT/Claude: somente em workspace/plano e callback suportados, com autorização explícita.

## Critério

Registrar versão do cliente, URL de staging, request IDs redigidos, protocolo negociado e resultado positivo/negativo. Sem essas evidências, compatibilidade permanece não comprovada.
