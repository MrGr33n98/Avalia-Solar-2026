# ADR 0001: Base geográfica explícita por finalidade de ranking

- **Status:** aceito para planejamento
- **Data:** 2026-09-24
- **Escopo:** Ranking Hierárquico / IAS

## Contexto

O `RankingEligibilityScope` atual filtra por `companies.state` e `companies.city`, representando sede. O domínio também possui `CompanyServiceArea`, com tipos de cobertura por cidade, estado, raio e nacional. Usar os campos de sede como significado geográfico universal excluiria empresas que atendem uma localidade sem terem sede nela e confundiria origem empresarial com área de atendimento.

## Decisão

A base geográfica é explícita no escopo e depende da finalidade do ranking. O ranking público/marketplace B2C usa cobertura de atendimento para determinar quais empresas podem atender a localidade. O ranking institucional B2B usa sede para representar origem/presença empresarial. Uma empresa sediada em São Paulo e com atendimento nacional pode ser elegível ao ranking institucional de São Paulo e, potencialmente, ao ranking público de Florianópolis; sua cobertura não a torna elegível ao ranking institucional de Florianópolis.

A cobertura, inclusive a nacional, não concede elegibilidade irrestrita: a elegibilidade final continua sujeita à política de validação de cobertura e aos demais critérios e quality gates do `RankingScope`. Cobertura nacional poderá tornar uma empresa candidata a escopos locais sem exigir materialização de escopos para todos os municípios.

Como consequência, `RankingEligibilityScope` não poderá tratar `companies.state` e `companies.city` como significado universal de geografia. A nomenclatura definitiva da base geográfica e seu modelo de confiança serão definidos em decisões posteriores.

## Consequências

- A sede e a cobertura são conceitos geográficos distintos e não intercambiáveis.
- Os escopos e as consultas de elegibilidade precisam identificar explicitamente qual base geográfica se aplica.
- Cobertura nacional e multirregional exigem resolução hierárquica, sem materialização automática de todas as localidades.
- Estados de confiança, evidências, responsáveis pela validação e expiração da cobertura permanecem em aberto.
