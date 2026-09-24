# Avalia Solar — Discovery final do Ranking v2 / IAS

- **Status:** Discovery documental concluído; aprovações de produto e calibração de produção pendentes.
- **Data:** 2026-09-24
- **Baseline observado:** `257bbdc167c7a63434b1212d09ea8e8f8e5e1c54` (`main`); worktree já continha documentação não rastreada e alterações locais listadas abaixo.
- **Limite:** investigação read-only de código, migrations, specs e documentos. Nenhuma consulta foi executada contra produção, nenhum código/migration/schema foi alterado nesta execução.
- **Vocabulário da evidência:** **AS-IS** = confirmado em código/schema/spec; **DOCUMENTED** = afirmação só documental; **INFERENCE** = consequência técnica; **PROPOSED** = recomendação futura; **UNKNOWN** = não demonstrado; **PRODUCTION DATA PENDING** = precisa perfil seguro de produção.

## Sumário executivo

O repositório contém um ranking orgânico executado em runtime, mas não implementa IAS/IS/IPM. O score orgânico atual é `Trust Score × 10 + engajamento diário ponderado por decaimento exponencial`, sem teto total; Trust Score já incorpora avaliações, volume de avaliações, views/clicks e leads. Positioning tem eixos independentes e sobreposição de sinais. Portanto a opção arquitetural mais segura é **D: manter ranking orgânico e IAS como produtos/metodologias independentes**, sem somar ou substituir scores até uma decisão metodológica baseada em dados e revisão de produto. Esta é recomendação, não ADR aceito.

Há riscos concretos prioritários fora da fórmula: `CompanyServiceArea#covers?` considera radius atendido por igualdade de UF, sem calcular distância; usos de cobertura variam entre sede, listas legacy e relação; o frontend estima cidades cobertas multiplicando estados por 10; ranking eligibility oficial ainda usa sede; SEO local prioriza `sponsored`/`priority_score`; um painel ActiveAdmin chamado “ranking meritocrático” ordena por `Company.ordered_by_priority`; e Positioning pode retornar o último candidato mesmo sem elegibilidade.

As decisões conceituais ADR 0001–0010 foram lidas e permanecem coerentes entre si no núcleo. Contradições estão no comportamento/documentos pré-existentes e devem ser tratadas como lacunas de migração, não como autorização para reabrir decisão congelada. As maiores dependências que não podem ser fechadas só pelo repo são confiança/evidência da cobertura, thresholds estatísticos, modelo de snapshot reproduzível e score IAS.

## 1. Baseline e método

### Baseline

Comandos iniciais: `git status`, `git branch --show-current`, `git rev-parse HEAD`, `git log -1 --oneline`, `git diff -- CONTEXT.md docs/adr/`.

| Campo | Resultado |
|---|---|
| `CURRENT_SHA` | `257bbdc167c7a63434b1212d09ea8e8f8e5e1c54` |
| `CURRENT_BRANCH` | `main` |
| `HEAD` | `257bbdc16 feat(pwa): refactor mobile bottom navigation with safe-area and zero dead actions` |
| `WORKTREE_STATUS` | Alterações pré-existentes: `.gitignore`, `AGENTS.md` modificados; `CONTEXT.md`, ADRs 0001–0010, Discovery hierárquico e `interface-design/` não rastreados. Sem staged. Preservados. |
| Diff de ADRs | Vazio porque os ADRs/CONTEXT estão não rastreados; o status, não o diff, é a evidência de sua presença. |

O conteúdo exibido repetidamente no transcript não foi reproduzido em blocos repetidos nos arquivos efetivamente lidos. Os ADRs 0001–0010 e `CONTEXT.md` têm textos singulares. Não havia duplicação documental real a corrigir. O baseline contém mudanças pré-existentes não documentais (`.gitignore`, `AGENTS.md`); nenhuma foi modificada nesta tarefa.

### Evidência consultada

Inspecionados os ADRs 0001–0010, `CONTEXT.md`, `docs/architecture/DISCOVERY_HIERARCHICAL_RANKING_IAS.md`, serviços/workers Rails, models, serializers, controller/API, queries, migrations, schema, specs direcionadas, componentes frontend e configuração/localidades. Nenhum runner/test foi executado para evitar conexão inadvertida a um banco ou execução com configuração ambiental não confirmada. **PRODUCTION DATA PENDING**.

## 2. ADRs e decisões conceituais congeladas

| ADR | Decisão | Status | Impacto / dependências | Questões abertas | Implementação necessária? |
|---|---|---|---|---|---|
| 0001 | B2C usa `service_coverage`; B2B institucional usa `headquarters`; geografia é explícita | Aceito para planejamento | Desacopla geografia de `companies.city/state`; depende de cobertura confiável | Nome de schema; validação | Sim, depois de resolver fontes/IDs |
| 0002 | Hierarquia extensível; primeira cascata cidade → estado → Brasil; somente geografia relaxa; requested/candidate/resolved separados; nenhum candidato válido = `no_eligible_scope` | Aceito para planejamento | Exige policy/resolver versionado e quality gates | Modelo territorial, thresholds e versão da policy | Sim |
| 0003 | `CompanyServiceArea` é fonte canônica-alvo; legacy só compatibilidade temporária, migração faseada | Aceito para planejamento | Backfill auditável, writers, consumidores, shadow, rollback | Inventário/reconciliação real; contrato canônico | Sim |
| 0004 | Declaração, publicação, confiança e autorização variam por consumidor; autodeclaração não qualifica para Ranking B2C | Aceito para planejamento | Exige autorização de uso distinta de moderação/entitlement | Policy por consumer e limiar de confiança | Sim |
| 0005 | Evidência híbrida e territorialmente específica; ausência de evidência ≠ ausência de atendimento | Aceito para planejamento | Evidência possui provenance/freshness e possibilidade de revisão | Sinais aceitos, limiares, expiração | Sim |
| 0006 | Identidade territorial interna distinta de código externo, nome/alias/slug | Aceito para planejamento | Exige catálogo e versionamento territorial compartilhados | Fonte/licença/refresh/membership | Sim |
| 0007 | Scope por identidade comparável metodologicamente governada; dimensão de UI não entra automaticamente | Aceito para planejamento | Exige canonicalização e contrato da metodologia | `sector` vs categoria, formato key, activation dimensions | Sim |
| 0008 | Elegibilidade da empresa, validade da população, publicabilidade e disponibilidade de análises são camadas separadas | Aceito para planejamento | Gate reportável por status/reasons/diagnostics | Classificação dos gates | Sim |
| 0009 | Thresholds são calibrados com dados reais, separados por capability e versionados; 10 é somente AS-IS | Aceito para planejamento | Depende de profiling de produção autorizado e histórico | Todos os valores estatísticos | Sim, depois do perfil |
| 0010 | Manifesto publicado imutável com release geral e componentes versionados; snapshots o referenciam | Aceito para planejamento | Exige lifecycle, contexto `as_of`, retenção de dados para reprodução completa | Schema, input retention, workflow | Sim |

Não há conflito conceitual interno entre ADRs 0001–0010. São complementares. Conflitos com implementação/documentos legados constam na seção 58. Nenhum ADR foi reescrito.

## 3. AS-IS: composição dos scores

### 3.1 Trust Score

**AS-IS:** `TrustScore::Definition` versão `trust-score-v1` consome `verified`, média de rating, contagem de avaliações, views de perfil, cliques CTA e leads da empresa (`AB0-1-back/app/services/trust_score/definition.rb:8-39`, `calculate`; `.../calculator.rb:9-17`). A evidência do código permite afirmar que mede uma composição de **verificação do cadastro + rating/volume de avaliações + engajamento de perfil + contagem de leads**, não “idoneidade”, qualidade instalada, satisfação comprovada ou cobertura territorial.

Fórmula AS-IS: `score = clamp(50 + verification(0|20) + rating(0..20) + reviews(0..10) + engagement(0..10) + leads(0..10), 0,100)`, arredondado a 2 casas. Rating usa `min(max(rating,0)/5 × 20,20)`; reviews `min(max(count,0)/100 × 10,10)`; leads `min(max(count,0)/100 × 10,10)`; engagement é log-normalizado `10 × ln(1+min(max(views+2×clicks,0),500))/ln(501)`. Base 50 fixa; ausente/nil vira zero no `Calculator#attribute`. O somatório nominal máximo é 120 antes do clamp, de modo que vários inputs altos saturam em 100 e perdem discriminação. Validação do model restringe score persistido a 0..100 (`AB0-1-back/app/models/company_trust_score.rb:9-12`).

`TrustScore::CalculationService#calculate!` retorna comparação com score anterior; `fetch_stored` devolve `0.0` se não existe registro (`.../calculation_service.rb:16-33`). `CompanyTrustScore` persiste score; o model não define timestamp/version próprio visível (`.../company_trust_score.rb:3-18`). O worker de recálculo e a tabela podem ter timestamp no schema; a definição efetiva e freshness do registro devem ser consultadas pelo schema/worker, sem tratar score inexistente como observação verdadeira de zero. `health_status` é bucket derivado, `score_trend` retorna hardcoded `stable` (`.../company_trust_score.rb:19-32`). Não há versionamento composto do score persistido, embora `components` contenha `definition_version` calculada.

### 3.2 Ranking orgânico oficial

**AS-IS:** `Analytics::RankingScoreWorker#perform` calcula para empresas com `company_trust_score` uma pontuação por query SQL: `ranking_score = 10 × trust_score + Σ(engagement_score_d × exp(-0.1 × (CURRENT_DATE - d)))`, com `d` nos 7 dias anteriores ao dia atual (`AB0-1-back/app/workers/analytics/ranking_score_worker.rb:20-33`). A janela inclui datas `CURRENT_DATE - 7` até `< CURRENT_DATE` (dias civis do PostgreSQL; não “últimos 168h”). `CompanyFeatureDaily.engagement_score` é agregado de views+5×CTA click+10×WhatsApp click; `lead_conversion_rate` e reviews/unique sessions são calculados pela feature store mas não entram nessa expressão (`AB0-1-back/app/workers/analytics/feature_store_daily_worker.rb:41-59`). Decay soma sem teto total: engagement recente pode dominar indefinidamente o componente Trust, embora cada linha diária tenha input próprio. Para 7 dias completos, o multiplicador por idade varia por dia; sinal menor não é limitado ao intervalo 0–100.

Há duas materializações: `company_ranking_score` é upsert por `company_id` no worker; snapshot diário `CompanyRankingSnapshot` tem versão `organic-performance-v2` (`AB0-1-back/app/models/company_ranking_snapshot.rb:3-15`). O `RankingSnapshotWriter` cria somente `global` e `category`, não escopos por cidade/estado, inclui qualquer população não vazia e ordena por score desc, Trust Score desc (`COALESCE 0`), reviews_count desc, `company_id` asc (`AB0-1-back/app/services/company_dashboard/ranking_snapshot_writer.rb:20-28,33-63`). Portanto desempate é determinístico para o mesmo estado de dados, mas Trust Score, avaliações e ID participam após empate no score. Flags de Trust ausente (> nil) e mais velho que 26h são gravadas e não removem empresa nem impedem snapshot (`.../ranking_snapshot_writer.rb:66-71`).

