# ADR 0002: Hierarquia e fallback geográfico do RankingScope

- **Status:** aceito para planejamento
- **Data:** 2026-09-24
- **Escopo:** Ranking Hierárquico / IAS

## Contexto

Um escopo geográfico solicitado pode não ter população suficiente ou adequada. O fallback precisa preservar a intenção da consulta, tornar explícito o escopo efetivamente utilizado e evitar que níveis territoriais sem representação canônica alterem silenciosamente a população.

## Decisão

A hierarquia conceitual deve poder representar cidade, região metropolitana, estado, região e nível nacional. Um nível só pode participar do fallback quando tiver representação territorial canônica, identificador estável, fonte confiável, membership determinístico, normalização definida, qualidade suficiente, quality gates definidos e testes. Até que região metropolitana e região atendam a esses requisitos, a primeira política implementável é cidade → estado → nacional. Isso posterga esses níveis; não os elimina do domínio futuro.

Cada transição altera somente a geografia. Categoria, `project_type`, porte, metodologia, período, base geográfica e quaisquer outras dimensões são preservadas. Não se remove `project_type` para obter uma amostra maior. Uma futura política para relaxar outra dimensão exigirá decisão explícita e versionada.

Para cada candidato, o sistema constrói o escopo, resolve sua população e aplica novamente os quality gates. Só um candidato aprovado pode ser o escopo resolvido. A política preserva conceitualmente o escopo solicitado, os candidatos avaliados, o escopo resolvido e o motivo do fallback. Se nenhum candidato, inclusive o nacional, passar pelos gates, o resultado é conceitualmente “sem escopo elegível”; o sistema não relaxa dimensões, inventa benchmark ou publica uma amostra inválida.

A hierarquia não altera a base geográfica definida no ADR 0001: B2C continua usando cobertura de atendimento e B2B continua usando sede em todos os níveis. A cobertura nacional pode tornar empresas candidatas a rankings públicos locais, mas não exige materializar um registro para cada município; elegibilidade de cobertura, metodologia e quality gates continuam aplicáveis.

A resolução deve pertencer a uma política de fallback explícita, com responsabilidade conceitual por escopo solicitado, candidatos, escopo resolvido e motivo. Sua versão e histórico precisam ser governados; a decisão entre versionamento de código, metodologia, política ou configuração permanece aberta. Esta decisão não fixa nomes de schema, tabelas ou campos.

## Consequências

- A política inicial é cidade → estado → nacional, preservando todas as dimensões não geográficas.
- Região metropolitana e região dependem de decisões futuras sobre fonte territorial, IDs, membership, relacionamentos, cobertura territorial, versionamento e efeitos no histórico.
- Cada nível exige nova avaliação de população e quality gates; os limiares permanecem fora deste ADR.
- O domínio e os contratos futuros precisam distinguir escopo solicitado, candidatos, escopo resolvido, motivo do fallback e ausência de escopo elegível.
- Fallback e sua versão precisam ser explicáveis e auditáveis; snapshots e analytics precisarão preservar essa distinção conforme decisões futuras de persistência.
