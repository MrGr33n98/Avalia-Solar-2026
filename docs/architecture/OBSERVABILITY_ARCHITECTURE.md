# Arquitetura Canônica de Observabilidade & Performance — Avalia Solar

## 1. Visão Geral e Princípios
A camada de observabilidade do Avalia Solar provê visibilidade forense ponta a ponta através da cadeia de execução canônica:
```
USER REQUEST
   ↓ (x-request-id / traceparent)
NEXT.JS FRONTEND
   ↓ (/api/v1 proxy com request_id)
RAILS API (BaseController + Rack Middleware)
   ↓ (Observability::Context + ActiveSupport::Notifications)
DOMAIN SERVICES (Sales, Entitlements, Billing, Outbox)
   ↓ (pg_stat_statements / Redis telemetry)
POSTGRESQL / REDIS
   ↓ (DomainEvent transactional envelope)
TRANSACTIONAL OUTBOX
   ↓ (Sidekiq client middleware com context injection)
SIDEKIQ WORKERS
   ↓ (Sidekiq server middleware com context extraction)
DOWNSTREAM CONSUMERS & EXTERNAL APIS
```

### Princípios Canônicos
1. **Rastreabilidade Ponta a Ponta Sem Adivinhação**: Toda anomalia é classificada estritamente como `OBSERVED`, `CORRELATED`, `LIKELY`, `CONFIRMED` ou `UNKNOWN`.
2. **Provedores Canônicos Unificados**: Sem duplicação de APMs. Utiliza a stack consolidada: Sentry (erros/traces), Yabeda/Prometheus (métricas `/metrics`), Scout APM (transações) e Lograge (logs estruturados).
3. **Segurança & LGPD Zero-Leak**: Sanitização automática via `Observability::Sanitizer` para chaves sensíveis (passwords, JWTs, Stripe secrets, CPFs, cartões).
4. **Resiliência e Read-Only MCP**: Ferramentas de diagnóstico e MCPs operam 100% em modo somente-leitura.

---

## 2. Sinais e Fontes Telemetrizadas

| Camada | Fonte | Sinal Coletado | Mecanismo de Coleta | Destino |
|---|---|---|---|---|
| **Frontend** | Next.js 14 App Router | Web Vitals (LCP, FID, CLS, TTFB), Route Latency | PostHog / Next Telemetry | PostHog / GA4 |
| **API Web** | Rails 7 (Puma) | Latência HTTP (p50, p95, p99), Status, Error Rate | Yabeda Rails + Rack::Runtime | `/metrics` / Prometheus |
| **Erros** | Rails + Sidekiq | Exception Class, Stack Trace, Context Envelope | Sentry SDK (`sentry.rb`) | Sentry Cloud |
| **Banco de Dados** | PostgreSQL 14+ | Conexões ativas/pool, Duração de query, Locks | ActiveRecord ConnectionPool + Yabeda | `/metrics` / DB Logs |
| **Cache/Filas** | Redis 7 | Memória utilizada, Clientes conectados, Latência | Redis INFO + Yabeda | `/metrics` |
| **Processamento** | Sidekiq 7 | Enqueued, Busy, Latência por fila, Retries, Dead | Sidekiq::Stats + Yabeda Sidekiq | `/metrics` / Prometheus |
| **Outbox** | DomainEvent Table | Pending, Processing, Dead Letter, Throughput, Oldest Age | `Observability::OutboxMetrics` | `/metrics` / SystemHealth |
| **Logs** | Rails Application | JSON estruturado com correlation_id e user context | Lograge + `ActiveSupport::Notifications` | STDOUT / Log Aggregator |

---

## 3. Propagação de Contexto e Correlação

Toda requisição carrega o envelope de contexto definido em `Observability::Context`:
- `request_id`: Identificador único da requisição HTTP (propaga do Next.js via header `X-Request-Id`).
- `trace_id`: ID de rastreamento distribuído W3C / Sentry.
- `correlation_id`: Identificador da transação de negócio originária.
- `causation_id`: ID do evento ou mensagem que disparou a etapa atual.
- `company_id`: Tenant ID do contexto isolado.
- `user_id`: ID do usuário autenticado.
- `actor_type` & `actor_id`: Identidade do autor (ex: `User`, `System`, `Admin`).
- `route` & `operation`: Endpoint ou serviço invocado.
- `deployment_version`: Versão do commit (`GIT_SHA` ou `APP_VERSION`).

---

## 4. Métricas do Transactional Outbox (Wave 3 → Wave 4)

O serviço canônico `Observability::OutboxMetrics` monitora os seguintes indicadores em tempo real diretamente do modelo `DomainEvent`:
1. `outbox.pending.count`: Total de eventos aguardando despacho.
2. `outbox.processing.count`: Total de eventos em processamento concorrente.
3. `outbox.failed.count`: Eventos com falha transitória (`attempts < 5`).
4. `outbox.dead_letter.count`: Eventos envenenados/críticos (`attempts >= 5`).
5. `outbox.oldest_pending_age_seconds`: Idade do evento pendente mais antigo.
6. `outbox.retry.count`: Soma total de tentativas de reprocessamento.
7. `outbox.throughput_per_minute`: Taxa de conclusão de eventos por minuto.

### Regras de Saúde do Outbox:
- **`healthy`**: `dead_letter == 0`, `pending < 100`, `oldest_pending_age < 60s`.
- **`degraded`**: `pending >= 100` ou `oldest_pending_age >= 60s`.
- **`critical`**: `dead_letter > 0` ou `oldest_pending_age > 300s`.

---

## 5. Política de Sanitização e Proteção LGPD

O módulo `Observability::Sanitizer` intercepta todos os dados de telemetria, logs e diagnósticos:
- Mascaramento compulsório para chaves: `password`, `token`, `jwt`, `secret`, `api_key`, `authorization`, `credit_card`, `cpf`, `phone`.
- Regex de redação para cabeçalhos `Bearer [FILTERED]`, tokens JWT `[FILTERED_JWT]` e chaves Stripe `sk_live_[FILTERED]`.
- **Controle de Cardinalidade**: Proibido injetar e-mails, nomes de usuários ou payloads completos em labels de métricas Prometheus.