Elegibilidade oficial atual: `Company.active` + join obrigatório de score em `company_ranking_score`, filtros opcionais category, headquarters state/city e `companies.project_types @> sector` (`.../ranking_eligibility_scope.rb:17-38`). Não verifica cobertura, confiança, validação, subcategoria por parent/child, score mínimo, freshness ou gate de publicabilidade. `RANKING_MIN_COMPARABLE_POPULATION=10` é do benchmark e Positioning, não bloqueia writer/ordenação oficial (`.../ranking_benchmark_service.rb:8-22`; `.env.example:124`; ADR0008/0009).

O pipeline usa advisory lock global do worker; writer usa `upsert_all` com chave diária única. Reprocessamento de mesmo dia substitui resultado (não soma valor persistido ao score já salvo), mas a agregação parte de tabela diária e `CURRENT_DATE` do banco, sem `as_of` congelado comum explícito entre Trust/eventos/snapshot. Worker grava estado de pipeline fora de uma transação global envolvendo score e snapshot; falha pode deixar score atualizado e snapshot/processing watermark em outro estado (`.../ranking_score_worker.rb:15-46`).

**Official vs preview:** `RankingService` usa snapshot versionado para modo canônico; filtros ad hoc montam população dinâmica para preview/analysis. A API indica semântica em `definition` e `is_ad_hoc_preview`; Positioning pode retornar preview, requested/resolved scope e fallback. `CompanyRankingSnapshot` permite apenas global/category (`.../company_ranking_snapshot.rb:8`). Preview não é manifesto/contrato metodológico imutável.

### 3.3 Engagement e risco de contagem repetida

Taxonomia reconhece aliases de profile view, CTA, WhatsApp, email, telefone, website, quote e lead (`AB0-1-back/app/services/analytics/event_taxonomy.rb:5-26`). O `FeatureStoreDailyWorker` hoje lê `company_daily_stats` agregada, não consome evento bruto diretamente; por dia faz upsert de `company_feature_daily` com `engagement_score = profile_views + 5×cta_clicks + 10×whatsapp_clicks`, `lead_conversion_rate = leads/profile_views` e review velocity (`.../feature_store_daily_worker.rb:41-59`). O ranking lê apenas `engagement_score` dos feature rows na janela SQL indicada.

O pipeline de eventos inclui `TrackEventJob` → `TrackEventService`, `EventEligibility` (contexto acquisition vs organic_engagement), aliases e tabela/deduplicação para plataforma. **Não foi demonstrado** que todas as rotas que atualizam `company_daily_stats` aplicam exatamente a mesma elegibilidade/idempotência; o evento bruto tem IDs, há `analytics_event_dedup` e tabela de eventos particionada em migrations de 2026-02, mas não existe prova única de que esse caminho de dedupe governa cada contador diário. `FeatureStoreDailyWorker` usa watermark por dia e lock, reprocessa dias do intervalo por upsert, o que torna a linha diária idempotente para a mesma fonte; duplicação antes da tabela diária ou múltiplas taxonomias de evento pode inflar contadores. Não afirmar que reprocessar esse worker duplica persistentemente o próprio `company_feature_daily`; é substituição por chave `(company_id, day)` em Postgres. Late-event behavior exato, timezone, `occurred_at` vs `created_at` e reconciliador completo permanecem **UNKNOWN** sem percorrer todo o event-ingestion path/dados.

### 3.4 Benchmark e percentil

`RankingBenchmarkService#call` recebe a população já elegível, remove score nil, ordena score, retorna `empty` se zero; se `n < min`, `insufficient_sample`; default min 10 configurável por ENV. Acima disso calcula P50/P75/P90 por interpolação linear no índice `(p/100)*(n-1)`, reporta colisão somente quando P75=P90, min/max/média/desvio padrão populacional e contagem distinta (`AB0-1-back/app/services/company_dashboard/ranking_benchmark_service.rb:8-45,85-107`). Não possui gate de variância, distinção mínima, ties, zeros, freshness, amostra independente ou benchmark histórico. A colisão não invalida o resultado do ranking; benchmark é resposta derivada. Não foi encontrado persistence/cache dedicado do benchmark no service. Dados/benchmark são calculados em runtime via `RankingService`.

## 4. Positioning, IAS e semântica de sinais

### 4.1 Positioning

`Positioning::Definition` é `positioning-v1`; X combina Trust .45, verificação .20, credibilidade review .15, badges .10, social proof .10; Y combina leads .35, engagement .25, conversão .20, maturidade .10; há caps de volume/relação e modo alternativo reviews (`AB0-1-back/app/services/company_dashboard/positioning/definition.rb:8-37`). `Calculator` materializa X/Y e `ThresholdCalculator` usa medianas. `Eligibility` exige min de população (o mesmo ENV/default 10), ao menos dois X e dois Y distintos e taxa de zero Y inferior a 50%; caso contrário `insufficient_sample` (`.../positioning/eligibility.rb:10-47`). Esses gates bloqueiam Positioning/quadrante, não o ranking orgânico.

`ScopeResolver#resolve` testa candidatos e aceita o primeiro `ready`; se nenhum for suficiente, recalcula e retorna o último mesmo falhando (`.../positioning/scope_resolver.rb:19-31`). Fallback é assimétrico: city → state preserva category/sector; então adiciona category/global candidato; state → category/sector, então category/global; sem state/city, casos setor/categoria vão para categoria. A política só observa `population.length >= min` no resolver (não os gates de Positioning até camada posterior). É legado de Positioning e **não** deve ser copiado para novo RankingScope conforme ADR0002/0008.

### 4.2 IAS / IS / IPM

Busca do repositório: IAS/IS/IPM aparecem em Discovery e artefatos documentais como proposta conceitual, incluindo IS (satisfação), IPM (presença/maturidade) e agregação IAS. Há fórmula/candidato ilustrativo, pesos e possíveis sinais documentados; são **DOCUMENTED / PROPOSED**, não implementação runtime. Não se encontrou classe de cálculo IAS/IS/IPM, model/tabela de score, endpoint, persistência, migration, teste ou versionamento em app Rails/Next. Portanto:

| Conceito | Classificação | Evidência |
|---|---|---|
| Trust Score | AS-IS IMPLEMENTED | `TrustScore::Definition`, Calculator, CalculationService, `CompanyTrustScore` |
| Organic Ranking v2 | AS-IS IMPLEMENTED | worker, eligibility, snapshot writer/model, API/service |
| Positioning | AS-IS IMPLEMENTED | `Positioning::Definition`, Calculator, Eligibility, ScopeResolver; análise derivada com score próprio |
| IAS | DOCUMENTED / PROPOSED; runtime não encontrado | Discovery conceitual; ausência de código runtime localizada |
| IS | DOCUMENTED / PROPOSED; runtime não encontrado | Definição conceitual; sem runtime/persistência/teste |
| IPM | DOCUMENTED / PROPOSED; runtime não encontrado | Definição conceitual; sem runtime/persistência/teste |

### 4.3 Double counting / bounds

| Sinal | Fonte e significado implementado | Trust | Organic | Positioning | Risco de sobreposição |
|---|---|---:|---:|---:|---|
| Verificação `verified` | flag de verificação geral; sem prova territorial | +20 | Indireto, embutido em Trust ×10 | X + eixo próprio | Duplicado no X do Positioning ao lado de Trust |
| Rating médio | cache da média de avaliações | linear até 20 | Indireto via Trust | possivelmente credibilidade/eixo reviews | Rating + contagem são correlacionados estruturalmente |
| Contagem reviews | volume | até +10 no Trust | Indireto via Trust e desempate reviews | volume/credibilidade | Correlação e sobreposição no desempate/Positioning |
| Views | tráfego de perfil | parte do engagement Trust | Daily engagement | eixo Y engagement | Mesmo sinal retorna por dois caminhos em Organic: Trust*10 e evento recente |
| CTA clicks | cliques; Trust usa peso 2 | Trust | daily engagement: CTA×5 / WhatsApp×10 | Y engagement/conversão | Forte risco estrutural de dupla ponderação |
| Leads | contador acumulado | Trust, até +10 | `lead_conversion_rate` não usado no score organic | Y leads/conversão | Trust e eixo Y; Trust não necessariamente same time window |
| Cobertura/área | declaração, relation ou sede dependendo consumidor | Não input direto da fórmula | Elegibilidade atual usa sede; não score | Recommendation geography; IAS só proposta | Não converter em score sem confiança e finalidade |
| Profile completeness | nenhum input da definição Trust | Não | Não | não no eixo genérico | Recommendation usa completude; proposta IPM usa presença, risco futuro |
| Badges/social proof | Trust não os inclui diretamente | Não | Não | X includes | Company verified vs badge distinction exige provenance |
| Sponsored/priority/plan | não na expressão score worker | Não | Snapshot writer exclui; eligibility não filtra por plano/sponsored | Recommendation tem paid placements | Search/SEO/Admin preview podem ordenar por paid/priority; superfície distinta |
| Project count/age/resposta | não na fórmula Trust/organic | Não | Não | operacional depende de eixo Y | IAS proposta; sinal e proveniência ainda não demonstrados |

**Bound importante:** Trust fica 0–100, Organic final não possui cap: embora janela seja sete dias, não existe bound declarado para quantidade/valor de feature rows; matematicamente `Σ engagement_d × exp(...)` não tem bound superior no código. Assim, essa dimensão pode dominar Trust sem limite. Isso não prova distribuição observada; impacto quantitativo é **PRODUCTION DATA PENDING**. IAS deve evitar agregar Trust inteiro com os mesmos sinais subjacentes sem modelagem de contribuição/correlação para não duplicar reviews, engagement, leads e verificação.

### 4.4 Decisão 11 — score oficial / IAS

| Alternativa | Avaliação |
|---|---|
| A — somente Organic Ranking | Preserva runtime; posterga IAS, não atende possibilidade de índice institucional separado. |
| B — substituir por IAS | Não recomendado: IAS sem implementação, fórmula validada, dados e histórico de comparação; quebra semântica de `organic-performance-v2`. |
| C — combinar Organic + IAS | Não recomendado: semânticas e escalas diferentes, overlap de sinais, risco de dupla contagem e de alterar ordem sem metodologia/versionamento. |
| D — coexistência independente | **Aprovada pelo owner (D11).** Organic Ranking continua ordenação atual, Trust Score continua input interpretável, Positioning é capability derivada independente; IAS futuro tem manifesto, inputs, elegibilidade, quality, snapshot e validação próprios. Nenhum score é somado nem substitui outro sem ADR/metodologia e experimento. |

ADR0011 registra a decisão aprovada. Não se deve afirmar que o IAS é ranking oficial.

## 5. Snapshot, história, desempate e estabilidade

