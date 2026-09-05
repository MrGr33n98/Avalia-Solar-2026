class CreateSalesAudiences < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_audiences do |t|
      t.references :company, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :name, null: false
      t.text :description
      t.string :kind, null: false, default: 'dynamic'
      t.jsonb :filter_definition, null: false, default: {}
      t.boolean :active, null: false, default: true
      t.timestamps
    end
    add_index :sales_audiences, %i[company_id active updated_at]
    add_check_constraint :sales_audiences, "kind IN ('dynamic')", name: 'sales_audiences_kind'
  end
end
