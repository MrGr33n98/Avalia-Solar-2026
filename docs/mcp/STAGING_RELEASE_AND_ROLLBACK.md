# MCP-10 — Staging, production gates and rollback runbook

**Release state: NO-GO until explicit product/security/operations approval.**
This runbook is a proposed controlled rollout, **not evidence of any completed deployment**.

## Immutable release and isolation principles

1. Source of truth is the approved `main` commit SHA. Never deploy an unreviewed stacked PR.
2. Do not enable public MCP unless the OAuth authorization server, read-only data policies, quotas and monitoring have passed staging tests.
3. Keep `MCP_REMOTE_TRANSPORT_ENABLED` unset or `false` in production by default.
4. Separate production authorization `MCP_REMOTE_PRODUCTION_ENABLED=true` is required **in addition** to the transport switch and `MCP_REMOTE_AUTH_MODE=oauth`. Preview-key mode cannot be enabled in production.
5. `MCP_PUBLIC_TOOLS_EXECUTION_ENABLED` must be set separately after all gates pass; its absence means no real `tools/call`.
6. Never use the internal `/api/v1/mcp/tools/:tool_name` dispatcher as a public fallback.

## Deployment dependency order

- MCP-02B: modern protocol recovery and target CI on main.
- MCP-04: externally issued OAuth bearer access tokens (strict issuer, audience, scope).
- MCP-05: Redis quota and caller identity enforcement.
- MCP-06: directory/public category tools with strict inputs and provenance.
- MCP-07: approved-review reputation and objective comparisons.
- MCP-08: instrumentation with bounded no-PII labels; integrate collector and dashboards.
- MCP-09: security-adversarial tests and independent SDK interoperability.
- MCP-10: staging/production release policy, rollback and incident response.

All Pull Requests are subject to existing `CI — Web & Backend` and any mandatory MCP contract checks; do not bypass them to accelerate a release.

## Staging setup checklist

- [x] Provision **separate** staging hostname (`mcp-staging.avaliasolar.com.br`) with DNS, valid TLS and HTTP POST route to Rails `/mcp`. Configurado e validado com TLS ativo via Nginx Proxy Manager no IP `64.225.59.107`.
- [x] Provision the self-hosted Rails/Devise/Doorkeeper Authorization Server in the isolated staging stack; register exact resource `https://mcp-staging.avaliasolar.com.br/mcp`, read scope `mcp:public:read`, client IDs and PKCE S256 redirect allowlists.
- [x] Confirm opaque Doorkeeper token lookup, resource, scope, expiration, refresh rotation and revocation.
- [x] Configure `MCP_REMOTE_ALLOWED_HOSTS` and `MCP_REMOTE_ALLOWED_ORIGINS` as exact allowlists; no wildcards.
- [x] Configure `MCP_REMOTE_TRANSPORT_ENABLED=true`, `MCP_REMOTE_AUTH_MODE=oauth`, `MCP_REMOTE_OAUTH_ENABLED=true`, `MCP_REMOTE_POLICY_ENABLED=true`, and `MCP_PUBLIC_TOOLS_EXECUTION_ENABLED=true` on staging.
- [x] Verify dedicated Redis availability and configured network/proxy IP trust; rate and concurrency protections fail closed.
- [x] Provision restricted `mcp-staging` GitHub environment with `MCP_STAGING_RESOURCE_URL` variable and `MCP_STAGING_ACCESS_TOKEN` secret.
- [x] Confirm no private/admin/lead/CRM operations are externally discoverable or callable.
- [x] Review actual public profiles, service coverage semantics, approved reviews and PII suppression.

## Validation before any production approval

