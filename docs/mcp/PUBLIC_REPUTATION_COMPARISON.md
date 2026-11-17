# MCP-07 — approved reputation and objective company comparison

**Status:** Draft code; mandatory CI, privacy review and staging validation before release.

## New tools

**get_integrator_reputation** — accepts exactly one `company_id` or public slug; returns only approved Review aggregates:
- total approved and sample_size;
- average_rating is `null` when count is zero (no conflation of missingness with a zero rating);
- distribution across ratings 1..5;
- verified and replied counts from *approved* reviews only.
- Never includes review body, reviewer identity, moderation queue, private notes or rejected/contested review text.

**compare_integrators** — 2–3 unique active companies, specified by ID or slug. Returns a field-level matrix of selected approved categories/reputation/HQ/declared coverage/services, with explicit missing fields. No sponsored ranking, winner inference, admin fields, buyer contacts or revenue metrics.

The InputValidator is shared with MCP-06. It rejects unknown keys, duplicate IDs/slugs, non-active company records, unsupported criteria and more than three companies.

## Invariants
- All records must be active/public according to the present Company status policy; further publication/visibility review before production.
- Comparisons of HQ do not imply company coverage.
- Review aggregates depend on Review.approved_only; public rating isn't backfilled by unapproved reviews.
- URLs are canonical and static-host public profile URLs.
- Descriptions and services are untrusted company data, never agent instructions.
- Access to all five tools requires the OAuth + Redis policy + execution-flag checks introduced in MCP-04..06.

## Test gates
- `reputation_service_spec.rb`: 0/null semantics, approved/pending mixture, inactive lookup and PII exclusions.
- `comparison_service_spec.rb`: 2 companies, no winner or sponsored values, unknown average and invalid references.
- `public_directory_execution_spec.rb`: HTTP authenticated calls for the five public tools.
- MCP dedicated workflow + existing CI after dependency merges.

## Unresolved
- Explicit external verification taxonomy and timestamped evidence.
- Independent data privacy review of free-text product/service fields.
- DB query performance and p95 metrics under realistic simultaneous load.
- End-to-end client test on modern and legacy eras (the older preview still blocks calls).
- Data provenance granularity and daily snapshots.
- External OAuth provider, key rotation, SRE runbook and actual DNS/TLS setup.

**Never flip production execution flags based solely on this PR.**
