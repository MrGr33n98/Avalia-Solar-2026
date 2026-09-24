# ADR 0008: Quality gates em camadas do RankingScope

- **Status:** aceito para planejamento
- **Data:** 2026-09-24
- **Escopo:** Elegibilidade, validade populacional, publicação e análises derivadas

## Contexto

O sistema atual possui regras distintas em `RankingEligibilityScope`, `RankingBenchmarkService`, snapshots oficiais e Positioning. O mínimo configurável de população do benchmark tem default atual de 10, mas snapshots oficiais podem ser gravados com qualquer população não vazia. Positioning avalia gates adicionais de variação e concentração; esses gates não devem ser tratados automaticamente como requisitos do ranking orgânico.

## Decisão

Separar quatro camadas de decisão, cada qual com status, razões e diagnósticos próprios ou conceitos equivalentes:

1. **Company Eligibility:** determina se uma empresa individual integra a população candidata, considerando futuramente atividade, categoria, elegibilidade geográfica, confiança de cobertura aplicável, dados requeridos e exclusões metodológicas.
2. **Population Validity:** avalia se a população elegível possui qualidade suficiente para comparação. Pode considerar tamanho, scores válidos/distintos, distribuição, variância, concentração, empates, zero inflation, dados ausentes e qualidade dos drivers.
3. **Ranking Publicability:** decide se o ranking pode ser publicado oficialmente; pode depender de população válida, metodologia disponível, snapshot atual, qualidade requerida, identidade de scope válida e ausência de falha bloqueante. Existência/resolução de scope não implica publicabilidade.
4. **Analysis Availability:** decide quais análises derivadas podem ser expostas — por exemplo benchmark, quartis, percentil, quadrante, peers, recommendations, positioning e opportunity gap. Uma análise indisponível não bloqueia necessariamente um ranking publicável.

Cada gate deve ser explicável por status, razões e diagnósticos, podendo registrar valor observado e requerido sem definir schema. Sinais candidatos incluem população insuficiente, scores válidos/distintos insuficientes, baixa variância, empates excessivos, snapshot/trust desatualizado, benchmark ausente, variação insuficiente nos eixos e dados requeridos ausentes. Nenhum motivo é declarado bloqueante neste ADR. Gates poderão ser classificados como bloqueantes, avisos ou diagnósticos em decisão posterior baseada em dados.

O default atual `RANKING_MIN_COMPARABLE_POPULATION=10` é somente comportamento AS-IS do `RankingBenchmarkService`, não threshold aprovado para metodologia futura ou IAS. Ties, baixa diversidade efetiva de scores, zero inflation e colisão de quantis exigem avaliação; não implicam automaticamente invalidez do ranking. Colisão de quantis pertence prioritariamente à disponibilidade da análise que os utiliza.

Fallback geográfico consulta os gates necessários à publicabilidade do produto/metodologia, não todos os gates de análises derivadas. Indisponibilidade de quadrante não força fallback quando o ranking básico é publicável. Se nenhum candidato passa pelos gates de publicação, o resultado é conceitualmente `no_eligible_scope`; não se devolve nem publica o último candidato inválido.

Lifecycle do snapshot (por exemplo processing, stale, available) é distinto do status de publicação. Atualidade de dados também é distinta da elegibilidade individual: Trust Score desatualizado pode constituir warning ou afetar publicabilidade conforme política futura, mas não implica inelegibilidade automaticamente. Falta de benchmark pode impedir somente essa análise, se a metodologia assim determinar.

A política de quality gates e suas alterações — thresholds, métricas requeridas e classificação bloqueante — devem ser governadas e versionadas junto à metodologia ou a política versionada compatível. Valores, bloqueios e fórmula final permanecem em aberto.

## Consequências

- API e observabilidade futuras podem expressar publicabilidade do ranking e disponibilidade de cada análise separadamente, sem um único `ranking_status` sobrecarregado.
- Fallback pode usar apenas os requisitos de publicação, preservando dimensões do escopo conforme ADR 0002.
- Scopes existentes e resolvíveis podem ser não publicáveis; snapshots disponíveis não constituem prova automática de publicabilidade.
- Decisões de gate futuras devem registrar gate, resultado, motivo, observado/requerido, versão da metodologia/política e timestamp para explicabilidade, observabilidade e auditoria.

## Em aberto

Permanecem em aberto thresholds, minimum population e quantidade de scores distintos, sinais bloqueantes/avisos/diagnósticos, tratamento de ties, distribuição e zero inflation, freshness por dado, requisitos de benchmark e análises, status/schema, formato de reasons/diagnostics e estratégia de versionamento. O default atual 10 não é adotado como regra futura.
