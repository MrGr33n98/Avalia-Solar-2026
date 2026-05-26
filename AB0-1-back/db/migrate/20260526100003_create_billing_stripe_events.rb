# frozen_string_literal: true

# Migration: Cria tabela de idempotência de eventos Stripe
#
# CRÍTICO: Deve existir ANTES do primeiro webhook de billing SaaS.
# Garante que cada evento Stripe é processado exatamente uma vez.
#
# Rollback: rails db:rollback STEP=1 — seguro
class CreateBillingStripeEvents < ActiveRecord::Migration[7.0]
  def change
    create_table :billing_stripe_events do |t|
      # Identificação do evento (UNIQUE — coração da idempotência)
      t.string :stripe_event_id, null: false,
               comment: 'ID do evento Stripe (evt_XXXX) — UNIQUE para idempotência'
      t.string :event_type, null: false,
               comment: 'Tipo do evento (customer.subscription.created, etc.)'

      # Status de processamento
      t.string :processing_status, null: false, default: 'processing',
               comment: 'processing|success|failed|skipped'
      t.text :error_message,
             comment: 'Mensagem de erro se processing_status = failed'

      # Payload completo (sanitizado — sem dados de cartão)
      t.jsonb :raw_payload, default: {},
              comment: 'Payload do evento Stripe (filtrado para remover dados sensíveis)'

      # Timestamp de processamento
      t.datetime :processed_at, null: false,
                 comment: 'Quando o evento foi recebido para processamento'

      t.timestamps
    end

    # UNIQUE em stripe_event_id é o mecanismo de idempotência
    add_index :billing_stripe_events, :stripe_event_id,
              unique: true, name: 'idx_billing_stripe_events_unique'

    # Índices para queries operacionais
    add_index :billing_stripe_events, :event_type
    add_index :billing_stripe_events, :processing_status
    add_index :billing_stripe_events, :processed_at
    add_index :billing_stripe_events, [:processing_status, :created_at],
              where: "processing_status = 'failed'",
              name: 'idx_billing_stripe_events_failed'
  end
end
