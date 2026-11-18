# C2 — Release e rollback

## Release seguro

Publicar código com `MCP_REMOTE_TRANSPORT_ENABLED=false`, `MCP_REMOTE_PRODUCTION_ENABLED=false` e `MCP_PUBLIC_TOOLS_EXECUTION_ENABLED=false`. Validar health e login existente; não executar migration manual em produção.

## Rollback

1. Desabilitar a execução pública e, se necessário, o transporte MCP.
2. Revogar grants/tokens C2 conforme o procedimento Doorkeeper.
3. Reverter a imagem pela pipeline normal com rollback automático.
4. Só remover colunas OAuth em janela aprovada e após retenção/auditoria; a migration C2 é reversível localmente, não deve ser revertida por impulso em produção.
5. Confirmar que login web/PWA e APIs legadas continuam saudáveis.

Não há deploy manual, alteração de DNS/TLS ou ativação de produção autorizados nesta PR.
