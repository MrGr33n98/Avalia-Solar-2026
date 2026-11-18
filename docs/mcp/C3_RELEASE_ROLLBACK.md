# C3 — Release e rollback

Não executar deploy manual nem migration em produção nesta fase. O rollback
de código é o revert da PR C3. A desativação imediata é feita mantendo
`MCP_PRIVATE_REMOTE_TRANSPORT_ENABLED=false` e
`MCP_PRIVATE_REMOTE_OAUTH_ENABLED=false`.

Antes de qualquer staging, confirmar que a configuração do recurso privado,
issuer, hosts e origins é específica do ambiente. Revogar tokens emitidos
durante o teste e remover aplicações de teste pelo procedimento controlado do
Authorization Server.
