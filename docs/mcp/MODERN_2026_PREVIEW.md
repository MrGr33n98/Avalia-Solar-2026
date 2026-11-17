# MCP-02B — Modern 2026-07-28 stateless transport (restricted preview)

**Status:** Recovery PR targeting main after the original #146 was merged into a feature branch, not main. **Not production-enabled.**  
**Scope:** Support modern stateless discovery and metadata validation on the same private `POST /mcp` endpoint.

## Motivation and source of truth

The MCP specification changed materially in revision 2026-07-28:
- The modern era no longer uses the `initialize` / `notifications/initialized` handshake or protocol-level sessions.
- Every request sends version and client capabilities in `params._meta`.
- HTTP requests mirror version and method in `MCP-Protocol-Version` and `Mcp-Method`; `tools/call` additionally requires `Mcp-Name`.
- `server/discover` is mandatory; `tools/list` results carry `resultType`, `ttlMs` and `cacheScope`.
- Server validation must reject incompatible body/header values with `HeaderMismatch` (`-32020`, HTTP 400).
- Unsupported protocol versions use error `-32022`, HTTP 400, with `data.supported` and `data.requested`.

References:
- https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2026-07-28/server/discover.mdx
- https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2026-07-28/basic/transports/streamable-http.mdx
- https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/schema/2026-07-28/schema.ts

## Modern preview operations

| Method | Result |
|---|---|
| `server/discover` | `resultType=complete`, protocol versions, tool capability and server metadata; TTL=0, cache=private |
| `tools/list` | Five defined public tools only; TTL=0, cache=private; never serializes internal sources |
| `tools/call` | **Always rejected**, even for the five public tools |
| Unknown method | `-32601`, HTTP 404 |
| `initialize` with legacy protocol | Legacy 2025-11-25 preview path remains compatible |

Modern path does not support `ping` (removed in 2026-07-28).

### HTTP security and compatibility

The feature gates are inherited unchanged from PR #145:
- `MCP_REMOTE_TRANSPORT_ENABLED` defaults off.
- Private test key must match `X-MCP-Preview-Key`; this is **not OAuth**.
- Hosts are constrained by `MCP_REMOTE_ALLOWED_HOSTS`; Origin by `MCP_REMOTE_ALLOWED_ORIGINS`.
- Input JSON and request size are validated before protocol parsing.
- No arbitrary SQL, admin tools, contacts, leads, campaigns, or buyer-intent data.
- No session identifiers are created; no GET SSE subscription or session deletion.
- Header values are checked against JSON-RPC method and tool name, including the supported Base64 sentinel for `Mcp-Name`.
- HTTP responses contain no raw exception messages or stack traces.

## Test and release gates

**Automated:** `spec/requests/api/v1/mcp/modern_transport_spec.rb` verifies modern stateless discovery, no-session behavior, five tools, immutable scope, mismatch errors, unsupported versions, Base64 names, no tool execution, legacy handshake, key rejection and method errors.

**Required before production activation:**
1. CI passes all required jobs, including RSpec and Playwright.
2. Validate against an independent 2026-07-28 MCP SDK client and formal conformance cases (not claimed in this PR).
3. OAuth 2.1 resource authorization, discovery, audience, revocation and scoped grants.
4. Strict tool argument validation, cross-tenant protections and usage quotas.
5. Domain adapters execute only reviewed read-only services.
6. SRE enablement, on-call, metrics, staging smoke and feature-flag rollback.
7. Any caching and listing results respect authorization context.

**No merge or production rollout by this document.** Review on GitHub.

## GitHub PR dependency

PR #145: feature-gated route and 2025-11-25 legacy handshake preview.  
This PR: modern 2026-07-28 per-request stateless preview **stacked on #145** to keep review focused.

After #145 merges into `main`, retarget this PR to `main` and verify that the diff contains only the modern handler, controller adaptation, tests and this documentation.
