# Plano de implementação — Ranking v2 / Coverage / Territory / IAS

- **Status:** plano aprovado para implementação faseada; não executado.
- **Baseline:** `257bbdc167c7a63434b1212d09ea8e8f8e5e1c54` em `main`, worktree sujo/não rastreado; branch e isolamento obrigatórios antes de runtime.
- **Autoridade metodológica:** ADR 0001–0011 + `FINAL_DISCOVERY.md`.
- **Regra geral:** não consultar/alterar produção; migrations reversíveis/aditivas; no máximo uma consumer/read-path cutover por wave; nenhum threshold/formula IAS inventado.

## Princípios de execução

1. Implementar por PR/commit pequeno; cada wave tem DoD próprio e rollback testado.
2. Criar branch de trabalho somente após inventário e estratégia de preservação do worktree. Nunca usar checkout/reset/clean/stash automático para “limpar” arquivos já existentes.
3. Antes de branch: registrar `git status --short --untracked-files=all`, branch, SHA; mapear ownership de arquivos e guardar patch/manifesto de hashes fora do repo por procedimento revisado (sem copiar secrets). Os arquivos untracked `AB0-1-front/public/images/search-avalia-solar.png`, `CONTEXT.md`, ADRs e `interface-design/` devem ser preservados. Não incluir automaticamente essas alterações nos commits Ranking v2.
4. Nenhum baseline test foi executado nesta sessão. Primeiro identificar DB/test env e dependências; testes Rails somente com database test/local confirmado. Nunca invocar app/job/runner apontando a produção.
5. Paths/tabelas novas são propostas, não commits autorizados. Cada migration exige schema impact review, rollback test e decisão se additive extension ou novas tabelas.
6. `DATA_CALIBRATION_REQUIRED` (threshold/população/evidence/IAS/engagement caps/SLO) e `PRODUCT_VALIDATION_REQUIRED` (formula IAS/claims) não impedem construir infraestrutura, mas impedem ativar gates ou publicação que dependam desses valores.

## Test commands e gates conhecidos

Confirmados em `AB0-1-front/package.json`, `AB0-1-back/Gemfile`, `.github/workflows/ci-web-backend.yml` e `AB0-1-back/bin/quality`; disponibilidade/dependências/DB ainda precisam ser confirmadas.

- Front focado: `cd AB0-1-front; npm run test -- --runInBand <spec-path>`.
- Front lint/typecheck: `npm run lint`; `npm run typecheck`; frontend build `npm run build` somente quando SSR/rotas/build mudarem.
- Rails foco: `cd AB0-1-back; bundle exec rspec <spec-path>`; lint `bundle exec rubocop <files>`.
- Rails suite: `bundle exec rspec`; quality wrapper `bin/quality` (também Brakeman/RuboCop/RSpec; usar após verificar efeitos/config).
- CI nomeia RSpec e focused ranking specs; `npm run test:banners` não é teste de coverage/ranking.
- **Gate de DB:** verificar `RAILS_ENV=test`, `DATABASE_URL`/config e nome do DB antes de qualquer teste que acessa Rails. Nenhum comando de migration executado como parte deste plano. Migration spec exige DB isolado e rollback explícito.
- Commands abaixo são plano executável futuro; não são declarações de execução/pass.

## Waves

### Wave 0 — Baseline / safety / tooling

- **Goal:** branch-safe baseline, proteção contra produção, comandos e owners de arquivos claros.
- **AS-IS affected:** worktree `main` dirty/untracked; runner de testes depende de Postgres/RSpec; pnpm/npm scripts registrados.
- **Target:** branch dedicado criado sem descartar/copiar por cima de alterações; baseline de comandos/status gravado; execução em ambiente de teste identificado.
- **Files:** `docs/ranking-v2/*`; eventual `scripts/ranking-v2/*` só após aprovação e definição; não editar arquivos locais não relacionados.
- **Schema:** nenhum.
- **Services:** nenhum.
- **API:** nenhuma.
- **Frontend:** nenhum.
- **Tests:** confirmar spec runner e isolamento; baseline targeted de P0 sem executar produção.
- **Migration:** nenhuma.
- **Shadow:** não aplicável; registrar estados atuais.
- **Feature flag:** não aplicável.
- **Observability:** log dos commands/status/exit codes em relatório da wave.
- **Rollback:** branch descartável só após confirmar commits/artefatos; preservar base local intacta; sem limpeza automática.
- **Acceptance:** owner vê status+SHA e aprova naming/branch; DB test isolado e scripts comprovados.
- **Commands:** `git status --short --untracked-files=all`; `git branch --show-current`; `git rev-parse HEAD`; `git log -1 --oneline`; `git switch -c feat/ranking-v2-foundation` somente depois do procedimento de preservação e aprovação; `npm run test -- --runInBand <spec>`; `bundle exec rspec <spec>` com ambiente validado.
- **Dependencies:** nenhuma.
- **Risks:** worktree tem arquivo não rastreado de imagem e docs; branch move HEAD com todas as alterações no mesmo working tree, não separa automaticamente ownership.
- **DoD:** baseline de implementação reproduzível e trabalho de código fora de `main` sem perda/mistura silenciosa.

