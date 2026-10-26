# frozen_string_literal: true

class CreateSalesQuotas < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_quotas do |t|
      t.references :company, foreign_key: true, index: true
      t.references :user, null: false, foreign_key: true, index: true
      t.references :sales_pipeline, foreign_key: true, index: true
      t.string :period_type, null: false, default: 'monthly'
      t.date :starts_on, null: false
      t.date :ends_on, null: false
      t.bigint :target_revenue_cents, null: false, default: 0
      t.integer :target_deals_count, null: false, default: 0

      t.timestamps
    end

    add_index :sales_quotas, %i[user_id starts_on ends_on sales_pipeline_id],
              unique: true, name: 'idx_sales_quotas_user_period_pipeline'
  end
end
