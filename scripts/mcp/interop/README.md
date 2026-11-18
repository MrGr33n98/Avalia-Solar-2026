# Avalia Solar C4 — Two independent MCP SDK v2 clients

These are **manual test clients**, not deployable MCP servers. They use
the official MCP Python v2 and TypeScript v2 SDKs with a staging-only
OAuth bearer token issued for the exact resource. Never use production.

## Python

    python3 -m venv .venv-c4
    . .venv-c4/bin/activate
    pip install 'mcp>=2,<3'
    MCP_SMOKE_CONFIRMATION=STAGING_ONLY MCP_SDK_TARGET=public python3 scripts/mcp/interop/python_sdk_v2_smoke.py

## TypeScript

    npm install --prefix scripts/mcp/interop --no-audit --no-fund
    MCP_SMOKE_CONFIRMATION=STAGING_ONLY MCP_SDK_TARGET=public node scripts/mcp/interop/typescript_sdk_v2_smoke.mjs

### Required staging configuration

| Target | Resource URL env | Access token env | Other |
| --- | --- | --- | --- |
| public | `MCP_STAGING_RESOURCE_URL` | `MCP_STAGING_ACCESS_TOKEN` | — |
| private | `MCP_STAGING_PRIVATE_RESOURCE_URL` | `MCP_STAGING_PRIVATE_ACCESS_TOKEN` | `MCP_STAGING_PRIVATE_COMPANY_ID` |

Use a secure environment/secret store. Never paste bearer tokens,
customer data or credentials into PRs, issues, chat or logs.
All client scripts demand HTTPS in the approved Avalia Solar staging domain
and the exact public/private resource path. They reject missing consent.

The two SDKs validate the negotiated 2026-07-28 protocol, exact tool
allowlists and one read-only call. A separate Ruby staging smoke covers
cross-tenant and invalid/missing-token denial. The SDK smokes consume
preissued tokens: they are **not** browser OAuth login/consent/refresh tests.

## References

- https://ts.sdk.modelcontextprotocol.io/v2/protocol-versions
- https://py.sdk.modelcontextprotocol.io/v2/client/transports/
- docs/mcp/C4_IMPLEMENTATION_AND_RELEASE_GATES.md

Do not claim integration with ChatGPT or Claude based on these SDK tests alone.
Live SDK smoke requires approved staging infrastructure and credentials.