### Wave 0A — Data truth P0s

- **Goal:** remover claim `estados × 10` e impedir novo domínio ranking de confiar em raio não calculado.
- **AS-IS affected:** `CompanyComparisonModal` exibe `+N regiões`; `HomeComparisonPreview` exibe `+N cidades`; backend `CompanyServiceArea#covers?` radius = mesma UF; spec atual afirma esse comportamento.
- **Target:** quando houver city names reais, exibir contagem dessas cidades; se houver só estados, exibir estados; não derivar cidades. Novo domínio classifica radius `unsupported/unverified` sem usar legacy `covers?` como prova. Consumer legado continua comportamento intacto até migration/policy dedicada.
- **Files:** `AB0-1-front/components/CompanyComparisonModal.tsx`, `components/home/HomeComparisonPreview.tsx` e specs novos; backend nenhum runtime nesta slice; futuros `app/domains/coverage/*` não devem ser criados sem Wave 2.
- **Schema:** nenhum.
- **Services:** nenhum.
- **API:** preservar payload atual, sem novos campos obrigatórios.
- **Frontend:** substituir o label de contagem por cardinalidade fonte real; zero/unknown não vira contagem fictícia; preservar layout.
- **Tests:** novos specs isolados de ambos componentes: city only, state only, mixed, empty/unknown; asserts para “estados atendidos” quando sem city list e ausência de claim `X cidades`. Backend spec de radius fica como teste de legacy; acrescentar depois teste de `unsupported` do resolver novo.
- **Migration:** nenhuma.
- **Shadow:** comparar payload/claim exibido antes/depois com fixtures existentes; sem alteração em IDs/cobertura.
- **Feature flag:** não requerida se só troca claim falso por dado de cobertura real; se consumer de métrica desejar flag, default antigo não pode continuar publicando estimativa.
- **Observability:** monitorar ausência de dados e estado “sob consulta”; não criar métrica de cidades estimadas.
- **Rollback:** rollback de UI para “áreas de atendimento” genérico, nunca para multiplicação ×10.
- **Acceptance:** nenhum caminho renderiza `states.length * 10` como cidades; contratos API não mudam; suites focadas verdes.
- **Commands:** `cd AB0-1-front; npm run test -- --runInBand <novos-specs>`; `npm run lint -- --file components/CompanyComparisonModal.tsx --file components/home/HomeComparisonPreview.tsx` (validar sintaxe real do Next lint); `npm run typecheck`.
- **Dependencies:** branch wave 0; baseline front.
- **Risks:** modal e Home usam rótulos diferentes (“regiões” vs “cidades”), confirmar conteúdo e formatos de coverage antes do patch; UI ainda pode receber national/radius sem cidades.
- **DoD:** claims coerentes com dados reais e teste de regressão cobrindo estados-only.

### Wave 1 — Territory Foundation

