# Avalia Solar — Transactional Outbox Engine

**Status:** CANONICAL
**Data:** 18 de Setembro de 2026
**Escopo:** `AB0-1-back` (Rails 7 API, PostgreSQL 14+, Sidekiq 7)
**Golden SaaS Pattern:** Wave 3 — Transactional Outbox & Idempotent Event Delivery

---

## 1. Visão Geral & Garantias Arquiteturais

O **Transactional Outbox Engine** do Avalia Solar garante atomicidade transacional entre mutações no banco de dados e a publicação durável de eventos de domínio, eliminando a perda de eventos em falhas de processo e impedindo disparos de side effects em transações revertidas (*rollback*):

```
BEGIN TRANSACTION
  Domain Mutation (ex: Opportunity.update!)
  Outbox.record!(event_type: 'sales.opportunity.stage_changed', aggregate: opp)
COMMIT
    ↓
Outbox::DispatchJob / Outbox::DispatcherService (PostgreSQL FOR UPDATE SKIP LOCKED)
    ↓
Sidekiq Worker
    ↓
Outbox::EventRouter → Idempotent Consumers (Feed, CRM, Analytics, Billing)
```

### Regras Cardinais
1. **DURABILIDADE EM POSTGRESQL:** O PostgreSQL é a fonte autoritativa de persistência dos eventos (`domain_events`). Redis e Sidekiq atuam exclusivamente como camada de transporte e execução assíncrona.
2. **AT-LEAST-ONCE DELIVERY:** O outbox garante entrega *pelo menos uma vez*. Todos os consumidores downstream são projetados para execução idempotente via `event_id` único (UUID).
3. **ZERO ENQUEUE DENTRO DA TRANSAÇÃO:** Nenhum job é enfileirado síncronamente antes da confirmação (*commit*) do banco.
4. **POISON EVENT PROTECTION:** Eventos com 5 tentativas com falha entram em estado *dead-letter* (`failed` com `attempts >= 5` e `last_error` registrado), sem bloquear a fila de outros eventos.
5. **MULTI-WORKER SAFETY:** O despacho de lotes utiliza `FOR UPDATE SKIP LOCKED`, permitindo múltiplos workers concorrentes operando em paralelo sem deadlocks ou duplicações de claim.

---

## 2. Envelope Canônico de Eventos

Todo evento gravado no outbox obedece à seguinte estrutura no payload JSONB:

```json
{
  "event_id": "c7a8b3d2-4f1e-4e8b-8a5c-1b2c3d4e5f6a",
  "event_type": "sales.opportunity.stage_changed",
  "event_version": 1,
  "occurred_at": "2026-09-18T13:15:00Z",
  "company_id": 102,
  "correlation_id": "req-1234-abcd",
  "causation_id": "cmd-5678-efgh",
  "data": {
    "opportunity_id": 45,
    "from_stage_id": 1,
    "to_stage_id": 2,
    "actor_id": 9
  },
  "metadata": {
    "source_ip": "127.0.0.1"
  }
}
```

### Proteção e Sanitização de Credenciais
O serviço `Outbox::Record` filtra recursivamente chaves sensíveis como `password`, `token`, `jwt`, `secret`, `api_key`, `stripe_secret_key`, substituindo seus valores por `[FILTERED]` antes da persistência.

---

## 3. Máquina de Estados do Evento

```
[ pending ] ──(claim com SKIP LOCKED)──> [ processing ] ──(sucesso)──> [ completed / published ]
                                               │
                                            (erro)
                                               ↓
                                   [ failed ] (attempts < 5)
                                               │
                                       (attempts >= 5)
                                               ↓
                                   [ dead_letter / poison ]
```

---

## 4. API de Uso

### Gravando Evento dentro de Transação de Negócio
```ruby
Sales::Opportunity.transaction do
  opportunity.update!(stage: new_stage)
  Sales::StageHistory.create!(...)

  Outbox.record!(
    event_type: 'sales.opportunity.stage_changed',
    aggregate: opportunity,
    payload: {
      opportunity_id: opportunity.id,
      from_stage_id: old_stage.id,
      to_stage_id: new_stage.id,
      actor_id: current_user.id
    }
  )
end
```

### Despacho de Lotes
```ruby
# Execução direta ou via job agendado:
Outbox::DispatcherService.call(batch_size: 100)
# Ou via ApplicationJob:
Outbox::DispatchJob.perform_later(batch_size: 100)
```
