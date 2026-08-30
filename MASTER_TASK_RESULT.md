# Root Causes

- **CONFIRMADA** — Docker publicava portas 3000/3001; health era cacheável; CSP incluía localhost; loaders Inbox não capturavam todas rejeições; GETs usavam até três tentativas; 401 não deve ser retryable.
- **NÃO CONFIRMADA** — causa interna do HTTP 500 Rails, duplicação analytics, 401 público, RSC e Server Action `x`; exigem evidência runtime.

# Arquivos alterados

- `docker-compose.yml`
- `AB0-1-front/app/api/health/route.ts`
- `AB0-1-front/app/dashboard/inbox/LiveInbox.tsx`
- `AB0-1-front/lib/inbox-api.ts`
- `AB0-1-front/lib/api-client.ts`
- `AB0-1-front/lib/api-error.ts`
- `AB0-1-front/lib/analytics/identity-stitch.ts`
- `AB0-1-back/config/initializers/lograge.rb`
- `AB0-1-front/next.config.js`
- `AB0-1-front/app/companies/[id]/CompanyDetailClient.tsx`
- `AB0-1-front/components/WebVitalsReporter.tsx`
- `AB0-1-front/components/feed/NewsFeedCard.tsx`
- `AB0-1-front/components/Footer.tsx`
- `MASTER_TASK_RESULT.md`

# Mudanças

Portas agora usam `expose`; health usa `force-dynamic`, `revalidate=0`, `no-store` e mascara envs; CSP permite localhost somente fora de produção; Inbox captura erros, mostra Retry e limita GETs a uma tentativa; analytics público exige autorização; Footer reduz prefetch secundário.

# Infra

Frontend/backend continuam na rede `ab0-network`, acessíveis internamente em `ab0-frontend:3000` e `ab0-backend:3001`. NPM permanece acesso externo.

# Inbox

Loaders têm catch; `markRead` fica dentro da boundary; retry Inbox limitado. Reconnect reutiliza loaders protegidos.

# Analytics / Performance / Server Action x / Request ID

Web-vitals tinha dois caminhos; `WebVitalsReporter` agora impede backend duplicado no `track`, mantendo um beacon direto. Identity stitch agora deduplica por usuário + anonymous ID na sessão; chamadas repetidas retornam sem novo POST. Analytics e identity têm safeguards locais; 401 público é evitado pelo gate de autorização; RSC e action `x` não foram confirmados; request-id recebeu fallback local, mas produção exige validação.

# Testes

- `docker compose config`: passou, com warnings de env ausentes.
- `npm run typecheck`: passou.
- `npm run lint`: falhou com dívida preexistente; baseline em `/tmp/avalia-lint-before.txt`, resultado em `/tmp/avalia-lint-after.txt`.
- `npx eslint` nos arquivos alterados: passou; baseline global segue com dívida preexistente.
- `git diff --check`: passou.
- `npx next build --no-lint` com otimizações desativadas: timeout após 300s, exit code 124; sem progresso além de `Creating an optimized production build ...`. Build padrão anterior travou no ambiente local.

# Riscos

500 Rails permanece sem stacktrace. Retry menor pode reduzir recuperação transitória.

# Rollback

```bash
git checkout main
git branch -D fix/infra-runtime-hardening
```

# Deploy sugerido

Não executar. Validar em pipeline controlada antes de deploy.