- **Goal:** modelo interno canônico aditivo para country/state/municipality, com source/version, external identifiers, aliases/slugs e provenance.
- **AS-IS affected:** `municipios.csv`/`br_locations.json`, `BrLocations`, `CoverageNormalizer`, company headquarters/service areas usam strings/UF.
- **Target:** internal stable Territory ID; IBGE candidate external municipality code; explicit BR/UF/municipality relationships; catalog version and alias resolver; CSV not source until audit passes.
- **Files:** new `AB0-1-back/app/models/territory.rb`, services/import validators, `db/migrate/*territor*` (exact path/name after schema audit), `db/data` tooling; specs/factories; no replacement of current normalizers yet.
- **Schema:** **proposed after schema audit** territory catalog, external identifiers/provenance/version, aliases, relationship/membership; constraints/indexes reviewed before migration.
- **Services:** source audit, parser/validator, dry-run report, deterministic import planner; no prod importer.
- **API:** none in v1; internal contract only.
- **Frontend:** none.
- **Tests:** code/canonical ID invariants, duplicate external IDs, invalid UF/missing code, homonyms by UF, alias stable identity, source version import fixtures.
- **Migration:** additive/reversible; no data import; no changes to companies city/state.
- **Shadow:** resolve current URL/locality labels against candidate catalog and report unresolved/ambiguous without switching reads.
- **Feature flag:** none for catalog import; read integration behind per-consumer flag later.
- **Observability:** import counts/reject reasons/source revision in dry-run artifact; no PII.
- **Rollback:** remove/disable additive catalog migration only if unused; importer has dry-run and no prod write.
- **Acceptance:** catalog source provenance approved; all validation cases pass; import dry-run discrepancy report review.
- **Commands:** `bundle exec rspec spec/models/territory_spec.rb spec/services/territory/*_spec.rb`; `bundle exec rubocop <new-files>`; validator CLI on test fixture only.
- **Dependencies:** CSV provenance/license/integrity audit; Wave 0.
- **Risks:** dataset could be wrong/outdated/encoding corrupted; identities must not use IBGE as PK.
- **DoD:** versioned catalog contract + tested dry-run importer, no production import.

### Wave 2 — Canonical Coverage Contract

- **Goal:** shared Coverage domain/resolver over CompanyServiceArea, explicit mode/territory/source/declaration/confidence/freshness/provenance boundaries.
- **AS-IS affected:** service area model, Company legacy fields, consumer services.
- **Target:** one canonical resolver interface; separate truth/source/trust/entitlement/authorization; radius returns unsupported until complete center semantics.
- **Files:** new `AB0-1-back/app/services/coverage/*` or domain module (placement follow current conventions), model/specs; `company_service_area.rb` only after focused impact review.
- **Schema:** no confidence/evidence enum assumed; additive provenance fields only after policy/schema review; territory FK not until Territory Wave 1 stable.
- **Services:** `CoverageResolver` + `CoverageTrustPolicy` interface; strict result carries match basis, source and status, no fake verification.
- **API:** internal first; no breaking changes.
- **Frontend:** none.
- **Tests:** exhaustive service type matrix for city/state/national/radius/active, HQ not implicitly coverage, entitlement does not change confidence, unknown values fail closed for new ranking policy.
- **Migration:** none or additive only after ADR/schema review; no backfill.
- **Shadow:** old vs resolver outcome in specs and sanitized fixtures.
- **Feature flag:** disabled by default for consumers.
- **Observability:** resolver reason codes/unsupported radius diagnostic.
- **Rollback:** consumers retain old paths; remove flag routing, not stored data.
- **Acceptance:** canonical contract stable and consumer policy explicit; radius new use returns not-authorized/unsupported rather than calling old behavior.
- **Commands:** focused RSpec service/model suites; `bundle exec rubocop` changed files.
- **Dependencies:** Wave 1 contract; owner trust policy remains interface/unknown, not fabricated confidence.
- **Risks:** accidentally treating legacy records as verified; breaking Lead/Search behavior.
- **DoD:** new resolver works in tests, no consumer cutover.

### Wave 3 — Coverage Reconciliation

