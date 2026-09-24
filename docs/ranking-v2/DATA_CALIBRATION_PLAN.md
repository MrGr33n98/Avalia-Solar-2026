# Ranking v2 / IAS — Plano de calibração de dados

- **Status:** plano; nenhum profiling executado.
- **Dados de produção:** `PRODUCTION_DATA_PENDING` — execução somente após autorização explícita, análise de custo e confirmação de ambiente read-only.
- **Baseline:** ADR 0008/0009 e ADR 0011; `RANKING_MIN_COMPARABLE_POPULATION=10` é apenas comportamento AS-IS.

## Objetivo e não objetivos

Medir empiricamente população, qualidade/discriminação do score, estabilidade, cobertura e semântica dos eventos para alimentar decisões de gates/capabilities. Não maximizar quantidade de rankings publicados, escolher thresholds intuitivos, inferir B2C de sede, ajustar fórmula Organic ou inventar fórmula IAS.

## Fases e segurança

1. Validar clone/sanitized dataset ou ambiente analítico read-only; confirmar role sem privilégios de escrita, database/host, réplica e horário de snapshot.
2. Inspecionar schema, constraints, índices, partições e planos de query no ambiente não produtivo. Confirmar nomes/colunas antes das queries ilustrativas abaixo.
3. Rodar em cópia representativa; fazer `EXPLAIN (FORMAT JSON)` sem `ANALYZE` inicialmente. `EXPLAIN ANALYZE` executa query e só usar em dataset/replica aprovada, nunca implicitamente em produção.
4. Acesso produtivo exige aprovação separada, SELECT-only, réplica, intervalo limitado, limites de duração/statement, plano revisado, query assinada/versionada e resultado agregado sem PII. Não usar credenciais de aplicação.
5. Armazenar data cut, metodologia/release, definição, query commit/hash, ambiente e caveats junto ao relatório; não guardar dados pessoais/IDs de usuários.

## Perfil A — Snapshot Organic v2

AS-IS snapshots contêm escopos `global/category`, `score`, `rank_position`, `population_size`, `percentile`, `quality_flags`, `data_through`, `computed_at`, `snapshot_date`. Usar uma data e definição por perfil; snapshots diários podem ter sido upsertados, então não presumir imutabilidade histórica.

```sql
-- PostgreSQL; validar schema, role read-only, índices e :params antes de executar.
WITH per_scope AS (
  SELECT scope_type, scope_id, snapshot_date, definition_version,
         COUNT(*) AS n, COUNT(score) AS valid_scores,
         COUNT(DISTINCT score) AS distinct_scores,
         MIN(score) AS min_score, MAX(score) AS max_score,
         AVG(score) AS mean_score,
         percentile_cont(0.25) WITHIN GROUP (ORDER BY score) AS p25,
         percentile_cont(0.50) WITHIN GROUP (ORDER BY score) AS p50,
         percentile_cont(0.75) WITHIN GROUP (ORDER BY score) AS p75,
         percentile_cont(0.90) WITHIN GROUP (ORDER BY score) AS p90,
         STDDEV_POP(score) AS stddev,
         COUNT(*) FILTER (WHERE score = 0) AS zero_count
  FROM company_ranking_snapshots
  WHERE snapshot_date = :snapshot_date
    AND definition_version = :definition_version
  GROUP BY scope_type, scope_id, snapshot_date, definition_version
)
SELECT *, distinct_scores::numeric / NULLIF(n, 0) AS distinct_ratio,
       zero_count::numeric / NULLIF(n, 0) AS zero_ratio,
       (n < 5) AS n_lt_5, (n < 10) AS n_lt_10, (n < 15) AS n_lt_15,
       (n < 20) AS n_lt_20, (n < 30) AS n_lt_30, (n < 50) AS n_lt_50,
       (p25 = p50) AS p25_p50_collision,
       (p50 = p75) AS p50_p75_collision,
       (p25 = p75) AS p25_p75_collision
FROM per_scope;
```

Computar distribuição de N por category e global separadamente: contagem de scopes em cada bucket `<5/<10/<15/<20/<30/<50`, mediana, p25/p75/p90. Para score max/concentração de teto, calcular contagem de score igual a `max_score` por scope — não assumir que score máximo teórico equivale ao máximo observado. Medir largest tie, empresas empatadas e percentuais em empate.

## Perfil B — Headquarters B2B (não é cobertura B2C)

Até Territory catalog, city/state/categoria são agrupamentos textuais/IDs legacy. Indicar `LEGACY TERRITORIAL GROUPING`; cidade pode ter alias/homônimo. Empresa multi-category pode contar em mais de um grupo. Snapshot atual não materializa estado/cidade. Para perfil exploratório de Trust por sede:

