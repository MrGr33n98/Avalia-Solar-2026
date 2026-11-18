# MCP C2 — OAuth resource-server boundary

## Scope of this PR

This work integrates the isolated `/mcp` adapter with the self-hosted Rails/Devise/Doorkeeper Authorization Server from C1. Avalia Solar does not use Auth0 or another mandatory external provider. Authorization Code + PKCE is still owned by Doorkeeper and the existing Devise session.

The endpoint stays off unless explicitly authorized in a controlled environment. No domain/tool execution is enabled here.

### Decisão C2
- O token C2 padrão é opaco e protegido por hash pelo Doorkeeper.
- `resource` é persistido no grant/token Doorkeeper e deve ser igual à URL exata do MCP.
- `mcp:public:read` é o único escopo público desta fase.
- O Resource Server revalida atividade, recurso, escopo, titular e aplicação; nunca aceita JWT web ou ID token.
- A validação JWT RS256 permanece somente como modo legado explícito para os testes existentes. Não é o caminho de emissão C2 e não reivindica rotação JWKS.

### Environment (staging ONLY until AppSec approval)
| Variable | Purpose |
| --- | --- |
| `MCP_REMOTE_TRANSPORT_ENABLED=true` | Global kill switch, defaults disabled |
| `MCP_REMOTE_AUTH_MODE=oauth` | OAuth mode; default `preview` keeps earlier private preview tests |
| `MCP_REMOTE_OAUTH_ENABLED=true` | Second OAuth-specific enablement switch |
| `MCP_OAUTH_RESOURCE=https://<staging-host>/mcp` | Exact OAuth audience and protected resource |
| `MCP_OAUTH_ISSUER=https://<trusted-auth-server>` | Exact issuer; never inferred from request headers |
| `MCP_OAUTH_TOKEN_FORMAT=opaque` | C2 default; `jwt` is legacy compatibility only |
| `MCP_REMOTE_ALLOWED_HOSTS=<staging-host>` | Host allowlist: no wildcard |
| `MCP_REMOTE_ALLOWED_ORIGINS=<allowed-web-clients>` | Origin allowlist: exact values, no wildcard |

Do not place credentials or private keys in this documentation, GitHub Actions or the frontend bundle.

### Endpoints

`GET /.well-known/oauth-protected-resource/mcp` exposes RFC 9728 metadata **only** with a complete valid OAuth resource configuration. No bearer required for metadata; the same host/origin restrictions apply. Metadata advertises the exact HTTPS resource, the authorization server issuer and the single read scope.

`POST /mcp` accepts OAuth bearer tokens *only* in OAuth mode; no fallback to preview API keys, legacy cookies, user-supplied `tenant_id`, or trusted User-Agent values. Requests without a valid access token receive HTTP 401 `WWW-Authenticate` referencing the resource metadata; valid tokens without the read scope receive 403 `insufficient_scope`. Token claims are never logged.

### Validação de token opaco

`Doorkeeper::AccessToken.by_token` mais `accessible?`, `resource` exato, escopo obrigatório e sujeito estável `user:<id>` são obrigatórios. Revogação e refresh permanecem sob Doorkeeper. Bearers não são registrados em logs.

### Validação JWT legada

Strict `RS256` signed access tokens, `typ=at+jwt` or `application/at+jwt`, mandatory `iss`, `aud`, `sub`, `jti`, `iat`, `exp`, bounded `scope` string. Exact issuer and audience match; `mcp:public:read` is mandatory.

O caminho legado rejeita token cujo `jti` com issuer esteja em `Rails.cache` em `mcp:oauth:revoked:<sha256(issuer:jti)>`. Esse cache não é a autoridade de revogação do C2.

### Unimplemented blockers (do not enable externally)
- No staging PKCE redirect proof with an independent MCP client.
- No external client interoperability or production DNS/TLS evidence.
- No automated JWKS key rotation because JWT is not the selected C2 format.
- No private MCP tenant authorization; this belongs to C3.
- No tenant/client grant data model or entitlements.
- No rate limit/metering or token identity access audit.
- No execution of any `tools/call`; the five names remain discoverable-only.
- No independent conformance tests with ChatGPT / Claude.
- No reviewed public DNS, production TLS, SRE runbook, DPO signoff.

### Acceptance matrix

- [x] Resource metadata and advertised scope implemented in isolated Rails route.
- [x] Signed bearer token validation, wrong issuer/audience, expiry, scope and fake signature request tests committed.
- [x] Misconfiguration fails closed, preview token never authenticates OAuth mode.
- [ ] Real AS discovery + OAuth Authorization Code PKCE end-to-end proof.
- [ ] JWKS rotation and provider revocation test.
- [ ] SRE/AppSec approval and production-ready client registration.

See `docs/mcp/TEST-AND-RELEASE-GATES.md`; next PR-MCP-05 must add quota, policy and request safety before PR-MCP-06/07 may execute.