- **Goal:** read-only/dry-run mapping legacy coverage fields to CompanyServiceArea with per-company categories and unknowns.
- **AS-IS affected:** dashboard/admin writes legacy fields; relation may diverge.
- **Target:** deterministic report and then independently approved idempotent backfill plan; unknown data preserved.
- **Files:** `scripts/ranking-v2/coverage_reconciliation*`, service/parser specs, reports generated outside repo or sanitized fixture paths.
- **Schema:** none for dry run; backfill schema/use only after report signoff.
- **Services:** normalized compare, exact/equivalent/divergent/national/radius/inactive classifications; never infer missing locality.
- **API:** none.
- **Frontend:** none.
- **Tests:** same inputs idempotent report, unknown token retention, duplicate detection, no changes to DB, district/city ambiguous.
- **Migration:** no production write; later backfill separately authorized, reversible.
- **Shadow:** legacy vs canonical membership per sampled consumer query.
- **Feature flag:** none.
- **Observability:** row/report counts, anonymized discrepancies.
- **Rollback:** report-only; no rollback necessary; backfill transaction/batch rollback design before execution.
- **Acceptance:** classes cover legacy-only/relation-only/both equal/divergent/none/national/state/city/radius/inactive/unknown token.
- **Commands:** offline parser tests; read-only SELECT only after DB is approved; no `rails runner` on unknown env.
- **Dependencies:** Waves 1–2.
- **Risks:** payload field types vary, normalize aliases carefully.
- **DoD:** signed reconciliation report + backfill safety design; no write.

### Wave 4 — Consumer Migration Foundation

- **Goal:** freeze OLD consumer behavior in contract specs, add NEW shadow outputs one consumer at a time.
- **AS-IS affected:** Profile, Search, Leads, Recommendation, MobiVolt, SEO; today each has different source/matching.
- **Target:** shared resolver + purpose policy, outputs include match basis/provenance; no silent false local match.
- **Files:** `app/queries/companies/company_search_query.rb`, `app/services/search/company_search_service.rb`, `app/services/leads/lead_matching_service.rb`, `app/services/recommendation/eligibility_query.rb`, `organic_scorer.rb`, `app/services/chat/mobivolt/company_matcher_service.rb`, `app/controllers/api/v1/local_solar_pages_controller.rb`, serializers; one module per subtask.
- **Schema:** none for shadow base; only additive if source identity required.
- **Services:** adapter/shadow comparator by consumer.
- **API:** backward compatible, shadow not exposed publicly.
- **Frontend:** no migration initially.
- **Tests:** OLD contract snapshots; service request tests; false-positive/negative fixture matrix.
- **Migration:** none.
- **Shadow:** company IDs, reasons, territory, type, false positives/negatives, latency.
- **Feature flag:** per consumer, disabled by default.
- **Observability:** shadow diff counts by consumer/basis/coverage type, avoid high-cardinality IDs.
- **Rollback:** flag off to old path; preserve old query/service.
- **Acceptance:** no cutover until consumer-specific differences reviewed/approved.
- **Commands:** focused RSpec each module; frontend contract tests only when serializer/UI touched.
- **Dependencies:** Waves 1–3.
- **Risks:** old behavior includes headquarters match and fallback; diff not necessarily defect until policy approved.
- **DoD:** shadow mechanism + recorded behavior, no bulk cutover.

### Wave 5 — Methodology Manifest

- **Goal:** immutable published manifest and code-defined component contract, first compatibility manifest for Organic v2.
- **AS-IS affected:** version constants; ENV min population; snapshots only one definition version.
- **Target:** draft/published lifecycle; frozen component version/parameters; published manifest reference and changelog; no dynamic DSL.
- **Files:** new `app/models/methodology_manifest.rb`/registry/service only after architecture review; ranking version constants; specs.
- **Schema:** choose registry table vs code registry after persistence/ops review; additive, immutable release identity; no arbitrary JSON execution.
- **Services:** resolver/validator for component contract; `organic-performance-v2` compatibility artifact.
- **API:** internal/version references additive.
- **Frontend:** no Admin UI in this wave.
- **Tests:** published immutability, same manifest canonical serialization, config/ENV cannot mutate release, draft distinct from published.
- **Migration:** additive only if DB registry selected; rollback cannot remove manifests referenced by snapshots.
- **Shadow:** manifest describes current engine without changing behavior; compare serialized current constants to compatibility record.
- **Feature flag:** activation flag selects release only; never mutates release content.
- **Observability:** manifest/release/code SHA included in run logs.
- **Rollback:** previous published release remains active; new manifest retire, never edit in place.
- **Acceptance:** exact component list and effective parameters resolve deterministically; Organic v2 output unchanged.
- **Commands:** focused RSpec for registry/service; full ranking service/writer specs.
- **Dependencies:** ADR0010/0011; owner and code contract review.
- **Risks:** storing a false claim of effective params when ENV differs; freeze actual production config only after safe capture.
- **DoD:** manifest v2 compatibility artifact proven to reproduce rule description, no score changes.

