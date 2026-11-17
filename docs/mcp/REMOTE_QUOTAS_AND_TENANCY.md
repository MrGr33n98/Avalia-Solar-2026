# MCP-05 — Remote quota, identity and tenant-isolation policy

**Status:** implementation draft; stacked on MCP-04 (external OAuth). No production activation.

## The external boundary

All exposed capabilities remain **read-only public R0**. The external `/mcp` handler is not the legacy `/api/v1/mcp/tools/:tool_name`; there is no translation or wildcard fallback to the legacy dispatcher. Admin actions, CRM and lead export remain categorically out of scope.

Identity originates only from a validated signed OAuth token. `client_id` (or `azp`) from a trusted access token is required once the quota feature is enabled. A tool input, URL parameter, browser header or request body cannot establish tenant identity or change authorization scopes.

## Quota system

Flag: `MCP_REMOTE_POLICY_ENABLED=true`. Defaults off in existing preview tests, **but execution of a real tool MUST require this flag**. The HTTP enforcement hook runs only after authentication and before request parsing.

Counters use atomic Redis `EVAL INCRBY/EXPIRE` through Sidekiq's existing Redis connection, across all Rails replicas. No per-process memory fallback on Redis outage. Keys use server-keyed HMAC-SHA256 over client ID, subject or remote IP, preventing raw user identifiers from appearing in keys or logs.

| Dimension | Preview / minute | OAuth / minute |
|---|---:|---:|
| Identity | 20 | 30 |
| Validated OAuth client | 20 | 60 |
| Remote IP | 60 | 120 |

Daily per-client request cap: 200 preview / 500 OAuth. These are conservative **staging defaults**; production load testing must confirm them. Exceeded counters return HTTP 429 with `Retry-After`; Redis outage, malformed identity or disabled policy fail with HTTP 503.

Quotas are independently enforced and are not a commercial billing system. No token/user identity is logged or persisted in a new table by this PR. Limits are fixed window; concurrent excess is limited by Redis atomicity per counter (not a transactional all-dimensions operation). A rejected request may consume some counters, conservatively.

## Security decision: public-only MVP

Tenant membership and commercial entitlements are **not needed to read active public directory data**, and must not be simulated by client-supplied identifiers. When later private company tools are implemented, validate active membership with Rails policy + the OAuth identity/grant mapping, cache keys scoped by tenant, and negative tests using identities from separate companies.

**No private MCP tool is executable in this PR.** The feature gate for public tool execution is separate and must require both authorization and policy flags.

## Unresolved before external activation

- OAuth access token must include a reliable signed `client_id` / `azp`; provider integration and token tests required.
- Test active revocation, key rotation and multiple client identities against a real authorization server.
- Confirm Redis load, quota windows and IP trust-chain configuration behind the production proxy.
- Implement per-tool cost metering, concurrency budgets, read timeout and outage alerts for production.
- Define enterprise tenant membership/entitlement and permission grant models before any private tools.
- Provide auditable metrics, runbook, staging smoke and rolling rollback proof.

## Tests
- `spec/services/mcp/remote_quota_policy_spec.rb`: atomic Redis counters, error handling, key hashing and missing identities.
- `spec/requests/api/v1/mcp/remote_quota_spec.rb`: 429, Retry-After, 503 and unauthenticated rejection.
- Existing OAuth/transport specs unchanged and mandatory.

Security guarantees are contractual, not proof of production throughput. Do not publish the MCP endpoint based only on unit tests.
