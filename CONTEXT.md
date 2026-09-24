# Contexto de Ranking Avalia Solar

Este glossário define os conceitos de domínio do Ranking Hierárquico e do IAS enquanto sua arquitetura é especificada.

## Geografia e finalidade

**Base geográfica do ranking**:
A relação territorial usada para determinar a elegibilidade geográfica de uma empresa em um RankingScope. É explícita e varia conforme a finalidade do ranking.

**Sede empresarial**:
Localização de origem da empresa. Fundamenta a elegibilidade geográfica do ranking institucional B2B.

**Cobertura de atendimento**:
Localidades onde uma empresa declara ou demonstra que atende projetos. Fundamenta a elegibilidade geográfica do ranking público B2C, sujeita a uma política de validação ainda não definida.

**Ranking público / marketplace B2C**:
Comparação de empresas elegíveis para atender uma localidade, usando cobertura de atendimento como base geográfica.

**Ranking institucional / B2B**:
Comparação de empresas por sua origem ou presença empresarial, usando sede como base geográfica.

## Resolução de escopo

**Escopo solicitado**:
RankingScope pedido pelo consumidor ou produto, preservado mesmo quando não há população elegível naquele recorte.

**Escopo candidato**:
Recorte territorial considerado pela política de fallback ao procurar uma população elegível. Sua população e seus quality gates são avaliados antes de ser aceito.

**Escopo resolvido**:
Escopo candidato que passou pelos quality gates e fornece a população efetivamente usada para responder ao escopo solicitado.

**Política de fallback**:
Regra explícita e versionável que ordena candidatos geográficos e determina como avaliar cada um, mantendo as demais dimensões e a base geográfica do escopo.

**Motivo do fallback**:
Explicação registrada para a escolha de um escopo resolvido diferente do escopo solicitado, como a insuficiência dos quality gates no nível anterior.

**Nível geográfico**:
Tipo de unidade territorial referenciada por um escopo, como município, estado ou país. Deve ser resolvido por identidade territorial canônica; outros níveis só participam do fallback quando possuem representação e dados governados.

**Quality gate**:
Verificação governada que produz status, razões e diagnósticos para uma camada de decisão; pode ser classificada como bloqueante, aviso ou diagnóstico.

**Company Eligibility**:
Decisão individual sobre se uma empresa pode integrar a população candidata, acompanhada de razões e diagnósticos.

**Population Validity**:
Avaliação da qualidade da população formada pelas empresas elegíveis, distinta da elegibilidade de cada empresa.

**Ranking Publicability**:
Decisão sobre se um ranking pode ser publicado oficialmente, distinta da existência/resolução do escopo e da validade de análises derivadas.

**Analysis Availability**:
Disponibilidade independente de análises derivadas — como benchmark, quartis ou positioning — que podem exigir condições adicionais ao ranking básico.

**Blocking Gate**:
Verificação cujo resultado negativo impede a camada governada de prosseguir.

**Warning**:
Sinal de qualidade ou atualidade que deve ser exposto, mas não bloqueia por si só sem política explícita.

**Diagnostic**:
Medida observada para explicabilidade, monitoramento ou análise; não é bloqueante por padrão.

**Population Size**:
Quantidade de empresas na população de um escopo, distinta da quantidade de scores/dados válidos para cada análise.

**Effective Score Diversity**:
Diversidade informativa dos scores de uma população, considerada junto ao tamanho, sem uma fórmula ou threshold definido nesta etapa.

**Tie Concentration**:
Concentração de empresas em valores empatados, especialmente no maior grupo de empate; sinal a avaliar, não falha automática.

**Distribution Quality**:
Características estatísticas observadas da população — como dispersão, concentração, zeros e quantis — usadas para avaliar capabilities sem implicar bloqueio universal.

**Population Stability**:
Estabilidade da composição e ordenação de uma população ao longo de snapshots, a medir quando houver histórico adequado.

**Threshold Calibration**:
Processo empírico e versionado de definir limites e classes de gates usando evidência de distribuição, qualidade, estabilidade e finalidade.

**Sem escopo elegível**:
Resultado em que nenhum candidato, inclusive o nacional, passa pelos quality gates. Não autoriza relaxar dimensões ou publicar uma população inválida.

## Governança da cobertura

**Fonte canônica de cobertura**:
Autoridade de domínio para responder onde uma empresa atende. A arquitetura-alvo do Avalia Solar é `CompanyServiceArea`.