### Wave 6 — RankingScope Domain

- **Goal:** canonical identity contract with methodology/release, basis, level, territory and declared comparable dimensions.
- **AS-IS affected:** eligibility supports category/state/city/sector; snapshot only global/category.
- **Target:** canonical tuple; aliases resolved; category and project type distinct; `sector` legacy maps explicitly to project_type, no immediate API break.
- **Files:** new `app/services/company_dashboard/ranking_scope*` or domain module; `ranking_eligibility_scope.rb`; filter options; tests.
- **Schema:** no materialization required; persist only if lookup/history needs proven.
- **Services:** identity canonicalizer, contract validator, legacy `sector` adapter with deprecation metadata.
- **API:** retain existing params; document mapping and additive canonical scope fields later.
- **Frontend:** keep existing inputs, no new UI dimensions.
- **Tests:** alias/key invariants, dimension ordering, category vs project_type independent, null/global explicit, no UI sort in identity.
- **Migration:** none initially.
- **Shadow:** compare old eligibility params→new scope tuple with no population change.
- **Feature flag:** not needed for descriptor, required for query cutover.
- **Observability:** legacy `sector` use counters.
- **Rollback:** old argument adapter remains.
- **Acceptance:** identical semantics create identical identity; aliases not duplicate; no cross product.
- **Commands:** focused RSpec `ranking_eligibility_scope`, new scope specs; RuboCop.
- **Dependencies:** Territory + Manifest.
- **Risks:** category parent/child semantics unknown for ranking; do not silently include ancestors.
- **DoD:** scope descriptor and canonical tuple versioned in code; no persistence expansion.

### Wave 7 — Scope Resolution

- **Goal:** resolver preserving requested/candidates/resolved/reason and applying initial municipality→state→country hierarchy.
- **AS-IS affected:** Positioning resolver fallback and ad hoc controller paths.
- **Target:** versioned `ScopeResolutionPolicy`; only geographic dimension changes; basis/category/project type/release preserved; no_eligible_scope if none pass required publication gates.
- **Files:** new resolver/policy services; do not alter Positioning resolver until own wave 11.
- **Schema:** none initially; resolution trace attached to run/snapshot later.
- **Services:** candidate generation + gate callback; stop on valid publication candidate.
- **API:** internal result contract.
- **Frontend:** none.
- **Tests:** city→state→country preserve dimensions; basis immutable; all-fail no scope; no project_type relaxation; repeat deterministic.
- **Migration:** none.
- **Shadow:** compare candidates/selected scope against old policy without public cutover.
- **Feature flag:** disabled by default.
- **Observability:** candidate count, fallback rate/reason.
- **Rollback:** old resolver paths unaffected.
- **Acceptance:** no invalid final candidate returned as resolved; eligibility/population gates re-run each candidate.
- **Commands:** focused resolver specs and property tests.
- **Dependencies:** Waves 1,5,6; publication gate interface Wave 8.
- **Risks:** fallback cannot be activated while thresholds remain uncalibrated; use explicit compatibility policy only.
- **DoD:** pure resolver produces correct candidates and explainability.

### Wave 8 — Quality Gate Framework

- **Goal:** typed gate result/status/reason/observed/required/severity/blocking_for without choosing new thresholds.
- **AS-IS affected:** benchmark default 10 and Positioning gates; official writer currently accepts nonempty population.
- **Target:** four layers company eligibility, population validity, ranking publicability, analysis availability; compatibility policy reproduces current behavior.
- **Files:** new gate result/policy/result services; adapter around benchmark/Positioning outputs.
- **Schema:** none until diagnostics persisted in run/snapshot design.
- **Services:** gate evaluator with policy version and capability context.
- **API:** internal contract; no exposure yet.
- **Frontend:** none.
- **Tests:** status/reason invariants; analysis-only failure does not fail rank; legacy default 10 labeled AS-IS.
- **Migration:** none.
- **Shadow:** evaluate diagnostics side-by-side, don't block publication yet.
- **Feature flag:** shadow evaluation off-path or disabled by default.
- **Observability:** gate count by reason and capability; no thresholds actionable until approved.
- **Rollback:** remove shadow evaluation; legacy benchmark path continues.
- **Acceptance:** gate outputs explainable/versioned; no hidden default or fabricated threshold.
- **Commands:** focused RSpec gate, benchmark, Positioning.
- **Dependencies:** Manifest, Scope, calibration datasets when defining blocking policy.
- **Risks:** accidentally making benchmark N=10 an official publication gate.
- **DoD:** framework proves result shape, not policy numbers.

