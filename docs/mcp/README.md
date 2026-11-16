# Avalia Solar MCP — Implementation Program / PR-MCP-00

**Status:** Proposed architecture; not yet a public MCP server.  
**Baseline:** main @ `38380c84d3e57f659a2593c4aea375e8cb437a5e`, inspected 2026-11-16.  
**Decision:** Reuse the Rails domain services and existing `Mcp::` governance; provide an external, protocol-compliant *adapter* only after validating its security and interoperability. This PR is documentation-only.

## Why this project exists

Provide trustworthy Brazilian solar-energy company discovery, category navigation, approved-review reputation and objective comparison to ChatGPT, Claude and authorized business agents without selling individual buyer contacts or implying the marketplace performs installations.

## Verified starting point

| Domain | Existing source | Assessment |
|---|---|---|
| Tool invocation | `AB0-1-back/app/controllers/api/v1/mcp/tools_controller.rb` | Proprietary REST dispatcher; **not proof of Streamable HTTP MCP** |
| Existing tool registry | `ToolsController::TOOL_REGISTRY` | Contains public and sensitive internal tools; must not be exposed wholesale |
| Agent authorization | `AB0-1-back/app/services/mcp/agent_authorization_service.rb` | Existing identities/scopes, per-tenant restriction and HITL |
| Risk policy | `AB0-1-back/app/services/mcp/risk_classifier.rb` | R0–R4; prohibit arbitrary SQL/shell |
| Companies | `AB0-1-back/app/services/mcp/search_companies_service.rb` | Active-only; filters city of headquarters, state, category and verification |
| Profile | `AB0-1-back/app/services/mcp/company_profile_service.rb` | Public fields and declared geographic coverage |
| Approved reviews | `AB0-1-back/app/services/mcp/reviews_summary_service.rb` | Aggregates only approved reviews |
| Comparison | `AB0-1-back/app/services/mcp/compare_companies_service.rb` | 2–3 active companies; objective comparison |
| Categories | `AB0-1-back/app/models/category.rb` | Hierarchy/status exists; new public MCP adapter needed |
| Buyer Intent | `AB0-1-back/app/models/buyer_intent_activity.rb` and `intent_score.rb` | Internal buyer events exist; **not licensed for public distribution** |
| Domain documentation | `AB0-1-back/docs/mcp_mvp.md` | Ten internal MVP operations and privacy caveats |
| Existing CI | `.github/workflows/ci-web-backend.yml` | Preserve all mandatory gates |

## External P0 allowlist (proposed, not exposed yet)

1. `list_integrators` → existing `Mcp::SearchCompaniesService`, adapter with explicit HQ filter semantics.
2. `show_integrator_profile` → existing `Mcp::CompanyProfileService`.
3. `list_solar_categories` → `Category.active` via new read-only domain service.
4. `get_integrator_reputation` → existing `Mcp::ReviewsSummaryService`, correct empty review semantics.
5. `compare_integrators` → existing `Mcp::CompareCompaniesService`.

**Never externally discover:** `get_leads_summary`, `get_company_dashboard_metrics`, `bulk_lead_export`, `send_outbound_campaign`, `approval_*`, `revenue_*`, diagnostics, raw query and admin tools. Future private integrations require separate authorization and app review.

## Facts versus unverified assumptions

- **Confirmed in code:** internal POST `/api/v1/mcp/tools/:tool_name`, Rails service objects and request RSpec coverage.
- **Not established:** external HTTPS MCP endpoint, Streamable HTTP initialize/tools/list/tools/call, OAuth 2.1/PKCE discovery, aud/scopes bound to external resource, token lifecycle, client registration, tested performance SLO, external directory approval.
- **Not established:** legal basis for regional buyer-intent licensing, validity/evidence of individual enterprise verification badges, normalized equipment specs, production traffic capacity.
- Do not treat a successful GitHub Action as proof of an externally working MCP client or a published marketplace integration.

## Delivery roadmap

| PR | Deliverable | Gate |
|---|---|---|
| PR-MCP-00 (this PR) | Inventory, ADR, data/tool contracts, security gates | Product + API + AppSec review |
| PR-MCP-01 | Redact unexpected errors from internal MCP API; RSpec | Internal safety tests + CI |
| PR-MCP-02 | External remote MCP transport adapter, disabled by default | Protocol handshake/discovery contract tests |
| PR-MCP-03 | Public-only registry with strict schemas | No internal tools in discovery; malformed args rejected |
| PR-MCP-04 | OAuth metadata, audience, PKCE and resource auth | Token and redirect adversarial tests |
| PR-MCP-05 | Tenant-aware quotas and policy enforcement | Cross-tenant negative test matrix |
| PR-MCP-06 | Public list/profile/categories | Domain correctness and pagination |
| PR-MCP-07 | Approved reputation/comparison | Moderation, no-PII and missingness tests |
| PR-MCP-08+ | OTel, CI/staging, pilot, marketplace submissions | Runbook, DPO review, explicit release go/no-go |

See `docs/mcp/ADR-001-SYSTEM-BOUNDARIES.md`, `docs/mcp/TOOLS-V1-CONTRACTS.md`, `docs/mcp/TEST-AND-RELEASE-GATES.md`.

## Operational boundaries

- **Do not merge this PR solely because documentation checks are green** without review.
- Do not perform database migrations, configure secrets, register marketplaces or deploy in PR-MCP-00.
- Source of truth remains Rails/PostgreSQL; the external MCP gateway must use documented application services, not raw SQL.
- Sponsored positioning must not masquerade as objective recommendations.
- Data declared by a company must remain labeled as declared, not verified.
