# Ranking v2 — Mapa de impacto

- **Status:** inventário de paths para orientar waves; nenhuma alteração de runtime feita neste plano.
- **Change type:** `read-only audit`, `new additive`, `adapter/shadow`, `consumer cutover later`, `no change`.
- Todos os cutovers são condicionados a testes, reconciliação, flag e rollback. Paths novos são destinos propostos.

## Backend — score/ranking/Positioning

| Path | Responsabilidade atual | Papel alvo | Change type / wave |
|---|---|---|---|
| `AB0-1-back/app/services/trust_score/definition.rb` | trust formula/version | Input component versioned; fórmula preservada | compatibility wrapper, W5/W10 |
| `AB0-1-back/app/services/trust_score/calculator.rb` | materializa inputs de Company | mesma regra, provenance/missingness posterior | W10 |
| `AB0-1-back/app/services/trust_score/calculation_service.rb` | sync calculation/fetch stored default zero | manter API legacy; separar missing vs zero futuro | W10, sem score change |
| `AB0-1-back/app/models/company_trust_score.rb` | persist score bounded | Trust result, não rank nem coverage trust | W9 design review |
| `AB0-1-back/app/workers/analytics/ranking_score_worker.rb` | full recompute Trust + engagement SQL + writer | Organic v2 engine/manifest e run context | W5/W10 shadow first |
| `AB0-1-back/app/workers/analytics/feature_store_daily_worker.rb` | diário engagement/fact aggregation | manter compatibility; lineage/idempotency auditar | W0/data then W10 |
| `AB0-1-back/app/workers/analytics/feature_store_rolling_30d_worker.rb` | rolling features | não é v2 input sem decisão | inventory only |
| `AB0-1-back/app/services/company_dashboard/ranking_eligibility_scope.rb` | Active+score + category/HQ/city/sector filters | adapter de RankingScope e Company Eligibility | W6/W10 shadow |
| `AB0-1-back/app/services/company_dashboard/ranking_snapshot_writer.rb` | daily global/category snapshots | manifest/run, resolved scope, gates after additive schema | W9/W10 |
| `AB0-1-back/app/models/company_ranking_snapshot.rb` | snapshot identity global/category/date/version | legacy reader + future run linkage | W9 schema gate |
| `AB0-1-back/app/services/company_dashboard/ranking_service.rb` | official snapshot + preview/benchmark/Positioning API | response adapter with independent statuses | W11/W12 |
| `AB0-1-back/app/services/company_dashboard/ranking_benchmark_service.rb` | percentiles, min10, distribution | capability; min10 remains compatibility only | W8/W11 |
| `AB0-1-back/app/services/company_dashboard/positioning/definition.rb` | X/Y version/weights/caps | derived analysis component version | W11; no changed formula |
| `AB0-1-back/app/services/company_dashboard/positioning/calculator.rb` | computes axes | analysis only | W11 |
| `AB0-1-back/app/services/company_dashboard/positioning/eligibility.rb` | N/distinct/zero-y gates | capability gate; thresholds pending | W8/W11 |
| `AB0-1-back/app/services/company_dashboard/positioning/scope_resolver.rb` | fallback may return last invalid scope | legacy compatibility; new resolver must not copy | W7/W11 |
| `AB0-1-back/app/services/company_dashboard/positioning/threshold_calculator.rb` | median thresholds | Positioning analysis version | W11 |
| `AB0-1-back/app/services/company_dashboard/ranking_metrics.rb` | worker duration/snapshots metrics | add per-scope/fallback/gate/shadow metrics | W15/16 |
| `AB0-1-back/app/admin/ranking_preview.rb` | ActiveAdmin preview uses ordered_by_priority | label/rework separate from organic ranking | W12/13 governance follow-up |

## Backend — Coverage / territory / consumers

