# ADR 0007: Dimensões e identidade do RankingScope

- **Status:** aceito para planejamento
- **Data:** 2026-09-24
- **Escopo:** Identidade semântica dos escopos de ranking

## Contexto

O código atual filtra população por categoria, sede geográfica e `sector`/`project_types`; snapshots oficiais persistem apenas escopos global e categoria. Cidade, estado, setor e critério podem produzir consultas de preview. Critério pode alterar análise/posicionamento sem alterar a ordenação orgânica oficial; `history_days` seleciona histórico, não população. Porte não possui dimensão governada atual. O resolver de Positioning possui semântica própria de fallback e não constitui contrato automaticamente compartilhado com o ranking orgânico.

## Decisão

A identidade do RankingScope é composta pelas dimensões que definem a população ou comparabilidade, segundo contrato metodológico governado; a metodologia não pode incluir arbitrariamente todo parâmetro de UI.

### Dimensões nucleares

- **Metodologia e versão:** identificam regras metodológicas, incluindo mudanças governadas em fórmula, elegibilidade, normalização, desempate ou dimensões comparáveis.
- **Base geográfica:** `headquarters` ou `service_coverage`, pois altera a regra de elegibilidade territorial.
- **Nível e identidade territorial:** resolvidos pela identidade canônica territorial do ADR 0006, nunca por nome ou slug como identidade primária.

### Dimensões comparáveis governadas

- **Categoria:** compõe a identidade quando ativa na metodologia; sua ausência/global deve ter semântica explícita, distinta de texto livre como `all`.
- **Project type:** dimensão elegível, mas somente ativa se a metodologia declarar que redefine a população comparável.
- **Porte/size:** dimensão futura inativa até haver definição de domínio, fonte, proveniência, cobertura e regra metodológica; não derivar arbitrariamente de headcount, MEI/ME/EPP ou porte empresarial.
- **Sector:** permanece aberto/condicional até esclarecer sua relação semântica com categoria e seu uso fora do Positioning, evitando duplicação entre `category` e `sector`.
- Outras dimensões só entram quando explicitamente declaradas pelo contrato metodológico como alteradoras da população ou comparabilidade.

### Fora da identidade por padrão

`criterion` é parâmetro de análise/consulta, salvo metodologia futura que declare alteração de população, score comparável ou ordenação. Janela interna definida pela metodologia é coberta por sua versão; `history_days` e janela de consulta histórica não criam scope por padrão. `official`/`preview` são modos de execução/publicação. Paginação, ordenação de apresentação, modo de gráfico, abas, filtros visuais, limite, quantidade de vizinhos, visualização de benchmark e estado de UI são parâmetros de apresentação. `requested_scope`, `resolved_scope` e `fallback_reason` descrevem a resolução, não a identidade. Data do snapshot, `computed_at` e `as_of` são metadados temporais associados a snapshots de uma identidade, não partes da identidade estrutural.

Identidade semântica do scope e chave técnica (`scope_key`) são conceitos separados. A canonicalização futura deverá assegurar que a mesma semântica gere a mesma identidade, independentemente da ordem de parâmetros ou aliases, preferindo identidade territorial canônica a texto e definindo explicitamente null/global/any. O formato da chave permanece aberto; não adotar strings frágeis sem canonicalização/versionamento.

O contrato metodológico deverá declarar dimensões obrigatórias e opcionais comparáveis. A escolha futura entre contrato definido em código, configuração e registro em banco exige avaliação própria; não criar DSL nem JSON arbitrário executável nesta etapa. Alterar as dimensões comparáveis muda população/comparabilidade e exige governança e versionamento compatível, sem alteração silenciosa.

Identidade não implica materialização. Scopes podem ser resolvidos sob demanda ou materializados conforme política futura; não gerar todas as combinações. Preview pode avaliar scopes sem torná-los automaticamente rankings oficiais persistidos. Positioning e ranking orgânico não compartilham automaticamente escopo; eventual primitive comum exige compatibilidade de dimensões declaradas.

## Consequências

- Consultas e APIs deverão distinguir dimensões de identidade, parâmetros de consulta/apresentação, modo de execução e metadados de snapshot.
- A identidade futura é estável e determinística sem acoplar-se a strings de nomes ou à posição do parâmetro na URL.
- O ranking atual e seus snapshots não são alterados por este ADR.

## Em aberto

Permanecem em aberto o schema e nomes exatos, formato/algoritmo da chave, contrato metodológico executável, semântica completa de ausência/global, definição de `sector`, ativação de project type, futura dimensão de porte, persistência/materialização e política de compatibilidade de versões.
