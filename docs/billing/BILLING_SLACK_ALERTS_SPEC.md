# Spec de Alertas Slack: Billing SaaS

**Data:** 2026-05-26  
**Versão:** 1.0

---

## 1. Canal e Configuração

### Canal Novo: `#billing-alerts`

**Propósito:** Monitoramento operacional de billing (assinaturas, pagamentos, ações admin)  
**ENV var:** `SLACK_BILLING_WEBHOOK_URL`  
**Audiência:** Time de produto, operações, financeiro  
**Volume esperado:** 5-30 mensagens/dia em produção

### Canal Existente: `#alertas` (manter para técnico)

**Propósito:** Erros técnicos críticos (webhook inválido, falha de processamento)  
**ENV var:** `SLACK_ALERTAS_WEBHOOK_URL` (já existe)

### Feature Flag

```bash
# Para ativar/desativar alertas de billing sem deploy
BILLING_SLACK_ALERTS_ENABLED=true  # padrão em produção
BILLING_SLACK_ALERTS_ENABLED=false # para staging/testes
```

```ruby
# Billing::SlackNotifier verifica antes de enviar
def self.alerts_enabled?
  ENV.fetch('BILLING_SLACK_ALERTS_ENABLED', 'true') == 'true'
end
```

---

## 2. Eventos e Mensagens

### 2.1 Nova Assinatura Pro

**Trigger:** `customer.subscription.created` com plano Pro  
**Canal:** `#billing-alerts`  
**Urgência:** 🟢 Informativo  
**Modo:** Assíncrono (Thread ou Sidekiq)

```
💳 *Nova Assinatura Pro*

Empresa:  Energia Solar SP
Plano:    Pro
Cidade:   São Paulo/SP
Segmento: Instalador

Company ID: 123
```

```ruby
def self.notify_new_subscription(company:, plan:)
  return unless alerts_enabled?

  SlackNotificationService.notify(
    "💳 *Nova Assinatura #{plan.name}*",
    [{
      color: '#2eb886',
      fields: [
        { title: 'Empresa',   value: company.name, short: true },
        { title: 'Plano',     value: plan.name, short: true },
        { title: 'Cidade',    value: "#{company.city}/#{company.state}", short: true },
        { title: 'Segmento',  value: company.segment.capitalize, short: true }
      ],
      footer: "Company ID: #{company.id} | #{Time.current.strftime('%d/%m/%Y %H:%M')}"
    }],
    channel: :billing
  )
end
```

### 2.2 Enterprise Marcado Manualmente

**Trigger:** Admin executa `mark_as_enterprise!`  
**Canal:** `#billing-alerts`  
**Urgência:** 🟡 Atenção (admin action)  
**Modo:** Síncrono (crítico para auditoria)

```
🏢 *Enterprise Manual Ativado*

Empresa: Energia Solar Nacional
Admin:   joao@avaliasolar.com.br
Motivo:  Contrato assinado #4521

Company ID: 456
```

```ruby
def self.notify_enterprise_manual(company:, admin:, notes: nil)
  return unless alerts_enabled?

  fields = [
    { title: 'Empresa', value: company.name, short: true },
    { title: 'Admin',   value: admin.email, short: true }
  ]
  fields << { title: 'Motivo', value: notes, short: false } if notes.present?

  SlackNotificationService.notify(
    "🏢 *Enterprise Manual Ativado*",
    [{ color: '#f59e0b', fields: fields,
       footer: "Company ID: #{company.id}" }],
    channel: :billing,
    synchronous: true
  )
end
```

### 2.3 Pagamento Bem-Sucedido

**Trigger:** `invoice.payment_succeeded` (renovação mensal)  
**Canal:** `#billing-alerts`  
**Urgência:** 🟢 Informativo  
**Modo:** Assíncrono  
**Nota:** Para evitar spam em muitas assinaturas, considerar threshold (só logar se valor > R$ X)

```
✅ *Pagamento Confirmado*

Empresa: Energia Solar SP
Plano:   Pro
Valor:   R$ 297,00

Company ID: 123
```

```ruby
def self.notify_payment_succeeded(company:, amount_cents:, plan:)
  return unless alerts_enabled?

  SlackNotificationService.notify(
    "✅ *Pagamento Confirmado*",
    [{
      color: '#2eb886',
      fields: [
        { title: 'Empresa', value: company.name, short: true },
        { title: 'Plano',   value: plan.name, short: true },
        { title: 'Valor',   value: format_brl(amount_cents), short: true }
      ],
      footer: "Company ID: #{company.id}"
    }],
    channel: :billing
  )
end
```

### 2.4 Pagamento Falhou

**Trigger:** `invoice.payment_failed`  
**Canal:** `#billing-alerts`  
**Urgência:** 🔴 Urgente  
**Modo:** **SÍNCRONO** (não pode ser perdido)