| Path | Responsabilidade atual | Papel alvo | Change type / wave |
|---|---|---|---|
| `AB0-1-back/app/models/company_service_area.rb` | city/state/national/radius; `covers?` radius=UF | canonical area record, unsupported radius for new policy until center validated | W2; do not break legacy |
| `AB0-1-back/app/services/locations/coverage_normalizer.rb` | normalizes legacy city/state arrays/slugs | URL/legacy adapter to territory identity | W1/W2/W6 shadow |
| `AB0-1-back/app/services/locations/br_locations.rb` | loads names-only JSON | legacy catalog adapter; future territory resolver | W1/W6 |
| `AB0-1-back/lib/tasks/locations_from_csv.rake` | generates JSON and drops codes | refactor parser with dry-run validation; no prod import | W1 |
| `AB0-1-back/db/data/municipios.csv` | source-like file, provenance unknown | candidate input pending audit | W1 read-only only |
| `AB0-1-back/config/data/br_locations.json` | state/city names no codes | compatibility data, preserve until catalog cutover | W1/W6 |
| `AB0-1-back/app/services/company_service_area_limit_service.rb` | plan quota over legacy lists | entitlement only; not truth/confidence | W2/W4 no trust inference |
| `AB0-1-back/app/services/company_field_policy.rb` | direct update vs pending approval for legacy coverage | user permission/quota only, not territorial evidence | W2/W4 |
| `AB0-1-back/app/services/entitlement_service.rb` | derives quota from plan/legacy area | commercial entitlement only | W2 audit, preserve |
| `AB0-1-back/app/models/pending_change.rb` / `app/admin/pending_changes.rb` | approved_by/at for requested change | approval audit, not coverage verification | W2 governance boundary |
| `AB0-1-back/app/admin/companies.rb` | edits legacy coverage | canonical writer only after writer cutover | W3/W4 later |
| `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb` | accepts legacy profile changes/pending changes | new write endpoint/adaptor after reconciliation | W3/W4 later |
| `AB0-1-back/app/controllers/api/v1/companies_controller.rb` | profile fields/coverage serialization | compatibility API; preserve fields while add canonical response | W4/W12 |
| `AB0-1-back/app/serializers/company_serializer.rb` | legacy coverage + `service_areas` | one canonical Coverage payload plus deprecated projection | W4/W12 |
| `AB0-1-back/app/serializers/company_list_serializer.rb` | legacy fields | consumer-specific stable coverage representation | W4 |
| `AB0-1-back/app/serializers/company_card_serializer.rb` | legacy fields | canonical summary with provenance | W4 |
| `AB0-1-back/app/graphql/types/company_type.rb` | legacy coverage fields | additive canonical field, old fields remain | W4/W12 |
| `AB0-1-back/app/queries/companies/company_search_query.rb` | search filters include serving HQ/legacy | shared resolver and purpose-specific recall policy | W4 shadow |
| `AB0-1-back/app/services/search/company_search_service.rb` | filter against indexed coverage fields | shared Coverage policy; maintain recall/disclosure | W4 |
| `AB0-1-back/app/models/company.rb` | search_data, serves_* scopes, legacy priority | compatibility adapters; not universal geography | W2/W4/W6 |
| `AB0-1-back/app/services/leads/lead_matching_service.rb` | local match via Company serves_*; scoring | lead policy requiring sufficient confidence for high-trust route | W4 |
| `AB0-1-back/app/services/recommendation/eligibility_query.rb` | HQ + CompanyServiceArea city/state/national | resolver with recommendation-purpose policy | W4 |
| `AB0-1-back/app/services/recommendation/organic_scorer.rb` | separate geo/category/verified/rating/completeness score | independent product scorer; not Organic ranking | W4; preserve methodology |
| `AB0-1-back/app/services/recommendation/engine.rb` | combines OrganicScorer and sponsored slots | sponsored disclosure separate; no rank contamination | W4/D30 |
| `AB0-1-back/app/services/chat/mobivolt/company_matcher_service.rb` | HQ/legacy coverage priority and global fallback | shared resolver, explicit fallback reason | W4 |
| `AB0-1-back/app/controllers/api/v1/local_solar_pages_controller.rb` | SEO local HQ/legacy, sponsored/priority order | canonical coverage + SEO policy; preserve URLs and paid disclosure | W4 shadow |
| `AB0-1-back/app/services/geo/haversine_calculator.rb` | coordinate-distance helpers | evaluate only after center/unit/source/missing behavior defined | W0A/W2 later |

## Database / migrations / jobs

| Path | Responsabilidade atual | Papel alvo | Change type / wave |
|---|---|---|---|
| `AB0-1-back/db/migrate/20260802100000_create_company_service_areas.rb` | area relation and string location fields | legacy-compatible source rows; future Territory reference additive | W2/W9 only after review |
| `AB0-1-back/db/migrate/20260723090000_create_company_ranking_snapshots.rb` | snapshots and leaderboard indexes | preserve legacy schema; run context additive/new run table decision | W9 |
| `AB0-1-back/db/migrate/20260921130000_add_snapshot_date_to_company_ranking_snapshots.rb` | backfill date/unique daily index | keep existing index semantics during migration | W9 review |
| `AB0-1-back/db/schema.rb` | current schema snapshot | only generated after approved migration | W1/W2/W9 |
| `AB0-1-back/app/workers/analytics/feature_store_daily_worker.rb` | watermark daily aggregation with upsert | lineage/idempotency diagnostics | W0/data; no behavior change |
| `AB0-1-back/app/workers/analytics/ranking_score_worker.rb` | lock + global score/snapshot job | run-scoped/idempotent compatibility worker then dirty scopes | W10/W15 |
| `AB0-1-back/lib/tasks/ranking_snapshots.rake` | read/repair legacy snapshots | operational tool audit, no prod invocation | W0/W9 |

