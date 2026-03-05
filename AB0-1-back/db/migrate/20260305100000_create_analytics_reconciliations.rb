class CreateAnalyticsReconciliations < ActiveRecord::Migration[7.0]
  def change
    create_table :analytics_reconciliations do |t|
      t.integer :company_id, null: false
      t.date :day, null: false
      t.string :metric_name, null: false
      t.integer :canonical_value, default: 0
      t.integer :observed_value, default: 0
      t.integer :delta_abs, default: 0
      t.decimal :delta_percent, precision: 10, scale: 4, default: 0.0
      t.string :status, default: 'ok'

      t.timestamps
    end

    add_index :analytics_reconciliations, [:company_id, :day, :metric_name], unique: true, name: 'idx_analytics_recon_unique'
    add_index :analytics_reconciliations, :status
    add_index :analytics_reconciliations, :day
  end
end
