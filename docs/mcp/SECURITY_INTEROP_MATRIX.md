# MCP-09 — adversarial and external interoperability gates

**Status:** code/contract tests implemented in Draft PR; real client conformance and staging calls remain unverified until an OAuth provider, DNS, TLS and staging secrets are provisioned.

## Automated matrix in repository

| Gate | Existing/New test evidence | Expected |
|---|---|---|
| No internal tool leakage | public registry + `public_directory_execution_spec` | deny admin/revenue/lead tools even with valid OAuth |
| Correct audience/issuer and signature | `oauth_resource_spec` | HTTP 401 invalid token |
| Scope downgrade | `oauth_resource_spec` | HTTP 403 with RFC 6750 scope challenge |
| Disabled/preview-only execution | `public_directory_execution_spec` | tools/call denied |
| Redis unavailable and quota | `remote_quota_spec`, `remote_quota_policy_spec` | HTTP 503/429; no bypass |
| Cursor spoofing/replay | `cursor_spec` | signed user/filter bindings required |
| Approved reviews | `reputation_service_spec` | count only approved; 0 reviews -> null average |
| Private or extra output keys | `output_validator_spec` | fail closed; no raw buyer contact or token |
| Oversized output | `output_validator_spec` | fail closed before response |
| Modern mirrored headers | `modern_transport_spec` | reject body/header mismatch |
| Error redaction | internal error specs + remote controller | generic JSON-RPC errors only |

## Staging-only external smoke

`.github/workflows/mcp-staging-interop-smoke.yml` is **manual only**, behind a dedicated `mcp-staging` environment and explicit `STAGING_ONLY` confirmation. It requires:
- Environment variable `MCP_STAGING_RESOURCE_URL`, HTTPS with a hostname containing `staging` under `avaliasolar.com.br`, exact `/mcp` path.
- Environment secret `MCP_STAGING_ACCESS_TOKEN`: valid short-lived OAuth access token from the selected IdP, scoped to the public read resource. Never store in Git.
- Stage backend configured with exact issuer/audience/RS256 public key, Host and Origin allowlists, Redis policy and explicit tool execution flag.

The Ruby smoke probes `server/discover`, exactly five `tools/list` entries, `tools/call list_solar_categories`, and a deliberately rejected private tool. It fails on unexpected HTTP status, signature/capability errors or private-tool exposure; it does not issue writes.

The smoke script is a **plain JSON-RPC HTTP client**, **not an independent official MCP SDK implementation**. This is a necessary complement, not a substitute, for an official TypeScript/Python/Ruby SDK client conformance test.

## SDK clients and negative scenarios to execute manually

1. Independent modern 2026-07-28 SDK connects and discovers five read-only tools.
2. Invoke each of the five public tools with real staging data; inspect structuredContent.
3. Repeat from a second independently implemented SDK/client.
4. Wrong audience, invalid signature, expired token, revoked JTI and insufficient scope must be denied.
5. Tamper `Mcp-Method`/`Mcp-Name` vs JSON-RPC body; protocol must reject.
6. Replay pagination cursor under another identity or changed filters; reject.
7. Pending/rejected/contested reviews must not appear in aggregates or result bodies.
8. Tool descriptions and company-supplied content with malicious agent instructions must remain untrusted data.
9. Observe p95, rate limit 429, capacity, non-5xx success and operational logging.
10. Disable global feature flag and prove immediate fail-closed rollback.

## Remaining blockers

- Real OAuth provider configured/tested with PKCE S256 and issuer stamping, client registration and token rotation.
- Independent official SDK client tests, not just these internal request specs.
- Staging and public DNS/TLS setup, user permissions, on-call, operational metrics alerts.
- Data/Privacy/DPO review and marketplace listing approvals.

**Gate decision:** no `GO` until all mandatory independent staging and security tests pass. A green GitHub CI proves only local test contracts.
