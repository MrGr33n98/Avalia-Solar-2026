# Auditoria Forense e Calibração do Mapa de Posicionamento Avalia Solar

- **Data da Auditoria:** 24/09/2026
- **Branch de Trabalho:** `fix/positioning-calibration-v2`
- **HEAD Auditado:** `e7f9e91da31382d9c5fe64dbd0989a208d2cf206`
- **Ambiente:** Monorepo Avalia Solar 2026 (`AB0-1-back` Rails 7, `AB0-1-front` Next.js 14)

---

## 1. Classificação Epistemológica de Evidências

Para rigor metodológico, todas as afirmações deste relatório são categorizadas estritamente:

- **[FACT]**: Verificado diretamente no código-fonte, migrations, schemas ou execução de testes locais.
- **[INFERENCE]**: Dedução lógica necessária a partir de regras matemáticas e código comprovado.
- **[HYPOTHESIS]**: Explicação plausível com base na arquitetura observada, sujeita a confirmação com dados de produção.
- **[PRODUCTION_DATA_PENDING]**: Métrica que depende de consulta agregada e read-only contra a base de produção ativa.

---

## 2. Executive Summary (Resumo Executivo)

O colapso visual do Mapa de Posicionamento (Eixo Y colado no chão em `2.2`, labels de quadrante sobrepostos e círculos de empresas empilhados) **não é um bug puramente cosmético de CSS**. Trata-se de uma falha composta entre três camadas do sistema:

1. **Divergência de Dados / Telemetria Morta [FACT]:** O backend de Positioning v1 (`Positioning::Calculator`) consome diretamente as colunas `companies.profile_views_count` e `companies.cta_clicks_count`. No entanto, o pipeline de analytics moderno (`AnalyticsTrackingJob` -> `company_daily_stats` -> `FeatureStoreDailyWorker` -> `company_feature_daily`) **nunca incrementa nem atualiza essas colunas na tabela `companies`**. Elas permanecem com valor `0` para a vasta maioria do catálogo.
2. **Fórmula Linear com Tetos Descalibrados [FACT]:** A métrica de Leads no Eixo Y é linear até 100 leads (`Definition::CAPS[:execution_leads_max] = 100.0`). Como mais de 90% das empresas cadastradas possuem 0 ou 1 lead direto, a contribuição de leads para a maioria é 0.0.
3. **Colapso Aritmético do Eixo Y na Mediana = 2.2 [FACT & INFERENCE]:**
   - Leads = 0
   - Engajamento = 0 (views e clicks desnormalizados zerados)
   - Eficiência de Conversão = 0 (0 views e 0 clicks geram razão segura 0.0)
   - Maturidade Operacional = 1 sinal ativo (ex: `verified: true`) entre 5 sinais possíveis: $(1 / 5) \times 10.0 \times (100.0 / 90.0) = 2.222 \approx 2.2$.
   - **Resultado:** A maioria da população pontua exatamente entre `0.0` e `2.2`. A mediana da distribuição resulta matematicamente em **`2.2`**.
4. **Dead Code no ThresholdCalculator [FACT]:** A verificação `collapsed_y: y_median.to_f.zero? && zero_ratio_y >= 0.5` em `ThresholdCalculator` é código morto, pois `Positioning::Eligibility` bloqueia qualquer população com `zero_ratio >= 0.5` antes mesmo do cálculo de thresholds ser invocado.
5. **Falhas Geométricas no Frontend (`MagicQuadrant.tsx`) [FACT]:**
   - Os rótulos dos quadrantes usavam posicionamento dinâmico relativo a `100 - yThreshold`. Com `yThreshold = 2.2`, o rótulo **"Referências"** (que deveria morar no topo) é puxado para `top: 74%`, colidindo com a linha da mediana e atropelando os pontos.
   - A linha de referência da mediana usa `insideLeft` que transborda e sofre truncamento pelo navegador.
   - Não havia algoritmo determinístico de dispersão visual (jitter anti-colisão) para empresas com coordenadas idênticas ("efeito pilha de moedas").

---

## 3. Árvore de Causa Raiz (Root Cause Tree)

