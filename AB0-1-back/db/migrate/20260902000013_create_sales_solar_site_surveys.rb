class CreateSalesSolarSiteSurveys < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_solar_site_surveys do |t|
      t.references :solar_project, null: false, foreign_key: { to_table: :sales_solar_projects }
      t.references :inspector, foreign_key: { to_table: :users }
      t.string :status, null: false, default: 'draft'
      t.datetime :visited_at
      t.decimal :roof_area_m2, precision: 12, scale: 2
      t.decimal :roof_pitch_degrees, precision: 6, scale: 2
      t.string :roof_material
      t.string :shading_level
      t.string :connection_voltage
      t.text :observations
      t.jsonb :photos, null: false, default: []
      t.timestamps
    end
    add_index :sales_solar_site_surveys, %i[solar_project_id status]
  end
end
