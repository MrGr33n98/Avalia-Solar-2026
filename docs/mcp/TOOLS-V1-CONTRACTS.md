# Public MCP Tools v1 — proposed executable contracts

**State:** DOCUMENTED / NOT IMPLEMENTED. Each listed tool must be an external read-only facade mapped to an existing Rails service. Do not register these names on the internal controller until implementation and review.  
**MCP contract:** Remote MCP clients discover tools via `tools/list` and invoke them via `tools/call`. Represent the descriptions below as JSON Schemas in the transport implementation (PR-MCP-03).

## Shared rules

| Attribute | Contract |
|---|---|
| Access | R0 public; no business mutations |
| Input strictness | Reject unknown fields, malformed IDs, invalid enums and oversize input |
| Pagination | Default 10, maximum 20; cursor must be opaque, filter-bound and validated |
| Output provenance | `source_type`, `data_as_of`, `limitations`, `schema_version` |
| Traceability | `request_id` in redacted metadata |
| Authorization | Never read tenant IDs, user IDs, auth scopes or roles from tool inputs as proof |
| Missingness | Never infer positive value from missing evidence; zero ≠ unknown |
| URLs | Canonical absolute public profile URLs only; no private or attacker-controlled URLs |
| Time | UTC ISO 8601 for timestamps; report data currency |
| Descriptions | `readOnlyHint=true`, `destructiveHint=false` |
| External policy | No leads, CRM, outbound, internal diagnostics or admin execution exposed |

### list_integrators (P0)

**Owner:** Company Directory; adapter to `Mcp::SearchCompaniesService`.  
**Required:** at least one of `query`, `category_slug`, `headquarters_city`, `state`.  
**Optional:** `verified:boolean`, `limit:integer[1,20]`, `cursor:string`, `sort:{relevance,rating,review_count}`.  
**Unknown/unsupported:** reject invalid region, sort or category rather than expanding to unfiltered search.  
**Result:** `integrators:[{id,name,slug,profile_url,headquarters:{city,state},declared_coverage,verification_state,rating_average,rating_count,categories,data_as_of}]`, `next_cursor`, `limitations`.  
**Invariant:** `headquarters_city` filters headquarters, not the area served; `verified` is a public platform signal, not an equipment certification.  
**Current adapter gap:** existing SearchCompaniesService accepts `city` and `category` names, not this schema's `headquarters_city` and canonical `category_slug`; conversion must be explicit and tested.  
**Negative cases:** inactive/hidden companies excluded; unknown enum/filters rejected; no private phone/email or buyer contacts.

### show_integrator_profile (P0)

**Owner:** Company Directory; adapter to `Mcp::CompanyProfileService`.  
**Required:** exactly one of `company_id:integer` or `slug:string`.  
**Result:** `integrator:{id,name,slug,description,profile_url,headquarters,declared_coverage,services,categories,verification_state,rating_average,rating_count,data_as_of}`.  
**Invariant:** inactive, hidden or unpublishable company returns indistinguishable not-found response; descriptions remain untrusted source data.  
**Negative cases:** both identifiers supplied, ID not owned by a public company, URL/path injection.

### list_solar_categories (P0)

**Owner:** Catalog; new read-only adapter to `Category.active`.  
**Required:** none.  
**Optional:** `parent_id:integer`, `vertical:string` (only where verified taxonomy exists), `limit:integer[1,20]`, `cursor:string`.  
**Result:** `categories:[{id,name,slug,description,parent_id,vertical,data_as_of}]`, `next_cursor`.  
**Invariant:** active categories only, stable hierarchical identity, canonical slug derived from existing SEO semantics; never derive unsupported verticals by guessing.  
**Negative cases:** inactive categories, circular hierarchy, duplicate/missing SEO slug, unknown parent and vertical.

### get_integrator_reputation (P0)

**Owner:** Reputation; adapter to `Mcp::ReviewsSummaryService`.  
**Required:** exactly one of `company_id:integer` or `slug:string`.  
**Result:** `company_id`, `total_approved`, `average_rating:number|null`, `rating_distribution`, `verified_total`, `replied_total`, `sample_size`, `methodology_note`, `data_as_of`.  
**Invariants:** only `Review.approved_only` counted; pending/flagged/rejected/contested body and reviewer identity excluded; `average_rating=null` when `total_approved=0`.  
**Current adapter gap:** internal service currently produces `0.0` for no reviews, which external output must normalize to null without changing internal consumers.  
**Negative cases:** small sample, no reviews, unapproved reviews, injected review text, inactive company.

### compare_integrators (P0)

**Owner:** Company Directory / Reputation; adapter to `Mcp::CompareCompaniesService`.  
**Required:** `company_ids:array<string|integer>` with 2–3 UNIQUE items.  
**Optional:** `criteria:array<enum(reputation,categories,headquarters,declared_coverage,services)>`.  
**Result:** `companies`, `comparison_matrix`, `criteria_used`, `unknown_fields`, `limitations`, `data_as_of`.  
**Invariants:** no objective 'best' winner or sponsored boost; missing attribute is unknown, not false; all compared companies active and public.  
**Current adapter gap:** internal service limits to three and includes declared financing but does not yet provide a field-level matrix/provenance.  
**Negative cases:** duplicate IDs, four IDs, cross-tenant private attributes, inactive company, misleading company descriptions.

## Deferred capabilities — NOT exposed in MVP

- `find_integrators_by_coverage`: proposed P1, explicitly match declared service coverage (not HQ).
- `check_integrator_verification_seal`: P1, require timestamped evidence and verification type.
- `list_solar_equipment` / `compare_equipment_specs`: P1, normalize units and source fields.
- `get_my_integrator_metrics`: P2 with OAuth, active membership, plan gating.
- `browse_regional_buyer_intent`: P2/P3, aggregated only, DPO sign-off and small-cell suppression.
- `browse_integrator_competitive_intelligence`: P2/P3 licensed and anonymized.
- Research Board writes: P3, distinct human-approval and persistence boundaries.

## Failure semantics

| Condition | Recommended MCP behavior |
|---|---|
| Unknown tool | Protocol unknown-tool error; no partial routing to internal registry |
| Unknown input field | Structured validation error, without internal stack traces |
| Inactive company | Non-enumerative not-found |
| No reviews | Valid result, `total_approved=0`, `average_rating=null` |
| Too many calls | Rate-limit response with retry guidance |
| Unhandled exception | Generic internal error plus request ID, internal secure diagnostics only |
| OAuth token missing/expired | Standards-compliant authentication challenge |
| Insufficient scope | Deny; never fallback to a different tenant |
| Private/internal tool requested | Not listed and not callable, regardless of credential |

## Service-to-contract test mapping

| External tool | Existing source | Required tests before enabling |
|---|---|---|
| list_integrators | `SearchCompaniesService` | public visibility, HQ/coverage distinction, pagination, input allowlist |
| show_integrator_profile | `CompanyProfileService` | active status, PII absence, injection defense |
| list_solar_categories | `Category` | active hierarchy, stable slug, empty list |
| get_integrator_reputation | `ReviewsSummaryService` | moderation, zero/null, reviewer privacy |
| compare_integrators | `CompareCompaniesService` | 2–3 unique, missing values, no sponsored ranking |

**Definition of Done:** schemas committed and versioned; tools publicly discoverable ONLY on external gated endpoint after OAuth/protocol/security and telemetry gates; RSpec unit/request and independent MCP-client integration tests all green.
