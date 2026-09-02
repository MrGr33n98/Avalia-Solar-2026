class CreateSalesIntelligenceSignals < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_intelligence_signals do |t|
      t.references :sales_account, null: false, foreign_key: true
      t.references :sales_contact, foreign_key: true
      t.references :sales_opportunity, foreign_key: true
      t.string :signal_type, null: false
      t.string :severity, null: false, default: 'info'
      t.float :confidence, null: false, default: 1.0
      t.string :title, null: false
      t.text :description
      t.string :source_type
      t.bigint :source_id
      t.datetime :detected_at, null: false
      t.datetime :expires_at
      t.datetime :acknowledged_at
      t.references :acknowledged_by, foreign_key: { to_table: :users }
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :sales_intelligence_signals, %i[sales_account_id signal_type],
              name: 'index_sales_signals_account_type_active',
              where: 'acknowledged_at IS NULL'
    add_index :sales_intelligence_signals, :detected_at
    add_index :sales_intelligence_signals, :acknowledged_at
  end
end
