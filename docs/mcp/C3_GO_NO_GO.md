# C3 — Go / No-Go

## Estado atual

**NO-GO para produção e homologação pública.** A implementação está em uma
branch dependente da C2 e as flags privadas permanecem desligadas.

## Gates pendentes

- PR C2 integrada à `main`.
- CI completo da PR C3.
- Staging isolado com HTTPS e OAuth ponta a ponta.
- Cliente MCP independente e piloto autorizado.
- Observabilidade, quotas e rollback aprovados.

## Evidência local

A spec privada deve estar verde em PostgreSQL temporário antes do commit. Isso
não prova staging, DNS, TLS, ChatGPT, Claude ou produção.
