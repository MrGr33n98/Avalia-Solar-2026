# MCP-04 — OAuth 2.1 resource-server boundary (implementation draft)

## Scope of this PR

This work adds **resource-side token validation** to the isolated `/mcp` adapter. Avalia Solar remains a *protected resource* and does **not** mint tokens, perform OAuth redirects, register client IDs or implement an authorization server. Authorization Code + PKCE (S256), issuer stamping (RFC 9207) and client-registration/CIMD behavior belong to the selected external AS and the consuming client. **End-to-end OAuth cannot be claimed until a provider is connected and tested.**

The endpoint stays off unless explicitly authorized in a controlled environment. No domain/tool execution is enabled here.

### Prerequisite external decisions
- Choose and configure an OAuth provider (e.g. Auth0, Keycloak, Entra ID) that supports OAuth 2.1 / PKCE S256 and access-token signing.
- Register the resource/audience and permission `mcp:public:read`.
- Register approved MCP clients with secure redirect policies, allowed users, tenant boundaries and consent.
- Require access tokens signed with `RS256` and `typ=at+jwt`; the resource server intentionally rejects ID tokens. Issuer-specific token shapes must be verified in staging; do not relax these requirements silently.
- Provide the *public* signing key, delivered securely from the provider. This initial resource verifier expects a pinned key; automatic JWKS rotation/introspection and provider-side revocation are mandatory later.

### Environment (staging ONLY until AppSec approval)
| Variable | Purpose |
| --- | --- |
| `MCP_REMOTE_TRANSPORT_ENABLED=true` | Global kill switch, defaults disabled |
| `MCP_REMOTE_AUTH_MODE=oauth` | OAuth mode; default `preview` keeps earlier private preview tests |
| `MCP_REMOTE_OAUTH_ENABLED=true` | Second OAuth-specific enablement switch |
| `MCP_OAUTH_RESOURCE=https://<staging-host>/mcp` | Exact OAuth audience and protected resource |
| `MCP_OAUTH_ISSUER=https://<trusted-auth-server>` | Exact issuer; never inferred from request headers |
| `MCP_OAUTH_JWT_PUBLIC_KEY=<PEM>` | Provider's pinned RS256 PUBLIC verification key; no private signing keys |
| `MCP_REMOTE_ALLOWED_HOSTS=<staging-host>` | Host allowlist: no wildcard |
| `MCP_REMOTE_ALLOWED_ORIGINS=<allowed-web-clients>` | Origin allowlist: exact values, no wildcard |

Do not place credentials or private keys in this documentation, GitHub Actions or the frontend bundle.

### Endpoints

`GET /.well-known/oauth-protected-resource/mcp` exposes RFC 9728 metadata **only** with a complete valid OAuth resource configuration. No bearer required for metadata; the same host/origin restrictions apply. Metadata advertises the exact HTTPS resource, the authorization server issuer and the single read scope.

`POST /mcp` accepts OAuth bearer tokens *only* in OAuth mode; no fallback to preview API keys, legacy cookies, user-supplied `tenant_id`, or trusted User-Agent values. Requests without a valid access token receive HTTP 401 `WWW-Authenticate` referencing the resource metadata; valid tokens without the read scope receive 403 `insufficient_scope`. Token claims are never logged.

### Required JWT claims and validation

Strict `RS256` signed access tokens, `typ=at+jwt` or `application/at+jwt`, mandatory `iss`, `aud`, `sub`, `jti`, `iat`, `exp`, bounded `scope` string. Exact issuer and audience match; `mcp:public:read` is mandatory.

Optionally reject a token whose issuer-scoped hashed `jti` appears in `Rails.cache` at `mcp:oauth:revoked:<sha256(issuer:jti)>`. **This cache alone is not an external provider revocation or durable policy store.** Before production, implement provider revocation/introspection or short-lived credentials with tested rotation/revocation behavior.

### Unimplemented blockers (do not enable externally)
- No external OAuth authorization server or tested PKCE redirect flow.
- No automated JWKS key rotation; current verification key is pinned.
- No refresh/logout/revocation integration with provider.
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