### Wave 9 — Snapshot / Run Domain

- **Goal:** preserve requested/resolved scopes, manifest, as_of, computed_at, diagnostics, capabilities, data revision and publication state.
- **AS-IS affected:** `company_ranking_snapshots` daily unique rows, JSON breakdown/quality flags, `data_through`.
- **Target:** historical run identity and atomic publication pointer; keep existing snapshots readable.
- **Files:** `CompanyRankingSnapshot`, writer/reader, schema migrations after schema/index review.
- **Schema:** decision gate: additive columns vs new `ranking_runs`/scope tables; inspect nullability/index/volume/retention and migration lock/cost first; reversible, additive; no destructive cleanup.
- **Services:** run orchestration, immutable snapshot writer, compatibility serializer.
- **API:** preserve old fields; additive only.
- **Frontend:** no consumer change.
- **Tests:** upsert/idempotency, duplicate scope/date, atomic reader old/new, as_of separation, manifest reference.
- **Migration:** additive/backfill only in test or approved local DB; never prod in this phase.
- **Shadow:** write new run metadata in shadow table then compare no user-facing reads.
- **Feature flag:** writer selection flag, defaults old.
- **Observability:** run lifecycle/errors/partial write; data cut.
- **Rollback:** old snapshot reader/writer remains; additive metadata can be ignored; rollback only if no FK references.
- **Acceptance:** old clients unchanged; new run referentially complete; migration plan reviewed.
- **Commands:** migration specs on isolated test DB; focused writer/API specs.
- **Dependencies:** Manifest, Scope, Gates, source revision policy.
- **Risks:** table growth, locks, existing unique index and upsert conflict semantics.
- **DoD:** versioned run read/write works in tests, no current publish behavior change.

### Wave 10 — Organic Engine Compatibility

- **Goal:** encapsulate Organic v2 as compatibility manifest/engine; exactly preserve math, eligibility and tie ordering.
- **AS-IS affected:** RankingScoreWorker, RankingEligibilityScope, snapshot writer, TrustScore, daily features.
- **Target:** old/new path same inputs produce same population/score/tie/position/benchmark under frozen as_of.
- **Files:** worker, ranking services, Trust/feature definitions only extraction/refactor with golden tests.
- **Schema:** none unless Wave 9 run storage is ready.
- **Services:** compatibility engine wrapper, no formula adjustment.
- **API:** unchanged.
- **Frontend:** unchanged.
- **Tests:** golden SQL/sample fixtures, tie ordering, windows/time zone, missing score, rerun idempotence.
- **Migration:** none.
- **Shadow:** paired old/new calculation on controlled data, compare exact/rounding tolerance documented.
- **Feature flag:** `ranking_v2_engine_shadow` only; never for altering manifest.
- **Observability:** population/score/position diffs and duration.
- **Rollback:** route to old engine; keep snapshots.
- **Acceptance:** zero unexplained differences; any expected difference requires separate methodology release approval.
- **Commands:** worker, Trust parity, ranking service/writer/benchmark and sponsorship invariant specs.
- **Dependencies:** Waves 5–9; event `as_of` reproducibility context.
- **Risks:** SQL date semantics and mutable Trust/event inputs; ensure frozen test fixtures.
- **DoD:** compatibility proven, no formula change.

### Wave 11 — Benchmark / Positioning

