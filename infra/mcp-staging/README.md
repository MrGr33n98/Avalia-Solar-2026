# Avalia Solar MCP C4 — Staging Infrastructure Architecture & Runbook

> **Ambiente de Homologação (Staging):** O MCP Staging está provisionado e em operação
> através de **isolamento lógico por containers Docker** na infraestrutura DigitalOcean
> (Droplet `64.225.59.107`), sob o domínio `mcp-staging.avaliasolar.com.br`.

## 1. Topologia Real e Nível de Isolamento

- **Host:** Droplet DigitalOcean `64.225.59.107` (compartilhado logicamente com a stack de produção).
- **Projeto Docker Compose:** `avalia-solar-mcp-staging` (definido em `infra/mcp-staging/compose.yml`).
- **Rede:** Rede Docker dedicada em modo bridge (`mcp_staging_net`), isolada da rede de produção.
- **Porta:** `127.0.0.1:3101` (bind restrito a loopback local, sem exposição direta à internet).
- **Reverse Proxy & TLS:** Nginx Proxy Manager (NPM) com terminação TLS (Let's Encrypt) e proxy reverso para `127.0.0.1:3101`.
- **Banco de Dados & Cache:** Containers e volumes PostgreSQL 14 (`postgres_data`) e Redis 7 (`redis_data`) totalmente dedicados ao staging, sem compartilhamento com os bancos de produção.
- **Identidade e Fixtures:** Usuários sintéticos e empresas sintéticas criados exclusivamente no banco de staging (`mcp_staging_db`).

### Riscos de Recursos Compartilhados e Mitigações

1. **Contenção de CPU e Memória:**
   - *Risco:* Testes de carga ou spikes em staging consumirem recursos do Droplet e impactarem a latência do frontend/backend de produção.
   - *Mitigação:* Limites de concurrency no script de carga (padrão 5 workers), quotas Redis rigorosas (30 req/min por identidade), e monitoramento de CPU/RAM via métricas de sistema e Yabeda.
2. **Isolamento de Rede:**
   - *Risco:* Exposição acidental da porta do container Rails staging para a internet.
   - *Mitigação:* `compose.yml` mapeia explicitamente `127.0.0.1:3101:3001`, bloqueando qualquer acesso que não passe pela terminação TLS do Nginx.
3. **Futura Evolução para Produção (Wave G5):**
   - Para volumes de tráfego de marketplace em produção, uma VM/Droplet fisicamente dedicada deve ser contratada caso o tráfego público de agentes cresça substancialmente.

## Preconditions

1. Obtain a separate staging VM and separate environment secrets with
   Product, AppSec, DPO and SRE approval. **Never clone production database,**
   **copy production .env, or reuse production OAuth tokens/keys**.
2. Provision DNS `mcp-staging.avaliasolar.com.br` and a trusted TLS cert.
3. Prepare a SHA-tagged backend image using the reviewed commit, not `latest`.
4. Create an ignored `infra/mcp-staging/.env` on **the staging VM only**.
   The repository root `.gitignore` ignores `.env` and `.env.*`.
5. Define **staging-only** `MCP_STAGING_BACKEND_IMAGE`,
   `MCP_STAGING_POSTGRES_USER`, `MCP_STAGING_POSTGRES_PASSWORD`,
   `MCP_STAGING_POSTGRES_DB`, `RAILS_MASTER_KEY`, `SECRET_KEY_BASE`,
   and other Rails boot dependencies. Use a fresh secret for each resource.
6. Limit `MCP_STAGING_ALLOWED_ORIGINS` to audited origins (or empty when
   clients send no Origin). No wildcard CORS, no disabled TLS validation.
7. Ensure Docker network, port 3101 and PostgreSQL/Redis volumes are not
   shared with any production Compose project or exposed to the internet.

## Configuration and dry-run (STAGING VM ONLY)

Do not run the commands below until you have verified the isolated VM.

    cd infra/mcp-staging
    test "$MCP_STAGING_APPROVED" = STAGING_ONLY
    docker compose --env-file .env -f compose.yml config --quiet
    docker compose --env-file .env -f compose.yml up -d postgres redis
    docker compose --env-file .env -f compose.yml run --rm rails bundle exec rails db:prepare
    docker compose --env-file .env -f compose.yml up -d rails

The template uses `RAILS_ENV=production` **inside the isolated staging
container** because the released Docker image targets the Rails production
runtime. This is not the production environment/domain. The value
`MCP_REMOTE_PRODUCTION_ENABLED=true` is needed to pass a Rails.env.production?
guard and **must not be copied to the production deployment**.

Database migrations apply **only** to the new staging DB configured above.
The sample Nginx config must be reviewed and installed by operations only
after real DNS and TLS are ready; it proxies to localhost:3101 and disables
access logging of sensitive OAuth request URLs.

## Validate read-only staging behavior

1. Confirm health, metadata issuer and protected-resource URLs.
2. Create **separate staging users and companies**: one authorized
   company and another without membership; do not use real customer data.
3. Register Doorkeeper OAuth clients with exact HTTPS callbacks and
   PKCE S256; scope public `mcp:public:read` or private `mcp:company:read`.
4. **Prove browser login/consent** works with the actual Devise/Next.js
   session before assuming the Doorkeeper login redirect is functional.
5. Obtain short-lived access tokens with their exact resource; deliver
   credentials through GitHub environment `mcp-staging` secrets.
6. Trigger the manual Ruby smoke and the two-SDK workflow, using
   `STAGING_ONLY` and public/private/both. They cannot run without
   credentials; do not fabricate PASS.
7. Verify invalid resource/scope, revoked tokens, 429/503 quotas,
   cross-tenant denial, private tool isolation, and actual rollout rollback.

## In case of incident

Operate on isolated staging only:

    docker compose --env-file .env -f compose.yml stop rails

Revoke issued staging OAuth tokens and inspect safely redacted request logs.
Rollback **production** is a separate approved change ticket; neither
the staging template nor any GitHub PR automatically enables production.

## Limitations

- No DNS, VM, TLS, OAuth clients or secrets are provisioned by committing this directory.
- A successful Docker boot does not prove OAuth PKCE consent or SDK interoperability.
- Two independent SDKs and the Ruby smoke run only when explicitly invoked
  against a real staging environment.
- Host/origin allowlists and reverse-proxy trusted IP configuration require
  manual security review.
- See `docs/mcp/C4_IMPLEMENTATION_AND_RELEASE_GATES.md` for GO/NO-GO.
