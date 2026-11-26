# 11. Performance Engineering

A compactação deve melhorar a densidade visual sem adicionar complexidade ao runtime.

| Área | Estratégia |
|---|---|
| Next.js Image | Preservar otimização nativa |
| Image sizes | Refletir a largura real dos cards |
| Lazy loading | Imagens fora da área visível |
| LCP | Priorizar apenas imagens críticas identificadas pela medição |
| CLS | Reservar a geometria da mídia |
| Hydration | Não adicionar estado React para calcular colunas |
| Responsividade | CSS Grid e container queries quando necessárias |
| JavaScript | Nenhuma nova biblioteca |
| Animações | Evitar `transition-all` |
| Re-render | Medir antes de introduzir memoização |
| Network | Nenhuma requisição adicional para renderizar o card |
| API | Preservar contratos existentes |
| Skeleton | Mesmas proporções do resultado carregado |
| DOM | Evitar wrappers desnecessários |

O grid deve ser resolvido preferencialmente por CSS, sem `window.innerWidth`, listeners de resize ou cálculos JavaScript desnecessários.

### Performance budgets

| Indicador | Meta |
|---|---:|
| LCP | ≤ 2,5 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0,1 |
| TTFB | ≤ 600 ms como meta do ambiente |
| Dependências adicionadas | 0 |
| Requisições adicionais para layout | 0 |
| Overflow horizontal | 0 |
| Regressão de bundle | 0 como objetivo |
| Redução da altura do card padrão | ≥ 35% |
| Redução da altura da seção | ≥ 30% no cenário de referência |

Esses são critérios propostos, não medições já realizadas em produção.

## Protocolo de comparação
Medir AS-IS/TO-BE no mesmo ambiente, viewport, dados, cache e perfil de rede/CPU; registrar ao menos 3 rodadas e mediana de laboratório. INP de campo depende de tráfego representativo; usar métricas de laboratório apenas como proxy e rotular. Registrar bytes de JS, imagens e número de requests. Sem redução artificial de informações para cumprir orçamento.