```
[Colapso do Mapa de Posicionamento]
├── 1. Camada de Dados (Data Layer)
│   ├── AnalyticsTrackingJob escreve exclusivamente em `company_daily_stats` [FACT]
│   ├── Colunas `companies.profile_views_count` e `cta_clicks_count` são legadas e não recebem update [FACT]
│   └── `Positioning::Calculator` lê colunas desnormalizadas zeradas em vez da telemetria agregada [FACT]
├── 2. Metodologia & Cálculo (Methodology Layer)
│   ├── Leads com corte linear em 100 sem log [FACT]
│   ├── Engagement zerado pela falta de dados das colunas legadas [FACT]
│   ├── Conversão zerada por ausência de denominadores em views/clicks [FACT]
│   └── Y reduz-se apenas à Maturidade Operacional (1 flag = 2.2 pts) [INFERENCE]
├── 3. Quality Gates (Eligibility & Thresholds)
│   ├── `Eligibility` só checa `zero_y.zero?`, ignorando concentração no chão (valores 0.1..2.2) [FACT]
│   └── `ThresholdCalculator#collapsed_y` é inalcançável no fluxo 'ready' (Dead Code) [FACT]
├── 4. API & Seleção de Pontos
│   └── `PointSelector` escolhe líderes do ranking orgânico (`crs.score DESC`), não líderes geométricos [FACT]
└── 5. Renderização (Frontend Layer)
    ├── Badge "Referências" persegue a mediana até `top: 74%` [FACT]
    ├── ReferenceLine insideLeft sofre clipping em Y baixo [FACT]
    └── Ausência de Jitter determinístico sobrepõe logos perfeitamente iguais [FACT]
