# frozen_string_literal: true

# Migration: Cria tabela de auditoria de ações administrativas de billing
#
# Toda ação manual via Billing::AdminSubscriptionService é registrada aqui.
# Imutável: apenas INSERT, nunca UPDATE/DELETE.
#
# Rollback: rails db:rollback STEP=1 — seguro
class CreateBillingAdminActions < ActiveRecord::Migration[7.0]
  def change
    create_table :billing_admin_actions do |t|
      # Quem executou
      t.references :admin_user, null: false, foreign_key: true,
                   comment: 'Admin que executou a ação'

      # Sobre o quê
      t.references :company, null: false, foreign_key: true,
                   comment: 'Empresa afetada pela ação'
      t.bigint :company_subscription_id,
               comment: 'CompanySubscription afetada (nullable — pode não existir ainda)'

      # O quê
      t.string :action_type, null: false,
               comment: 'Tipo da ação: sync_stripe|mark_enterprise|force_downgrade|cancel_at_period_end|emergency_reset|add_note|extend_trial|enterprise_lead_convert'
      t.text :justification, null: false,
             comment: 'Justificativa obrigatória para toda ação manual'

      # Metadados extras (auditoria detalhada)
      t.jsonb :metadata, default: {},
              comment: 'Dados contextuais da ação (reason, stripe_id, etc.)'

      # Quando e de onde
      t.datetime :performed_at, null: false,
                 comment: 'Timestamp da execução da ação'
      t.string :ip_address,
               comment: 'IP do admin (do request HTTP)'

      t.timestamps
    end

    # Índices para auditoria e queries operacionais
    add_index :billing_admin_actions, :action_type
    add_index :billing_admin_actions, :performed_at
    add_index :billing_admin_actions, [:company_id, :performed_at],
              name: 'idx_billing_admin_actions_company_time'
    add_index :billing_admin_actions, [:admin_user_id, :performed_at],
              name: 'idx_billing_admin_actions_admin_time'

    # FK explícita para company_subscription_id (sem references helper para permitir null)
    add_foreign_key :billing_admin_actions, :billing_company_subscriptions,
                    column: :company_subscription_id, on_delete: :nullify
  end
end