- **Goal:** represent benchmark, percentile and Positioning as independent capabilities and ensure new resolver never resolves invalid candidate.
- **AS-IS affected:** `RankingBenchmarkService`, Positioning Calculator/Eligibility/ScopeResolver, API payload.
- **Target:** ranking publishability can pass while benchmark/quadrant is unavailable; no reuse of min10 as future threshold; legacy resolver behavior isolated.
- **Files:** benchmark and `positioning/*`, RankingService/metrics specs.
- **Schema:** no new schema except Wave 9 capability result.
- **Services:** capability evaluator/version; new resolver returns no_eligible_scope not last failed.
- **API:** additive `analyses` capability/reason fields.
- **Frontend:** later Wave13.
- **Tests:** N<10 legacy, distinct X/Y, zero Y, ties, quantile collisions, failed analysis vs valid ranking.
- **Migration:** none.
- **Shadow:** compare old/new positioning scope selection; do not change current UI until approved.
- **Feature flag:** per capability/read path.
- **Observability:** capability unavailable rate/reason and resolved scope.
- **Rollback:** old positioning endpoint/path until migration completed.
- **Acceptance:** failed analysis never changes Organic rank; invalid final scope cannot be represented as resolved in new contract.
- **Commands:** RSpec benchmark, positioning eligibility/resolver/calculator and ranking service.
- **Dependencies:** Waves 7–9; statistical gate decisions before publication behavior.
- **Risks:** changing dashboard insights under same version; version every behavior change.
- **DoD:** independent capability contract and safe resolution, calibrated policy still disabled.

### Wave 12 — API Contract

- **Goal:** expose ranking/scope/resolution/quality/snapshot/freshness/analyses/methodology additively.
- **AS-IS affected:** company dashboard controller/service; REST/GraphQL serializers.
- **Target:** new versioned/additive response; legacy fields stable; public errors/reasons are safe.
- **Files:** `app/controllers/api/v1/company_dashboard_controller.rb`, ranking service, serializers, API schema/specs, frontend `lib/ranking-contract.ts` contract later.
- **Schema:** none.
- **Services:** response adapter maps domain status independent of one `status` boolean.
- **API:** additive payload, preserve old keys; version compatibility analysis before removal.
- **Frontend:** types only/contract tests; UI Wave13.
- **Tests:** request/serializer contract tests, auth and tenant isolation, old/new clients.
- **Migration:** none.
- **Shadow:** serialize both shapes in tests/logs without sending duplicate payload publicly.
- **Feature flag:** endpoint field flag if rollout needed, not manifest semantics.
- **Observability:** response version/legacy use/error and safe reason codes.
- **Rollback:** remove additive fields/read path; keep old response.
- **Acceptance:** contract docs/specs agree; no sensitive anti-fraud diagnostics leaked.
- **Commands:** focused request specs for ranking endpoints and frontend contract tests.
- **Dependencies:** Waves 6–11.
- **Risks:** persisted clients expect fields/types; verify GraphQL/REST consumers.
- **DoD:** versioned contract backward-compatible.

### Wave 13 — Frontend / UX

- **Goal:** show requested vs resolved, reason, population, method, freshness and capability statuses clearly.
- **AS-IS affected:** dashboard Ranking Performance and current rankings view/banner/map.
- **Target:** fallback explanation, distinct stale/empty/no-scope, unavailable analysis, sponsored disclosure separate.
- **Files:** `AB0-1-front/app/dashboard/components/RankingPerformanceTab.tsx`, `components/ranking/RankingStateBanner.tsx`, `RankingPositioningMap.tsx`, methodology transparency and specs.
- **Schema:** none.
- **Services:** no business logic in UI; consume API contract.
- **API:** Wave12.
- **Frontend:** accessible mobile/responsive labels; no invented metrics.
- **Tests:** Jest component states, requested/resolved content, stale, analysis unavailable, legacy payload compatibility.
- **Migration:** none.
- **Shadow:** visual review/staging only after API flag; no experiment in production without approval.
- **Feature flag:** UI flag controls new contract rendering; safe fallback old UI.
- **Observability:** client errors and fallback/capability usage, no PII.
- **Rollback:** UI flag off.
- **Acceptance:** human-readable explanation, no technical overload, no public visibility of internal anti-abuse thresholds.
- **Commands:** focused Jest spec, `npm run lint`, `npm run typecheck`; build if route/SSR changes.
- **Dependencies:** Wave12.
- **Risks:** fake accuracy claims if API lacks population/freshness evidence.
- **DoD:** product states covered and usable on mobile.

### Wave 14 — IAS Foundation Only