`CompanyRankingSnapshot` tem company, `scope_type` global/category, `scope_id`, `definition_version`, score, posição, população, percentile, breakdown JSON, quality flags, `data_through`, `computed_at`, `snapshot_date`; model valida unicidade lógica por dia e migration cria índices de leaderboard e chave única diária via `COALESCE(scope_id,-1)` (`AB0-1-back/app/models/company_ranking_snapshot.rb:3-15`; `db/migrate/20260723090000_create_company_ranking_snapshots.rb:9-30`; `db/migrate/20260921130000_add_snapshot_date_to_company_ranking_snapshots.rb:8-17`). Snapshot writer faz `upsert_all`, portanto diário não é append-only se recomputado, embora registre uma linha por company/scope/version/date.

**Ausente no snapshot:** territory identity/geographic basis, requested/resolved/candidate list/reason, category context além do scope_id limitado, `project_type`, manifest de componentes, `as_of` (há `data_through` date/datetime), source revisions, gate report separado, capabilities disponíveis, event watermarks e referência de inputs completa. Scope de snapshots é incompatível com cidade/UF agora. Recalc hoje não reproduziria necessariamente inputs históricos: company, reviews, Trust Score, status, `project_types`, eventos/features e categoria são mutáveis; não há input snapshot integral no domínio visto. Classificação atual: **L1 parcialmente explicável** por versão geral, breakdown, `data_through`, flags e tie rule; **L2 parcial**; **L3 NOT REPRODUCIBLE** sem retenção versionada de inputs/event history/território/metadados.

Há ordering determinístico no snapshot writer (`score desc, trust desc, reviews_count desc, id asc`) mas sort dinâmico do `Recommendation::Engine` só score desc e pode depender da ordenação anterior para ties. Páginas SEO usam suas próprias ordenações. Nada disso deve ser confundido com desempate único para todos os produtos.

Schema possui snapshots diários desde migration de Julho/Setembro 2026; spec do writer valida upsert/versionamento básico. Há histórico potencial no banco local, mas não foi consultado; produção e estabilidade temporal **PRODUCTION DATA PENDING**. Para ranking churn futuro medir posição, Spearman/Kendall, top-N overlap, entradas/saídas, variação de score e sensibilidade por release/escopo, mantendo corte temporal comparável.

## 6. Coverage: estado, nacional, cidade, raio e sede

### 6.1 Fontes

`CompanyServiceArea` define `city/state/national/radius`, active flag, UF, nome de cidade e `radius_km` (`AB0-1-back/app/models/company_service_area.rb:1-13`; migration `20260802100000_create_company_service_areas.rb:3-15`). Há serializers que expõem ambos: legacy `coverage_states/coverage_cities` e relação `service_areas` (`app/serializers/company_serializer.rb:198-210`); GraphQL também expõe listas legacy (`app/graphql/types/company_type.rb:52-53,86-92`). `Company` tem associação à relação, mas writers e leitores não convergiram. Dashboard e Admin atuais leem/escrevem principalmente coverage_* legacy; `CompanyFieldPolicy` trata service_area como lista de campos coverage legacy e limites levam a `PendingChange`, não verifica verdade geográfica (`app/services/company_field_policy.rb:3-38,61-65`; `app/services/company_service_area_limit_service.rb:19-51`). O `CompanyServiceArea` selecionado nos caminhos de recomendação/leads/Profile existe como segunda representação. Não encontrei writer/backfill universal da relação. Duplicação/divergência potencial é fato estrutural; tamanho real precisa reconciliação read-only futura.

### 6.2 O que estado/nacional significa hoje por consumidor

| Consumidor | Estado significa todos municípios? | Nacional significa todos municípios? | Fonte / evidência |
|---|---|---|---|
| `CompanyServiceArea#covers?` | Para `coverage_type=state`, retorna true se UF igual, portanto todos os pedidos de cidade dessa UF (`:24-27`) | `national` retorna true antes de checar city/UF (`:15-18`) | Relação estruturada; radius bug abaixo |
| `CoverageNormalizer#serves_state?` | Sede igual OU `coverage_states` contém UF (`:127-134`) | Não tem representação national reconhecida nos campos legacy | Legacy + sede |
| `CoverageNormalizer#serves_city?` | Cidade sede ou lista de cidades + `serves_state?`; cidade legacy pode depender da UF/lista states (`:136-149`) | Não assume cobertura nacional | Legacy + headquarters |
| Search (`CompanySearchService` / `Company.search_data`) | Indexa legacy `coverage_states`; state matching por índice legacy; não usa `CompanyServiceArea` canônica | Sem semântica nacional explícita demonstrada nos campos indexados | Search docs `app/models/company.rb:49-79`, service lines 192–195 |
| Leads | Se cidade indicada usa `Company#serves_city?`; estado usa `serves_state?`; então sede e legacy, não relation national diretamente (`app/services/leads/lead_matching_service.rb:39-44`; score reason 50-67) | Só se estado/cidade estiver refletido em legado; não automático | Legacy+
| Recommendation | Query inclui service areas e aceita `coverage_type=state` para UF ou cidade textual exata; nacional seleciona todos (`eligibility_query.rb:42-68`); scorer chama `covers?` e também dá geoscore por HQ (`organic_scorer.rb:38-59`) | Sim para eligibility via query; scorer ainda pontua conforme HQ/local/national | Relation + HQ, sem trust |
| MobiVolt matcher | Usa `serving_state` (legacy scope) e refinamento `serves_city?/serves_state?`; fallback a top rated global sem match (`company_matcher_service.rb:41-45,60-82,88-115`) | Nacional pode não ser retornado pelo matcher se não está em legacy; no catch/no results há fallback geral sem localidade | Legado + sede |
| SEO local `/companies/energia-solar/:state/:city` | `local_base_scope` chama `serving_state(state)`; por cidade há refinamento sede/listas; não exige relação CompanyServiceArea/national | Não tratada implicitamente como nacional nos campos legacy | `local_solar_pages_controller.rb:61-82` |
| Perfil público | serializer mostra service areas e também coverage_states/cities; frontend tem fallback dual-source | service_areas national se existir, de outro modo lista `coverage_states` pode sugerir abrangência parcial | Serializer e `CompanyIdentityCard.tsx:64-82` |
| RankingEligibilityScope | Não há cobertura; estado/cidade da sede apenas | Não | `ranking_eligibility_scope.rb:17-38` |

**Diretriz proposta:** para serviços, `state` e `national` podem ser regras de descoberta/serviço candidatas abrangentes, mas não equivalem automaticamente à cobertura comprovada; cada consumer aplica autorização/confiança própria conforme ADR0004. Para Ranking B2C nacional/estadual/local, declarar hierarquia de alcance explicitamente e não inferir municipal coverage de sede nem da quota de plano. Não escolher se state cobre todos municípios até owner+policy de produto.

### 6.3 City, radius e sede implícita

City relation compara `city_name` case-insensitive após trim e exige UF; não usa ID territorial, alias, transliteração nem código IBGE (`CompanyServiceArea#covers?` lines 19-33). `CoverageNormalizer` usa catálogo `br_locations.json`, translitera acentos para canonical matching e combina com UF; sem UF percorre estados até primeiro matching city (`coverage_normalizer.rb:58-73,177-192`). Nomes homônimos exigem UF. `serves_city?` conta implicitamente a sede como atendimento (`:141-143`). Recommendation mistura sede e service area; `EligibilityQuery` também inclui headquarters explicitamente. Isso é inconsistente com o conceito futuro “service coverage”. Recomenda-se que headquarters não seja convertido silenciosamente em serviço; pode ser uma regra de fallback separada do produto, explicitada no payload/policy, nunca prova de cobertura para Ranking B2C.

`CompanyServiceArea#covers?` `radius` apenas retorna `state_code == target_state` (`:29-31`), ignorando `radius_km`, center, coordenadas e distância. Existe `Geo::HaversineCalculator` (`app/services/geo/haversine_calculator.rb`) para coordenadas de Company, mas não é usado por esse método e o centro real de área não está modelado no migration da relação. Resultado: falsa elegibilidade em todo o estado, um **P0 de verdade territorial** se essa capacidade for usada para decidir localidade. Sem evidência de que o Ranking B2C atual chama esse método; recommendation/leads podem chamar cobertura.

### 6.4 Confiança/evidence

Regras aprovadas ADR0004–0005, não schema:

| Consumidor | Declared | Evidenced / validated | Verified | Expired | Rejected | Unknown |
|---|---|---|---|---|---|---|
| Profile | Pode exibir com atribuição “informado pela empresa” | Exibir proveniência | Exibir com claim validado se política | Mostrar como desatualizada/retirar claim forte | Não publicar cobertura rejeitada | Não afirmar cobertura |
| Search | Pode afetar recall como declaração | Pode rankear/claim conforme policy | Pode afirmar correspondência validada | Não alegar atual | Não usar | Não assumir |
| Leads | Não basta para roteamento de alta confiança | Potencialmente candidato secundário; decisão de evidência aberta | Política mais forte pode autorizar | Exigir freshness definida | Excluir roteamento | Sem match confiável |
| Recommendation | Apenas candidato informativo, sem claim territorial forte | Pode suportar recomendação conforme policy | Pode suportar recomendação territorial | Necessita regra temporal | Excluir | Não recomendar como local |
| MobiVolt | Pode ser pista de descoberta; sem claim comprovado | Política posterior | Pode fundamentar localidade | Não usar como atual | Excluir | Fallback transparente |
| SEO local | Publicação depende de produto/entitlement, não selo de confiança | Marcar claim | Claim forte se validado | Atualizar/desindexar segundo SEO policy | Não declarar atende | Não gerar área inventada |
| Ranking B2C | Não elegível somente por declaration | Requer nível mínimo futuro | Requer policy + demais gates | Não elegível até revalidação | Não elegível | Não elegível |
| Analytics | Pode contabilizar como declarado separado | eventos de origem/nível | Segmentável por status | acompanhar freshness | auditar transição | preservar unknown |

Sinais existentes: Company projects/`delivered_projects_score`, reviews gerais/ratings, leads e distribuição, portfolio/media, endereço/coordinates/geocoding, verificação geral, badges. Esses objetos não são evidence automaticamente. Projects são declarados/score agregado em Company; reviews podem não ter localidade de execução; lead local significa demanda, não execução; CNPJ/endereço mede sede; badge mede atributo conforme sua semântica. Nenhuma entidade comum de `CoverageEvidence`, ligando evidência verificada à localidade, foi encontrada. Contratos/documentos e revisão específica de cobertura não confirmados. Confidence expiry/freshness específica não encontrada. Exigir proveniência, vínculo territorial, qualidade, gaming risk, data de validade e revisão como descoberta anterior; valores pendem decisão.

## 7. Entitlement, governança operacional e pay-to-rank

`PlanFeatureCatalog` tem limites de estados/cidades e `national_coverage` por tier; `CompanyServiceAreaLimitService` compara lista de coverage legacy e quota, trata 27 estados como pedido de nacional (`app/services/company_service_area_limit_service.rb:8-13,19-51`). `CompanyFieldPolicy` permite update direto quando dentro de limite, exige approval se exceder; isso controla autorização/configuração, não prova território (`app/services/company_field_policy.rb:20-38,61-65`). Dashboard emite `PendingChange` para alterações excedentes; ActiveAdmin `pending_changes` grava approved_at/approved_by, sem semântica de verificação territorial. Company Admin edita as colunas legacy. Não há policy de validação territorial específica demonstrada.

