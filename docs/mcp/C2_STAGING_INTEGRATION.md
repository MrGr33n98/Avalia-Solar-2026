# C2 — Staging e integração

## Estado

Não foi provisionado nem verificado staging externo nesta PR. `mcp-staging.avaliasolar.com.br`, DNS, TLS, proxy, PostgreSQL/Redis segregados e secrets próprios continuam pendentes.

## Checklist autorizado

1. Criar ambiente isolado, sem banco de produção.
2. Configurar issuer e resource HTTPS exatos.
3. Manter execução pública desligada durante discovery/auth.
4. Obter cliente de teste e callback exato; não registrar cliente aberto.
5. Executar Authorization Code + PKCE, `tools/list`, refresh e revogação.
6. Validar erros de resource, scope, expiração, assinatura e quota.
7. Coletar request IDs sem tokens/PII.
8. Aprovar AppSec/Privacidade/SRE antes de qualquer execução pública.

Nenhum token, chave ou callback real é armazenado neste repositório.
