# Matriz de testes

| Fluxo | Teste | Estado |
| --- | --- | --- |
| Rota inválida | Jest renderiza banana/audiences/templates/sequences sem NaN/spinner | PASS (18/18 suíte routing/API) |
| Erro API | Jest valida HTTP 500 não JSON e erro de domínio | PASS |
| Rotas browser | Playwright com sessão CRM e APIs reais | PENDENTE |
| Audiência | Request preview/segments + tenant isolation | Specs existentes; execução completa pendente |
| Template | CRUD/preview/sanitização | Specs parciais; execução completa pendente |
| Campaign lifecycle | create/preflight/snapshot/dispatch/pause/resume/retry/cancel | Specs existentes; executar |
| Provider | SES message ID + webhook idempotente | PENDENTE |
| Métricas | recipient events refletem dashboard | PENDENTE |
