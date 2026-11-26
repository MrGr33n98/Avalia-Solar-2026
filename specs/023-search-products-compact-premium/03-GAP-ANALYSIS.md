# 5. GAP Analysis consolidada

| ID | GAP | Causa raiz | Solução | Impacto | Prioridade |
|---|---|---|---|---|---|
| G01 | Card muito largo | Grid fixo | Grid adaptativo | Alto | P0 |
| G02 | Card muito alto | Aspect ratio 4:3 | Imagem com altura controlada | Alto | P0 |
| G03 | Espaço branco excessivo | Imagem e paddings | Media container compacto | Alto | P0 |
| G04 | Ausência de três colunas | Breakpoints atuais | Container-responsive | Alto | P0 |
| G05 | Distância entre informações | Margens independentes | Density tokens | Alto | P1 |
| G06 | Distância entre seções | `space-y-10` | Espaçamento contextual | Médio | P1 |
| G07 | Hierarquia tipográfica | Pesos e tamanhos variados | Typography scale | Médio | P1 |
| G08 | CTA ocupa área excessiva | Layout vertical | CTA compacto | Médio | P1 |
| G09 | Hover exagerado | Zoom e elevação | Microinterações sutis | Médio | P2 |
| G10 | Imagem quebrada | Sem tratamento explícito de erro no card de busca | Fallback resiliente | Alto | P1 |
| G11 | Título longo truncado | `line-clamp-2` | Acesso ao título completo | Médio | P1 |
| G12 | Parcelamento presumido | Valor hardcoded | Condições comerciais reais | Crítico | P0 |
| G13 | Ambiguidade da reputação | Rating da empresa no produto | Identificação semântica | Alto | P0 |
| G14 | Risco de regressão | Componente compartilhado | Variante isolada | Alto | P0 |
| G15 | Imagens potencialmente superdimensionadas | `sizes` baseado na viewport | Ajustar ao grid efetivo | Médio | P1 |
| G16 | Risco de layout shift | Alterações de carregamento | Skeleton com geometria equivalente | Alto | P1 |
| G17 | Densidade inconsistente | Ausência de variante compacta | Contrato reutilizável | Alto | P1 |
| G18 | Cobertura automatizada | Ainda não inventariada integralmente | Auditoria e ampliação dos testes | Alto | P0 |
