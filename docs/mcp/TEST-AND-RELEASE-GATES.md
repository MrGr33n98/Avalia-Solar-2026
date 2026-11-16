# PR-MCP Execution Gates — TDD, Security, CI/CD and Marketplaces

**Status:** proposed release acceptance criteria; no production deployments authorized by this document.  
**Protected invariant:** public external MCP is a distinct allowlisted boundary; internal CRM and administrative tools remain private.

## Acceptance gates

| Gate | Owner / approval | Evidence required | Stop condition |
|---|---|---|---|
| G0 Architecture | Product + Backend + AppSec | Approved ADR, 5-tool allowlist, source mapping | Open contract or unknown data classification |
| G1 Safety | AppSec + DPO | No backtraces, token validation, cross-tenant, prompt injection, privacy | Any known P0 exposure |
| G2 Protocol | Backend + QA | MCP initialize, tools/list, tools/call + accepted schemas and version | Remote client cannot discover/call |
| G3 Functional | QA | Deterministic category/company/review comparisons | Inactive entity or private data leaked |
| G4 Operational | SRE | Rate limits, staging smoke, traces, rollback, feature flag | Unmeasured outage or no rollback |
| G5 Distribution | Product + Legal + DevRel | Client demos and current listing policy verified | Incomplete legal/demo/marketplace evidence |

## TDD matrix — minimum acceptance scenarios

| ID | Test | Expected behavior | First target PR |
|---|---|---|---|
| TC-001 | Search companies by HQ city | Only active entities headquartered in city | 06 |
| TC-002 | Distinguish HQ vs service coverage | No unsupported claim of serving city | 06 |
| TC-003 | Unknown category slug | Validation/not-found, never broad unfiltered results | 06 |
| TC-004 | Read active profile | Only public fields and canonical URL | 06 |
| TC-005 | Read inactive profile | Unenumerable not-found | 06 |
| TC-006 | List categories with active hierarchy | Stable parent IDs and slugs | 06 |
| TC-007 | Exclude inactive categories | No inactive records in output | 06 |
| TC-008 | No reviews | average=null, count=0 | 07 |
| TC-009 | Approved/rejected review mixture | Count only approved | 07 |
| TC-010 | Compare 2 unique active companies | Objective matrix with missingness | 07 |
| TC-011 | Compare same ID twice | Invalid arguments | 07 |
| TC-012 | Compare four companies | Invalid arguments | 07 |
| TC-013 | Error exception includes secret | 500 contains no secret/backtrace | 01 |
| TC-014 | Unknown tool | Explicit unknown_tool, no fallback | 01/03 |
| TC-015 | Tool listing | Exactly five read-only public tools | 03 |
| TC-016 | Unsupported input key | Rejected by schema | 03 |
| TC-017 | Protocol version handshake | Negotiated supported version only | 02 |
| TC-018 | Pagination and sorting | Stable, bounded and filter-bound | 06 |
| TC-019 | Auth token wrong audience | Denied | 04 |
| TC-020 | Token for tenant A asks for B data | Denied, no existence leak | 05 |
| TC-021 | Review prompt injection | Returned as data, never as instructions | 07 |
| TC-022 | Anonymous scraper > burst limit | 429 and backoff | 05 |
| TC-023 | Payload exceeds maximum size | Early rejection | 02/05 |
| TC-024 | Tool timeout | Bounded failure, no partial private payload | 02 |
| TC-025 | Release rollback | Prior healthy release restored | 10 |

## Adversarial tests — mandatory

