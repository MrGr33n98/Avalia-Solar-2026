# ADR 0004: Política de confiança e autorização de uso da cobertura

- **Status:** aceito para planejamento
- **Data:** 2026-09-24
- **Escopo:** Cobertura de atendimento e seus consumidores

## Contexto

O domínio precisa distinguir o que a empresa declara, o que é publicado, quanto se confia na cobertura e em quais produtos/consumidores ela pode ser usada. Aprovação de empresa, aprovação comercial de limites e validação territorial respondem a perguntas diferentes. A Decisão 3 estabeleceu `CompanyServiceArea` como fonte canônica-alvo, mas ainda não definiu validação, evidências ou confiança por área.

## Decisão

Declaração, publicação, validação/confiança e autorização de uso são conceitos separados. A autorização é determinada por consumidor e finalidade; não haverá um status universal de aprovação que conceda uso indistinto em todos os produtos.

- **Perfil público:** cobertura declarada pode ser exibida se permitida pelas regras existentes de entitlement/moderação e não rejeitada. Enquanto não validada, deve ser identificada como informação fornecida pela empresa, não como verificada pelo Avalia Solar.
- **Search / discovery:** cobertura declarada pode participar de recall/descoberta sem ser tratada como verificada, gerar badge de cobertura verificada ou aumentar Trust Score. A semântica de correspondência deve permitir distinguir sede, cobertura declarada e cobertura validada.
- **Leads:** declaração isolada não basta para routing de alta confiança; poderá, no máximo, ser considerada candidata secundária conforme política futura. Routing operacional exige confiança maior, a definir.
- **Recommendation:** declaração isolada não fundamenta recomendação territorial forte. Pode ser apresentada como candidata informativa; recomendação forte requer confiança maior, a definir.
- **Ranking público B2C:** declaração isolada não confere elegibilidade oficial. Empresa com sede em São Paulo que declare atender todo o Brasil não entra automaticamente na população do ranking de Florianópolis. Qualquer elegibilidade futura também depende da metodologia, dos filtros do RankingScope e de seus quality gates.

Verificação geral da empresa não equivale à validação de suas áreas de atendimento. Aprovação de `PendingChange` ou autorização comercial para configurar/publicar uma abrangência também não comprova atendimento territorial. `Entitlement` limita configuração/publicação, mas não constitui verdade geográfica, não eleva confiança e não pode, por upgrade de plano, elevar a posição ou o score orgânico do ranking.

Origem do dado (*source*) e confiança são dimensões distintas. Uma cobertura declarada nacional tem blast radius maior que uma cobertura municipal; políticas de maior impacto podem exigir evidência proporcional à amplitude territorial. A proporção e os thresholds não são definidos neste ADR.

## Consequências

- Cada consumidor deverá aplicar uma política explícita de confiança/autorização coerente com sua finalidade; Search poderá favorecer recall sem fazer claims de validação.
- Não se reutilizam implicitamente `moderation_status`, `verified`, `business_verification_status`, aprovação comercial ou limite de plano como verificação de cobertura.
- O cálculo orgânico do Ranking B2C não pode ser aumentado por assinatura ou entitlement comercial.
- Mudanças futuras de confiança precisarão de trilha auditável que permita identificar estado anterior, responsável, momento e justificativa.
- Frescor/expiração da validação deverá ser avaliado; a confiança não é presumida eterna.

## Em aberto

Este ADR não fecha nomes de níveis/status nem schema; tipos, suficiência e combinação de evidências; processo automatizado/manual; thresholds por amplitude territorial; regras detalhadas de autorização por produto; prazos de validade/freshness; nem implementação. A política não altera `RankingEligibilityScope` nesta etapa.