**Representação legada**:
Campos ou formatos anteriores que permanecem temporariamente para compatibilidade, sem constituir uma segunda autoridade de domínio.

**Consumidor de cobertura**:
Módulo que consulta a cobertura por um contrato de domínio compartilhado, sem reconstruir sua semântica a partir de representações distintas.

**Camada de compatibilidade**:
Adaptação temporária entre a fonte canônica e consumidores legados durante a migração faseada.

**Declaração de cobertura**:
Afirmação da empresa sobre as localidades que atende; não constitui, por si só, validação ou autorização para todo uso.

**Publicação de cobertura**:
Exibição da declaração em um produto, sujeita às regras de entitlement e moderação e à transparência sobre sua origem.

**Confiança da cobertura**:
Grau de confiança atribuído à cobertura a partir de validação e evidências, separado da verificação geral da empresa.

**Autorização de uso da cobertura**:
Decisão sobre permitir o uso de uma cobertura por consumidor e finalidade específicos, conforme a política aplicável.

**Evidência de cobertura**:
Informação ou registro usado para avaliar se a cobertura declarada corresponde à capacidade territorial de atendimento. Sinais declarativos, de atividade, execução, clientes, documentais/externos e verificação manual têm semânticas distintas; tipos e suficiência ainda serão definidos.

**Ausência de evidência**:
Falta de evidência suficiente para avaliar uma cobertura, que não equivale à prova de que a empresa não atende a localidade.

## Identidade territorial

**Território**:
Unidade geográfica governada que pode representar país, região, estado, região metropolitana ou município, sem pressupor que todas as relações formem uma árvore perfeita.

**Identidade territorial**:
Identidade interna estável do território no domínio Avalia Solar; não deve ser substituída por nome, slug ou código de uma fonte externa.

**Código territorial externo**:
Identificador atribuído por uma fonte externa oficial ou candidata, preservado como referência distinta da identidade interna. O código IBGE é candidato para municípios brasileiros.

**Fonte territorial**:
Origem do catálogo ou identificador externo de um território, cuja confiabilidade, licença, atualização e cobertura precisam ser governadas.

**Versão territorial**:
Versão ou referência temporal da fonte e das relações territoriais usada para manter proveniência e explicar alterações históricas.

**Alias territorial**:
Nome alternativo ou histórico associado a um território para resolução e exibição, sem constituir sua identidade primária.

## Identidade do RankingScope

**RankingScope**:
Descritor semântico versionável da população comparável de um ranking, composto pelas dimensões nucleares e pelas dimensões comparáveis governadas pela metodologia.

**Dimensão comparável**:
Dimensão cuja diferença altera a população ou comparabilidade segundo o contrato metodológico; sua presença na consulta, URL ou interface não basta para torná-la parte do scope.

**Identidade do scope**:
Conjunto semântico canonicalizado de dimensões que define um RankingScope, independente da representação técnica usada para lookup ou persistência.

**Chave do scope**:
Representação determinística da identidade do scope para lookup, cache ou persistência; seu formato ainda será decidido.

**Modo de execução**:
Contexto de execução/publicação — como oficial ou preview — separado da identidade da população comparável.

**Parâmetro de consulta**:
Entrada de consulta ou apresentação que não integra a identidade do scope, salvo quando metodologia governada declarar que muda população ou comparabilidade.

## Governança metodológica

**Methodology Manifest**:
Registro conceitual imutável de uma metodologia publicada e das versões/parâmetros governados de seus componentes, referenciado por resultados históricos.

**Methodology Release**:
Versão composta publicada de uma metodologia, que identifica o conjunto imutável de regras e componentes usados.

**Component Version**:
Versão imutável de um componente metodológico — como fórmula, elegibilidade, quality gates, geografia, fallback, benchmark, janela ou desempate — referenciada por um release.

**Published Methodology**:
Release aprovado e publicado, imutável; alterações relevantes exigem novo release.

**Draft Methodology**:
Proposta de metodologia ainda sujeita a edição, revisão e aprovação, sem equivalência automática a ranking oficial publicado.

**Execution Context**:
Contexto de cálculo associado ao snapshot, como instante de cálculo, corte temporal dos dados, código/release e parâmetros efetivamente resolvidos.

**As Of**:
Instante até o qual os dados foram considerados para um resultado, distinto do momento em que o cálculo foi executado.

**Methodological Changelog**:
Explicação legível e auditável das mudanças entre releases metodológicos publicados.
