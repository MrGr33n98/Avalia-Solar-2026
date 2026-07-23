class CreateCompanyServiceAreas < ActiveRecord::Migration[7.0]
  def change
    create_table :company_service_areas do |t|
      t.references :company, null: false, foreign_key: { on_delete: :cascade }
      t.string :coverage_type, null: false, default: 'city'
      t.string :state_code, limit: 2
      t.string :city_name
      t.integer :radius_km
      t.boolean :is_active, null: false, default: true

      t.timestamps
    end

    add_index :company_service_areas, [:state_code, :city_name, :is_active], name: 'idx_company_service_areas_lookup'
    add_index :company_service_areas, :coverage_type
  end
end
