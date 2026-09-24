# ADR 0011: Relação entre Ranking Orgânico, Trust Score, Positioning e IAS

- **Status:** aceito para planejamento
- **Data:** 2026-09-24
- **Escopo:** Ranking Avalia Solar / metodologias de score

## Contexto

O Avalia Solar possui Trust Score, ranking orgânico `organic-performance-v2` e análise Positioning implementados. IAS, IS e IPM aparecem como conceitos/propostas no Discovery, mas não possuem fórmula aprovada ou implementação runtime. Os sinais dos componentes se sobrepõem: reviews, engajamento e leads participam do Trust Score, e parte reaparece em Positioning e em hipóteses documentais de IAS. Combinar os scores agora duplicaria sinais e mudaria população/interpretação sem validação.

## Decisão

1. **Ranking Orgânico** permanece a metodologia vigente durante a migração, preservando seu comportamento atual até release metodológico aprovado.
2. **Trust Score** é um input/sinal da composição orgânica e de outros consumidores; não é posição ou ranking.
3. **Ranking Score** é o resultado de score da metodologia orgânica vigente, não sinônimo de Trust Score.
4. **Benchmark/percentil** são análises relativas da população comparável; não são score nem substituto do ranking.
5. **Positioning** é análise derivada independente com seus próprios eixos, thresholds e disponibilidade; não determina a ordenação orgânica.
6. **IAS** será metodologia independente, experimental/futura, com boundary, manifesto, inputs, elegibilidade, quality policy, resultado/snapshot e validação próprios.
7. **IS/IPM** não possuem fórmula aprovada nesta decisão. Não criar valores ou pesos para produzi-los.
8. Nesta etapa não se combina Organic + IAS, Trust + IAS, nem se substitui Organic por IAS. Qualquer relação futura exige validação metodológica específica, análise de double counting, governança/versionamento e aprovação própria.

## Consequências

- A infraestrutura de metodologia pode ser construída sem publicar ou calcular score IAS.
- Migração de infraestrutura deve manter compatibilidade de Organic v2 e seu desempate atual.
- Experimentos IAS devem ser marcados como experimentais e não alterar API/rank oficial.
- Thresholds, fórmula, pesos, IS/IPM e validação de produção continuam `DATA_CALIBRATION_REQUIRED` e/ou `PRODUCT_VALIDATION_REQUIRED`.
- Nenhuma alteração de fórmula ou ranking decorre deste ADR.

