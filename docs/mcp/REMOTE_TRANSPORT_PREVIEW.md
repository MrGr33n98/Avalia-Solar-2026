# PR-MCP-02 — Remote MCP transport preview (not publicly enabled)

**State:** Implementation proposal for a restricted, executable-preview transport. **Do not enable on production.**  
**PR scope:** Transport framing and isolated discovery only; no customer access, billing, OAuth, or actual tool execution.  
**Protocol supported in this PR:** MCP Streamable HTTP **2025-11-25** (handshake era), JSON-RPC 2.0 / JSON response path.  
**Not yet supported:** MCP **2026-07-28** modern stateless `server/discover` lifecycle, SSE response streaming, OAuth 2.1, actual tool execution or public ChatGPT/Claude connector approval.

## Why the protocol version is pinned

MCP 2026-07-28 removed the mandatory `initialize` flow, GET event-stream endpoint, and session IDs. This PR explicitly implements a minimal compatibility baseline for older handshake-based clients; do **not** claim 2026-07-28 interoperability until a separate SDK-backed contract suite passes.

References:
- https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2025-11-25/basic/transports.mdx
- https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2026-07-28/basic/transports/streamable-http.mdx
- https://ruby.sdk.modelcontextprotocol.io/protocol-versions/

## Route

`POST /mcp` — feature gated, private preview.  
`GET /mcp` and `DELETE /mcp` — HTTP 405 (no independent SSE subscription or session termination).  
Future deployment proposal: `https://mcp.avaliasolar.com.br/mcp` after OAuth, DNS, TLS, origin validation and infra routing review; this address is not asserted as active.

This route is **not** the existing proprietary `POST /api/v1/mcp/tools/:tool_name`; the old authenticated internal dispatcher is unchanged.

## Secure preview gating

By default, endpoint responds with 404 to all methods unless BOTH are true:

1. `MCP_REMOTE_TRANSPORT_ENABLED=true`
2. `MCP_REMOTE_PREVIEW_TOKEN` is configured as a high-entropy secret of >= 32 bytes.

Each preview request must carry `X-MCP-Preview-Key` equal to the secret. Missing/wrong key results in 404; do not put this secret in client-side JavaScript or URL parameters.

`Origin` validation: requests carrying an Origin must exactly match one comma-separated entry in `MCP_REMOTE_ALLOWED_ORIGINS`. Empty allowlist means all Origin-bearing requests are denied. No wildcard. Requests without an Origin still require the preview key.

**Security boundary:** This preview token is an internal staging/developer control, NOT OAuth. Never reuse these credentials as customer access or assume an MCP connector can supply this header. For external launch, replace this preview gate with a standards-compliant authorization resource server.

## Implemented operations

| Method | Behavior |
|---|---|
| `initialize` | Responds with protocolVersion 2025-11-25 and read-only tools capability |
| `notifications/initialized` | 202 Accepted with empty body |
| `ping` | Empty JSON-RPC result |
| `tools/list` | Five public tools from `Mcp::PublicToolRegistry.list` |
| `tools/call` | Always denies (no domain service invoked) |
| Other methods | JSON-RPC method-not-found error |

## Explicitly disabled or absent

- OAuth and PKCE — PR-MCP-04.
- Cross-tenant access and entitlements — PR-MCP-05.
- Domain invocation adapters — PR-MCP-06/07.
- Modern 2026-07-28 discovery and metadata headers — next protocol compatibility milestone.
- Asynchronous notifications, SSE streaming, resources/prompts and MCP sessions.
- Identity-aware quotas, public rate limiting, marketplace verification, hosted production availability.

## Wire contract

Clients must POST one JSON-RPC object with:
- `Content-Type: application/json`.
- `Accept: application/json, text/event-stream`.
- `MCP-Protocol-Version: 2025-11-25` for requests after `initialize`.
- `X-MCP-Preview-Key` only during nonpublic tests.

Request max 32,768 UTF-8 bytes. Responses always JSON for valid requests. No proxy-specific text streaming.

All errors are scrubbed to standard JSON-RPC codes with correlation by server-side `request_id`; exception messages and stack traces are never returned to the client.

## Example local test (for maintainers only)

1. On an isolated development instance, set `MCP_REMOTE_TRANSPORT_ENABLED=true`, configure a generated random `MCP_REMOTE_PREVIEW_TOKEN` and a narrow `MCP_REMOTE_ALLOWED_ORIGINS` as necessary.
2. Invoke POST `/mcp` with a client that sends the required headers and an `initialize` JSON-RPC request with `protocolVersion: 2025-11-25`, `capabilities: {}` and `clientInfo` (name/version).
3. Send `notifications/initialized`; expect HTTP 202.
4. Send `tools/list`; expect exactly five public read-only entries.
5. Send `tools/call`; expect an error and no company or tenant data access.
6. Remove the feature flag; expect 404.

## Tests and release gates

- Request spec: `AB0-1-back/spec/requests/api/v1/mcp/remote_transport_spec.rb`.
- Existing internal MCP request specs must remain green.
- CI baseline: `.github/workflows/ci-web-backend.yml`.
- A green PR is not approval to enable this endpoint in production.
- Before integration with external clients: test complete handshake lifecycle against the official SDK; implement current modern lifecycle, OAuth discovery/PKCE, strict input schema validation, SSRF/Origin controls, quota, tenancy and data provenance.
- Do not merge this PR if any required test fails; resolve failures without disabling checks.

## Rollback

Revert the PR or keep `MCP_REMOTE_TRANSPORT_ENABLED` unset/false; existing internal MCP APIs and the Brand Page remain unaffected.
