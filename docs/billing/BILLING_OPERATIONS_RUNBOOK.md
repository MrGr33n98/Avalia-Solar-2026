# Runbook de Operações: Billing SaaS

**Data:** 2026-05-26  
**Versão:** 1.0  
**Audiência:** Time de operações, suporte, engenharia

---

## 1. Ambientes e Secrets

### Variáveis de Ambiente Obrigatórias

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_XXXX          # Produção: sk_live / Staging: sk_test
STRIPE_WEBHOOK_SECRET=whsec_XXXX        # Webhook do banner (legado)
STRIPE_BILLING_WEBHOOK_SECRET=whsec_XXXX # Webhook do billing SaaS (NOVO)

# Slack
SLACK_BILLING_WEBHOOK_URL=https://hooks.slack.com/services/XXXX
BILLING_SLACK_ALERTS_ENABLED=true

# Feature flag
BILLING_ENABLED=true  # Para ligar/desligar todo o módulo billing
```

### Verificação de Ambiente no Boot

```ruby
# config/initializers/stripe.rb
if Rails.env.production?
  raise "STRIPE_SECRET_KEY deve começar com sk_live_ em produção" \
    unless ENV['STRIPE_SECRET_KEY']&.start_with?('sk_live_')
  raise "STRIPE_BILLING_WEBHOOK_SECRET não configurado" \
    if ENV['STRIPE_BILLING_WEBHOOK_SECRET'].blank?
end
```

---

## 2. Configuração do Stripe Dashboard

### Endpoints de Webhook

| Ambiente | URL | Eventos |
|---|---|---|
| Produção | `https://api.avaliasolar.com.br/api/v1/billing/webhooks/stripe` | Ver lista abaixo |
| Staging | `https://api-staging.avaliasolar.com.br/api/v1/billing/webhooks/stripe` | Ver lista abaixo |
| Desenvolvimento | Stripe CLI: `stripe listen --forward-to localhost:3000/api/v1/billing/webhooks/stripe` | Todos |

### Eventos a Assinar no Stripe Dashboard

```
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_succeeded
invoice.payment_failed
customer.subscription.trial_will_end
```

**⚠️ Atenção:** O endpoint de billing é DIFERENTE do endpoint de banner.  
Banner: `POST /api/v1/payments/webhooks/stripe` → `STRIPE_WEBHOOK_SECRET`  
Billing: `POST /api/v1/billing/webhooks/stripe` → `STRIPE_BILLING_WEBHOOK_SECRET`

---

## 3. Indicadores de Saúde (Health Checks)

### Verificações Diárias

```bash
# 1. Assinaturas sem sincronização recente (> 24h)
rails runner "
  stale = Billing::CompanySubscription
    .where('last_synced_at < ?', 24.hours.ago)
    .where(status: %w[active trialing past_due])
  puts \"Stale subscriptions: #{stale.count}\"
  stale.each { |s| puts \"  - Company #{s.company_id}: #{s.status}\" }
"

# 2. Webhooks com falha recente
rails runner "
  failed = Billing::StripeEvent
    .where(processing_status: 'failed')
    .where('created_at > ?', 24.hours.ago)
  puts \"Failed webhook events: #{failed.count}\"
"

# 3. Assinaturas past_due com mais de 7 dias
rails runner "
  critical = Billing::CompanySubscription
    .where(status: 'past_due')
    .where('last_payment_error_at < ?', 7.days.ago)
  puts \"Critical past_due (>7 days): #{critical.count}\"
"
```

---

## 4. Runbooks de Incidentes

### INC-01: Webhook Não Processado

**Sintomas:**
- Alerta no `#alertas`: "Erro no Processamento de Webhook Billing"
- `Billing::StripeEvent` com `processing_status: 'failed'`
- Empresa pagou mas não recebeu acesso

**Diagnóstico:**

```bash
# 1. Ver últimos eventos com falha
rails runner "
  Billing::StripeEvent
    .where(processing_status: 'failed')
    .order(created_at: :desc)
    .limit(10)
    .each do |evt|
      puts \"#{evt.stripe_event_id} | #{evt.event_type} | #{evt.error_message}\"
    end
"

# 2. Verificar se empresa tem CompanySubscription
rails runner "
  company = Company.find(COMPANY_ID)
  sub = Billing::CompanySubscription.find_by(company: company)
  puts sub.inspect
"
```

**Resolução:**

```bash
# Via ActiveAdmin:
# → /admin/billing_company_subscriptions/[ID]
# → Ação: "Sincronizar com Stripe"
# → Justificativa: "Reprocessamento após falha de webhook #evt_XXXX"

# Ou via rails console (apenas super_admin engenharia):
admin = AdminUser.find_by(email: 'seu@email.com')
service = Billing::AdminSubscriptionService.new(
  company: Company.find(COMPANY_ID),
  admin_user: admin,
  justification: "Reprocessamento manual — incidente INC-01"
)
service.sync_with_stripe!
```

**Prevenção:** Habilitar reprocessamento automático via Sidekiq retry.

---

