# Arquitetura candidata — validar por evidência
| Tipo | Estratégia | Guardrail |
|---|---|---|
| Shell | manter identidade e navegação montadas, limitar providers/contextos à área necessária | não manter dados de outro tenant montados |
| Server components | aproveitar App Router onde sessão e autenticação server-side estiverem comprovadas, shell estático/segmentos e Suspense | não migrar globalmente, não duplicar fetch ou usar cache compartilhado |
| Client components | filtros, eventos, charts, forms e drawers somente onde necessários | fronteira client pequena; medir hydration |
| URL/tab | uma função canônica de aliases/params, history sem loops; avaliar History API suportada pelo Next 14 para tabs puramente client, router para mudança de rota | preservar company_id, permissões, deep link, back/forward, analytics; validar integração Next |
| Queries | fábrica de keys com identidade de sessão/tenant/escopo/filtros, hooks por domínio; sinais AbortSignal quando fetch aceita | cancelar/descartar tardias, logout/switch limpa dados inadequados; não usar placeholder anterior de tenant distinto |
| Cache | staleTime por domínio com TTL e freshness explícitos; avaliar 30–60s métricas, 2–5min catálogos, notificações event-driven | valores iniciais propostos, não para autorização; revalidar permissions em eventos relevantes, fail closed; nada público |
| Realtime | evento tipado, invalidação de query alvo, coalescência 100–300ms candidata, backoff/reconnect | revogação e segurança imediatas; evento desconhecido revalida de forma segura; respeitar SLA de frescor |
| Prefetch | intenção (hover/focus) ou idle após conteúdo crítico, apenas rota provável e autorizada, sob rede adequada | limitar concorrência a 1–2, respeitar saveData, abortar ao trocar tenant, nenhuma prefetch de recurso bloqueado |
| Charts | lazy import por módulo e viewport se abaixo da dobra; reservar tamanho; evitar animação longa | alternativa tabular e resize responsivo; conteúdo principal primeiro |
| Tables | paginação server já existente ou comprovadamente necessária, virtualização só com volume/benchmark | teclado, foco, busca, ordenação e exportação completos |
| Forms/drawers | import no primeiro uso ou prefetch de intenção, preservar dirty state | nenhuma mutação sem ação explícita; retry seguro/idempotência |
| Motion | opacity/transform, 120–180ms, 180–240ms drawer; evitar transition-all e layout animado caro | prefers-reduced-motion, não esconder loading com animação |
| Data | paralelizar apenas independente, agregação API apenas se medição provar roundtrips/SQL dominante | preservar contratos, quotas, autorização, timeouts, observabilidade; sem endpoint gigante |
Não usar memo em massa; isolar state, props estáveis e memoização seletiva orientada pelo Profiler. React 18 transitions somente para atualizações não urgentes; nunca atrasar feedback de input ou mudança de tenant. Preferir CSS responsivo; charts não devem recalcular em cada pixel de animação. Revisar query provider global e client/server boundaries antes de otimizar.
