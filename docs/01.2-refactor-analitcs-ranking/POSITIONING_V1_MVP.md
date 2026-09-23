# Positioning V1 — Mapa de Posicionamento Avalia Solar

## 1. Objetivo e versão

O Mapa de Posicionamento Avalia Solar é uma análise comparativa complementar ao Ranking Performance orgânico. A versão técnica é `positioning-v1` e não possui afiliação com a nomenclatura ou metodologia de terceiros.

A metodologia é governada pela equipe do Avalia Solar. Empresas não enviam pesos, método de corte ou população mínima pela API.

## 2. Eixos e fórmulas

No modo padrão, o eixo X (Autoridade de Confiança) mantém a fórmula existente:

- 45% Trust Score;
- 20% Verificação;
- 15% Credibilidade das avaliações;
- 10% Profundidade de selos;
- 10% Prova social.

A credibilidade combina 70% de `rating_avg / 5` e 30% de `log(1 + reviews_count) / log(1 + 200)`. Verificação e prova social são sinais binários; selos usam `min(company_badges / 10, 1)`.

O eixo Y (Poder de Execução) mantém os sinais atuais: 35 pontos para leads, 25 para engajamento, 20 para eficiência de conversão e 10 para maturidade operacional. Sem critério, os 90 pontos-base são reescalados por `100 / 90`; com critério, até 10 pontos de aderência são adicionados sem novo reescalonamento.

Leads usam cap de 100. Engajamento usa 55% de visualizações (`log(1 + views) / log(1 + 2000)`) e 45% de cliques (`log(1 + clicks) / log(1 + 300)`). Conversão usa 45% view-to-click com cap de 0,35 e 55% click-to-lead com cap de 0,60. Divisão por zero resulta em zero.

O modo `ranking_quadrant=reviews` permanece disponível: X combina 70% nota e 30% volume logarítmico; Y combina 45% volume e 55% credibilidade.

## 3. Thresholds

Os cortes são calculados separadamente para X e Y usando a mediana da população estatística completa. Para N ímpar é usado o elemento central; para N par, a média dos dois elementos centrais. Não há corte visual fixo em 50.

A classificação usa igualdade no lado superior:

- `x >= x_threshold` e `y >= y_threshold`: Referências;
- `x >= x_threshold` e `y < y_threshold`: Especialistas;
- `x < x_threshold` e `y >= y_threshold`: Em expansão;
- `x < x_threshold` e `y < y_threshold`: Em desenvolvimento.

## 4. Elegibilidade e população

A população estatística é toda a população retornada por `RankingEligibilityScope` no escopo resolvido. Ela calcula pontos, medianas, massa crítica e flags de qualidade. A população visual é limitada a líderes, vizinhos e empresa atual por `Positioning::PointSelector`.

A massa crítica reutiliza `RankingBenchmarkService.min_comparable_population` (padrão atual: 10) e exige pelo menos dois valores distintos em cada eixo. Populações curtas ou distribuições degeneradas retornam `insufficient_sample` e não publicam quadrantes artificiais.

## 5. Escopo e fallback

O payload diferencia `requested_scope` de `resolved_scope`. A ordem é cidade → estado → categoria/setor compatível → categoria/global. Dimensões metropolitanas e porte legal não fazem parte desta versão.

Quando há fallback, `fallback.active` é verdadeiro e a UI informa o motivo. O fallback altera somente o mapa comparativo; não altera ranking oficial, snapshots, histórico, ordenação ou escopo oficial.

## 6. Contrato e linhagem

O payload expõe `x_score`, `y_score`, `x_breakdown`, `y_breakdown`, thresholds, população elegível, população exibida, escopos, distribuição e versão da metodologia. Os aliases `completeness_of_vision` e `ability_to_execute` permanecem durante a transição.

| Sinal | Origem | Normalização | Peso padrão |
| --- | --- | --- | --- |
| Trust | `company_trust_score.score` | valor 0–100 | 45% de X |
| Verificação | `companies.verified` | binário | 20% de X |
| Avaliações | `rating_avg`, `reviews_count` | rating + log | 15% de X |
| Selos | `company_badges` | cap 10 | 10% de X e maturidade |
| Prova social | `social_proof_enabled` | binário | 10% de X e maturidade |
| Leads | `leads_count` | cap 100 | 35 pontos de Y |
| Engajamento | `profile_views_count`, `cta_clicks_count` | logs | 25 pontos de Y |
| Conversão | cliques, visualizações e leads | caps 0,35/0,60 | 20 pontos de Y |
| Maturidade | cinco flags operacionais | fração ativa | 10 pontos de Y |

## 7. Independência, segurança e privacidade

O mapa não determina a posição orgânica. `sponsored`, `featured`, plano pago e premium não entram na fórmula. A consulta continua protegida por `CompanyPolicy`, entitlement `advanced_analytics` e escopo da empresa autenticada. Concorrentes não expõem PII, contatos, leads individuais ou dados brutos de clientes.

Snapshots oficiais continuam exclusivos de `CompanyRankingSnapshot`; esta versão não cria migration nem histórico de posicionamento.

## 8. Limitações e próximos passos

Esta versão não implementa IAS completo, IS/IPM, suavização Bayesiana, decaimento de reviews, governança por comitê, configuração de metodologia no banco, porte empresarial, regiões metropolitanas, tratamento de anomalias ou snapshots históricos de posicionamento.

Follow-ups: auditoria de governança de badges, política de anomaly handling, `company_positioning_snapshots`, `operational_size_band`, escopos regionais confiáveis e Positioning V2/IAS.

## 9. Changelog

- `positioning-v1`: cálculo extraído para domínio próprio; thresholds por mediana; massa crítica e distribuição não degenerada; fallback explícito; população estatística separada da população visual; contrato e UI auditáveis.
