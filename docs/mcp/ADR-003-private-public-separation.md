# ADR-003 — Separação entre MCP público e privado

## Contexto

O MCP público deve permanecer read-only e sem dados empresariais. A leitura
privada exige vínculo de usuário, empresa e plano.

## Decisão

Usar `/mcp/private`, resource OAuth distinto e escopo `mcp:company:read`.
O endpoint possui registry, executor, policy e flags próprios. A autorização
é feita no backend; parâmetros de tenant não são uma concessão.

## Consequências

Há uma pequena duplicação de protocolo para manter fronteiras claras. A
ferramenta privada não aparece em `PublicToolRegistry` e o endpoint público
não pode despachá-la.
