# Implementation Plan: CRM Email Timeline Realtime

## Technical context

- Rails 7 / PostgreSQL / Sidekiq e Next.js 14 / TypeScript existentes.
- Reusar `Sales::EmailMessage`, `Sales::EmailEvent`, `Sales::EmailLink`, `Sales::EmailThread`, suppression, `Sales::Messaging::SNSMessageVerifier`, ActionCable autenticado e `lib/cable.ts`.
- Não criar segunda engine, canal genérico de dashboard ou websocket externo.
- Migrações aditivas/reversíveis; preservar `status`, contadores e contratos legados até leitura dual e backfill auditável.

## Arquitetura proposta

`SNS/pixel/link/inbound adapter → normalizador e idempotência → EmailEvent + lifecycle agregado em transação → after_commit broadcast → SalesTimelineChannel autorizado → cursor/delta REST → timeline V2`.

`Sales::Timeline::Query` compõe email aggregate root e eventos não-email. Controller autentica/autoriza, resolve Opportunity scoped e serializa DTO. O front usa o delta como fonte de verdade; socket só invalida/transporta IDs e cursor. Polling visível recupera indisponibilidade do socket.

## Dados e compatibilidade

Adicionar source, received_at, dedupe_key, signal_class, classification_reasons, schema_version a email events; constraints únicas scoped para dedupe; delivery/engagement separados e timestamps ausentes somente depois de confirmar schema real. Contadores comerciais serão derivados ou materializados após medir volume; eventos antigos permanecem com source/classification `legacy/unknown`, sem reinterpretar contagens históricas como leitura humana.

## Fases

1. Preflight/discovery e contratos (host, source canônica, provider inbound e compatibilidade).
2. Persistência/classificação/idempotência e host dedicado; suppression/lifecycle.
3. Timeline query/DTO/cursor e tenant tests.
4. Canal after-commit/autorização/reconnect e fallback.
5. UI cards/filtros/status/notificações.
6. Observabilidade/readiness, CI gates, staging E2E e go/no-go.

## Decisões necessárias para produção

Inbound provider e credenciais/identity/DNS são deployment facts não presentes no repo. Implementar interface/adapters e testes fakes não comprova ingestão real. Valores de `EMAIL_TRACKING_HOST`, ActionCable origin, SNS subscription e mailbox devem ser configurados e verificados no staging/servidor por operador autorizado.