**Payment hoje:** pode afetar limites/configuração coverage, features de SEO local/visibilidade, recursos comerciais e anúncios/placements; não há caminho direto da subscription tier para `RankingEligibilityScope` ou `RankingScoreWorker`. `RankingEligibilityScope` e snapshot writer declaram patrocínio fora do ranking orgânico. Invariante organic ranking: test `spec/services/company_dashboard/organic_ranking_sponsorship_invariant_spec.rb`. Assim **não foi encontrado pay-to-rank direto no ranking oficial atual**. Porém há risco de confundirem produtos: SEO local order prioriza `sponsored`, `featured`, `verified`, `priority_score` em `local_priority_order_sql` (`local_solar_pages_controller.rb:143-149`); Recommendation injeta sponsored slots (`recommendation/engine.rb:30-60`); `Company#ordered_by_priority`/Admin ranking preview expõe priority/sponsored (`company.rb:384-400`, `admin/ranking_preview.rb:42-79`). Manter nomes/labels distinct organic vs sponsored e nunca tratar SEO/listing order como rank oficial.

## 8. Território e taxonomias

`db/data/municipios.csv` possui cabeçalhos codificados com corrupção de encoding no checkout (`C�DIGO...`), com colunas TOM/IBGE/município/UF, primeira linha fornece IBGE 1100106 e município em encoding corrompido no byte view. Arquivo contém 5.572 linhas incluindo header. O cabeçalho indica fontes/códigos, mas **origem, data, versão, licença e integridade não são comprovadas** por metadado inspecionado. Não concluir quantidade oficial de municípios: precisa validar duplicatas, códigos, UF, municípios homônimos e codificação antes. `locations_from_csv.rake` faz fallback para UTF-8/Windows-1252/ISO-8859-1, reconhece UF/cidade, descarta códigos, deduplica strings e grava somente estados/cidades em JSON (`AB0-1-back/lib/tasks/locations_from_csv.rake:15-46,81-110`). `BrLocations` carrega JSON de nomes, sem IDs (`app/services/locations/br_locations.rb:7-25,48-73`). `CoverageNormalizer` translitera e slugifica texto, slug não é identidade (`coverage_normalizer.rb:89-112,177-192`).

**Territory Catalog v1 proposto:** ingestão governada versionada, primeiro país BR e UF oficial, município com ID interno estável + código IBGE externo candidato + nome canônico/aliases + UF parent; fonte/proveniência/licença/data da extração registrada; validação de unicidade de código e identidade, associação municipal inequívoca, alias e história temporal. Slug só resolve URL a ID. Não escolher CSV atual como fonte até proveniência/licença/refresh auditados. `CompanyServiceArea`, headquarters, projects, leads/reviews e RankingScope eventualmente referenciam o catálogo. Catálogo não materializa rankings.

Busca por região metropolitana, meso/microrregião e região intermediária não encontrou domínio/catálogo governado implementado. Opções futuras: estatísticas oficiais regionalizadas (com versão/membership), fonte legal de regiões metropolitanas (membership temporal e divergências), ou adiar esses níveis. Cidade→UF→país pode avançar primeiro após catálogo e cobertura. Metro/Region dependem de fonte/membership/temporalidade antes de uso.

### Categoria vs setor

`Category` tem `kind main/sub`, `parent_id`, children, relacionamento muitos-para-muitos com empresas e taxonomias de produtos/critério (`app/models/category.rb:8-39`). `Company::PROJECT_TYPES` é enum/lista diferente (ver `company.rb:718-770`) e eligibility atual chama filtro `sector`, mas compara literalmente com `companies.project_types @> [...]` (`ranking_eligibility_scope.rb:22`). Portanto código evidencia que “sector” da query atual representa um `project_type` legado, não relacionamento Category parent/child; categoria e project type não são sinônimos. A eventual equivalência setorial de negócio continua ambígua por nomes de UI/Discovery. Decisão prudente: tratar como dimensões/taxonomias distintas, descontinuar nome semântico `sector` após mapear callers; category main/sub é hierarquia própria; project type é natureza do projeto. ADR0007 deixa ativo de forma condicional até definição de contrato.

## 9. Scope, fallback, dimensões e identity tuple

| Dimensão | Core | Conditional | Query-only / execution / snapshot | Razão |
|---|---:|---:|---:|---|
| Methodology identity + release | Sim | | | Regras comparáveis/reprodução |
| Geographic basis | Sim | | | Muda população (headquarters vs coverage) |
| Geographic level + canonical territory | Sim | | | Define recorte territorial |
| Category | | Sim | | população por produto/categoria quando ativada pelo contrato |
| Project type | | Sim | | só se contrato diz que redefine comparabilidade |
| Sector atual | | Em resolução semântica | | `sector` usa `project_types` no ranking; manter mapeamento explícito |
| Size/porte | | Futuro inativo | | sem fonte/domínio/proveniência |
| Criterion | | Só futura metodologia se altera população/score oficial | query/analysis | hoje posicionamento/análise |
| Internal lookback | Parte do componente/versionado | | | influencia resultado |
| History days escolhido | | | query | consulta histórica, não outra população |
| requested/resolved/fallback reason | | | resolution metadata | papel/processo, não identidade dos scopes |
| Preview/official | | | execution/publication mode | não redefine população |
| `as_of`, computed_at, snapshot_date | | | snapshot context | tempo de resultado, não identidade |
| Sort/page/chart/UI filters/benchmark mode | | | query/presentation | não muda população ou método |

Tuple canônica proposta antes de hash/string: `(methodology_identity, methodology_release, geographic_basis, geographic_level, territory_internal_id, active comparable dimension key/value pairs canonicalized by methodology)`; null/global/any necessita semântica tipada. IDs/category/project types devem ser estáveis; aliases/slugs resolvidos previamente; ordem canônica por chave; migration não deve serializar texto livre. Methodology release version change changes identity; territory source change exige decisão de compatibilidade, não necessariamente nova scope semântica se identity interna persistir. `Scope Identity != Scope Key != materialization`.

Policy de resolução proposta: `ScopeResolutionPolicy` resolve requested + candidates, preserva base geo e todas as dimensões; para cada candidato calcula população e publication-required gates; primeiro válido é resolved; nenhum válido vira no_eligible_scope. Candidate history/reason/gate result vão para response/audit/snapshot. Não usar gate de quadrante para fallback se ranking é publicável. Versionar hierarquia e ordem de candidatos.

Outros fallbacks AS-IS: Positioning já descrito; MobiVolt recua para top-rated global sem local match; recommendation query não evidencia fallback geográfico, embora scorer aplique pontos por sede/área; Search aceita filtros/retorno de discovery próprios; SEO “nearby_locations” muda localização para vizinhas por paginação de páginas, não ranking fallback. Benchmark não tem fallback interno; ranking endpoint pode gerar preview/snapshot statuses. Os consumidores não compartilham um resolver único hoje.

## 10. Quality gates e status/reasons

| Gate atual | Camada | Classificação AS-IS | Observação |
|---|---|---|---|
| Empresa active + ranking score row | Company eligibility | BLOCKING | Inner join + Company.active |
| Category/state/city/project type match | Company eligibility | BLOCKING se filtro | HQ city/state; project_type match literal |
| Trust missing/stale 26h | snapshot diagnostic | WARNING/flag (não bloqueia) | Snapshot continua gravado |
| População vazia | snapshot | writer não cria snapshot; API status empty | Não há resultado official persistido para scope sem empresas |
| `n < min 10` | benchmark | BLOCKING para benchmark | Não bloqueia ordering/snapshot |
| distinct score count | benchmark diagnostic | DIAGNOSTIC | Não tem limiar |
| P75=P90 | benchmark diagnostic | WARNING/info | Só colisão P75/P90, não P25/P50/P75 |
| X/Y < 2 distintos | Positioning | BLOCKING para positioning | `degenerate_*_distribution` |
| Y zeros ≥50% | Positioning | BLOCKING para positioning | `zero_inflated_y` |
| `n<10` | Positioning | BLOCKING para Positioning | ENV compartilhado |
| Stale snapshot (36h) | snapshot lifecycle/API | status stale | não equivale a gate publicability |
| Fallback não conseguiu população válida | Positioning legado | UNKNOWN/bug sem target | retorna último falho; não copiar |
| Missing benchmark | analysis-only | ANALYSIS-ONLY | ranking score/ordering existe sem benchmark |

Status alvo separados: `scope_resolution_status`, `publication_status`, `snapshot_status`, `freshness_status`, `analysis_capability_status`. Reason code registry conceitual: `INSUFFICIENT_POPULATION`, `NO_ELIGIBLE_SCOPE`, `MISSING_REQUIRED_DATA`, `MISSING_TRUST`, `COVERAGE_NOT_TRUSTED`, `STALE_SNAPSHOT`, `STALE_TRUST_DATA`, `BENCHMARK_UNAVAILABLE`, `INSUFFICIENT_VALID_SCORES`, `INSUFFICIENT_DISTINCT_SCORES`, `LOW_VARIANCE`, `EXCESSIVE_TIES`, `QUADRANT_DEGENERATE`, `MISSING_REQUIRED_DIMENSION`, `TERRITORY_UNRESOLVED`, `METHODOLOGY_UNAVAILABLE`. Semântica/pass-fail por capability é decisão futura com profiling.

## 11. Perfil de dados — somente plano, não executado

**Não há conexão segura/autorizada com produção nesta execução. Nenhum número de empresas, população, N bucket, distribuição ou ranking churn é inferido. Seeds/specs/dev não são representativos. Para B2C não use headquarters como proxy de coverage.** Queries abaixo são PostgreSQL SELECT-only ilustrativas para preparar profiling após validar schema/ambiente/índices; não executar em produção sem autorização, EXPLAIN e janela/custo.

### 11.1 Ranking score distribution (scopes AS-IS global/category; usar snapshot comparável e data única)

```sql
-- :snapshot_date, :definition_version. Requer validar nomes/constraints no schema antes.
WITH scoped AS (
  SELECT scope_type, scope_id, company_id, score
  FROM company_ranking_snapshots
  WHERE snapshot_date = :snapshot_date
    AND definition_version = :definition_version
), per_scope AS (
  SELECT scope_type, scope_id, COUNT(*) AS n, COUNT(score) AS valid_scores,
         COUNT(DISTINCT score) AS distinct_scores,
         MIN(score) AS min_score, MAX(score) AS max_score,
         AVG(score) AS mean_score, percentile_cont(0.5) WITHIN GROUP (ORDER BY score) AS median_score,
         STDDEV_POP(score) AS stddev,
         COUNT(*) FILTER (WHERE score = 0) AS zero_count,
         COUNT(*) FILTER (WHERE score = (SELECT MAX(s2.score) FROM scoped s2
           WHERE s2.scope_type=scoped.scope_type AND s2.scope_id IS NOT DISTINCT FROM scoped.scope_id)) AS ceiling_count
  FROM scoped GROUP BY scope_type, scope_id
)
SELECT *, (distinct_scores::numeric / NULLIF(n,0)) AS distinct_ratio,
       zero_count::numeric / NULLIF(n,0) AS zero_ratio,
       ceiling_count::numeric / NULLIF(n,0) AS ceiling_ratio,
       (n < 5) AS n_lt_5, (n < 10) AS n_lt_10, (n < 15) AS n_lt_15,
       (n < 20) AS n_lt_20, (n < 30) AS n_lt_30, (n < 50) AS n_lt_50
FROM per_scope;
```

