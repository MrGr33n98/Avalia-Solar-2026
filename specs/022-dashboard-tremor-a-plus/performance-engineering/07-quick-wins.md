# Quick wins — candidatos, não mudanças autorizadas
| ID | Ação após confirmar | Impacto esperado | Esforço | Ordem |
|---|---|---|---|---|
| Q1 | impedir respostas obsoletas e corrida de tenant | segurança + estabilidade | M | P0 |
| Q2 | centralizar aliases e sincronização URL; eliminar redirect/commit redundante | navegação | M | P0 |
| Q3 | deduplicar queries com identidade semântica e escopo | rede/CPU | M | P0 |
| Q4 | trocar refresh amplo por invalidação seletiva/coalescência segura | menos bursts | M | P0 |
| Q5 | manter shell; loading/error por seção e skeleton estável | percepção/CLS | P–M | P0 |
| Q6 | lazy chart/drawer pesado e remover imports transitivos comprovados | JS inicial | M | P1 |
| Q7 | configurar staleTime e refetch por domínio medido | revisitas rápidas | P–M | P1 |
| Q8 | cancelar filtros obsoletos, debounce somente entrada textual | UX/rede | M | P1 |
| Q9 | separar accounts/reporting falhas independentes no Buyer Intent | resiliência | M | P1 |
| Q10 | reduzir width/padding animation e layouts caros | fluidez | P–M | P1 |
| Q11 | prefetch seletivo depois do conteúdo crítico | warm navigation | M | P1 |
| Q12 | paginação/virtualização/mídia conforme profiling | DOM/memória | M–G | P2 |
| Q13 | mapear provider Apollo e dependências sem uso | bundle | M | P2 |
| Q14 | SQL/index/endpoint changes somente com trace backend | API | G | P2 |
P/M/G = pequeno/médio/grande, estimativa inicial. D0 reprioriza por impacto medido × frequência × confiança / esforço. Segurança precede velocidade; manter paridade com Spec 017.