### INC-02: Assinatura Divergente (Stripe vs Banco)

**Sintomas:**
- Alerta no `#alertas`: "Divergência Detectada: Stripe vs Banco"
- Cliente reclamou de perda de acesso mas pagou
- Cliente com acesso Pro mas subscription cancelada no Stripe

**Diagnóstico:**

```bash
# 1. Verificar estado no Stripe via console
rails runner "
  sub = Billing::CompanySubscription.find_by(company_id: COMPANY_ID)
  if sub.stripe_subscription_id.present?
    stripe_data = Stripe::Subscription.retrieve(sub.stripe_subscription_id)
    puts 'Banco: ' + sub.status
    puts 'Stripe: ' + stripe_data.status
    puts 'Banco period_end: ' + sub.current_period_end.to_s
    puts 'Stripe period_end: ' + Time.at(stripe_data.current_period_end).to_s
  end
"
```

**Resolução:**

```bash
# Banco está desatualizado → Sincronizar com Stripe
# Via ActiveAdmin: Ação "Sincronizar com Stripe"

# Stripe está desatualizado → Improvável, mas possível em caso de bug
# Documentar e escalar para engenharia sênior
```

---

### INC-03: Past Due em Lote (Muitas Empresas)

**Sintomas:**
- Vários alertas de `past_due` em sequência
- Possivelmente problema no método de pagamento global ou issue no Stripe

**Diagnóstico:**

```bash
# Verificar se é problema isolado ou em lote
rails runner "
  puts Billing::CompanySubscription
    .past_due
    .where('last_payment_error_at > ?', 1.hour.ago)
    .count
"

# Verificar status operacional do Stripe
# → https://status.stripe.com/
```

**Resolução:**

- Se for problema no Stripe → aguardar resolução, comunicar empresas afetadas
- Se for problema específico de um banco emissor → aguardar Smart Retry automático do Stripe
- Manter acesso até resolução (não bloquear por 24-48h)

---

### INC-04: Webhook Stripe com Assinatura Inválida

**Sintomas:**
- Alerta no `#alertas`: "Webhook Billing — Assinatura Inválida"
- Log: `Stripe::SignatureVerificationError`

**Causas Possíveis:**

1. `STRIPE_BILLING_WEBHOOK_SECRET` incorreto ou expirado
2. Deploy sem atualizar o secret
3. Tentativa de ataque (replay ou forjado)
4. Diferença de endpoint no Stripe Dashboard

**Diagnóstico:**

```bash
# Verificar secret configurado
rails runner "puts ENV['STRIPE_BILLING_WEBHOOK_SECRET']&.first(20)"

# Verificar URL do webhook no Stripe Dashboard
# → https://dashboard.stripe.com/webhooks
# Confirmar que aponta para /api/v1/billing/webhooks/stripe (não /payments/webhooks/stripe)
```

**Resolução:**

```bash
# Se secret incorreto: atualizar ENV em produção e reiniciar
# Se for ataque: analisar IPs nos logs, avaliar blocklist via rack-attack

# Após correção, reprocessar eventos perdidos:
# No Stripe Dashboard → Webhooks → Selecionar endpoint → "Resend" nos eventos
```

---

### INC-05: Billing Completo Offline

**Sintomas:**
- Nenhum webhook processado em > 1 hora
- Alertas Slack pararam de chegar

**Diagnóstico:**

```bash
# Verificar se Sidekiq está processando
# → https://api.avaliasolar.com.br/sidekiq (se acessível)

# Verificar logs do servidor
# grep "billing/webhooks" logs/production.log | tail -50

# Verificar conectividade com Stripe
rails runner "Stripe::Balance.retrieve; puts 'Stripe OK'"
```

**Resolução Rápida:**

```bash
# Reiniciar workers (com supervisord/systemctl)
systemctl restart sidekiq

# Se Stripe está down → https://status.stripe.com
# → Aguardar resolução. Stripe reenvia webhooks automaticamente após recovery.
# → SLA: Stripe tenta reenviar por até 72h com backoff exponencial.
```

---

## 5. Reconciliação Stripe ↔ Banco

### Job Periódico (Sidekiq Scheduler)

```yaml
# config/sidekiq_schedule.yml
billing_reconciliation:
  cron: "0 2 * * *"  # Todo dia às 2h da manhã
  class: Billing::ReconciliationJob
  description: "Verifica divergências entre Stripe e banco local"
```

```ruby
# app/jobs/billing/reconciliation_job.rb
class Billing::ReconciliationJob < ApplicationJob
  queue_as :billing_maintenance

  def perform
    Billing::CompanySubscription
      .active_saas
      .where('last_synced_at < ? OR last_synced_at IS NULL', 6.hours.ago)
      .find_each do |sub|
        next unless sub.stripe_subscription_id.present?

        stripe_sub = Stripe::Subscription.retrieve(sub.stripe_subscription_id)
        
        if stripe_sub.status != sub.status
          Billing::SlackNotifier.notify_divergence(
            company: sub.company,
            local_status: sub.status,
            stripe_status: stripe_sub.status
          )
        end

        Billing::SubscriptionSyncService.new(stripe_sub).call
      rescue Stripe::InvalidRequestError => e
        # Subscription não existe mais no Stripe
        sub.update!(status: 'canceled', canceled_at: Time.current)
      end
  end
end
```

