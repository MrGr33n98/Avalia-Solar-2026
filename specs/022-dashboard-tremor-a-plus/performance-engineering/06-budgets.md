# Métricas / Definition of A+++
A+++ é critério interno proposto, não certificação. Baseline atual = a medir. Core Web Vitals p75 RUM segmentado mobile/desktop, janela 28 dias e amostra mínima acordada (proposta ≥200 page views válidos e ≥200 interações para INP por segmento; se menor reportar insuficiente). Medidas lab por cenário, medianas 5–10 runs; metas internas P95 exigem amostra suficiente (≥100 eventos comparáveis). Não misturar lab e field.
| Indicador | Gate / alvo | Medição |
|---|---|---|
| LCP p75 | ≤2.5s (stretch ≤1.8s) | RUM navegação completa |
| INP p75 | ≤200ms (stretch ≤150ms) | RUM, não Lighthouse |
| CLS p75 | ≤0.1 (stretch ≤0.05) | RUM |
| TTFB p75 | ≤600ms alvo | nav timing, por ambiente |
| TBT mobile lab | ≤200ms | Lighthouse autenticado local/staging |
| Clique→feedback | p95 ≤100ms | marks/perf trace |
| Troca de aba warm → conteúdo útil | p95 ≤300ms | marks, cache fresco autorizado |
| Troca cold → conteúdo útil | p95 ≤1.2s alvo | perf marks e rede controlada |
| Filtro cacheado | p95 ≤300ms | interação + conteúdo |
| Shell remount em tab local | 0 | mount counter/Profiler |
| Requests duplicados evitáveis | 0 por cenário | trace normalizado |
| JS inicial crítico | ≤450 KiB gzip alvo; Δ ≤5% por rota sem aprovação | analyzer/build, distinguir transfer size |
| CPU render de transição | reduzir ≥30% nos hotspots confirmados | comparação lab mesma fixture |
| Long tasks | reduzir ≥50% onde baseline viola orçamento | trace >50ms, sem ocultar trabalho |
| API p95 crítica | ≤500ms alvo staging com carga acordada | server timing/tracing |
| Subscriptions | 1 por domínio/tenant ativo quando necessário; 0 órfãs | instrumentation |
| Heap pós-GC | sem crescimento sustentado após 30 ciclos; investigar >10% sobre baseline estabilizado | heap local |
| Segurança / a11y | 0 cross-tenant, 0 chamadas bloqueadas, 0 axe serious/critical, 0 regressão crítica | testes |
| VM | 0 processos adicionais, sem regressão sustentada de RAM/CPU | telemetria existente |
Se alvo absoluto inviável, documentar dependência, delta atingido, risco e aprovação; nunca redefinir meta silenciosamente. Ação em foreground durante cache miss: feedback rápido ≠ dados carregados. Não marcar PASS por skeleton. RUM: route template, dispositivo, duração e estado cache, sem IDs de pessoas/empresa/payloads, respeitar consentimento/políticas.