## Frontend / API / UX

| Path | Responsabilidade atual | Papel alvo | Change type / wave |
|---|---|---|---|
| `AB0-1-front/components/CompanyComparisonModal.tsx` | derived coverage count has `states*10` | real city count or state count, never estimate | W0A |
| `AB0-1-front/components/home/HomeComparisonPreview.tsx` | same fake city estimate | real count/state wording | W0A |
| `AB0-1-front/app/companies/[id]/components/CompanyIdentityCard.tsx` | reads both legacy and service areas | canonical contract/disclosure | W4 |
| `AB0-1-front/app/companies/[id]/components/CompanyProfileShell.tsx` | fallback dual-source coverage UI | canonical view; declared vs validated language | W4 |
| `AB0-1-front/app/dashboard/components/RankingPerformanceTab.tsx` | dashboard ranking assembly | requested/resolved/status/capability view | W13 |
| `AB0-1-front/app/dashboard/components/ranking/RankingStateBanner.tsx` | current status messaging | separate stale/no-scope/analysis-unavailable | W13 |
| `AB0-1-front/app/dashboard/components/ranking/RankingPositioningMap.tsx` | quadrant UI | show capability unavailable independent from rank | W13 |
| `AB0-1-front/app/dashboard/components/ranking/RankingMethodologyTransparency.tsx` | methodology explanation | manifest/release/changelog explanation | W13 |
| `AB0-1-front/lib/ranking-contract.ts` | TS ranking response contract | additive versioned resolution/gates/analyses types | W12/W13 |
| `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb` | ranking JSON response | versioned contract adapter, maintain old fields | W12 |

## Tests / docs / governance

| Path | Responsabilidade atual | Papel alvo | Change type / wave |
|---|---|---|---|
| `AB0-1-back/spec/models/company_service_area_spec.rb` | asserts legacy radius same-UF behavior | keep legacy test; add new-domain unsupported radius test | W0A/W2 |
| `AB0-1-back/spec/models/company_coverage_spec.rb` | Company legacy coverage | compatibility contract and future adapter tests | W4 |
| `AB0-1-back/spec/services/company_dashboard/ranking_snapshot_writer_spec.rb` | snapshot ordering/upsert | manifest/as_of/run parity | W9/W10 |
| `AB0-1-back/spec/services/company_dashboard/ranking_service_spec.rb` | rank API service | statuses/capabilities/resolved scopes | W11/W12 |
| `AB0-1-back/spec/services/company_dashboard/ranking_benchmark_service_spec.rb` | benchmark percentiles/sample | capability semantics; N10 only compatibility | W11 |
| `AB0-1-back/spec/services/company_dashboard/organic_ranking_sponsorship_invariant_spec.rb` | ensures sponsored excluded from organic | maintain anti-pay-to-rank invariant | W10/16 |
| `AB0-1-back/spec/services/leads/lead_matching_service_spec.rb` | current location lead matching | consumer trust policy/shadow contracts | W4 |
| `AB0-1-back/spec/services/recommendation/engine_spec.rb` | recommendations and paid placements | organic/paid distinction | W4 |
| `AB0-1-back/spec/services/chat/mobivolt/company_matcher_service_spec.rb` | MobiVolt matching/fallback | explicit coverage basis/reason | W4 |
| `AB0-1-front/components/CompanyComparisonModal.*spec*` (new) | no focused spec found | test true coverage wording | W0A |
| `AB0-1-front/components/home/HomeComparisonPreview.*spec*` (new) | no focused spec found | test true coverage wording | W0A |
| `docs/ranking-v2/FINAL_DISCOVERY.md` | approved technical baseline | frozen reference | current |
| `docs/adr/0001..0011` | architecture decisions | governance source | current |
| `docs/ranking-v2/DATA_CALIBRATION_PLAN.md` | profiling procedure | calibration workstream | current |
| `docs/ranking-v2/IMPLEMENTATION_PLAN.md` | wave execution controls | delivery plan | current |
| `docs/ranking-v2/TASKLIST.md` | atomic work inventory | task progress/status | current |

