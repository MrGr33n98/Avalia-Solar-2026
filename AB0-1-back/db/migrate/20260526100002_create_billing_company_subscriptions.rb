# frozen_string_literal: true

# Migration: Cria tabela principal de assinaturas SaaS
#
# CRÍTICO: Esta tabela é o coração do billing SaaS.
# Separada do BannerSubscription (banner legado) e SubscriptionPlan (marketplace).
#
# Rollback: rails db:rollback STEP=1 — seguro, nenhum dado existente
# Tempo estimado: < 1s em banco vazio, < 5s em banco grande (apenas criação de índices)
class CreateBillingCompanySubscriptions < ActiveRecord::Migration[7.0]
  def change
    create_table :billing_company_subscriptions do |t|
      # Referências obrigatórias
      t.references :company, null: false, foreign_key: true,
                   comment: 'Empresa assinante'
      t.references :plan, null: false, foreign_key: true,
                   comment: 'Plano contratado (Free/Pro/Enterprise)'

      # Status da assinatura — espelha Stripe status + estados internos
      t.string :status, null: false, default: 'incomplete',
               comment: 'trialing|active|past_due|canceled|unpaid|incomplete|incomplete_expired|manual|paused|enterprise_lead'

      # IDs do Stripe (nullable para contas manual/enterprise)
      t.string :stripe_customer_id, comment: 'Stripe Customer ID (cus_XXXX)'
      t.string :stripe_subscription_id, comment: 'Stripe Subscription ID (sub_XXXX)'
      t.string :stripe_price_id, comment: 'Stripe Price ID atual da subscription'

      # Período de cobrança
      t.datetime :current_period_start, comment: 'Início do período atual (UTC)'
      t.datetime :current_period_end, comment: 'Fim do período atual (UTC)'
      t.boolean :cancel_at_period_end, default: false, null: false,
                comment: 'Cancelamento agendado para o fim do período'
      t.datetime :canceled_at, comment: 'Timestamp do cancelamento efetivo'

      # Trial
      t.datetime :trial_start, comment: 'Início do trial'
      t.datetime :trial_end, comment: 'Fim do trial'

      # Falha de pagamento
      t.text :last_payment_error, comment: 'Motivo da última falha de pagamento (sem dados de cartão)'
      t.datetime :last_payment_error_at, comment: 'Timestamp da última falha'

      # Sincronização
      t.datetime :last_synced_at, comment: 'Último sync com Stripe'

      # Enterprise / Manual
      t.boolean :is_enterprise_manual, default: false, null: false,
                comment: 'Conta Enterprise ativada manualmente (sem Stripe)'
      t.text :enterprise_notes, comment: 'Notas do processo Enterprise (contrato, motivo, etc.)'
      t.text :admin_notes, comment: 'Notas operacionais do admin (visível só internamente)'

      # Enterprise Lead System
      t.string :enterprise_lead_status,
               comment: 'Status do lead Enterprise: new|contacted|qualified|converted|lost'
      t.jsonb :enterprise_lead_metadata, default: {},
              comment: 'Payload CRM-ready: tamanho da empresa, segmento, urgência, etc.'

      t.timestamps
    end

    # Índices únicos para integridade de dados
    add_index :billing_company_subscriptions, :stripe_customer_id,
              unique: true, where: 'stripe_customer_id IS NOT NULL',
              name: 'idx_billing_subs_stripe_customer_unique'

    add_index :billing_company_subscriptions, :stripe_subscription_id,
              unique: true, where: 'stripe_subscription_id IS NOT NULL',
              name: 'idx_billing_subs_stripe_subscription_unique'

    # Uma empresa só pode ter uma assinatura ativa SaaS
    add_index :billing_company_subscriptions, :company_id,
              unique: true, name: 'idx_billing_subs_company_unique'

    # Índices operacionais
    add_index :billing_company_subscriptions, :status
    add_index :billing_company_subscriptions, :current_period_end
    add_index :billing_company_subscriptions, :is_enterprise_manual
    add_index :billing_company_subscriptions, :cancel_at_period_end,
              where: 'cancel_at_period_end = true',
              name: 'idx_billing_subs_cancel_at_period_end'
    add_index :billing_company_subscriptions, :last_payment_error_at,
              where: 'last_payment_error_at IS NOT NULL',
              name: 'idx_billing_subs_payment_failed'
  end
end
