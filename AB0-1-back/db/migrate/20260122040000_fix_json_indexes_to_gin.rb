class FixJsonIndexesToGin < ActiveRecord::Migration[7.0]
  def up
    # Remove índices btree antigos se existirem
    remove_index :companies, name: "index_companies_on_project_types_gin", if_exists: true
    remove_index :companies, name: "index_companies_on_services_offered", if_exists: true
    
    # Cria extensão btree_gin se não existir
    execute "CREATE EXTENSION IF NOT EXISTS btree_gin;"
    
    # Recria índices como GIN
    add_index :companies, :project_types, using: :gin, name: "index_companies_on_project_types_gin"
    add_index :companies, :services_offered, using: :gin, name: "index_companies_on_services_offered"
  end

  def down
    remove_index :companies, name: "index_companies_on_project_types_gin"
    remove_index :companies, name: "index_companies_on_services_offered"
    
    # Recria como btree (causará erro, mas é reversível)
    add_index :companies, :project_types, name: "index_companies_on_project_types_gin"
    add_index :companies, :services_offered, name: "index_companies_on_services_offered"
  end
end
