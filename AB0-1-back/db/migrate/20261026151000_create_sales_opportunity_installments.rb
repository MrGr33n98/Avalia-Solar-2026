# frozen_string_literal: true

class CreateSalesOpportunityInstallments < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_opportunity_installments do |t|
      t.references :sales_opportunity, null: false, foreign_key: true, index: { name: 'idx_sales_opp_installments_on_opp_id' }
      t.integer :installment_number, null: false, default: 1
      t.date :due_date, null: false
      t.bigint :amount_cents, null: false, default: 0
      t.string :status, null: false, default: 'planned'
      t.datetime :paid_at
      t.text :notes

      t.timestamps
    end

    add_index :sales_opportunity_installments, %i[sales_opportunity_id installment_number],
              unique: true, name: 'idx_sales_opp_installments_unique_number'
    add_index :sales_opportunity_installments, :due_date
    add_index :sales_opportunity_installments, :status
  end
end