```sql
WITH base AS (
  SELECT c.id, c.state, c.city, cts.score AS trust_score, cc.category_id
  FROM companies c
  JOIN company_ranking_score crs ON crs.company_id = c.id
  LEFT JOIN company_trust_score cts ON cts.company_id = c.id
  LEFT JOIN categories_companies cc ON cc.company_id = c.id
  WHERE c.status = 'active'
)
SELECT category_id, state, city, COUNT(DISTINCT id) AS companies,
       COUNT(trust_score) AS valid_scores, COUNT(DISTINCT trust_score) AS distinct_scores,
       AVG(trust_score), STDDEV_POP(trust_score), MIN(trust_score), MAX(trust_score),
       COUNT(*) FILTER (WHERE trust_score = 0) AS zero_scores
FROM base
GROUP BY GROUPING SETS ((category_id), (state), (city,state),
                        (category_id,state), (category_id,city,state));
```

Essa consulta é população/sinal por sede, não população de ranking local B2C; ela também não reproduz score orgânico. B2B profile de ranking deverá depois usar scope canonical e método pinado.

## Perfil C — Coverage reconciliation

```sql
-- Somente estrutura e contagem; validar tipos legacy antes de cast/normalização.
SELECT c.id,
       NULLIF(c.coverage_states::text, '') IS NOT NULL AS has_legacy_states,
       NULLIF(c.coverage_cities::text, '') IS NOT NULL AS has_legacy_cities,
       EXISTS (SELECT 1 FROM company_service_areas a WHERE a.company_id = c.id) AS has_relation
FROM companies c;

SELECT coverage_type, is_active, state_code, COUNT(*) AS rows,
       COUNT(DISTINCT company_id) AS companies
FROM company_service_areas GROUP BY coverage_type, is_active, state_code;
```

Produzir buckets: legacy-only, relation-only, both, neither; ambos equivalentes/divergentes após normalização com fonte; national/state/city/radius/inactive; duplicados, unknown token, UF/cidade não resolvida. Não fazer backfill nesta análise. Não contar radius como município sem origem, centro e distância válidos.

## Perfil D — Score dominance e sinais de entrada

Comparar o breakdown persistido de Trust (componentes/version) e Organic (`base_trust`, `recent_engagement`) em snapshot equivalente. Medir contribuição relativa, saturação Trust 100, relação score total ↔ Trust, caudas e impacto do engagement por idade. Analisar correlação/colinearidade de rating/review count, views/clicks/leads e Positioning X/Y usando snapshots/agregados minimizados. Sem recalcular de fonte mutável como se fosse histórico imutável. IAS somente poderá usar input-definition experimental aprovada e validação independente.

## Perfil E — Freshness / stability / event dedupe

- Snapshots: número por dia/definição/scope, computed_at, data_through, quality flags; p50/p90 age e gaps de jobs.
- Rank stability: pares de snapshots comparáveis com mesma manifest/scope/data cut; top-N overlap/churn, entradas/saídas, Spearman/Kendall, delta de posição/score, sensibilidade a uma empresa e pequenos deltas. A produção/histórico não foi consultada; **PRODUCTION DATA PENDING**.
- Eventos: seguir registro→dedupe→agregado por empresa/dia; volume bruto/canonical, ids repetidos, late events, retry, delta reprocessado. Separar `occurred_at`, `created_at`/received e `processed_at`; query deve preservar privacy e escopo temporal.
- Comparar `company_daily_stats` com `company_feature_daily` por empresa/dia; não juntar cardinalidades que multiplicam linhas. Inspecionar chaves idempotentes e pipelines antes da query.

## Queries de ties / quantis / freshness

```sql
WITH ties AS (
  SELECT scope_type, scope_id, score, COUNT(*) AS tie_n
  FROM company_ranking_snapshots
  WHERE snapshot_date = :snapshot_date AND definition_version = :definition_version
  GROUP BY scope_type, scope_id, score
), largest AS (
  SELECT scope_type, scope_id, MAX(tie_n) AS largest_tie,
         SUM(tie_n) FILTER (WHERE tie_n > 1) AS companies_in_ties,
         COUNT(*) FILTER (WHERE tie_n > 1) AS tied_values
  FROM ties GROUP BY scope_type, scope_id
)
SELECT * FROM largest;

SELECT snapshot_date, definition_version, COUNT(*) AS rows,
       MIN(computed_at) AS first_computed, MAX(computed_at) AS last_computed,
       COUNT(*) FILTER (WHERE quality_flags ? 'stale_trust_score') AS stale_trust,
       COUNT(*) FILTER (WHERE quality_flags ? 'trust_score_missing') AS missing_trust
FROM company_ranking_snapshots
WHERE snapshot_date >= :from_date AND snapshot_date < :to_date
GROUP BY snapshot_date, definition_version ORDER BY snapshot_date;
```

## Deliverables / decisões suportadas

1. Relatório agregado sem PII, ambiente e query versionados.
2. Cobertura e limitações por dimensão, sem converter ausência de evidência em inexistência.
3. Proposta de blocking/warning/diagnostic por camada e capability; cada threshold justificado por validade, estabilidade, cobertura e finalidade.
4. Dados de score/engagement e double counting; não altera score.
5. Recomendação explícita de threshold com sensibilidade e impacto do fallback; owner aprova antes de manifest published.

Sem dados autorizados, todos números permanecem **PRODUCTION DATA PENDING**. Não rodar as queries neste plano automaticamente.