### Comando Manual de Reconciliação

```bash
# Reconciliar todas as assinaturas ativas
rails runner "Billing::ReconciliationJob.perform_now"

# Reconciliar assinatura específica
rails runner "
  sub = Billing::CompanySubscription.find_by(company_id: COMPANY_ID)
  stripe_sub = Stripe::Subscription.retrieve(sub.stripe_subscription_id)
  Billing::SubscriptionSyncService.new(stripe_sub).call
  puts 'Sincronizado: ' + sub.reload.status
"
```

---

## 6. Operações de Suporte

### Ver Estado de Billing de uma Empresa

```bash
# Via rails runner (apenas engenharia):
rails runner "
  company = Company.find_by_slug_or_id('solar-sp')
  sub = Billing::CompanySubscription.find_by(company: company)
  
  puts '--- Empresa ---'
  puts company.name
  puts company.plan&.name
  puts ''
  puts '--- Subscription ---'
  puts sub&.status || 'Sem subscription'
  puts sub&.stripe_subscription_id || 'Sem Stripe ID'
  puts sub&.current_period_end&.strftime('%d/%m/%Y')
  puts sub&.last_payment_error
"
```

### Resetar Acesso de Empresa (Emergência)

```bash
# APENAS em caso de bug confirmado que bloqueou empresa que pagou
# Usar AdminSubscriptionService com role super_admin
# Registrar em billing_admin_actions obrigatoriamente

rails runner "
  admin = AdminUser.find_by(email: 'SEU_EMAIL')
  company = Company.find(COMPANY_ID)
  pro_plan = Plan.find_by(name: 'Pro')
  
  # Criar/atualizar subscription como manual até sync
  sub = Billing::CompanySubscription.find_or_initialize_by(company: company)
  sub.update!(
    status: 'active',
    plan: pro_plan,
    is_enterprise_manual: false,
    admin_notes: 'Reset de emergência — aguardando sync com Stripe'
  )
  company.update!(plan: pro_plan)
  
  Billing::AdminAction.create!(
    admin_user: admin,
    company: company,
    action_type: 'emergency_reset',
    justification: 'Bug #XXX — empresa bloqueada indevidamente',
    performed_at: Time.current
  )
  puts 'Reset aplicado. Sincronizar com Stripe em seguida.'
"
```

---

## 7. Como Lidar com Falha Temporária do Stripe

### Comportamento Esperado

- **Checkout:** Erro tratado, mensagem amigável ao usuário, log registrado
- **Webhook:** Stripe reenviará automaticamente com backoff (até 72h)
- **Portal:** Erro tratado, mensagem amigável
- **Acesso às features:** Status atual mantido (não revogar acesso por falha momentânea do Stripe)

### Modo de Degradação Controlada

```ruby
# Em caso de Stripe em manutenção prolongada:
# 1. Ativar feature flag BILLING_ENABLED=false
# 2. Checkout retorna mensagem: "Sistema de pagamento temporariamente indisponível. Tente em alguns minutos."
# 3. Assinaturas ativas mantêm acesso normalmente
# 4. Reprocessar webhooks perdidos após recovery via Stripe Dashboard
```

---

## 8. Checklist de Deploy (Billing)

### Antes do Primeiro Deploy com Billing Ativo

- [ ] `STRIPE_BILLING_WEBHOOK_SECRET` configurado em produção
- [ ] Webhook endpoint cadastrado no Stripe Dashboard com eventos corretos
- [ ] `SLACK_BILLING_WEBHOOK_URL` configurado
- [ ] Tabelas de billing criadas: `rails db:migrate`
- [ ] Plans com `stripe_price_id_monthly` preenchido
- [ ] Testar em staging com Stripe test mode
- [ ] Testar webhook com Stripe CLI: `stripe trigger customer.subscription.created`
- [ ] Confirmar que webhook legado de banner ainda funciona (não afetado)

### Após Deploy

- [ ] Verificar `#billing-alerts` no Slack (sem erros)
- [ ] Verificar `#alertas` (sem erros de webhook)
- [ ] Fazer uma assinatura de teste end-to-end
- [ ] Verificar que CompanySubscription foi criada corretamente
- [ ] Verificar que plan da company foi atualizado

---

## 9. Escalonamento

| Situação | Quem aciona |
|---|---|
| Past_due de 1-2 empresas | Suporte resolve via Admin |
| Past_due de 10+ empresas em 1h | Escalar para Produto |
| Webhook inválido (possível ataque) | Escalar para Engenharia imediatamente |
| Divergência em 5+ assinaturas | Escalar para Engenharia |
| Stripe status.stripe.com com incidente | Monitorar, comunicar clientes afetados, aguardar |
| Billing completamente offline > 30min | Escalar para Engenharia Sênior |