### 11.2 Ties / quantile collisions

```sql
WITH tie_groups AS (
  SELECT scope_type, scope_id, score, COUNT(*) AS tie_n
  FROM company_ranking_snapshots
  WHERE snapshot_date = :snapshot_date AND definition_version = :definition_version
  GROUP BY scope_type, scope_id, score
), tie_summary AS (
  SELECT scope_type, scope_id, MAX(tie_n) AS largest_tie,
         SUM(tie_n) FILTER (WHERE tie_n > 1) AS companies_in_ties,
         COUNT(*) FILTER (WHERE tie_n > 1) AS tied_score_values
  FROM tie_groups GROUP BY scope_type, scope_id
), qs AS (
  SELECT scope_type, scope_id,
    percentile_cont(0.25) WITHIN GROUP (ORDER BY score) AS p25,
    percentile_cont(0.50) WITHIN GROUP (ORDER BY score) AS p50,
    percentile_cont(0.75) WITHIN GROUP (ORDER BY score) AS p75,
    percentile_cont(0.90) WITHIN GROUP (ORDER BY score) AS p90
  FROM company_ranking_snapshots
  WHERE snapshot_date = :snapshot_date AND definition_version = :definition_version
  GROUP BY scope_type, scope_id
)
SELECT qs.*, tie_summary.*, largest_tie::numeric / NULLIF(
  (SELECT COUNT(*) FROM company_ranking_snapshots s WHERE s.scope_type=qs.scope_type
   AND s.scope_id IS NOT DISTINCT FROM qs.scope_id AND s.snapshot_date=:snapshot_date
   AND s.definition_version=:definition_version),0) AS largest_tie_ratio
FROM qs JOIN tie_summary USING(scope_type, scope_id);
```

### 11.3 Coverage reconciliation (not B2C population conclusion)

```sql
-- Reconciliação structural only. Verify column types; legacy fields may be arrays/text/json.
SELECT c.id,
       NULLIF(c.coverage_states::text,'') IS NOT NULL AS has_legacy_states,
       NULLIF(c.coverage_cities::text,'') IS NOT NULL AS has_legacy_cities,
       EXISTS (SELECT 1 FROM company_service_areas a WHERE a.company_id=c.id) AS has_service_areas
FROM companies c;

SELECT coverage_type, is_active, state_code, COUNT(*) AS rows,
       COUNT(DISTINCT company_id) AS companies
FROM company_service_areas GROUP BY coverage_type, is_active, state_code;
```

### 11.4 Headquarters-only B2B legacy grouping

```sql
-- Snapshot atual não tem city/state scope. Perfil exploratório de sede, não prova
-- de população B2C. Categoria é N:N; empresa multicategoria entra em vários grupos.
WITH company_scope AS (
  SELECT c.id, c.state, c.city, cts.score, cc.category_id
  FROM companies c
  JOIN company_ranking_score crs ON crs.company_id = c.id
  LEFT JOIN company_trust_score cts ON cts.company_id = c.id
  LEFT JOIN categories_companies cc ON cc.company_id = c.id
  WHERE c.status = 'active'
)
SELECT category_id, state, city, COUNT(DISTINCT id) AS eligible_companies,
       COUNT(score) AS valid_trust_scores, COUNT(DISTINCT score) AS distinct_trust_scores,
       AVG(score) AS mean_trust, STDDEV_POP(score) AS stddev_trust,
       COUNT(*) FILTER (WHERE score = 0) AS zero_trust
FROM company_scope
GROUP BY GROUPING SETS ((category_id), (state), (city, state),
                        (category_id,state), (category_id,city,state));
```

Separar `category`, `state`, `city`, `category×state`, `category×city`; mapear buckets `<5/<10/<15/<20/<30/<50` e p25/p50/p75/p90 da população. Esta query mede Trust Scores, não o ranking composto de forma retrospectiva; usar snapshots por data única para `organic-performance-v2`, ou reproduzir o cálculo somente em ambiente seguro com `as_of` controlado. Agrupamentos textuais são **LEGACY TERRITORIAL GROUPING** e headquarters serve análise B2B apenas. B2C coverage profiling espera reconciliação canônica/confiança; não usar sede como proxy. Snapshots atuais só representam global/category.

### 11.5 Freshness and history

```sql
SELECT snapshot_date, definition_version, COUNT(*) AS rows,
       MIN(computed_at) AS first_computed, MAX(computed_at) AS last_computed,
       COUNT(*) FILTER (WHERE quality_flags ? 'stale_trust_score') AS stale_trust_rows,
       COUNT(*) FILTER (WHERE quality_flags ? 'trust_score_missing') AS missing_trust_rows
FROM company_ranking_snapshots
WHERE snapshot_date >= :from_date AND snapshot_date < :to_date
GROUP BY snapshot_date, definition_version ORDER BY snapshot_date;
```

### 11.6 Segurança/custo

Validar schema e índices (leaderboard index scope/version/date/position; snapshots unique; service area `(state_code,city_name,is_active)`; GIN `project_types`/JSONB conforme query). `EXPLAIN (FORMAT JSON)` primeiro em cópia/dev representativa; preferir agregação por datas/scopes limitados; sem locks, sem UPDATE/DELETE; conferir partições e estatísticas; produzir plano de custo, limite temporal e autorização explícita antes de qualquer leitura produtiva. Não usar queries textuais em cidades como prova de identidade canônica.

## 12. Search, SEO, Leads, Recommendation, MobiVolt e perfil

| Módulo | AS-IS confirmado | Migração / risco |
|---|---|---|
| Search | `CompanySearchQuery` e `CompanySearchService` usam `serving_state`, `coverage_states`, `coverage_cities_normalized` indexados legacy; `Company#search_data` indexa legacy campos. | Pode divergir de CompanyServiceArea/national/radius; manter recall declared com origem e filtro separado. |
| SEO local | Controller usa `serving_state`; filtros são rating/category/project types; `apply_sort` inclui `sponsored`/`priority_score`; nearby locations gera páginas próximas. | Pode afirmar “atende local” baseado em sede/legacy e listar company fora de serviço validado. Canonical migration precisa URL preservation/SEO shadow/canonical. |
| Leads | `LeadMatchingService` usa active/admin, categories/capabilities, location via `serves_city?`/`serves_state?`, feature `quote_feature_enabled?`; score +40 preferred, +25 verified, +20 cidade, +10 estado, rating até 10; limita top N ENV. | Sede/legacy service sem confiança; preferência de company pode sobrepor; declaração insuficiente para high-confidence route conforme ADR4. |
| Recommendation | Relation exige Company.active/moderation approved; local IDs = HQ OR state/city/national ServiceArea; `OrganicScorer` tem geography, category, verification, rating, completeness; Engine injeta até 2 sponsored placements. | Usa fórmula própria, não Ranking v2 score. Ela faz recomendação locacional com base em declaração; trust policy mais forte e disclosure. Sponsored explicit flag. |
| MobiVolt | Prioriza localizações HQ/cobertura legacy, usa `serving_state`; top3 por location score, fallback para top rated global sem local match; sort inicial priority/sponsorship. | Pode sugerir fora do target geográfico no fallback, sem sinalização de fallback; sem confiance coverage. |
| Perfil público | serializers e frontend consomem `coverage_*` + `service_areas`; `CompanyIdentityCard` tenta ambos; Company serializer expõe city/state/radius/national. | Dual source presente; UI pode misturar/duplicar/modo não confiável. Migrar contrato único com `mode`, áreas, provenance, confidence/status e display label. |
| Home comparison | `CompanyComparisonModal` e `HomeComparisonPreview` retornam `cities.length || states.length * 10 || 0` (`components/CompanyComparisonModal.tsx:20-36`; `components/home/HomeComparisonPreview.tsx:20-26`). | **P0 data truth:** estima 10 cidades por estado sem dado; não é cobertura verdadeira. Não corrigido nesta etapa. |

Recomendação de contrato coverage futuro: `mode`, `areas[]` territorialmente identificadas, `national`, `radius` somente quando validado, `source`, `confidence/validation`, `updated_at`, display label; render declarada como tal. Uma única Coverage Domain/Resolver central serve vários consumers com policy explícita distinta.

## 13. Materialização, recompute, cache, concorrência

### Estratégia-alvo

| Opção | Trade-off |
|---|---|
| A runtime only | Dados sempre atuais; custo/latência imprevisível, snapshots/reprodução fracos. |
| B tudo materializado | leitura rápida; cartesian explosivo (`empresas × 5.570 municípios × categories × project types × methodologies`) e invalidação pesada. |
| C precompute completo | previsível por escopo popular, custo de jobs alto e desperdício de localidades long-tail. |
| D híbrida lazy/materialized | **Proposta recomendada:** catálogo territorial pequeno, resolução/população sob demanda para scopes raros/preview, snapshots oficiais para scopes publicados/solicitados e populares, sem materializar cobertura empresa×município nem todos os scopes; thresholds de escala e TTL dependem profiling. |

AS-IS: ranking score é recalculado globalmente pelo worker e materializado em `company_ranking_score`; snapshot writer percorre global + todas Category (não cidades) diariamente. Dois advisory locks globais separados para feature store e ranking. Recompute é full population, não por scope/local; worker atualiza score rows e snapshots. `FeatureStoreDailyWorker` tem watermark e lock, mas range é por dias. Não existe prova de job incremental por empresa/RankingScope nem invalidação específica de ranking para cada mutation.

### Invalidation proposta

Inputs que potencialmente invalidam: TrustScore recalc/verified, review moderation/aggregation, event/feature aggregation, company active/status, category/project type, headquarters para B2B, service area/trust para B2C, territory catalog, methodology activation, quality policy, benchmark input, time-window rollover. Adotar evento/outbox + dirty scope keys, debounce/coalescing e full recompute de reconciliação; manifest/snapshot escreve atomicamente por release/scope/as_of e só publica após concluir gates. Cache key inclui canonical scope + methodology release + data revision/as_of; invalidation observável. Implementar após mapear writes/event dispatch e latência.

### Race/idempotência e consistência

Worker ranking usa advisory lock numa instância do banco; reduz concorrência de workers da mesma DB lock key, não é idempotency key distribuída entre DBs. Upsert snapshots evita duplicata para unique diária; scores upsert por company; event dedupe existe em plataforma e migrations, porém cobertura ponta-a-ponta não demonstrada. Score refresh não tem transação única englobando tudo; company data pode mudar durante leitura. Target: pin inputs/revisions/as_of, transaction/swap do conjunto de snapshot ou state `processing`/versioned run + atomic publication pointer; unique run key `(scope identity, manifest release, as_of)`; retries idempotentes; outbox/watermarks para eventos; reader vê versão completa anterior ou nova, nunca parcial. Lock por scope/partition quando necessário, evitando um lock global como gargalo. Testar dois jobs, mutation no meio, falha entre scoring/writer e retry.

