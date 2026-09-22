# Ranking Performance — contrato operacional

## Semântica

O ranking orgânico oficial é um fato persistido em `company_ranking_snapshots`.
Ele só usa a metodologia `organic-performance-v2`: score de confiança vezes dez
mais engajamento dos últimos sete dias completos, com decaimento exponencial.
Patrocínio, anúncios e plano comercial não participam da fórmula, do desempate ou
da população elegível.

Filtros de estado, cidade, setor ou critério ativam `mode=preview`. Preview é uma
comparação em tempo real e não é persistido; o contrato continua retornando
`official_ranking` e `history.scope=official` para não apresentar uma série
histórica oficial como se fosse regional.

## Contrato

`GET /api/v1/company_dashboard/analytics/ranking` retorna, além dos campos
legados temporários:

- `official_scope` — escopo persistido global ou de categoria;
- `comparison_scope` — filtros ativos da comparação;
- `ranking` — fato atual do modo retornado;
- `official_ranking` — sempre oriundo do snapshot canônico;
- `benchmarks` — p50, p75 e p90 reais ou estado de amostra insuficiente;
- `history.scope=official`;
- `quadrant.meta` — metodologia e definições dos eixos;
- `definition`, `quality`, `insights`, `request_id`.

`population_label` é sempre `eligible_companies`; a interface exibe “empresas
elegíveis”. A elegibilidade é centralizada em
`CompanyDashboard::RankingEligibilityScope`: empresa ativa, com ranking score e
aderente aos filtros/categoria.

## Benchmarks

`RANKING_MIN_COMPARABLE_POPULATION` configura a amostra mínima. O valor inicial
é `10`, declarado em `.env.example`, e deve ser revisado por Produto/Dados antes
de uma alteração de política. Abaixo do mínimo, a API responde
`insufficient_sample` sem publicar percentis de benchmark.

## Performance e observabilidade

O serviço registra duração, contagem de consultas SQL e população elegível. O
histograma de duração permite acompanhar p50/p95; a migração para `ROW_NUMBER()`
em SQL só deve ser considerada com evidência de p95 acima de 400 ms ou população
acima de 10.000. A normalização de cidade continua em Ruby; não há migration de
`city_normalized` sem evidência de escala.

Métricas Yabeda/Prometheus: `ranking_requests_total`,
`ranking_failures_total`, `ranking_api_duration`,
`ranking_eligible_population`, `ranking_worker_duration` e
`ranking_snapshot_freshness_hours`.

## Validação de deploy

O deploy executa preflight dos snapshots, smoke canônico da empresa 372, smoke
`state=SC` (que deve retornar `mode=preview`) e smoke do worker. O estado `error`
não é aceito pelo smoke canônico.
