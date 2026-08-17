class CreateCompanyCategoryCapabilities < ActiveRecord::Migration[7.0]
  def change
    create_table :company_category_capabilities do |t|
      t.references :company, null: false, foreign_key: true
      t.references :category, null: false, foreign_key: true
      # O nome automático excede o limite de 63 caracteres do PostgreSQL.
      t.references :category_solution_type,
           foreign_key: { on_delete: :cascade },
           index: { name: 'idx_ccc_solution_type_id' }
      t.string :capability_type, null: false
      t.string :coverage_scope
      t.jsonb :attributes_json, null: false, default: {}
      t.boolean :verified, null: false, default: false
      t.datetime :verified_at
      t.timestamps
    end

    add_index :company_category_capabilities,
              %i[company_id category_id category_solution_type_id capability_type],
              unique: true,
              name: 'idx_company_category_capabilities_unique'
    add_index :company_category_capabilities, %i[category_id capability_type]
  end
end
