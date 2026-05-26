# frozen_string_literal: true

# Migration: Adiciona campos Stripe ao modelo Plan
# para integração com Billing SaaS (separado do banner legado)
#
# Rollback: rails db:rollback STEP=1
# Risco: NENHUM — apenas adição de colunas nullable. Zero downtime.
class AddStripeFieldsToPlans < ActiveRecord::Migration[7.0]
  def change
    add_column :plans, :stripe_product_id, :string, comment: 'Stripe Product ID (prod_XXXX)'
    add_column :plans, :stripe_price_id_monthly, :string, comment: 'Stripe Price ID mensal (price_XXXX)'
    add_column :plans, :stripe_price_id_yearly, :string, comment: 'Stripe Price ID anual — reservado para v2'
    add_column :plans, :is_public, :boolean, default: true, null: false, comment: 'Exibir no /pricing público'
    add_column :plans, :display_order, :integer, default: 0, null: false, comment: 'Ordem de exibição nos cards'

    add_index :plans, :stripe_price_id_monthly, unique: true, where: 'stripe_price_id_monthly IS NOT NULL'
    add_index :plans, :display_order
    add_index :plans, :is_public
  end
end
