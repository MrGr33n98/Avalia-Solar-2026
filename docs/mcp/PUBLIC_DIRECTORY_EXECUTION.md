# MCP-06 — public read-only directory (staged implementation)

**Status:** review/CI required. Source of truth is Rails models and approved public records, not the internal MCP dispatcher. Does not enable production endpoints by default.

## Three implemented public read-only tools

1. `list_integrators`: Active companies only, exact state/HQ city filters, verified flag, active category slug, name/slug search, deterministic ordering and signed bounded pagination.
2. `show_integrator_profile`: Active company only, explicit profile attributes, canonical HTTPS brand-page URL, HQ and separately declared service coverage. No lead contact data.
3. `list_solar_categories`: Active categories only, stable SEO slug, parent identity, bounded pagination. `vertical` is not yet a proven taxonomy attribute and is rejected rather than inferred.

All input shapes pass `Mcp::Public::InputValidator`; unknown keys, spoofed tenant, invalid IDs, unsupported sorts and unbounded limits raise a safe JSON-RPC invalid-argument response. The identity-bound cursor expires after 10 minutes and limits scanning to 500 records; dataset changes may shift offset pages, so stable snapshot pagination remains a hardening task.

All outputs include `schema_version`, `data_as_of`, `source_type`, `data` and `limitations`. Descriptions are stripped of HTML, length-limited, and treated as untrusted data, never instructions. URLs are generated from the fixed public host, never supplied by the agent.

## Execution gating — MUST ALL hold

- `MCP_REMOTE_TRANSPORT_ENABLED=true`
- `MCP_REMOTE_AUTH_MODE=oauth` and `MCP_REMOTE_OAUTH_ENABLED=true` with valid issuer/audience/RS256 provider token and `mcp:public:read` scope.
- `MCP_REMOTE_POLICY_ENABLED=true` with working Redis atomic rate limiting.
- `MCP_PUBLIC_TOOLS_EXECUTION_ENABLED=true` (defaults OFF).
- Exact allowed Host/Origin validation.
- Verified OAuth token includes issuer, sub and signed client identifier, no public tool argument is treated as authorization.

The modern 2026-07-28 protocol dispatches only through `Mcp::Public::Executor`, not `ToolsController::TOOL_REGISTRY`. The 2025-11-25 preview retains `tools/call` disabled. `get_integrator_reputation` and `compare_integrators` remain disabled until PR-MCP-07.

## Acceptance tests

- Active/inactive company cases and non-enumerating not-found.
- Public profile fields exclude buyer contacts, individual intents and private account data.
- Unknown category slug, unknown sort, arbitrary SQL/tenant input rejected.
- Signed pagination cursor rejects query or identity mismatch.
- OAuth + policy + tool flag needed before real `tools/call`; private tools rejected.
- Data correctness against staging database remains required before shipping.

**Open risks:** Query planner cost and index review, public visibility beyond status=active, safe HTML handling, offset cursor snapshots, rate/latency load tests, security policy sign-off and client SDK conformance. Do not enable in production on the basis of CI alone.
