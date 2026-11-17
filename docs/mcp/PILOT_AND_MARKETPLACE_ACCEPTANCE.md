# Avalia Solar MCP — G5 pilot, distribution and acceptance evidence

**Status: NOT TESTED / NO marketplace listing submitted.** This sheet is to be filled by the approved pilot owner after external OAuth, DNS, staging and SDK interoperability are ready. It does not authorize tool execution or submission.

## Pilot preconditions

- [ ] All MCP-02B through MCP-10 Pull Requests merged in dependency order, with `main` CI/deploy verification.
- [ ] Privacy & terms pages reviewed for tool data provenance, data retention, sponsored ranking and permitted client usage.
- [ ] External OAuth provider has staged Authorization Code + PKCE S256 with correct scopes/audience, client registration, revocation and key rotation.
- [ ] Approved HTTPS staging endpoint with separate secrets and isolated production datasets.
- [ ] Two independently implemented MCP clients available; no compatibility assertion based solely on internal JSON-RPC request specs.
- [ ] Security, DPO, Product, Backend and SRE signoff; staging rollback evidence and on-call owner.

## Five mandatory positive user journeys

| Case | Prompt / expected call | Evidence |
| --- | --- | --- |
| P1 | “Liste integradores solares em Santa Catarina.” → `list_integrators` with HQ semantics and active-only results. | [ ] request IDs, five redacted records, schema validation |
| P2 | “Mostre o perfil público deste integrador.” → `show_integrator_profile`, canonical public link. | [ ] only allowed fields, correct limitations |
| P3 | “Quais categorias de energia solar existem?” → `list_solar_categories`. | [ ] active taxonomy and cursor |
| P4 | “Qual a reputação desse integrador?” → `get_integrator_reputation`; approved-only counts, null average for no reviews. | [ ] review aggregate vs moderation ground truth |
| P5 | “Compare três integradores sem patrocinados influenciarem o resultado.” → `compare_integrators`. | [ ] correct matrix, no synthetic winner |

## Three mandatory negative journeys

| Case | Expected outcome | Evidence |
| --- | --- | --- |
| N1 | Client requests `bulk_lead_export`, `approval_execute` or `revenue_*` → not discoverable or callable. | [ ] explicit denied call |
| N2 | Expired, forged or wrong-audience access token → 401; insufficient read scope → 403. | [ ] response codes with no secrets |
| N3 | Call tries unapproved review, arbitrary `tenant_id`, duplicate/four company comparison or cross-identity cursor → rejected. | [ ] no private data exposure |

## Marketplace onboarding actions (provider policies must be independently confirmed at submission time)

**ChatGPT:** test current supported connector/app authorization and OAuth discovery requirements, obtain any necessary allowed origins/redirect URIs from the platform, and validate consent, public disclosures and tool annotations. Submit only after a controlled pilot is proven.

**Claude:** validate current remote MCP connection, OAuth scopes, discovery, user documentation and directory review process. Test in a separate client implementation from ChatGPT before claiming interoperability.

**Gemini Enterprise:** validate a supported organization-backed MCP connector and any required Google Cloud IAM policies, not assumed available from this checklist.

No listing, domain challenge or approval has been performed; platform acceptance is an external action requiring the account owner's explicit decision.

## Go/no-go scorecard

- Staging public tool success rate (valid authorized requests): target >99% [ ].
- p95 latency for simple tools: target <800ms [ ]; record dataset size and concurrent users.
- 5xx rate: target <0.5% [ ].
- Private data/rejected review disclosures: ZERO [ ].
- Negative OAuth, cross-tenant, rate limits and cursor replay tests: all denied [ ].
- Kill-switch / rollback within approved operational window [ ].
- Product + Backend + AppSec + DPO + SRE owner approvals [ ].

Record release SHA, clients' SDK/versions, raw test count, failure evidence, reviewer and decision date in the approved internal release ticket, not in publicly accessible GitHub logs.

**Launch decision remains NO-GO until completed with verifiable evidence.**
