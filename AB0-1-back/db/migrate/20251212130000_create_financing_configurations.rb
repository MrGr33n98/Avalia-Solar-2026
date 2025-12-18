class CreateFinancingConfigurations < ActiveRecord::Migration[7.0]
  def change
    create_table :financing_configurations do |t|
      t.string :name, null: false
      t.integer :financing_type, null: false, default: 0
      t.decimal :interest_rate_fixed, precision: 5, scale: 2, default: 0.0
      t.decimal :interest_rate_variable, precision: 5, scale: 2, default: 0.0
      t.integer :grace_period_days, default: 0
      t.integer :min_installments, default: 1
      t.integer :max_installments, default: 12
      t.decimal :min_amount, precision: 15, scale: 2, default: 0.0
      t.decimal :max_amount, precision: 15, scale: 2, default: 0.0
      t.boolean :active, default: true

      t.timestamps
    end
    add_index :financing_configurations, :financing_type
  end
end
