# ADR-002 — Tokens opacos Doorkeeper no MCP C2

## Contexto

O Resource Server anterior validava JWT RS256, mas o Authorization Server C1 usa Doorkeeper 5.9.9 com tokens opacos hashados. A versão instalada não comprova suporte completo ao conjunto RFC 8707/RFC 9068/JWKS necessário para substituir o ciclo de vida nativo.

## Decisão

Usar tokens opacos emitidos pelo Doorkeeper. Persistir `resource` nos grants/tokens, exigir o resource exato no Authorization Server e validá-lo novamente no `/mcp` por `by_token`, `accessible?`, scope e aplicação.

## Consequências

Revogação e refresh permanecem consistentes com Doorkeeper; não há chave privada/JWKS adicional nem emissor paralelo. A interoperabilidade depende de clientes que aceitem bearer opaco. Se um cliente exigir JWT RFC 9068, será necessário novo ADR, emissor integrado ao ciclo de vida Doorkeeper e testes de rotação/revogação antes de mudar o padrão.

## Status

Aceita para C2; staging e clientes externos ainda não homologados.