### Eventos

Workers evidenciam datas diárias e recorte `CURRENT_DATE`, watermark UTC no feature daily vs zone `America/Sao_Paulo` no snapshot. Portanto calendário/janela pode desalinha timezone perto de meia-noite (INFERENCE). Snapshot `data_through` fica no final do dia anterior em horário de negócio; SQL score usa current_date DB. Necessário unificar `occurred_at` (atividade efetiva) e recepção/processamento, normalizar timezone, aceitar late event por reprocess de dias afetados, chaves idempotentes, contagem dedup e janela de reconciliação. Garantir reprocess não incrementa contadores: upsert observado para feature rows, mas origem de contador exige confirmação.

### Missing/cold start

TrustScore Calculator converte nil ausente em 0, indistinguível de zero observado; score orgânico precisa de Trust record por inner join, então empresa recém-ativa sem TrustScore fica fora até calcular; feature engagement pode default 0 se não há linha (`COALESCE SUM 0`). Snapshot ainda deixa Trust nil como flag se joined, mas elegibility exige ranking score. Não há IAS cold-start policy. Não imputar média/default sem método; armazenar missingness/coverage e avaliar elegibilidade/capability; ausência de evidência não é pontuação negativa. Perfil novo deve ter caminho evidenciado manual/documental de cobertura e estado “dados insuficientes”, em vez de fabricated rank.

## 14. UX, API, Admin e explicabilidade

### API alvo (conceitual)

```yaml
ranking:
  methodology: { id: organic-performance, release: vN }
  status: { publication: publicable, snapshot: available, freshness: current }
  score_definition: ...
  population: { eligible: ..., valid_scores: ... }
scope:
  identity: ...
  dimensions: { basis: service_coverage, level: municipality, territory: ... }
resolution:
  status: resolved
  requested: ...
  candidates: [...]
  resolved: ...
  fallback_reason: insufficient_population
quality:
  gates: [{ code: ..., status: warning, observed: ..., required: ... }]
analyses:
  benchmark: { available: true }
  percentile: { available: true }
  positioning: { available: false, reason: ... }
freshness: { computed_at: ..., as_of: ..., data_through: ... }
```

Não é contrato/schema aprovado. Público deve explicar “Solicitado: Florianópolis; exibindo comparação estadual: Santa Catarina; motivo: amostra local insuficiente; população/data/método.” Sem revelar parâmetros antifraude. Admin diagnostics inclui população por gate, observed/required, source/confidence, versões, inputs, run logs e audit trail. Frontend já tem `RankingStateBanner`, `RankingMethodologyTransparency`, `RankingPositioningMap`, rankings UX; ajustar estados de stale/empty/fallback/capability separada, sem status único.

### Admin lifecycle e RBAC propostos

Sem ActiveAdmin de metodologia/coverage validation observado; `admin/ranking_preview.rb` é preview legacy. Futuro lifecycle: draft → review → approved → scheduled/active → retired, release publicado imutável. Separation of duties conceitual: autor metodologia ≠ reviewer/aprovador para mudança de fórmula; coverage reviewer com permissão/registro separado de moderation/admin comercial; operador pode disparar recompute, não editar score/posição; auditor read-only; tenant company pode declarar própria cobertura e ver diagnostics da sua empresa, não mudar metodologia nem outras empresas. Definir RBAC quando for especificar endpoints. Approval de `PendingChange` não serve como coverage verification. Não há audit trail de coverage confidence/version identificado.

### Overrides, patrocinado, segurança

`Company` possui `featured/sponsored/priority_score`, placements patrocinados explícitos, e ranking oficial exclui todos (`RankingEligibilityScope`, `RankingSnapshotWriter`, invariant spec). Override manual de posição orgânica não encontrado nos snapshots/worker consultados. Admin preview contradiz naming: ranking meritocrático mas usa `ordered_by_priority` e mostra patrocínio/priority. Search/SEO têm paid ordering e banner ad, mas chamar surface “ranking” pode confundir. Endpoint Dashboard ranking passa por auth/company context (controllers e specs existentes); Admin preview exige ActiveAdmin; permissões específicas de mudança metodológica ou trigger não existem. Necessário audit RBAC antes de implementação.

## 15. Performance, observabilidade e falhas

### Gaps de escala/index

`RankingSnapshotWriter` N scopes = global + cada Category; faz query/join/allocation em Ruby, ordenação de todas as empresas por scope, `upsert_all` com linha por empresa/scope. Com scopes territoriais, custo cresce com combinações; evitar cross product. Eligibility usa category_company_ids subselect, text city transliterado em memória (plucks cities), sem ID canônico; B2C coverage exigiria relação/índice. CompanyServiceArea lookup tem index `(state_code,city_name,is_active)` e `coverage_type` separate, mas query national/state/city e company_id também precisa plano/index. `project_types @>` precisa índice GIN se seletividade/plan justificar. Não rodado EXPLAIN; gaps são hipóteses que devem ser medidos, não migrations recomendadas sem plano.

### Observabilidade atual e futura

Existe `RankingMetrics.worker` para duração/snapshots (`app/services/company_dashboard/ranking_metrics.rb`) e logging JSON no worker, Sidekiq retries, quality flags em snapshots. Falta no código revisto observabilidade de população por canonical scope, publicable ratio, fallback/no eligible, coverage divergence, gate reason, shadow diff, stale rate por release. Futuras métricas: `ranking_compute_duration`, `ranking_scope_population`, `ranking_publicable_ratio`, `fallback_rate`, `no_eligible_scope_rate`, `stale_snapshot_rate`, `coverage_mismatch_rate`, `shadow_diff_rate`, `event_lag`, `recompute_failure`, com labels de release/basis/level sem cardinalidade explosiva.

SLO/freshness: API tem limiar snapshot stale 36h; writer marca Trust score stale >26h. São AS-IS, não SLO metodológico/publicado. Definir SLO de freshness por produto com base de job e UX; não aprovar arbitrariamente.

### FMEA compacto

| Falha | Causa/evidência | Impacto | Detecção atual | Mitigação futura / severidade |
|---|---|---|---|---|
| Radius vira UF inteira | `covers?` não mede km | Falso match local | Spec pode testar comportamento; sem métrica de erro | Desativar uso ranking até geofence real; **P0** |
| Dados coverage divergentes | legacy + relation | Search/lead/recommendation/SEO resultados distintos | Sem reconciliação | Inventário+shadow; **P1** |
| Estimativa falsa nº cidades | `states.length*10` | Declaração enganosa na comparação | Testes/visual code | Remover estimativa futuro; **P0 data truth** |
| Ranking snapshot stale | worker failure/delay | posição antiga exibida | `stale` após 36h/metrics | Alertar/SLO/last-good policy; **P1** |
| Trust missing/stale | ausência de recalculation | rank mistura sinais incompletos | quality flags | gate policy / current snapshot; **P1** |
| Coverage autodeclarada vira recomendação/lead forte | query atual aceita coverage sem trust | recomendação/roteamento geográfico incorreto | não há confidence | authorization-by-consumer; **P1** |
| Event duplicate/late | dedupe não demonstrado ponta a ponta | score/engagement inflado | audit/aggregate discrepancy | idempotency + reconciliation; **P1 unknown** |
| Score engagement domina | sem teto agregado, trust*10 vs suma | escala/rank instável ou desigual | distribuições não consultadas | profiling, manifest, calibration; **P1/data** |
| Degenerate benchmark/quadrant | ties/quantile collision | claims percentile ruins; positioning inexistente | flags parciais | capability gates; **P2** |
| Scope territory ambíguo | nomes/alias textuais | população incorreta | sem catálogo | canonical territory; **P1** |
| Positioning retorna candidato inválido | scope resolver devolve last failure | análise engana usuário | status insufficient_sample exposto | novo resolver no futuro; **P1** |
| Writer parcialmente falha | score upsert e snapshot não atômicos juntos | old/new data inconsistency | worker exception log | versioned run + atomic publish; **P1** |
| Fallback de MobiVolt é global | nenhum match local | sugestão fora da localidade | retorno não diferencia fallback | explicar/escalar empty state; **P1** |
| Manifest mutável ausente | constants/ENV parciais | reproduzir método não confiável | release string parcial | manifest lifecycle; **P1** |

Detectability/severidade qualitativa; não são probabilidade quantitativa.

## 16. Shadow migration, rollback e testes

### Sequência coverage/territory

1. Read-only inventory em cópia/ambiente seguro: somente legacy, somente relation, ambos/equal, ambos/divergent, nenhum; national/radius/inactive; tokens desconhecidos, duplicatas, cidade/UF inválida.
2. Contrato/resolver canônico e catálogo territorial versionado; não remove fontes.
3. Backfill idempotente, dry-run, before/after, preserve unknowns, sem inferir, rollback possível.
4. Cutover writers a `CompanyServiceArea` primeiro; projeção temporária unidirecional somente para consumer legacy; proibir dual authority bidirecional.
5. Migrar consumer um de cada vez com shadow old-vs-new: `company IDs`, false positives/negatives, city/state/national/radius, alias, latency.
6. Deprecar colunas somente após todos consumidores/writers migrated, validação observável e rollback test.

### Shadow ranking

Executar engine antigo vs novo em paralelo sem publicar novo resultado; medir population/scope/fallback diffs, score diff, posição, tie, benchmark, gate capabilities, coverage basis, runtime/query cost. Tolerância definida previamente por produto/métrica, sem números inventados. Novas tabelas/versões aditivas; `feature flag` seleciona read path e manifesto, nunca altera regra de manifesto em uso. Rollback aponta para old path/last known good immutable snapshot sem apagar dados legados ou manifest.

### Test plan e invariantes

- Unit para fórmula, normalization, missingness, event taxonomy/dedup, gate classification e canonicalization.
- Model para territorial identity, relationships, uniqueness/versioning, service-area semantics, audit.
- Service para coverage resolver, consumer trust policy, candidate fallback, methodology manifest e snapshot write.
- Request/contract REST/GraphQL: basis, requested/resolved/fallback, publicability/capability reasons/freshness, tenant isolation.
- Policy/RBAC/ActiveAdmin: quem declara, revisa, aprova, publica, recomputa, lê diagnostics.
- Migration/backfill: dry run, idempotence, unknown tokens, no infer/delete, rollback.
- Property/invariant: same inputs+manifest+as_of ⇒ same result; alias resolves same territory/scope; category/project type preserved through fallback; paid plan ≠ score/rank/trust; analysis fail não necessariamente ranking fail; no national invalid accepted; retries don’t duplicate events/snapshots; public payload never marks declaration verified.
- Frontend/E2E: requested-vs-resolved, insufficient/no scope, stale, capability unavailable, transparent declared coverage and sponsored distinction.
- Shadow/performance/chaos: dual jobs same scope, mid-run mutations, late/duplicate event, interrupted snapshot writer, high population, cache invalidation.

