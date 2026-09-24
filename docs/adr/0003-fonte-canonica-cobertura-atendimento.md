# ADR 0003: Fonte canônica da cobertura de atendimento

- **Status:** aceito para planejamento
- **Data:** 2026-09-24
- **Escopo:** Ranking Hierárquico / IAS e consumidores de cobertura

## Contexto

O repositório mantém `companies.coverage_states` e `companies.coverage_cities` como campos legados com caminhos de escrita e múltiplos leitores. `CompanyServiceArea` tem estrutura relacional e leitores, mas não foi encontrado um writer da aplicação nem backfill desses campos. Os consumidores, portanto, podem chegar a decisões geográficas diferentes. A Decisão 1 definiu cobertura como base do ranking público B2C; a Decisão 2 exige preservar essa base durante o fallback.

## Decisão

`CompanyServiceArea` é a fonte canônica-alvo do domínio para responder onde uma empresa atende. `companies.coverage_states` e `companies.coverage_cities` permanecem temporariamente como representações legadas/de compatibilidade, sem dupla autoridade permanente. A direção é uma fonte canônica consultada por um contrato compartilhado de cobertura; consumidores não devem reconstruir sua semântica separadamente.

A migração será faseada e não haverá cutover nesta etapa:

1. **Inventário e reconciliação:** medir empresas com somente campos legados, somente relação, ambas as fontes ou nenhuma; diferenças e equivalências seguras; tokens desconhecidos; duplicatas; e registros por estado, cidade, nacional, raio e ativo/inativo. Não executar essa medição em produção nesta etapa.
2. **Contrato canônico:** projetar um único contrato/resolver de domínio que responda cobertura territorial e exponha resumo, modo, origem e confiança sem fechar nomes de campos ou métodos.
3. **Backfill:** converter dados legados normalizáveis em `CompanyServiceArea` com idempotência, dry-run, auditoria before/after, sem inferir dados ausentes, sem apagar os campos legados, preservando tokens desconhecidos para revisão e com rollback possível.
4. **Cutover de writers:** depois de validar o backfill, Dashboard, ActiveAdmin, imports e APIs passam a escrever na fonte canônica. Enquanto houver leitores legados, admite-se apenas projeção temporária unidirecional da fonte canônica; não haverá sincronização bidirecional permanente.
5. **Migração de consumidores:** migrar Perfil Público, Search, SEO Local, MobiVolt, Leads, Recommendation e Ranking B2C gradualmente para o contrato canônico.
6. **Comparação shadow:** antes de cada cutover, comparar resultados legados e canônicos quanto a incluídos/excluídos, cidade, estado, nacional, raio, normalização, falsos positivos e falsos negativos. Não fazer cutover silencioso.
7. **Depreciação:** somente após backfill, cutover dos writers e consumidores, comparação validada, observabilidade e rollback testado, marcar os campos legados como deprecated. Remover colunas exige decisão separada.

Cobertura nacional é um conceito explícito (`coverage_type = national`), não uma lista artificial de 27 estados. Ela pode tornar uma empresa candidata a escopos locais; não concede elegibilidade automática. Cobertura por estado também não prova, por si só, atendimento a todos os municípios para Ranking B2C. A capability `radius` permanece sujeita a validação técnica antes de uso no RankingScope.

Origem do dado (*source*) e confiança/validação são conceitos distintos. Entitlement determina limites comerciais de configuração/publicação; não prova cobertura, não aumenta confiança e não afeta score ou posição orgânica. Verdade de cobertura, entitlement, validação da cobertura e elegibilidade para um RankingScope permanecem responsabilidades separadas. Entitlements podem controlar limites e funcionalidades comerciais, mas não podem aumentar score orgânico, posição ou nível de validação.

O ADR não define estados de confiança, schema, nomes de campos, processo de aprovação, fontes geográficas canônicas nem política de elegibilidade. `RankingEligibilityScope` e os demais consumidores permanecem inalterados nesta etapa; Ranking B2C só migrará após backfill, contrato canônico, política de confiança, identidade territorial, comparação shadow e quality gates definidos.

## Consequências

- `CompanyServiceArea` passa a ser a autoridade-alvo; os campos legados são somente compatibilidade transitória.
- Não haverá sincronização bidirecional permanente. Uma projeção legacy poderá existir temporariamente em uma única direção.
- Inventário, reconciliação e backfill devem distinguir equivalência segura de dados que exigem revisão, preservando tokens desconhecidos durante a transição.
- Perfil público e demais consumidores devem migrar para um contrato canônico em fases, com comparação do comportamento anterior e novo.
- Entitlement comercial não equivale a cobertura verdadeira ou verificada e não pode influenciar o cálculo orgânico do ranking.
- Permanecem pendentes as decisões de confiança, fonte e identidade territorial, elegibilidade por nível de cobertura, semantics de raio, contrato final, cutover, depreciação e remoção das colunas.