```
🚨 *Falha de Pagamento*

Empresa:    Energia Solar SP
Plano:      Pro
Valor:      R$ 297,00
Motivo:     insufficient_funds
Tentativas: 2/4

⚠️ Status mudou para: past_due

Company ID: 123
```

```ruby
def self.notify_payment_failed(company:, amount_cents:, decline_reason:, attempt_count: nil)
  return unless alerts_enabled?

  fields = [
    { title: 'Empresa',    value: company.name, short: true },
    { title: 'Valor',      value: format_brl(amount_cents), short: true },
    { title: 'Motivo',     value: translate_decline_reason(decline_reason), short: true }
  ]
  fields << { title: 'Tentativa', value: "#{attempt_count}/4", short: true } if attempt_count

  SlackNotificationService.notify(
    "🚨 *Falha de Pagamento*",
    [{
      color: '#e74c3c',
      fields: fields,
      footer: "Company ID: #{company.id} | #{Time.current.strftime('%d/%m/%Y %H:%M')}"
    }],
    channel: :billing,
    synchronous: true  # OBRIGATÓRIO — não pode ser Thread
  )
end

private

def self.translate_decline_reason(code)
  {
    'insufficient_funds'    => 'Saldo insuficiente',
    'card_declined'         => 'Cartão recusado',
    'expired_card'          => 'Cartão vencido',
    'incorrect_cvc'         => 'CVC incorreto',
    'processing_error'      => 'Erro de processamento',
    'do_not_honor'          => 'Banco recusou sem motivo informado'
  }.fetch(code, code.humanize)
end
```

### 2.5 Assinatura Cancelada

**Trigger:** `customer.subscription.deleted`  
**Canal:** `#billing-alerts`  
**Urgência:** 🟡 Atenção  
**Modo:** Assíncrono

```
📤 *Assinatura Cancelada*

Empresa:  Energia Solar SP
Plano:    Pro
Motivo:   customer_cancel
Vigência: até 26/06/2026

Company ID: 123
```

```ruby
def self.notify_subscription_canceled(company:, plan:, reason:, period_end: nil)
  return unless alerts_enabled?

  fields = [
    { title: 'Empresa',   value: company.name, short: true },
    { title: 'Plano',     value: plan&.name || 'N/A', short: true },
    { title: 'Motivo',    value: reason, short: true }
  ]
  fields << { title: 'Acesso até', value: period_end&.strftime('%d/%m/%Y'), short: true } if period_end

  SlackNotificationService.notify(
    "📤 *Assinatura Cancelada*",
    [{ color: '#f59e0b', fields: fields,
       footer: "Company ID: #{company.id}" }],
    channel: :billing
  )
end
```

### 2.6 Downgrade para Free

**Trigger:** Admin executa `force_downgrade_to_free!` ou webhook de cancel  
**Canal:** `#billing-alerts`  
**Urgência:** 🟡 Atenção  
**Modo:** Síncrono se admin, assíncrono se webhook

```
⬇️ *Downgrade para Free*

Empresa:  Energia Solar SP
De:       Pro
Para:     Free
Motivo:   Inadimplência após 4 tentativas
Admin:    sistema (webhook)

Company ID: 123
```

### 2.7 Assinatura Past Due

**Trigger:** `customer.subscription.updated` com `status: past_due`  
**Canal:** `#billing-alerts`  
**Urgência:** 🔴 Urgente  
**Modo:** Síncrono

```
⚠️ *Assinatura Past Due*

Empresa:  Energia Solar SP
Plano:    Pro
Desde:    26/05/2026
Ação:     Stripe fará retry automático

Company ID: 123
```

### 2.8 Webhook Stripe Inválido

**Trigger:** `Stripe::SignatureVerificationError` no handler de billing  
**Canal:** `#alertas` (técnico — não billing)  
**Urgência:** 🔴 Crítico  
**Modo:** SÍNCRONO (pode indicar ataque)

```
🔒 *Webhook Billing — Assinatura Inválida*

Provider:  Stripe (billing)
Erro:      No signatures found matching the expected signature for payload
Timestamp: 26/05/2026 15:42:00
IP:        203.x.x.x

⚠️ Verificar STRIPE_BILLING_WEBHOOK_SECRET
```

### 2.9 Webhook Falhou no Processamento

**Trigger:** Exceção não tratada durante processamento de evento  
**Canal:** `#alertas`  
**Urgência:** 🔴 Crítico  
**Modo:** SÍNCRONO

```
💥 *Erro no Processamento de Webhook Billing*

Event Type: customer.subscription.updated
Event ID:   evt_XXXX
Erro:       CompanyNotFound: stripe_customer_id cus_XXXX

Ação necessária: Reprocessar manualmente no Admin
```

### 2.10 Ação Administrativa Sensível

