class CreateFinancingOptions < ActiveRecord::Migration[7.0]
  def change
    create_table :financing_options do |t|
      t.references :company, null: false, foreign_key: true, index: true
      t.string :institution_name, null: false
      t.string :credit_line, null: false
      t.string :target_audience, null: false # PF, PJ, Rural
      t.integer :max_term_months
      t.integer :grace_period_months
      t.decimal :interest_rate_percent, precision: 5, scale: 2
      t.text :interest_rate_details
      t.boolean :active, default: true, null: false

      t.text :service_filters
      t.text :project_filters
      t.text :category_filters

      t.timestamps
    end

    add_index :financing_options, [:company_id, :active]
    add_index :financing_options, :target_audience
  end
end