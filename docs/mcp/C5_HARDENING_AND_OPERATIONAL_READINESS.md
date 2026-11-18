# MCP C5 — Hardening e preparação operacional

**Base:** merge C4 `bd42387f4`
**Estado:** hotfix de workflow e documentação preparados; **NO-GO para ativação**.
**Restrição:** utilizar a Droplet existente; não criar infraestrutura adicional nem alterar produção.

## 1. Correção de segurança do CI

O workflow C4 original injetava simultaneamente tokens público e privado em cada job da matriz.
A C5 separa os jobs:

- `public-sdk-interop`: somente `MCP_STAGING_RESOURCE_URL` e `MCP_STAGING_ACCESS_TOKEN`;
- `private-sdk-interop`: somente `MCP_STAGING_PRIVATE_RESOURCE_URL`,
  `MCP_STAGING_PRIVATE_ACCESS_TOKEN` e `MCP_STAGING_PRIVATE_COMPANY_ID`.

O guard `.github/scripts/test_mcp_c4_sdk_workflow.rb` bloqueia o retorno do job compartilhado,
referências cruzadas de secrets/variables e Actions sem SHA. Os três workflows MCP usam Actions
fixadas em commits conhecidos.

## 2. Auditoria read-only da VM

Não foi localizada autorização SSH nesta etapa. A auditoria da Droplet fica **BLOCKED**, sem
tentativa de conexão e sem mudança em produção.

Comandos seguros para execução manual por uma pessoa autorizada, sem imprimir secrets:

```bash
date -Is
free -h
nproc
df -hT
docker ps --no-trunc --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
docker network ls
docker volume ls
docker ps -q | while read -r c; do
  docker inspect --format '{{.Name}} image={{.Config.Image}} networks={{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$c"
done
```

Após identificar os nomes, substituir `NGINX_CONTAINER`, `POSTGRES_CONTAINER`, `REDIS_CONTAINER`
e `BACKEND_CONTAINER` pelos containers confirmados:

```bash
docker exec NGINX_CONTAINER nginx -T 2>/dev/null \
  | sed -E 's/(Authorization|Bearer|token|secret|password|key)[^;]*/\1=<redacted>/Ig' \
  | grep -E 'server_name|listen |proxy_pass|access_log|ssl_protocols|location '
docker exec POSTGRES_CONTAINER pg_isready
docker exec REDIS_CONTAINER redis-cli ping
docker exec REDIS_CONTAINER redis-cli INFO server \
  | sed -n -E '/^(redis_version|os|tcp_port|uptime_in_seconds):/p'
docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' BACKEND_CONTAINER \
  | awk -F= '$1 ~ /^MCP_/ { if ($2 ~ /^(true|false|preview|oauth|opaque)$/) print $1 "=" $2; else print $1 "=<redacted>" }'
docker exec POSTGRES_CONTAINER sh -lc \
  'psql -At -c "SELECT version, name FROM schema_migrations WHERE name ILIKE '\''%doorkeeper%'\'' ORDER BY version"'
```

Critério: confirmar que `MCP_REMOTE_PRODUCTION_ENABLED`, transporte público, execução pública e
transporte/OAuth/policy privados permanecem `false` em produção. Não executar `docker compose up`,
`restart`, `rails db:migrate`, `redis-cli FLUSH*`, comandos de escrita SQL ou edição de `.env`.

## 3. Arquitetura sem nova Droplet

Enquanto não houver staging persistente autorizado, a homologação permanece em PostgreSQL/Redis
efêmeros do GitHub Actions. Para uma futura homologação na Droplet existente:

```text
Internet -> Nginx/TLS existente (host mcp-staging aprovado)
         -> projeto Compose separado, rede e volumes com nomes exclusivos
         -> Rails MCP staging, porta localhost dedicada
         -> PostgreSQL e Redis staging dedicados no mesmo host
```

Regras obrigatórias:

1. Não compartilhar rede, volumes, banco, Redis, `.env`, `RAILS_MASTER_KEY`, `SECRET_KEY_BASE` ou
   tokens com o Compose de produção.
2. Usar imagem backend imutável pelo SHA revisado e dados sintéticos.
3. Expor somente Nginx/TLS; PostgreSQL, Redis e Rails ficam privados.
4. Manter produção com todas as flags MCP desabilitadas.
5. Usar tokens Doorkeeper de curta duração, recursos exatos e scopes mínimos.

Essa topologia continua single-host e não tolera a falha da Droplet. O risco deve ser aceito
explicitamente por SRE; não é alta disponibilidade nem isolamento de domínio de falha.

## 4. Checklist DNS/HTTPS/OAuth

- [ ] DNS `mcp-staging.avaliasolar.com.br` aponta para o endpoint aprovado.
- [ ] Certificado TLS válido, TLS 1.2/1.3 e verificação sem bypass.
- [ ] Well-known resources e issuer retornam URLs exatas.
- [ ] `MCP_REMOTE_ALLOWED_HOSTS` e `MCP_PRIVATE_ALLOWED_HOSTS` são exatos.
- [ ] Origins permitidas são explícitas; sem wildcard.
- [ ] Clientes Doorkeeper são exclusivos de staging, com callback exato e PKCE S256.
- [ ] Empresas, usuários, memberships e entitlements são sintéticos.
- [ ] Tokens são curtos, revogáveis e entregues somente ao Environment `mcp-staging` após a
      correção de least privilege.
- [ ] Nenhum token aparece em logs, artefatos, commits ou URLs registradas.

## 5. Rollout progressivo e rollback

1. **Dark:** manter todas as flags MCP `false` em produção.
2. **Staging:** habilitar as flags somente no Compose isolado e validar OAuth, quotas, tenant
   isolation e os dois SDKs.
3. **Canary controlado:** se aprovado, liberar um único cliente/tenant sintético ou interno
   autorizado, sem habilitar o público geral.
4. **Observação:** acompanhar `401/403/429/503`, latência, quotas, erros Redis, logs redigidos e
   ausência de PII.
5. **Expansão:** somente após aprovação AppSec/SRE/Produto/DPO e evidência de rollback.

Rollback operacional: revogar tokens de staging; desligar primeiro execução pública e transporte
privado; depois desligar transporte público/OAuth/policy; por fim restaurar a imagem/configuração
anterior do ambiente isolado. Não executar rollback na produção sem autorização e janela operacional.

## 6. Matriz GO/NO-GO

| Controle | Evidência atual | Decisão |
| --- | --- | --- |
| Workflow sem exposição cruzada | Guard Ruby + revisão YAML | GO após CI |
| Actions pinadas por SHA | Três workflows MCP corrigidos | GO após CI |
| OAuth/PKCE local | Specs C4 existentes | GO local |
| SDK Python/TypeScript externo | Sem endpoint/token real | NO-GO |
| Staging isolado persistente | Não confirmado | BLOCKED |
| Auditoria SSH da Droplet | Sem autorização SSH | BLOCKED |
| Produção MCP desabilitado | Não verificável remotamente nesta etapa | NO-GO |
| DNS/TLS/OAuth real | Não executado | NO-GO |
| ChatGPT/Claude externo | Não executado | NO-GO |

**Decisão C5:** pronta para revisão de segurança e CI; não pronta para merge automático, deploy,
criação de secrets ou ativação de MCP.
