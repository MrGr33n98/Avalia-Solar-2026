class FixJsonIndexesToGin < ActiveRecord::Migration[7.0]
  def up
    # Remove índices antigos se existirem
    remove_index :companies, name: "index_companies_on_project_types_gin", if_exists: true
    remove_index :companies, name: "index_companies_on_services_offered", if_exists: true
    
    # Converter colunas para JSONB e usar índices GIN apenas no PostgreSQL
    if ActiveRecord::Base.connection.adapter_name == 'PostgreSQL'
      change_column :companies, :project_types, :jsonb, using: 'project_types::jsonb'
      change_column :companies, :services_offered, :jsonb, default: [], null: false, using: 'services_offered::jsonb'
      
      execute "CREATE EXTENSION IF NOT EXISTS btree_gin;"
      
      add_index :companies, :project_types, using: :gin, name: "index_companies_on_project_types_gin"
      add_index :companies, :services_offered, using: :gin, name: "index_companies_on_services_offered"
    else
      # No SQLite apenas garantimos que as colunas existam como string/text (comportamento padrão do Rails para JSON no SQLite)
      # Não fazemos nada especial pois SQLite não suporta JSONB/GIN nativamente desta forma
      puts "Skipping PostgreSQL-specific JSONB/GIN migration steps for SQLite"
    end
  end

  def down
    remove_index :companies, name: "index_companies_on_project_types_gin"
    remove_index :companies, name: "index_companies_on_services_offered"
    
    # Reverter para JSON
    change_column :companies, :project_types, :json, using: 'project_types::json'
    change_column :companies, :services_offered, :json, default: [], null: false, using: 'services_offered::json'
  end
end
