# C3 — Go / No-Go

## Estado do código (18/11/2026)

A PR **#183** foi integrada à `main` (merge `d27165b8`).
O CI da branch C3 (RSpec e MCP Remote Contract Gate) foi aprovado. O
código da Fase C3 também consta em deploys posteriores. **Isso não
comprova que o endpoint está habilitado ou homologado em produção.**

**Decisão operacional permanece NO-GO** para ativação pública/privada.

## Gates pendentes

- Provar que `MCP_PRIVATE_REMOTE_TRANSPORT_ENABLED` e
  `MCP_PRIVATE_REMOTE_OAUTH_ENABLED` permanecem desligadas na produção.
- Comprovar staging HTTPS, serviços e bancos isolados.
- Validar authorization code + PKCE e fluxo de login/consentimento externo.
- Testar 2 SDKs MCP independentes e clientes ChatGPT/Claude onde suportado.
- Cobrir quotas e telemetria privadas conforme implementação C4, com CI verde.
- Demonstrar isolamento entre dois tenants com CompanyMember + Pundit e
  entitlement `advanced_analytics`.
- Executar testes de revogação, expiração, refresh e rollback no staging.
- Reunir aprovações Produto, Backend, AppSec, Privacidade e SRE.

Ver `docs/mcp/C4_IMPLEMENTATION_AND_RELEASE_GATES.md`.

## Evidência conhecida vs. desconhecida

- **Conhecido:** PR C3 integrada; testes automatizados da PR aprovados.
- **Não comprovado:** DNS/TLS staging real, interoperabilidade externa,
  configuração efetiva de flags em produção e aprovação de release.

**Não ativar MCP por consequência de merge/deploy.**