- [ ] Collect green results for every merged SHA on main, including the targeted remote MCP gate.
- [ ] Run `MCP Staging — External OAuth Interoperability Smoke` manually with `STAGING_ONLY`; the workflow must not run without staging credentials and approvals.
- [ ] Test all five public tools with **two independently implemented, actual MCP SDK clients**. Plain `curl`/Ruby JSON-RPC is not enough.
- [ ] Verify OAuth full authorization-code + PKCE S256 flow (including invalid redirects, resource mismatch, scope downgrade, rotation/revocation) with the configured self-hosted Authorization Server.
- [ ] Test rate limit 429/Retry-After, Redis outage 503, oversized payloads, unauthorized tools, replayed cursors, unapproved reviews, prompt injection and wrong-tenant attempts.
- [ ] Capture p50/p95/p99 latency and errors under staged realistic concurrency; proposed objectives p95 <800ms for simple calls, 5xx <0.5%, successful valid calls >99%.
- [ ] Prove telemetry reaches the agreed provider without PII/token/subject/IP and that alerts work.
- [ ] Confirm rollback procedure in staging and compare SHA before/after rollback.
- [ ] Obtain Product/Backend/AppSec/DPO/SRE written GO decision and a staffed on-call window.

## Production release sequencing

1. Merge approved PRs **in dependency order**, one at a time; rebase/retarget each successive stacked PR to `main` and verify that only its incremental diff remains. Do not squash a child PR into a stale feature branch.
2. Verify production CI/release SHA and deploy only via existing protected CD workflow, with all gating flags **off**.
3. Confirm public site and internal Rails health are stable, without assuming a green Action implies external MCP readiness.
4. After self-hosted OAuth, staging interoperability and security review pass, use a change ticket with explicit owner to configure production OAuth resource/issuer, Host/Origin allowlists and Redis. Keep `MCP_REMOTE_PRODUCTION_ENABLED=false`.
5. Enable production switches with an approved staged rollout: `MCP_REMOTE_PRODUCTION_ENABLED=true`, `MCP_REMOTE_TRANSPORT_ENABLED=true`, `MCP_REMOTE_AUTH_MODE=oauth`, `MCP_REMOTE_OAUTH_ENABLED=true`, `MCP_REMOTE_POLICY_ENABLED=true`. Keep `MCP_PUBLIC_TOOLS_EXECUTION_ENABLED=false` until authorized.
6. Confirm OAuth resource metadata and discovery; test 401/403, invalid Host and private tool denial. Only then separately enable `MCP_PUBLIC_TOOLS_EXECUTION_ENABLED=true`.
7. Pilot with approved clients, observe quotas/latency/errors, maintain explicit rollback readiness. No automatic marketplace submission or registration.

## Emergency rollback / kill switches

- **First response:** unset or set `MCP_PUBLIC_TOOLS_EXECUTION_ENABLED=false`; tool execution stops at the modern protocol dispatcher.
- **Full stop:** set `MCP_REMOTE_TRANSPORT_ENABLED=false` or `MCP_REMOTE_PRODUCTION_ENABLED=false`; external route returns HTTP 404.
- Revoke exposed OAuth tokens at the Authorization Server, invalidate local cache and rotate verification keys when necessary.
- If a bad release affected Rails beyond MCP, deploy the last known healthy production SHA using the existing protected workflow; verify application state and audit logs.
- On-call records exact SHA, incident timeline, traces without PII, and approvals. Never paste bearer token/private keys into incident tickets or chat.
- Retest 401/403/404, private-tool denial and internal service health after rollback.

## Marketplace / pilots (G5)

- ChatGPT and Claude: independently demonstrate five positive tool calls, invalid-token, insufficient-scope and private-tool rejection; check current directory and connector onboarding requirements.
- Gemini Enterprise: independently test supported custom MCP connector and organization authorization if applicable.
- Publish privacy and terms, contact/support, data provenance and retention rules. Review sponsored visibility vs organic reputation.
- Directory inclusion requires **explicit provider approval**; preparing this runbook does not imply registration or certification.

## Outstanding external dependencies

Identity provider registration, token/client issuance, actual DNS/TLS setup, cloud environment/secrets, external SDK interop, metrics exporter, DPO/AppSec sign-off and production approval **cannot be completed by merging code alone**.

**Current release decision: NO-GO.** Do not enable MCP in production until every required gate above is checked with evidence.