## 17. Invariantes arquiteturais

1. Headquarters != service coverage.
2. Coverage declaration != verified service fact.
3. Entitlement != geographical truth.
4. Approval comercial/moderation != coverage verification.
5. Coverage source/provenance != coverage confidence.
6. Coverage truth != authorization by consumer.
7. Coverage trust != ranking score.
8. Trust Score != rank position.
9. Trust Score’s underlying signals must not be reweighted unknowingly as an independent IAS signal.
10. Organic rank != sponsored placement; subscription cannot directly lift organic position.
11. Ranking score != benchmark/percentile.
12. Positioning != organic rank.
13. IAS != Organic Ranking unless a future explicit methodology decision says otherwise.
14. Scope identity != key != snapshot != materialization.
15. Snapshot status != publication status.
16. Requested scope != resolved scope; same geographic basis throughout fallback.
17. Fallback changes geography only; no silent category/project-type/time/methodology relaxation.
18. No valid national fallback => no eligible scope, not last invalid result.
19. UI/query filter != comparable dimension automatically.
20. Absence of evidence != evidence of no service.
21. City label/slug/external code != internal territorial identity.
22. Territory catalog != company×territory or ranking-scope cartesian materialization.
23. Stale/unknown/missing != numeric zero unless explicitly defined by method.
24. Failed derived analysis does not imply ranking failure.
25. Every published snapshot references immutable manifest and execution context.
26. Same canonical inputs + manifest + as_of + deterministic tie policy ⇒ same ordered result.
27. Public profile label distinguishes declared from validated coverage.
28. Commercial sponsorship is labeled distinct from organic and cannot be hidden as ranking.
29. A locality-specific evidence item cannot prove a broader geography without governed propagation rule.
30. State/national/radius semantics are consumer-specific until policy says otherwise.

## 18. Contradiction audit: code/docs/tests/ADR

| Tema | Código | Discovery/docs/specs | ADR | Canonicalização recomendada / conflito |
|---|---|---|---|---|
| B2C geography | RankingEligibilityScope uses HQ | Older discovery proposes B2C coverage | ADR0001 says coverage | ADR approved target wins; migrate after dependencies |
| National coverage | `CompanyServiceArea` covers all; other legacy users may not; state list has no explicit national | Older discovery treats national as hierarchy candidate | ADR0003 explicit but not automatic eligibility | Separate consumer policy, not normalize to 27 states |
| State coverage | service area expands all cities in state; legacy varies; rank headquarters only | old docs assume coverage maybe state | ADR0003 says state not proof for rank | consumer-specific; B2C trust/territorial decision required |
| Radius | relation equality of UF | Haversine exists separately | ADR0003 requires validation | radius capability not safe in `covers?` for rank; P0 |
| Min population | 10 benchmark/positioning only; snapshot accepts N>0 | older docs sometimes call min10 ranking threshold | ADR0008/9: AS-IS only | ADR wins, separate gates |
| Fallback | Positioning returns last invalid; city→state→category/global; MobiVolt global fallback | older Discovery has variants incl project_type relaxation | ADR0002 prohibits silent relaxation | New scope resolver must not reuse old fallback |
| Snapshot scopes | global/category only | older Discovery proposes city/state/national keys | ADR0007 expects territory identity | additive model later; snapshot AS-IS cannot represent full target |
| Ranking score | trust*10 + unbounded recent engagement | Discovery reports formula but includes some proposed future items | ADR0001–0010 do not decide new formula | formula verified; no formula edit now |
| Category/project type | Category tree vs Company.project_types filter under sector key | Discovery labels category/sector/project_type as distinct sometimes | ADR0007 keeps sector open | code says Category != project_types; UI/domain naming still needs freeze |
| Sponsored | official snapshot excludes; SEO/admin/recommendation has paid order/placements | older descriptions may call all results ranking | ADR0003 anti pay-to-rank; no new ADR | identify organic vs paid surface; no direct current official pay-to-rank found |
| Manifest | version constants + ENV, snapshot only definition version | Discovery proposes methodology manifest but mentions mutable matrix | ADR0010 immutable published | code not yet compliant; target ADR wins |
| Coverage estimation | UI displays `states.length*10` estimate | likely meant approximate reach | ADR0006 identity/canonical coverage | not data truth; concrete P0 defect |
| Repetition in transcript | actual docs only single sections | transcript repeats prompts | no actual duplicate | no cleanup required |

## 19. Débito técnico priorizado

| ID | Sev. | Evidência / impacto | Bloqueia? | Wave sugerida |
|---|---|---|---|---|
| DT-01 coverage count fictício | P0 | frontend multiplies states by 10 as cities; claim false | Bloqueia claim confiável | Truth fixes independent; not changed now |
| DT-02 radius false-positive | P0 | `covers?` radius equals state, ignores km/center | Bloqueia radius-based eligibility | Disable/use guard until validated |
| DT-03 split coverage authority | P1 | legacy fields and relational records co-exist; no universal writer/reconciler | Bloqueia B2C canonical cutover | Inventory/reconciliation first |
| DT-04 inconsistent geographic consumer semantics | P1 | HQ/legacy/service areas/national differ in Search/SEO/Leads/Recommendation/MobiVolt | Bloqueia trust-worthy unified experience | Coverage Domain + staged shadow |
| DT-05 ranking B2C still headquarters-based | P1 | official `RankingEligibilityScope` only HQ | Bloqueia promised B2C coverage ranking | Wait on catalog/trust/gates |
| DT-06 territory is text/slug | P1 | company service areas and legacy data lack canonical territory ID | Blocks exact city membership | Territory catalog |
| DT-07 home estimate | P0 | fake city count | blocks trustworthy coverage UX only | Independent UI/data-truth plan |
| DT-08 no manifest/input provenance | P1 | one version string, mutable ENV/input models | Blocks new historical claims/replay | manifest + input traceability |
| DT-09 engagement no cap | P1 | score formula unbounded component | Requires empirical review, not immediate formula change | profiling/experiment |
| DT-10 Positioning fallback invalid | P1 | returns last insufficient candidate | Blocks trustworthy positioning fallback | resolver correction in separate approved implementation |
| DT-11 admin “ranking” uses priority | P1 | preview uses `ordered_by_priority`, exposes sponsored | risk operational misinterpretation | Admin separation |
| DT-12 no production calibration | P1 | no safe authorized data query | Blocks threshold approval/publication gates | data plan |

## 20. Remaining decision register

| ID | Topic / current | A | B | C | D | Recommended / why | Blocking? / data? / owner / confidence |
|---|---|---|---|---|---|---|---|
| D11 | Papel dos scores; Organic exists, IAS not implemented | só Organic | substituir por IAS | combinar | coexistir independente | **D; OWNER APPROVED**: Organic continua vigente; IAS permanece independente/experimental | ADR0011 registrado; fórmula IAS bloqueada por calibração/produto |
| D12 | Threshold/score diversity absent for organic publicability | N universal fixo | por geo | por capability | empirical layered calibration | **D; OWNER APPROVED AS POLICY**; nenhum número aprovado | DATA_CALIBRATION_REQUIRED; gates finais dependem de dados |
| D13 | Trust coverage for consumers has no coverage-specific evidence model | self-declared everywhere | manual verified everywhere | universal trust status | trust+authorization by purpose | **D; OWNER APPROVED**; ADR0004/5 | confiança por consumidor; níveis/limites continuam abertos |
| D14 | What qualifies evidence and propagation scope | project count alone | document/manual | automated signals only | hybrid, locality-bound, freshness-aware | **D; OWNER APPROVED AS ARCHITECTURE** | thresholds de evidência DATA_CALIBRATION_REQUIRED |
| D15 | State means all municipalities? consumers disagree | yes globally | no globally | per consumer mode | explicit semantic class per consumer and trust | **D; OWNER APPROVED** | semântica por consumer; evidência operacional ainda necessária |
| D16 | Headquarters implicit service coverage | treat HQ as service | never treat HQ as service | allow Search/Recommendation only | explicit separate HQ discovery route, not B2C proof | **D; OWNER APPROVED**; sede não prova cobertura B2C | ADR0001/4; preservar separação |
| D17 | Canonical territorial source/model | current CSV | IBGE authoritative import | internal catalog + IBGE external + provenance | defer municipality IDs | **C; OWNER APPROVED**; IBGE é candidato externo, CSV não é fonte definitiva ainda | auditar provenance/version/license/integrity antes de importação |
| D18 | Metro/regional levels | implement text aliases | official metro dataset | defer until governed membership | canonical future capability, implement city/state/country first | **D; OWNER APPROVED** | Metro/Region não bloqueiam v1; exigem dataset e governança futuros |
| D19 | Identity methodology registry representation | code constants | mutable DB config | arbitrary DSL/JSON | immutable manifest registry after code contract validation | **D; OWNER APPROVED**; iniciar com contrato claro em código | manifesto publicado imutável; sem DSL/config mutável |
| D20 | Category vs sector/project type | merge categories | sector parent of category | separate unrelated dimensions | distinct taxonomy; map legacy `sector`→project_type explicitly | **D; OWNER APPROVED** | migração de nomenclatura planejada; API compatível na transição |
| D21 | Full compute historical reproduction | explain rules only | input snapshots | event sourcing all | phased L1→L2→L3 retention | **D; OWNER APPROVED**; L1/L2 faseados, L3 condicionado à necessidade | política de retenção permanece futura |
| D22 | Materialization | runtime all | materialize all | precompute every plausible scope | lazy + materialize published/high demand scopes | **D; OWNER APPROVED** | sem cartesian; critérios de materialização/performance serão validados |
| D23 | Recompute/invalidation | nightly full only | per company immediate | full per scope | dirty-scope incremental + periodic reconciliation/full | **D; OWNER APPROVED AS TARGET** | implementar após mapear dependências de invalidação |
| D24 | State/national/radius service coverage for routing/SEO/Search | strict verified only | declaration all | shared eligibility | shared resolver plus purpose-specific policy | **D; OWNER APPROVED** | migração por consumer; confiança específica por finalidade |
| D25 | Source write cutover | dual write forever | legacy canonical forever | direct one-step cutover | staged backfill/writer cutover/shadow/projection/deprecation | **D; OWNER APPROVED** | reconciliação necessária; sem dupla autoridade permanente |
| D26 | Ranking published status/API | single status | snapshot status | gate status only | independent resolution/publication/snapshot/freshness/capability statuses | **D; OWNER APPROVED** | thresholds/calibração ainda abertos |
| D27 | Organic tie-breaker / bound | current tie-break | Trust first | stable ID only | keep deterministic current as v2; future manifest-governed explicit tie policy | **D; OWNER APPROVED FOR LEGACY PRESERVATION** | não alterar v2 nesta wave; novas metodologias versionam desempate |
| D28 | IAS formula weights and IS/IPM definition | use Discovery pseudocode | Trust composition | empirically optimize after corpus | defer formula; define constructs/evidence and validate independently | **D; OWNER APPROVED TO DEFER FORMULA** | DATA_AND_PRODUCT_CALIBRATION_REQUIRED; bloqueia score IAS oficial |
| D29 | Confidence expiration | never expire | fixed universal time | evidence freshness by type/scope | consumer/territorial-risk freshness policy | **D; OWNER APPROVED AS TARGET POLICY** | nenhum TTL aprovado; requer evidência/produto |
| D30 | Sponsored presentation | mixed rank | separate lists | paid excluded everywhere | explicit sponsored slots and organic rank separate | **D; OWNER APPROVED** | patrocínio não altera organic rank; disclosure próprio |