**Trigger:** `AdminSubscriptionService` executa ação de finance/super_admin  
**Canal:** `#billing-alerts`  
**Urgência:** 🟡 Atenção  
**Modo:** SÍNCRONO (para auditoria em tempo real)

```
👤 *Ação Admin Executada*

Ação:          force_downgrade
Empresa:       Energia Solar SP
Admin:         joao@avaliasolar.com.br
Justificativa: "Cliente em disputa de chargeback"

Company ID: 123 | AdminAction ID: 789
```

### 2.11 Divergência Stripe ↔ Banco

**Trigger:** Job de reconciliação periódico detecta divergência  
**Canal:** `#alertas`  
**Urgência:** 🔴 Crítico  
**Modo:** SÍNCRONO

```
🔄 *Divergência Detectada: Stripe vs Banco*

Company ID:      123
Empresa:         Energia Solar SP
Banco (local):   status=active, period_end=2026-06-26
Stripe (live):   status=canceled, period_end=2026-05-26

Ação necessária: Sincronizar via Admin ou investigar
```

---

## 3. Dados Permitidos vs Proibidos

### ✅ Permitido enviar para Slack

| Dado | Justificativa |
|---|---|
| Nome da empresa (razão social) | Necessário para identificação |
| Company ID | Identificador seguro |
| Nome do plano | Free/Pro/Enterprise |
| Status da assinatura | Operacional |
| Valor da cobrança (genérico) | R$ XXX sem detalhes de cartão |
| Motivo genérico de falha | translated_decline_reason |
| Email do admin que executou ação | Auditoria interna |
| Tipo de ação executada | Auditoria |
| Justificativa do admin | Auditoria |
| Datas de período | Operacional |
| IDs de entidades internas (company_id) | Rastreabilidade |
| Últimos 12 chars do event_id | Rastreabilidade |

### ❌ Proibido enviar para Slack

| Dado | Motivo |
|---|---|
| Número do cartão | PCI — nunca disponível mesmo assim |
| CVV, data de expiração | PCI |
| CPF/CNPJ da empresa | PII desnecessária |
| Email do cliente final | PII — não necessário para operação |
| Telefone do cliente | PII |
| Stripe secret keys | Segurança crítica |
| `STRIPE_BILLING_WEBHOOK_SECRET` | Segurança crítica |
| Payload completo do webhook | Pode conter dados sensíveis |
| IP do cliente final | PII |
| Senha ou token de qualquer tipo | Segurança |
| `stripe_customer_id` completo | Pode ser usado para acesso indevido |
| `stripe_subscription_id` completo | Mesmo motivo |

---

## 4. Retry e Fallback

### Comportamento em caso de falha do Slack

```ruby
# SlackNotificationService já tem rescue embutido:
rescue StandardError => e
  Rails.logger.error("[SlackNotificationService] Falha: #{e.message}")
  nil  # Nunca propaga erro para o fluxo principal
```

**Garantia:** Falha do Slack **jamais** quebra o processamento de billing.

### Retry Automático

Para eventos críticos (payment_failed, webhook_invalid, ação admin), usar Sidekiq com retry:

```ruby
# Futuro: migrar alertas críticos para Sidekiq Job
class Billing::SlackAlertJob < ApplicationJob
  queue_as :billing_notifications
  retry_on StandardError, wait: 30.seconds, attempts: 3

  def perform(event_type, payload)
    Billing::SlackNotifier.send(event_type, **payload.symbolize_keys)
  end
end
```

**v1.0:** Thread.new para assíncronos, chamada direta para síncronos.  
**v1.1+:** Migrar críticos para Sidekiq.

---

## 5. Resumo por Evento

| Evento | Canal | Urgência | Modo | Implementar em |
|---|---|---|---|---|
| Nova assinatura Pro | `#billing-alerts` | 🟢 Info | Async | PR 8 |
| Enterprise manual | `#billing-alerts` | 🟡 Atenção | Sync | PR 7 |
| Pagamento confirmado | `#billing-alerts` | 🟢 Info | Async | PR 8 |
| Pagamento falhou | `#billing-alerts` | 🔴 Urgente | **Sync** | PR 5 |
| Assinatura cancelada | `#billing-alerts` | 🟡 Atenção | Async | PR 5 |
| Downgrade para Free | `#billing-alerts` | 🟡 Atenção | Async/Sync | PR 5/7 |
| Past Due | `#billing-alerts` | 🔴 Urgente | **Sync** | PR 5 |
| Ação admin sensível | `#billing-alerts` | 🟡 Atenção | **Sync** | PR 7 |
| Webhook inválido | `#alertas` | 🔴 Crítico | **Sync** | PR 5 |
| Webhook falhou | `#alertas` | 🔴 Crítico | **Sync** | PR 5 |
| Divergência Stripe | `#alertas` | 🔴 Crítico | **Sync** | PR 11 |