- **Goal:** independent methodology boundary, input-definition interface, experiment namespace and validation harness; no IAS score.
- **AS-IS affected:** docs only; no IAS runtime.
- **Target:** isolated experimental release can record input contract/status/validation run without official rank or fabricated value.
- **Files:** new methodology experiment interfaces and specs; no edit Organic formula.
- **Schema:** only if experiment metadata persistence approved; no score/result table until design approval.
- **Services:** boundary/registry hooks, validator requires approved definition artifact; refuse scoring if formula absent.
- **API:** none public; internal experiment result namespace only.
- **Frontend:** none/publication forbidden.
- **Tests:** IAS cannot become publicable without approved formula/inputs/manifest; isolation from Organic.
- **Migration:** none or additive experiment metadata only.
- **Shadow:** no score calculation; later experiment after calibration only.
- **Feature flag:** experiment flag cannot expose/publicize result.
- **Observability:** experiment execution/status, no score absent method.
- **Rollback:** disable experiment namespace; retain audited proposals.
- **Acceptance:** no fake IAS/IS/IPM; no substitution/addition; validation boundary documented.
- **Commands:** focused unit/service specs; no production jobs.
- **Dependencies:** Manifest/Gates/ADR0011; product/data validation.
- **Risks:** consumers misconstrue placeholder as score.
- **DoD:** infrastructure refuses unapproved scoring and keeps IAS separate.

### Wave 15 — Shadow

- **Goal:** compare old/new ranking and coverage results without changing official UI.
- **AS-IS affected:** snapshots/workers and all migrated consumers.
- **Target:** reproducible diff artifacts with population/coverage/score/position/fallback/benchmark/runtime/errors.
- **Files:** shadow services/jobs only after safe scheduling; reports; tests.
- **Schema:** optional shadow run result table after volume/retention decision; otherwise aggregate object store/log.
- **Services:** comparator, canonical as_of and manifest pins.
- **API:** none public.
- **Frontend:** none.
- **Tests:** deterministic diffs and sampling; no write side-effects.
- **Migration:** no destructive migration; any shadow schema additive.
- **Shadow:** primary purpose; compare basis/consumer-specific reasons.
- **Feature flag:** run enablement separate from read path.
- **Observability:** diff ratio/error/duration/coverage mismatch; cardinality controls.
- **Rollback:** disable worker/read shadow outputs; old engine remains.
- **Acceptance:** tolerances defined before data run; unresolved diffs block rollout.
- **Commands:** focused comparator specs, safe staging job manual invocation only.
- **Dependencies:** all relevant waves and sanitized data; approval before production shadow.
- **Risks:** hidden database cost and sensitive company lists in reports.
- **DoD:** signed shadow report with no unexplained material changes.

### Wave 16 — Rollout / cutover

- **Goal:** activate only a validated consumer/read path; preserve previous read path and last-known-good snapshot.
- **AS-IS affected:** old ranking and consumers.
- **Target:** per-consumer controlled rollout, immutable manifest selection, rollback to old engine.
- **Files:** flag config, routing layer, runbook/alerts.
- **Schema:** no destructive change; new schema already backward compatible.
- **Services:** flag chooses read path only, not formula or manifest content.
- **API:** compatibility contract remains.
- **Frontend:** staged activation after API.
- **Tests:** rollout flag matrix, old/new path, rollback and last-good read tests.
- **Migration:** no cutover until data/backfill and rollback signoff.
- **Shadow:** required signed evidence before enablement.
- **Feature flag:** per product/consumer; owner/expiry/audit; manifest remains immutable.
- **Observability:** SLO readiness, errors, stale rate, diffs, gate/publicable ratio, fallback/no-scope.
- **Rollback:** immediate flag-off to previous path/last-known-good immutable snapshot; no table deletion.
- **Acceptance:** tests, shadow evidence, reconciled coverage, policy approvals and on-call runbook.
- **Commands:** release pipeline only after owner authorization; never execute deploy in plan creation.
- **Dependencies:** Waves 0A–15, calibration and product sign-off for affected policy.
- **Risks:** partial population/caches or new invalid scope; monitor and stop if mismatch.
- **DoD:** cutover approved per consumer, rollback drilled, old path retirement separately decided.

## Wave ordering and exit criteria

`0 → 0A → 1 → 2 → 3 → 4 → 5/6 (partly parallel after interfaces) → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 (independent foundation after 5/8) → 15 → 16`.

Data calibration is a parallel workstream from baseline and reconciliation. It is not an excuse to pick thresholds early. Waves 10/11 compatibility work may proceed with an explicit AS-IS compatibility policy; threshold-based publishability remains off until D12/D14/D29 calibration and owner approval.

