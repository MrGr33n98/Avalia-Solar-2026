# ADR 0005: Evidência e obtenção de confiança da cobertura

- **Status:** aceito para planejamento
- **Data:** 2026-09-24
- **Escopo:** Confiança e validação da cobertura de atendimento

## Contexto

A Decisão 4 requer confiança proporcional ao consumidor e à finalidade. O repositório contém alguns sinais territoriais — como projetos de portfólio, leads e distribuições —, mas sua presença não comprova automaticamente execução real nem cobertura em uma localidade. Não foi constatado um fluxo específico de verificação territorial nem base suficiente para estabelecer pesos ou thresholds.

## Decisão

Adotar um modelo híbrido e gradual, que poderá combinar autodeclaração, sinais de evidência, validação automatizada e revisão manual quando necessária. A autodeclaração é alegação, não prova. Autorização comercial ou entitlement, inclusive para abrangência nacional, não valida cobertura territorial.

A evidência deve ser avaliada em relação à localidade específica. Um projeto comprovado em Florianópolis pode sustentar evidência sobre Florianópolis, mas não se propaga automaticamente para Santa Catarina ou para o Brasil. Requisitos poderão variar conforme nível de abrangência e impacto do consumidor; thresholds permanecem em aberto.

Os sinais devem manter semânticas distintas, sem implicar enum ou schema definitivo:

- **Declarativo:** afirmação da empresa de que atende uma localidade.
- **Atividade:** atividade comercial associada à localidade.
- **Execução:** evidência de projeto ou serviço efetivamente executado na localidade.
- **Cliente:** evidência fornecida ou confirmada por cliente.
- **Documental/externo:** documento ou fonte externa considerada confiável após avaliação futura.
- **Verificação manual:** decisão humana fundamentada.

Nenhum dado existente é evidência conclusiva por padrão. Portfólio publicado, lead recebido ou convertido, review genérica, badge e endereço da sede não comprovam isoladamente atendimento territorial. Antes de definir regras automatizadas, é necessário avaliar cobertura, qualidade, proveniência, frescor, risco de fraude, vínculo territorial e vínculo com execução real.

Ausência de evidência significa desconhecimento ou evidência insuficiente, não prova de ausência de atendimento. Deve existir um caminho futuro para cold start, que poderá considerar documentos, fontes externas, projeto comprovado, análise manual ou outros mecanismos ainda não selecionados. A validação pode ser automatizada quando os sinais forem fortes e consistentes; casos ambíguos, conflitantes, de ampla abrangência ou alto impacto poderão exigir revisão manual.

A confiança não deve ser presumida permanente. Frescor e validade devem ser avaliados em decisão futura. Para Ranking B2C, mera autodeclaração continua insuficiente: a empresa só poderá ser candidata após alcançar a confiança exigida, além de cumprir metodologia, elegibilidade, filtros do RankingScope e quality gates. Declarar atendimento nacional não concede elegibilidade automática ao ranking local de Florianópolis.

## Consequências

- A arquitetura futura deve preservar proveniência e vínculo territorial dos sinais para que confiança seja explicável e auditável.
- Sinais de intenção/atividade não podem ser tratados implicitamente como prova de execução.
- A ausência de histórico não exclui automaticamente empresas novas; haverá necessidade de mecanismo futuro de cold start.
- Processos automatizados e revisão manual podem coexistir; a decisão humana poderá ser direcionada aos casos em que dados ou impacto exijam maior escrutínio.

## Em aberto

Este ADR não define pesos, thresholds, quantidades mínimas de projetos/reviews, número de estados, validade temporal, propagação de cidade para estado ou de estado para cidades, nomes de níveis/status, tipos obrigatórios de evidência, mecanismos de cold start ou schema. A definição depende de análise de cobertura, qualidade, proveniência, frescor, risco de fraude e vínculo com execução real.