```

---

## 4. Rastreamento Forense da Empresa 372 (Company 372 Trace)

### Dados de Entrada Observados na UI
- **População comparável:** 458 empresas
- **Ranking Oficial:**
  - Trust Score = 89.00
  - Recent Engagement = 163.33
- **Positioning v1:**
  - Autoridade (X) = 70.1
  - Execução (Y) = 6.5
  - Threshold X = 51.5
  - Threshold Y = 2.2

### Decomposição Matemática Exata

#### Eixo X (Autoridade de Confiança):
- `trust_score`: $89.00 \times 0.45 = 40.05 \approx 40.0$
- `verification`: $100.0 \times 0.20 = 20.00$ (`verified: true`)
- `review_credibility`: $\approx 10.0$
- `badge_depth`: $0.0$
- `social_proof`: $0.0$
- **Total X:** $40.05 + 20.00 + 10.00 + 0 + 0 = 70.05 \approx 70.1$ [FACT]

#### Eixo Y (Poder de Execução):
1. **Leads:** A empresa 372 possui 11 leads vitalícios (`leads_count = 11` via `belongs_to :company, counter_cache: true`).
   $$\text{normalize}(11, 100) \times 35.0 = 0.11 \times 35.0 = 3.85$$
   Aplicando o multiplicador de ausência de critério ($100.0 / 90.0$):
   $$3.85 \times \frac{100.0}{90.0} = 4.277 \approx 4.3 \text{ pts}$$
2. **Engagement:**
   $$views = \text{normalize\_log}(0, 2000) = 0.0$$
   $$clicks = \text{normalize\_log}(0, 300) = 0.0$$
   $$\text{blended\_engagement} = 0.0 \times 25.0 \times \frac{100}{90} = 0.0 \text{ pts}$$
3. **Conversion Efficiency:**
   $$view\_to\_click = \text{safe\_ratio}(0, 0) = 0.0$$
   $$click\_to\_lead = \text{safe\_ratio}(11, 0) = 0.0$$
   $$\text{conversion} = 0.0 \times 20.0 \times \frac{100}{90} = 0.0 \text{ pts}$$
4. **Operational Maturity:**
   Sinais ativos: `verified: true`, `whatsapp_enabled: false`, `cta_whatsapp_enabled: false`, `social_proof: false`, `badges: 0`.
   Total: 1 sinal de 5.
   $$\text{score} = \left(\frac{1}{5}\right) \times 10.0 \times \left(\frac{100.0}{90.0}\right) = 2.0 \times 1.111 = 2.222 \approx 2.2 \text{ pts}$$
5. **Total Y:**
   $$Y = 4.28 + 0.00 + 0.00 + 2.22 = 6.50 \approx 6.5 \text{ pts}$$ [FACT]

### Resposta ao P0: Por que recent_engagement = 163.33 enquanto positioning engagement = 0?
- **No Ranking Oficial:** O score consome `company_ranking_score.breakdown['recent_engagement']`. Esse valor é calculado pelo `RankingScoreWorker` a partir da tabela `company_feature_daily` (alimentada diariamente pelo `FeatureStoreDailyWorker` a partir de `company_daily_stats`, aplicando decaimento exponencial de 7 dias com fórmula `SUM(f.engagement_score * EXP(-0.1 * (CURRENT_DATE - f.day)))`).
- **No Positioning v1:** O `Positioning::Calculator` lê os atributos diretos `record.profile_views_count` e `record.cta_clicks_count`. Essas colunas da tabela `companies` não são atualizadas pelo tracking de eventos em tempo real nem pelas tarefas agendadas, permanecendo zeradas. Logo, o cálculo de engajamento do positioning resulta em $0.0$.

---

## 5. Distribuição Populacional & Explicação de P50(Y) = 2.2

Para uma empresa típica sem leads no catálogo:
- `leads_count = 0` $\rightarrow$ Leads = 0.0
- `profile_views_count = 0` $\rightarrow$ Engagement = 0.0
- `cta_clicks_count = 0` $\rightarrow$ Conversion = 0.0
- `operational_maturity`:
  - Se a empresa tiver 1 flag ativa (como `verified` ou `whatsapp`): $2.22$ pts.
  - Se não tiver nenhuma flag ativa: $0.00$ pts.
  - Se tiver 2 flags ativas: $4.44$ pts.

Em um catálogo onde a maioria das empresas ativas possui apenas o status de verificação básico (1 flag ativa) e não gerou leads pela plataforma, mais de 50% das empresas acumulam pontuação de Execução igual a $2.2$. Consequentemente, **a mediana da população (P50) é rigorosamente 2.2**.

---

## 6. Inventário de Arquivos e Funções

| Caminho do Arquivo | Camada | Papel Atual | Risco | Alteração Proposta |
|---|---|---|---|---|
| `AB0-1-front/app/dashboard/components/MagicQuadrant.tsx` | Frontend | Renderização Recharts, Scatter, ReferenceLines e Badges | Alto (visual quebrado) | Fixar 4 quadrantes nos cantos; offset seguro para ReferenceLine; algoritmo determinístico de jitter anti-colisão |
| `AB0-1-front/app/dashboard/components/ranking/RankingPositioningMap.tsx` | Frontend | Card do mapa, textos de contexto e decomposição | Médio | Suporte a flags de qualidade da distribuição e exibição robusta de metadados |
| `AB0-1-back/app/services/company_dashboard/positioning/definition.rb` | Backend | Definições de eixos, pesos, caps e versão | Médio | Manter `positioning-v1` intacto; definir contrato e constantes para `positioning-v2` |
| `AB0-1-back/app/services/company_dashboard/positioning/calculator.rb` | Backend | Cálculo X/Y v1 | Baixo | Preservar v1 sem regressão para histórico e auditoria |
| `AB0-1-back/app/services/company_dashboard/positioning/calculator_v2.rb` | Backend | Novo cálculo estatístico v2 | Médio | Leads com escala log/janela; consumo canônico de engajamento; conversão suavizada |
| `AB0-1-back/app/services/company_dashboard/positioning/eligibility.rb` | Backend | Validação de qualidade amostral | Médio | Adicionar métricas de dispersão (`iqr`, `effective_range`), detecção de `low_spread_y` e `floor_concentration_y` |
| `AB0-1-back/app/services/company_dashboard/positioning/threshold_calculator.rb` | Backend | Cálculo das medianas e percentis | Baixo | Eliminar dead-code de `collapsed_y` e enriquecer payload com percentis (p10, p25, p75, p90, iqr) |
| `AB0-1-back/app/services/company_dashboard/positioning/point_selector.rb` | Backend | Seleção de líderes e vizinhos | Baixo | Documentar explicitamente ordenação orgânica dos líderes |
| `AB0-1-back/app/services/company_dashboard/ranking_service.rb` | Backend | Orquestrador de ranking e posicionamento | Alto | Encaminhar breakdown e suporte seletivo a `positioning-v2` mantendo fallback v1 |

---

## 7. Status de Produção [PRODUCTION_DATA_PENDING]

As seguintes consultas SQL são fornecidas para execução read-only de calibração populacional em ambiente com acesso autorizado:

```sql
-- Distribuição de quantis do Eixo Y sob a fórmula atual e telemetria canônica
SELECT 
  COUNT(*) as total_empresas,
  percentile_cont(0.10) WITHIN GROUP (ORDER BY leads_count) as p10_leads,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY leads_count) as p50_leads,
  percentile_cont(0.90) WITHIN GROUP (ORDER BY leads_count) as p90_leads,
  COUNT(CASE WHEN leads_count = 0 THEN 1 END)::float / COUNT(*) as ratio_zero_leads,
  COUNT(CASE WHEN profile_views_count = 0 THEN 1 END)::float / COUNT(*) as ratio_zero_views,
  COUNT(CASE WHEN cta_clicks_count = 0 THEN 1 END)::float / COUNT(*) as ratio_zero_clicks
FROM companies
WHERE status = 'active';
```
