> V1.2: antes de implementar, cumprir `performance-engineering/00-START-HERE.md`, A0–A3 e gate D0. A extensão é vinculante para performance e ordem de execução; Tremor inspiração only permanece.

# Performance budgets e observabilidade
Baseline obrigatório: commit SHA e deploy SHA separados, device/network/profile, viewport, role/plan, tenant sintético, cache cold/warm; 5 runs por cenário para lab e p50/p75/p95 descritos. RUM p75 com amostra suficiente (não inferir INP real de Lighthouse). Lighthouse TBT como proxy de lab, Playwright trace/PerformanceObserver para interações.

| Métrica | Meta |
|---|---|
| LCP p75 | ≤2.5s |
| INP p75 RUM | ≤200ms |
| CLS p75 | ≤0.1 |
| TTFB p75 | ≤600ms alvo, investigar infra |
| TBT lab mobile | ≤200ms alvo |
| JS inicial por rota crítica | ≤450 KiB gzip alvo; medir baseline, não confundir com raw |
| Δ bundle | ≤5% por rota sem exceção documentada |
| Duplicação requests idênticos | 0 evitáveis por ação |
| Mutação duplicada | 0 |
| 5xx e 403 inesperado | 0 nos cenários sintéticos |
| Processos extras VM | 0 |

Dashboard autenticado: sem cache público, query keys por tenant. Lazy import charts, drawers, editores; preferir CSS a JS; paginação/virtualização somente medida e a11y validada; skeleton estável, no layout thrash. Instrumentar RUM por route template, role/device, sem ID de pessoa/PII. Monitorar API latency, requests, erro, cancelamento, cache hit e UI feedback. REA opcional local/CI bounded; não exigir decompilação pesada nem instalar Hopper. Evidência sanitized; scripts de baseline não usam produção sem autorização. Falha em budget existente requer plano de redução e gate explícito, nunca elevar limite para passar.