As decisões D11–D30 acima estão congeladas conforme aprovação explícita do owner nesta etapa. O freeze não aprova valores numéricos: thresholds estatísticos, mínimos de evidência, expiração/confiança nacional, fórmula/pesos IAS, IS/IPM, normalização/caps de engagement e SLO permanecem DATA_CALIBRATION_REQUIRED e/ou PRODUCT_VALIDATION_REQUIRED. ADRs anteriores permanecem congelados.

## 21. Arquitetura final proposta

```text
HTTP request / scheduled run
  → MethodologyManifest (published release + immutable component versions)
  → RankingScope request (basis + canonical territory + declared comparable dimensions)
  → ScopeResolutionPolicy (requested/candidates/resolved/reason; versioned)
  → Territory Catalog + Coverage Domain / Headquarters resolver
  → Consumer-specific CoverageTrust/Authorization policy (B2C vs B2B)
  → CompanyEligibility (reasons/provenance)
  → candidate population at pinned as_of/input revision
  → PopulationValidity / RankingPublicability gates (versioned)
  → Score calculation + deterministic tie break
  → atomic immutable run/snapshot reference (scope, manifest, as_of, inputs, gate report)
  → Benchmark and separate AnalysisCapabilities (Positioning etc.)
  → Publication API / dashboard / SEO surfaces with explicit organic/sponsored labels
```

**B2C flow:** request locality → territory ID → service-coverage resolver → declared/evidence/trust authorization (mere declaration excluded from official population) → method eligibility → publication gates → snapshot. Search may use declared coverage only as recall and must label it; leads/recommendations require stronger separate policy.

**B2B flow:** canonical headquarters → territory → institutional scope; never mutate basis during fallback.

**IAS boundary:** independent `IAS` manifest, input definitions/provenance, eligibility, quality gates, result/snapshot, validation/experiment. No score addition/substitution with Organic until owner-approved methodology and statistical validation. Trust/Organic/Positioning are distinct signals/products.

**API:** independent scope/resolution/publication/snapshot/freshness/analyses/coverage/methodology sections; reasons observable and versioned. Consumers receive canonical coverage output, not two source-specific arrays.

## 22. Dependency graph and implementation readiness

```text
Territorial provenance + source decision
  → Territory Catalog / stable identity
  → coverage inventory/reconciliation
  → canonical Coverage Domain & consumer policies
  → coverage trust/evidence + audit/freshness
  → B2C RankingScope + eligibility
  → methodology manifest + component contracts
  → calibrated quality gates (production profile)
  → scoring/recompute/snapshots/reproducibility
  → API/UX/Admin governance
  → shadow comparison → staged cutover → observability/rollback
```

Paralelizável após interfaces definidas: profiling de score legado B2B vs territory source audit; taxonomy mapping category/project type; manifest lifecycle prototype (sem fórmula); consumers inventory/test contracts; observability/run architecture. Não paralelizar writers/cutovers antes da autoridade/canonical contract.

### Safe to implement after this blueprint is approved

- Documented interface contracts and terminology; decision register confirmation.
- Read-only profiling tooling on sanitized/dev copy and EXPLAIN runbook.
- Additive territory import validation tooling (not production import) after source provenance approval.
- Generic gate-result and manifest design prototypes/tests without changing active ranking behavior.
- Shadow comparison harness against existing pipeline, only when safe dataset and execution environment confirmed.
- Isolated data-truth UX correction plan for the fictitious count, subject to separate implementation authorization.

### Must wait for data / decisions

- Exact population thresholds, tie/variance/quantile classifications and capability cutoffs: production data and stability calibration.
- B2C official coverage eligibility: canonical coverage reconciliation + trust/evidence policy + territory IDs.
- IAS formula, weights, time windows, claims/certification: real evidence, double-count/correlation analysis, owner/product approval.
- Nationwide/state evidence propagation/freshness: policy and data.
- Full deterministic historical recomputation: retention decision, input snapshots/event revisions.

### Blockers classification

- **True blockers:** source-of-truth reconciliation before coverage cutover; trustworthy B2C local rank without canonical territory + trust policy; IAS scoring without formula/inputs/validation; statistical thresholds without profiling; historical exact replay without input retention.
- **Data calibration:** thresholds, trust/evidence acceptance/freshness, stability, geography coverage population, score dominance/correlation.
- **Later optimization:** high-cardinality precompute, index tuning, job partitioning, fully event-sourced L3 reproduction.
- **Non-blocking open question:** final field/table names, key encoding, metro catalog until metro launch, admin UX framework, precise SLO before baseline measurements.

## 23. Data still required

1. Authorized anonymized/production-derived snapshot score distributions by methodology/category/scope/date; counts <5/10/15/20/30/50, valid/distinct scores, tie concentration, min/max/mean/median/stddev, zero/ceiling ratios, quantile collisions, stale/missing scores.
2. Population by category×HQ state/city for B2B only; B2C requires resolved service areas and confidence, never HQ proxy.
3. Multi-snapshot time-series for rank churn, top-N stability, entry/exit, score perturbation.
4. Coverage reconciliation report across company legacy arrays and active/inactive service-area rows; national/state/city/radius; unknown tokens/duplicates.
5. Provenance/license/version of `municipios.csv`, encodings and audit of missing/duplicate/invalid IBGE codes and homonyms.
6. Evidence quality and locality binding for projects/reviews/leads/contracts/docs/external signals; current freshness and fraud/gaming risks.
7. Event ingestion-to-aggregate trace: eligible event taxonomy, event timestamps, dedupe key coverage, late/retry/replay and daily stats reconciliation.
8. Runtime/production cost and query plans for scope snapshots, coverage lookups and materialization demand.

All require explicit safety approval for any production read, even SELECT; do not use production credentials implicitly.

## 24. Stop condition answers

| Question | Discovery answer |
|---|---|
| 1 Who can enter? | AS-IS active + `company_ranking_score` plus optional HQ/category/project-type filters; future company eligibility policy; B2C trust-required. |
| 2 Geography per product? | Frozen: B2C service coverage, institutional B2B headquarters. Other consumers differ today. |
| 3 Coverage source? | Target CompanyServiceArea; AS-IS dual/legacy consumers, no universal authority. |
| 4 Trust coverage? | Not currently modeled specifically; purpose-dependent principle frozen, evidence sufficiency open. |
| 5 Territory identity? | Target internal stable ID + external code/source/version; AS-IS names/UF and slug; canonical catalog not implemented. |
| 6 Scope? | Methodology/version, basis, canonical territory/level + governed comparable dimensions; AS-IS scope limited global/category plus ad hoc filters. |
| 7 Fallback? | Target city→state→country, geog-only and gated; Positioning legacy violates no-invalid-scope outcome. |
| 8 Valid population? | Not defined for official organic ordering. Benchmark N=10 only; Positioning has more gates. Threshold calibration pending. |
| 9 Publishable? | Current writer persists any nonempty eligible population; no independent publicability gate. Target ADR0008 layers it. |
| 10 Official score? | Organic formula exactly identified; future IAS not implemented. Recommended continue Organic, independent IAS. |
| 11 Trust role? | Bounded Trust (0–100) component and rank secondary tie-break; not rank itself, not coverage trust. |
| 12 Benchmark role? | Derived runtime percentiles from score population; not score or ranking validity universal. |
| 13 Positioning role? | Separate X/Y/quadrant methodology; can fail while rank exists. |
| 14 IAS role? | Documented proposal only; no runtime, schema, endpoint, tests, or versioned formula found. |
| 15 Methodology version? | Partial constants/ENV; target immutable composed manifest, not implemented. |
| 16 Historical replay? | Partial explanation; exact recalculation not possible from snapshot alone. |
| 17 Snapshot materialization? | Daily global/category `upsert_all`; target hybrid lazy/materialized by published demand. |
| 18 Invalidation? | Full scheduled worker; dependency-specific invalidation not evidenced end-to-end. |
| 19 Avoid pay-to-rank? | Official organic scope excludes sponsored/plan; SEO/recommendation/admin surfaces have paid/priority paths requiring clear separation. |
| 20 Safe migration? | Phase inventory→contract→backfill→writer cutover→consumer shadow→deprecation; not executed. |
| 21 Observe/rollback? | Some worker duration/snapshot metrics/logs, but no coverage diffs/fallback/gate metrics; rollback design proposed. |
| 22 Production-dependent? | Thresholds, stability, B2C population, coverage reconciliation, evidence quality, event dedup and performance. |

## 25. Conclusão de readiness

Existe um blueprint arquitetural suficientemente definido para redigir um **Implementation Plan em waves**, mas não para escolher thresholds finais nem publicar B2C local/IAS. Primeiro plano seguro deve separar discovery/data audit (sanitized/read-only) e dependências de modelo, sem ativar novos resultados. ADRs 0001–0010 são a fundação aprovada para planejamento; D11 deve ser confirmada pelo owner antes de ADR aceito. O material deste documento é proposta técnica e evidência, não autorização para executar código, migrations, backfill, produção ou mudança de fórmula.

## Fontes principais AS-IS

- `AB0-1-back/app/services/trust_score/definition.rb`
- `AB0-1-back/app/workers/analytics/ranking_score_worker.rb`
- `AB0-1-back/app/workers/analytics/feature_store_daily_worker.rb`
- `AB0-1-back/app/services/company_dashboard/ranking_eligibility_scope.rb`
- `AB0-1-back/app/services/company_dashboard/ranking_snapshot_writer.rb`
- `AB0-1-back/app/services/company_dashboard/ranking_benchmark_service.rb`
- `AB0-1-back/app/services/company_dashboard/positioning/`
- `AB0-1-back/app/models/company_service_area.rb`
- `AB0-1-back/app/services/locations/coverage_normalizer.rb`
- `AB0-1-back/app/services/company_service_area_limit_service.rb`
- `AB0-1-back/app/services/company_field_policy.rb`
- `AB0-1-back/app/services/leads/lead_matching_service.rb`
- `AB0-1-back/app/services/recommendation/`
- `AB0-1-back/app/services/chat/mobivolt/company_matcher_service.rb`
- `AB0-1-back/app/controllers/api/v1/local_solar_pages_controller.rb`
- `AB0-1-back/lib/tasks/locations_from_csv.rake`
- `AB0-1-back/db/migrate/20260723090000_create_company_ranking_snapshots.rb`
- `AB0-1-back/db/migrate/20260802100000_create_company_service_areas.rb`
- `AB0-1-back/db/migrate/20260921130000_add_snapshot_date_to_company_ranking_snapshots.rb`
- `docs/architecture/DISCOVERY_HIERARCHICAL_RANKING_IAS.md` (DOCUMENTED; proposals are not evidence of runtime)