- **SEC-01** Public `tools/list` never reveals `bulk_lead_export`, `revenue_*`, `send_outbound_campaign`, `approval_*`, diagnostics.
- **SEC-02** Direct `tools/call` against an internal name is rejected even by an authenticated integrator.
- **SEC-03** Token A is invalid for B or any unrelated tenant.
- **SEC-04** Rejected/pending/contested reviews are never serialized.
- **SEC-05** Unhandled exception message, file path, SQL, token, backtrace never reaches the HTTP response.
- **SEC-06** Unhandled exception message containing a secret is not written to application logs.
- **SEC-07** Agent cannot change token scopes or tenant by tool arguments or headers.
- **SEC-08** HTML/review/company description containing instructions cannot induce tool execution or permission changes.
- **SEC-09** Rate limiting covers anonymous, client and tenant identities independently.
- **SEC-10** Cross-tenant cache keys and cursor reuse fail closed.

## Proposed build/test locations

| Layer | Existing path | New candidate |
|---|---|---|
| Internal API non-regression | `AB0-1-back/spec/requests/api/v1/mcp_tools_spec.rb` | Preserve |
| Agent scope, HITL and tenant | `AB0-1-back/spec/requests/api/v1/mcp/agent_governance_spec.rb` | Extend only after review |
| Internal 500 redaction | `AB0-1-back/app/controllers/api/v1/mcp/tools_controller.rb` | `spec/requests/api/v1/mcp/error_redaction_spec.rb` |
| External MCP transport | Not proven | `spec/requests/mcp/transport_spec.rb` proposed |
| External registry and schemas | Not proven | `spec/services/mcp/public_registry_spec.rb` proposed |
| Public domain facade | Internal services available | `spec/services/mcp/public/*_spec.rb` proposed |
| Protocol compatibility | Not proven | Client contract harness, with protocol version pinned |
| Required CI | `.github/workflows/ci-web-backend.yml` | Add required dedicated MCP gate only after stable tests |

## GitHub Actions release discipline

1. Branch from HEAD of `main` and make a small scoped PR.
2. Review exact changed paths and protect adjacent features (Brand Page, Reviews, SEO, CRM, WAHA).
3. Never hide security or contract failures with `|| true` or `continue-on-error`.
4. Capture RSpec results, frontend typecheck, existing critical E2E and new MCP-specific gate.
5. Confirm no migrations, deployment, unauthorized new secrets or active public endpoint in early PRs.
6. Merge only after CI + AppSec review; deploy from `main` only with explicit authorization.
7. Check the **deploy job** outcome and the externally serving `x-release` SHA; a green workflow with skipped jobs is not a deployment.
8. Verify a real MCP handshake and negative access tests after the authorized deployment.
9. Disable external gateway via a kill switch if leakage, abnormal request rates or auth errors arise.

## Marketplace submission evidence (not launched yet)

| Client | Baseline evidence | Additional publication action |
|---|---|---|
| ChatGPT / OpenAI | Five successful and three intentionally negative tool-use prompts, protocol demo, privacy policy | Validate currently supported package and domain challenge in submission portal |
| Claude | Remote HTTPS MCP, tool annotations, user docs, demo credentials and privacy | Apply Anthropic directory policy; avoid primarily advertising-oriented presentation |
| Gemini Enterprise | Streamable HTTP tool registration in eligible Google Cloud organization | Enable custom MCP connector and authorized operations |

**Do not claim a marketplace is accepted, published or certified** until the provider reports that status.

## Pilot scorecard (proposed targets)

- Valid public-tool result rate > 99%, excluding legitimate empty results and denied calls.
- Cross-tenant data leakage = 0.
- Confirmed private or rejected-review disclosures = 0.
- p95 simple tool latency target < 800 ms, subject to actual staging load measurements.
- Error 5xx < 0.5%, subject to SLO review.
- MCP usage recorded by tool, client, tenant class and release version without collecting raw prompt/PII.
- Pricing and entitlements are **proposals**; never enable new charges during a test PR.

## Handoff for next implementation owner

**Next immediate implementation PR:** `PR-MCP-02` MCP remote protocol adapter with no real public exposure and tests before enabling.  
**Hard dependency:** SDK/protocol interoperability spike (MCP-005) with current specification and real client checks.  
**Release owner:** SRE/Product/AppSec; no unattended marketplace submission.
