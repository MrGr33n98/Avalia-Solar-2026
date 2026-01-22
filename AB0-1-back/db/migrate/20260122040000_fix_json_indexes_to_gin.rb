class FixJsonIndexesToGin < ActiveRecord::Migration[7.0]
  def up
    # Remove índices antigos se existirem
    remove_index :companies, name: "index_companies_on_project_types_gin", if_exists: true
    remove_index :companies, name: "index_companies_on_services_offered", if_exists: true
    
    # Converter colunas JSON para JSONB (necessário para índices GIN)
    change_column :companies, :project_types, :jsonb, using: 'project_types::jsonb'
    change_column :companies, :services_offered, :jsonb, default: [], null: false, using: 'services_offered::jsonb'
    
    # Cria extensão btree_gin se não existir
    execute "CREATE EXTENSION IF NOT EXISTS btree_gin;"
    
    # Recria índices como GIN
    add_index :companies, :project_types, using: :gin, name: "index_companies_on_project_types_gin"
    add_index :companies, :services_offered, using: :gin, name: "index_companies_on_services_offered"
  end

  def down
    remove_index :companies, name: "index_companies_on_project_types_gin"
    remove_index :companies, name: "index_companies_on_services_offered"
    
    # Reverter para JSON
    change_column :companies, :project_types, :json, using: 'project_types::json'
    change_column :companies, :services_offered, :json, default: [], null: false, using: 'services_offered::json'
  end
end
