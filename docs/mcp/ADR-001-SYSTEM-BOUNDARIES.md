# ADR-001–012 — Avalia Solar MCP public interoperability and DDD boundaries

**Status:** PROPOSED / pending Product, Backend, AppSec and DPO approval.  
**Applicability:** External, public-read-only MVP, separate from existing internal MCP tools.  
**Decision record baseline:** 2026-11-16, main commit `38380c84d3e57f659a2593c4aea375e8cb437a5e`.

## ADR-001 — Reuse Rails, do not duplicate domain logic
- **Context:** Rails already owns Company, Review, Category, Product and request policies.
- **Decision:** Implement a protocol-compliant adapter and anti-corruption layer on top of existing domain services.
- **Rejected:** New independently writable data plane or direct database adapter.
- **Consequence:** Route/model implementation remains an internal API detail.

## ADR-002 — Public MCP is a separate security boundary
- **Decision:** Explicit allowlist of five R0 read tools. Do not publish `ToolsController::TOOL_REGISTRY` wholesale.
- **Control:** Discovery, execution and error handling must all enforce the same allowlist.
- **Consequence:** An internal tool must remain undiscoverable AND uncallable through the external endpoint.

## ADR-003 — Protocol before marketplace
- **Decision:** Target MCP Streamable HTTP with standardized initialization, discovery and invocation, pinned to a tested supported protocol version.
- **Open:** Validate official SDK/support matrix before choosing Ruby vs a thin isolated gateway.
- **Gate:** End-to-end compatibility with at least two independently implemented clients.

## ADR-004 — Identity, policy and scopes
- **Decision:** Adopt standards-compliant OAuth authorization for private tools; public discovery follows explicitly approved unauthenticated policy. External scopes are capability-specific; never trust client-supplied tenant IDs.
- **Required tests:** PKCE, token audience, expiry, revocation, cross-tenant access, scope downgrade.
- **Consequence:** Company JWT/header-based internal auth is NOT automatically suitable for external clients.

## ADR-005 — Bounded Contexts
- Company Directory: `Company` aggregate, public identity, categories, HQ and declared coverage.
- Reputation: `Review` aggregate, moderation, verified status and published aggregates.
- Catalog: `Product`, `CompanyProduct`, specification templates and relations.
- Buyer Intent: `BuyerIntentActivity` and derived `IntentScore`, strictly private until separately approved.
- Enterprise Control Plane: `Tenant`, `Client`, `Grant`, `Entitlement`, `ToolInvocation` (future contracts, not asserted as existing models).
- **Mapping:** External MCP name is a facade; the owning bounded context is authoritative.

## ADR-006 — Source and missingness are first-class
- **Decision:** Return `source_type`, `data_as_of`, limitations and missing fields.
- **Source enums:** `company_declared`, `platform_verified`, `review_aggregate`, `platform_derived`, `public_reference`, `unknown`.
- **No inference:** Headquarters location never implies company service coverage; `verified=true` never implies a specific certification.

## ADR-007 — Reputation is approved-only
- **Decision:** Use only published approved reviews; distinguish `average_rating: null` and `sample_size: 0` from zero rating.
- **Rejected:** Returning pending/rejected review text, reviewer PII or unsubstantiated sentiment analysis.

## ADR-008 — Strict tool schemas and pagination
- **Decision:** Reject undeclared input fields; clamp or reject limits according to contract; default 10, maximum 20.
- **Future pagination:** Opaque cursor bound to filter, identity and version; no unbounded scans or arbitrary SQL.
- **Rollback:** Version contracts; never silently change field semantics.

## ADR-009 — Rate limiting and metering are distinct
- **Decision:** Preserve internal controller's 60 requests/min per user-or-IP and tool as defense in depth; external quotas are per tenant/client/plan and cost.
- **Suggested pilot:** 20 requests/min anonymous, 30 Free, 50 Growth; operational load testing required.
- **Controls:** Atomic counters, Retry-After, maximum payload size, timeout, concurrency and anti-enumeration.

## ADR-010 — Treat returned content as untrusted
- **Decision:** Review text, company descriptions, product data and URLs are data, not agent instructions.
- **Controls:** Strict tool contracts, no arbitrary URL fetch, HTML sanitization, scope checks, bounded output and redaction.
- **Test:** Malicious review cannot trigger hidden tool, reveal credentials or alter selection policy.

## ADR-011 — No buyer-contact data resale
- **Decision:** Public MCP contains no leads, phone/email of buyers, individual intent histories, admin dashboards or CRM data.
- **Future Enterprise:** Only legally reviewed and contractually licensed regional aggregates with suppression thresholds and anti-reidentification review.
- **Gate:** DPO/legal sign-off before enabling intent tools.

## ADR-012 — Operational release and kill switch
- **Decision:** Public gateway feature disabled by default until external auth, SLO, audit, rollback and staging evidence are green.
- **CI:** Existing `.github/workflows/ci-web-backend.yml` mandatory gates remain unchanged in early PRs.
- **Release:** Deploy is a separately authorized step and must verify the serving SHA and real tool handshake, not just green build checks.

## Control Plane / Data Plane

| Control Plane | Data Plane |
|---|---|
| TLS/WAF and MCP protocol gateway | Company Directory services |
| Authorization server and OAuth resource metadata | Reputation and moderated Review data |
| Tool catalog/version and policy decisions | Category/Product Catalog |
| Tenant entitlements, quotas and usage | Buyer Intent aggregate service (future, private) |
| OTel tracing, audit and incident response | Competitive Intelligence (future, licensed) |

**Implementation choice:** logical boundaries within Rails at launch; physical separation only with measured load and tenancy requirements.

## Open decisions for review

1. SDK, language and exact MCP protocol revision/client matrix.
2. Public anonymous access versus OAuth on all endpoints for each marketplace.
3. Verification-seal semantics and evidence availability.
4. LGPD controller/processor contractual arrangements for external clients.
5. Validity rules and public data-retention periods.
6. Should MCP usage be bundled in Pro or sold as optional Growth add-on?
