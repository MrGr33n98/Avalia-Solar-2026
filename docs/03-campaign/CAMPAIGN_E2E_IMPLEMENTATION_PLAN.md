# Plano de implementação

1. P0: manter rotas estáticas, validação numérica, estados loading/error/retry e regressões.
2. P0: executar Playwright autenticado e request specs em stack isolada.
3. P1: conectar CRUD de saved audiences, editor/preflight de templates, Campaign 360 e recipients/analytics.
4. P1: provar Sidekiq, provider message ID, webhooks, tracking, suppression e métricas com fixtures reais de teste.
5. P2/P3: sequences engine, comparação, duplicação, archive, tags, observabilidade e performance.

Cada etapa exige evidência de teste e tenant isolation; dados fictícios são proibidos.
