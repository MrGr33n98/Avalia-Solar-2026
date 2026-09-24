# Ranking v2 — Tasklist executável

- **Status geral:** aprovado para planejamento; todas as tarefas abaixo `NOT_STARTED`.
- **Regras:** task pequena/revisável, sem produção; thresholds/formula IAS ficam explicitamente pendentes; cada runtime task requer branch segura e teste focal.
- **Campos:** `ID`, `EPIC`, `TASK`, `DEPENDENCY`, `FILES`, `TESTS`, `ACCEPTANCE`, `RISK`, `STATUS`.

| ID | EPIC / Wave | Task / subtasks | Dependency | Files | Tests / acceptance criteria | Risk | Status |
|---|---|---|---|---|---|---|---|
| SAFE-001 | W0 Safety | Inventariar status incluindo ignored/untracked, SHA, branch e owners; registrar hash de asset local sem copiá-lo | — | git metadata; plano | Nenhum arquivo local perdido/alterado | Worktree compartilhado | NOT_STARTED |
| SAFE-002 | W0 Safety | Confirmar DB test config/URL/database name, sem boot a produção | SAFE-001 | `AB0-1-back/config/database.yml`, spec helper (read-only) | Test env isolado provado | Test contra DB errado | NOT_STARTED |
| SAFE-003 | W0 Safety | Baseline frontend deps/scripts e testes focados atuais | SAFE-001 | `AB0-1-front/package.json`, Jest config | Registrar command/exit output sem alegar passou | Dependências ausentes | NOT_STARTED |
| SAFE-004 | W0 Safety | Após plano revisado, pedir/confirmar branch e executar `git switch -c feat/ranking-v2-foundation` preservando dirty tree | SAFE-001 | git branch | SHA base igual; todos dirty/untracked continuam presentes; branch não mistura ownership | Dirty changes carregadas | NOT_STARTED |
| P0-001 | W0A Data Truth | Subtask: substituir contagem fictícia em `CompanyComparisonModal` por cities reais ou estados reais; nunca `states*10` | SAFE-002/003; branch | `AB0-1-front/components/CompanyComparisonModal.tsx` | Testa city/state/mixed/empty; não mostra cidades fictícias | Payload antigo é incompleto | NOT_STARTED |
| P0-002 | W0A Data Truth | Subtask: mesma correção em HomeComparisonPreview e manter fallback “sob consulta”/estados | P0-001 | `AB0-1-front/components/home/HomeComparisonPreview.tsx` | Teste states-only mostra estados; search `states.length * 10` ausente | UI claims diferentes | NOT_STARTED |
| P0-003 | W0A Data Truth | Criar specs unit/component isolados para coverage labels e contract antigo | P0-001/002 | novos `*.spec.tsx` adjacentes | `npm run test -- --runInBand <specs>` executável | React mocks/router | NOT_STARTED |
| P0-004 | W0A Radius | Formalizar diagnostic “radius unsupported as territorial proof” no desenho de novo CoverageResolver, sem modificar `covers?` legacy | SAFE-001; Wave2 | plano/serviço futuro | Teste novo domain retorna unsupported; specs legacy radius permanecem | Legacy consumers dependem comportamento conhecido | NOT_STARTED |
| P0-005 | W0A Radius | Documentar requisitos center lat/lon, unidade, origem, precisão, missing coordinates, boundary/time validity; decisão separada antes geofence | P0-004 | `DATA_CALIBRATION_PLAN.md` / future ADR only on approval | Nenhuma distância falsa; lista requisitos completa | Haversine sem centro induz erro | NOT_STARTED |
| DATA-001 | Data Cal | Garantir SELECT role/sanitized copy e schema/index inventory | SAFE-002 | database config/ops runbook | Ambiente demonstravelmente não produção/read-only | Conexão ambiental ambígua | NOT_STARTED |
| DATA-002 | Data Cal | Implementar/validar query agregada N/score/ties/quantiles em snapshot date/definition | DATA-001 | `DATA_CALIBRATION_PLAN.md`, query fixtures/tool | N buckets <5/<10/<15/<20/<30/<50; métricas definidas | Query pesada | NOT_STARTED |
| DATA-003 | Data Cal | Profile headquarters category/state/city e documentar LEGACY TERRITORIAL GROUPING | DATA-001 | profiling query | Categorias multi-membership explícitas | Sede confundida com coverage | NOT_STARTED |
| DATA-004 | Data Cal | Gerar reconciliation report legacy↔CompanyServiceArea, sem writes | DATA-001, Wave3 | future offline script | legacy-only/relation-only/equal/divergent/none + type flags + unknowns | Dados pessoais/PII | NOT_STARTED |
| DATA-005 | Data Cal | Event dedup/late event lineage audit, hourly/daily reconciliation | DATA-001 | event/fact-store SQL + report | occurred/received/processed semantics documentadas | Eventos duplicados | NOT_STARTED |
| DATA-006 | Data Cal | Rank stability analysis multi-snapshot same manifest/scope | DATA-002, historical data | analytics report | churn/top-N/correlation/sensitivity; produção pendente se sem série | Snapshots upserted | NOT_STARTED |
| TERR-001 | W1 Territory | Auditar provenance/license/source/version/encoding do `municipios.csv` | SAFE-001 | `AB0-1-back/db/data/municipios.csv`, task docs | Fonte aprovada ou rejeitada com evidência | CSV não confiável | NOT_STARTED |
| TERR-002 | W1 Territory | Criar parser dry-run com header map, encoding, IBGE uniqueness, duplicate rows, invalid UF, missing codes, homonyms | TERR-001 | `lib/tasks/locations_from_csv.rake` (refactor only approved), new validator | fixtures invalid/valid; relatório determinístico | Parser escreve saída por engano | NOT_STARTED |
| TERR-003 | W1 Territory | Definir identidade interna + external code/source/version/alias/provenance schema | TERR-001/002 | proposed Territory model/migration | schema review + constraints/index review | Identidade IBGE acoplada | NOT_STARTED |
| TERR-004 | W1 Territory | Adicionar Territory internal models/relationships country-state-municipality | TERR-003 | `app/models/territory.rb`, migration | model/unit specs; no company switch | Migration lock/index | NOT_STARTED |
| TERR-005 | W1 Territory | Implementar dry-run import plan e report sem write | TERR-004 | importer service/task | idempotent plan, unknown handling, no insert | Dry-run acidental write | NOT_STARTED |
| TERR-006 | W1 Territory | Resolver slugs/aliases existentes para Territory identity em shadow | TERR-004/005 | `CoverageNormalizer`, `BrLocations`, resolver | homonym/alias/slug specs; URLs unchanged | SEO URL break | NOT_STARTED |
| COV-001 | W2 Coverage | Especificar CoverageResult/Resolver sem ambiguidade entre truth/source/trust/entitlement/authorization | TERR-004 | new coverage domain docs/code | unit contract decision matrix | Universal status mistakes | NOT_STARTED |
| COV-002 | W2 Coverage | Implementar read-only resolver para CompanyServiceArea types with active filtering | COV-001 | new `app/services/coverage/*`, model | state/national/city + inactive specs | Duplicate existing semantics | NOT_STARTED |
| COV-003 | W2 Coverage | Guard radius no novo resolver como unsupported; mapear center requirements | COV-002 | resolver specs | unsupported reason emitted; old method untouched | Cross-consumer regression | NOT_STARTED |
| COV-004 | W2 Coverage | Implementar purpose authorization policy interfaces com declared/evidence/unknown, sem enum/fake verification | COV-001 | policy service | consumer matrix unit tests; ranking declared rejected | Confundir company verification | NOT_STARTED |
| REC-001 | W3 Reconciliation | Coverage report classifier normalize legacy arrays/tokens and relation rows | DATA-004, COV-002 | new reconciliation service/script | all classes and unknown tokens preserved | False equivalence | NOT_STARTED |
| REC-002 | W3 Reconciliation | Generate per-company confidential dry-run report, aggregate sanitized summary | REC-001 | script/report template | deterministic, no DB writes | Sensitive company data | NOT_STARTED |
| REC-003 | W3 Reconciliation | Owner review equivalence map; define idempotent/backfill/rollback RFC; no execution | REC-002 | planning doc | dry-run/delta/rollback approved separately | Accidental write | NOT_STARTED |
| CONS-001 | W4 Consumers | Add OLD behavioral contract tests for Search/Profile/Lead/Recommendation/MobiVolt/SEO | SAFE-002 | existing specs per module | fixtures cover HQ/legacy/service/national/radius | Existing undocumented behavior | NOT_STARTED |
| CONS-002 | W4 Consumers | Build shadow comparator for one consumer at a time | COV-002, CONS-001 | new comparator service | IDs/reasons/type/false pos-neg output | Data leakage | NOT_STARTED |
| CONS-003 | W4 Consumers | Migrate public Profile serializer/frontend to canonical coverage output, retain old fields | CONS-002 | company serializers/GraphQL, `CompanyIdentityCard.tsx`, `CompanyProfileShell.tsx` | contract/E2E old clients + trust label | Break API/mobile | NOT_STARTED |
| CONS-004 | W4 Consumers | Search consumer adapter and shadow path | CONS-002 | `CompanySearchQuery`, `CompanySearchService`, `Company#search_data` | search query specs, discovery-recall semantics | Elasticsearch reindex | NOT_STARTED |
| CONS-005 | W4 Consumers | Leads consumer adapter, require policy confidence for high-confidence routing | CONS-002 | `LeadMatchingService` | routing unit/request specs; declaration secondary only | Lead delivery changes | NOT_STARTED |
| CONS-006 | W4 Consumers | Recommendation adapter keeps organic scorer and paid placement distinct | CONS-002 | EligibilityQuery/OrganicScorer/Engine | reason & sponsored slot specs | Recommendation outcome shifts | NOT_STARTED |
| CONS-007 | W4 Consumers | MobiVolt adapter, explicit no-local-match fallback response | CONS-002 | CompanyMatcherService | local match/fallback/no match specs | Chat quality | NOT_STARTED |
| CONS-008 | W4 Consumers | SEO local adapter/SEO shadow + canonical URL preservation | CONS-002 | `LocalSolarPagesController`, sitemap/routes | request/meta/canonical/indexable specs | SEO traffic/indexation | NOT_STARTED |
| METH-001 | W5 Manifest | Define code-based component contract and compatibility manifest object | ADR0010/0011 | new methodology contract | schema invariants/version resolution specs | Snapshot claim mismatch | NOT_STARTED |
| METH-002 | W5 Manifest | Resolve immutable published release representation and parameter digest | METH-001 | model/registry or code artifact (decision gate) | mutation forbidden after publication | Premature dynamic registry | NOT_STARTED |
| METH-003 | W5 Manifest | Register Organic v2 compatibility manifest without changing formula/ENV | METH-002 | ranking definitions/writer metadata | golden compatibility tests | Misrepresenting ENV active value | NOT_STARTED |
| SCOPE-001 | W6 Scope | Define comparable-dimension contract method/release/basis/territory/category/project type | TERR-004,METH-001 | new RankingScope domain | dimensional property tests | Sector ambiguity | NOT_STARTED |
| SCOPE-002 | W6 Scope | Add canonical tuple and key format decision + alias normalization | SCOPE-001 | new scope service | same semantics same tuple/key tests | Key instability | NOT_STARTED |
| SCOPE-003 | W6 Scope | Add legacy `sector` adapter to project_type and usage telemetry | SCOPE-001 | RankingEligibilityScope, filters/API | no breaking param; categories separate | API backward compatibility | NOT_STARTED |
| RES-001 | W7 Resolver | Implement candidate ladder city→state→country for same basis | SCOPE-001, GATE-001 interface | ScopeResolver service | candidate invariants, no relax dims | Invalid population selection | NOT_STARTED |
| RES-002 | W7 Resolver | Implement requested/candidate/resolved/reason/no_eligible_scope result | RES-001 | service + type contract | all candidates fail returns none; no last invalid | Misstate scope | NOT_STARTED |
| GATE-001 | W8 Gates | Define GateResult and four-layer result shapes, no new thresholds | METH-001,SCOPE-001 | new policy/result classes | unit/property tests | N=10 misapplied | NOT_STARTED |
| GATE-002 | W8 Gates | Add compatibility gate policy describing AS-IS eligibility/benchmark/positioning | GATE-001 | adapters to existing services | parity tests | Change output in extraction | NOT_STARTED |
| GATE-003 | W8 Gates | Map future threshold placeholders as calibration-required, not blocking | DATA-002 | policy docs/config contract | no default values accepted silently | Runtime gating too early | NOT_STARTED |
| SNAP-001 | W9 Snapshot | Inspect schema/index/volume/write path; choose additive columns vs new run tables | METH-002,SCOPE-002,GATE-001 | schema/migrations/report | design review only | Lock/storage growth | NOT_STARTED |
| SNAP-002 | W9 Snapshot | Implement immutable run context and as_of distinct from computed_at | SNAP-001 | run model/writer | model/service tests | Input revision insufficient | NOT_STARTED |
| SNAP-003 | W9 Snapshot | Add manifest/scope/resolution/gates/capabilities linkage | SNAP-002 | schema/writer/model | constraints/atomic publication tests | partial write | NOT_STARTED |
| SNAP-004 | W9 Snapshot | Preserve old `CompanyRankingSnapshot` reader and backfill strategy spec | SNAP-003 | serializers/migration | old rows readable; rollback | Historical interpretation | NOT_STARTED |
| ORG-001 | W10 Organic | Add golden fixtures for Trust/FeatureStore/Organic score and current tie | SNAP-002 | Trust specs, worker/writer specs | exact same input -> exact same output | Current pipeline depends database date | NOT_STARTED |
| ORG-002 | W10 Organic | Wrap v2 formula in compatibility engine, no coefficient/formula edits | ORG-001,METH-003 | RankingScoreWorker/engine | parity on controlled fixtures | Unnoticed formula drift | NOT_STARTED |
| ORG-003 | W10 Organic | Add old/new shadow comparison metrics for population/score/position/tie/benchmark | ORG-002 | comparator | zero unexplained drift | Shadow cost | NOT_STARTED |
| ANAL-001 | W11 Analysis | Separate benchmark capability result from publication status | GATE-001,SNAP-003 | benchmark/ranking service/API | ranking pass + benchmark unavailable test | API semantics | NOT_STARTED |
| ANAL-002 | W11 Analysis | Add safe new Positioning scope resolution; no invalid last candidate | RES-002 | positioning resolver/calculator | no_eligible_scope when all gates fail | Current consumers expect status | NOT_STARTED |
| ANAL-003 | W11 Analysis | Report quadrant distinct/zero/quantile diagnostics as analysis-only pending calibration | DATA-002 | positioning/gates | tests no rank block by analysis | Threshold gap | NOT_STARTED |
| API-001 | W12 API | Draft and publish additive response contract/version mapping | SNAP-003,ANAL-001 | ranking service/controller/serializer | API schema/contract specs | Consumer compatibility | NOT_STARTED |
| API-002 | W12 API | Add auth/tenant/diagnostics exposure review | API-001 | policies/request specs | company sees own; no anti-fraud leakage | IDOR/leak | NOT_STARTED |
| UI-001 | W13 UI | Add requested/resolved/fallback reason display | API-001 | dashboard ranking components | Jest states + accessibility | Incorrect fallback text | NOT_STARTED |
| UI-002 | W13 UI | Render snapshot freshness, method, population, capabilities separate | API-001 | RankingStateBanner/Transparency/PositioningMap | stale/missing/analysis-unavailable specs | UI overload | NOT_STARTED |
| UI-003 | W13 UI | Verify mobile/responsive and retain paid-placement disclosure | UI-001/002 | front components | jest+visual/E2E if available | Organic vs sponsored confusion | NOT_STARTED |
| IAS-001 | W14 IAS Boundary | Define isolated IAS methodology/input definitions API only | METH-001,GATE-001 | new experimental namespace | refuses no formula execution | Fake score placeholder | NOT_STARTED |
| IAS-002 | W14 IAS Boundary | Add experiment run/result namespace without score values or public endpoint | IAS-001,SNAP-002 | experiment model/service optional | no Organic write/read path | Boundary leaks into product | NOT_STARTED |
| IAS-003 | W14 IAS Boundary | Add validation harness contract for bias/double counting/stability (no weights) | DATA plan, IAS-001 | validation interface/specs | tests require approved input schema | Mistaken methodological approval | NOT_STARTED |
| SHADOW-001 | W15 Shadow | Define tolerances/owner signoff for each diff measure before runs | ORG-003,CONS shadow | report template | signed tolerance table | Arbitrary acceptance | NOT_STARTED |
| SHADOW-002 | W15 Shadow | Run approved staging/sanitized shadow, record error/runtime/data diffs | SHADOW-001 | shadow run artifacts | no official API/UI changes | High load/PII | NOT_STARTED |
| SHADOW-003 | W15 Shadow | Review divergences and get policy/data approval per consumer | SHADOW-002 | signoff artifacts | every material diff explained | Silent cutover | NOT_STARTED |
| ROLL-001 | W16 Rollout | Define per-consumer flags/read path/owner/expiry | SHADOW-003 | feature flags/config docs | flags don't mutate manifest | Flag drift | NOT_STARTED |
| ROLL-002 | W16 Rollout | Verify last-good snapshot and rollback path in staging | ROLL-001,SNAP-003 | runbook/service | flag-off restores old path; test failure exercise | Incomplete snapshots | NOT_STARTED |
| ROLL-003 | W16 Rollout | Approve rollout and SLO after calibration and reconciliation | ROLL-002,DATA signoff | approval record | tests, shadow, data and ops approved | Premature production exposure | NOT_STARTED |

## Sequenciamento sugerido

- Primeiro: SAFE-001–004 e P0-001–005.
- Paralelo isolado: DATA-001 e TERR-001 (read-only/offline) após SAFE-002.
- Ordem crítica: TERR → COV → REC → consumer shadow → manifest/scope/gates → snapshot → Organic compatibility → API/UI → IAS foundation → shadow/rollout.
- W1 Territory e revisão de source podem avançar em paralelo com análise de dados; não ativar reads.

