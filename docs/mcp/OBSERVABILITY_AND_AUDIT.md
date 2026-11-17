# MCP-08 — Observability and privacy audit

**Status:** instrumented request events in a Draft PR. Not deployed or connected to a production OTel collector.

## Contract implemented

The controller emits a sanitized `mcp.remote.request` ActiveSupport notification after processed POST requests, plus structured Rails log containing ONLY:
- finite `operation`: initialize, ping, server/discover, tools/list, tools/call or unknown;
- finite `tool`: one of five approved public tools or unknown;
- outcome: completed / rejected / error; HTTP status and capped duration in ms;
- optional bounded alphanumeric request ID.

**Absolutely never emit** token, JWT, Authorization header, subject/user ID, IP address, raw tool arguments, query string, company/review content, buyer-intent data, client secrets or authentication failures' exception message.

This PR does **not** create user-level audit logs, a metrics database, a new analytics service, an outbound webhook or a vendor dependency.

## Proposed operational integration (blocked pending SRE)

- Subscribe existing OTel exporter / Rails instrumentation to `mcp.remote.request`, preserving finite labels to avoid cardinality explosions.
- Define counters by operation/tool/outcome and latency histogram (p50/p95/p99); do not use request ID as a Prometheus label.
- Keep privacy/retention controls consistent with infrastructure log retention.
- Alert on p95 > 800ms for the simple public tools, 5xx >= 0.5%, quota 429 anomalies, Redis unavailable and auth failures.
- Measure dashboard correctness from real requests on staging, never just mocked tests.
- Separate business metering/billing from operational logs. No billable events are emitted by this PR.

## Acceptance before production activation

1. A tracing backend receives the event without raw auth or PII.
2. Dashboards show request counts/latency/errors, by tool, for staging smoke traffic.
3. Scrub and retention policies reviewed by SRE + DPO.
4. Rollback and alerts rehearsed; no behavior change or outage on telemetry failure.
5. Authorization, quota and public-read-only execution feature flags remain required.

See `docs/mcp/TEST-AND-RELEASE-GATES.md` for G4/G5 criteria. Instrumentation exists; **tracing, export and alerting are not yet demonstrated**.
