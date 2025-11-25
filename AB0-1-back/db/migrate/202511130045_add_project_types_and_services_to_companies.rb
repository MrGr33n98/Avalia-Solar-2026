class AddProjectTypesAndServicesToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :project_types, :jsonb, default: [], null: false
    add_column :companies, :services_offered, :jsonb, default: [], null: false
    add_index :companies, :project_types, using: :gin
    add_index :companies, :services_offered, using: :gin
  end
end
