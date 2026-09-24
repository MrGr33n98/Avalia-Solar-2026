# ADR 0009: Calibração da população e qualidade estatística

- **Status:** aceito para planejamento
- **Data:** 2026-09-24
- **Escopo:** Calibração de quality gates por camada e capability

## Contexto

O comportamento atual expõe `RANKING_MIN_COMPARABLE_POPULATION`, default 10, em benchmark e Positioning. Esse número não foi aprovado como requisito metodológico futuro. Não foi realizada consulta autorizada a dados reais de produção; contagens, distribuições e estabilidade de produção permanecem pendentes. Os dados de teste/seeds encontrados não são representativos para inferir thresholds.

## Decisão

Não aprovar novo minimum population nem outro threshold nesta etapa. O valor 10 permanece documentado somente como comportamento AS-IS/legacy atual. Calibração futura depende de perfil empírico real, seguro e representativo, não da escolha intuitiva de um N universal nem da maximização/minimização do número de rankings publicados.

O perfil deverá medir, por tipo de escopo e capability, tamanho da população, scores válidos/distintos e sua diversidade efetiva, min/max/média/mediana/desvio padrão, zeros e concentração no teto, ties e tamanho do maior grupo, quantis/colisões, freshness, dados ausentes, disponibilidade de benchmark e dados/dimensões requeridos. Também deverá avaliar estabilidade temporal quando existir histórico suficiente: churn do top N, variação de posição, entrada/saída, correlação de ordenação e sensibilidade a empresas ou pequenas mudanças de score.

Os thresholds e gates devem ser separados por camada/capability, incluindo validade populacional, publicabilidade, benchmark, percentil, quadrante e positioning quando aplicável. Diferenças por geografia ou categoria só serão aprovadas quando sustentadas por distribuição, estabilidade, método e finalidade. Population size isolado não basta: diversidade efetiva, qualidade dos dados e freshness também devem ser analisadas, sem fechar fórmula.

Cada condição deverá futuramente ser classificada como bloqueio, aviso ou diagnóstico com base empírica. Falha de capability derivada — por exemplo colisão de quantis para quartis ou alta concentração de ties — não bloqueia automaticamente o ranking básico. A política continuará respeitando as camadas do ADR 0008 e o fallback do ADR 0002; sem candidato que passe os gates de publicação, o resultado é `no_eligible_scope`.

Até haver identidade territorial e cobertura reconciliadas, agrupamentos por cidade/UF/categoria legados carregam ressalva de normalização, alias e homônimos. Perfil por sede é válido para analisar sede/B2B apenas; não estima população B2C por cobertura. A análise de população B2C permanece pendente da migração/reconciliação canônica de cobertura.

Thresholds, métricas requeridas e classificação dos gates devem ser versionados junto à metodologia ou política governada compatível. Alterações não podem reinterpretar silenciosamente snapshots históricos. Não houve alteração de runtime nesta decisão; profiling de produção exige autorização explícita, consultas somente leitura, análise de custo/EXPLAIN, índices, limite temporal e plano seguro antes de execução.

## Consequências

- `10` não deve ser copiado como threshold futuro do IAS ou de outra metodologia sem calibração e decisão próprias.
- O profiling deve entregar capacidades candidatas e incertezas, equilibrando validade, estabilidade, cobertura e explicabilidade.
- Relatórios precisam separar dados observados, limitações do agrupamento territorial, evidência de produção pendente e dados de teste/dev não representativos.
- Nenhuma população de Ranking B2C deve ser inferida de `companies.city/state` como proxy de cobertura.

## Em aberto

Permanecem em aberto todos os valores de minimum population, diversidade e demais thresholds; fórmula de estabilidade; políticas bloqueantes por capability; retenção e seleção do histórico; regras finais de freshness; fonte dos dados de cobertura; e implementação/armazenamento da versão de política.
