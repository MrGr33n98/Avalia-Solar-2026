class FixCompaniesProjectTypesIndex < ActiveRecord::Migration[7.0]
  def up
    # 1. Corrigir project_types
    # Remover índices antigos se existirem
    if index_exists?(:companies, :project_types, name: 'index_companies_on_project_types')
      remove_index :companies, name: 'index_companies_on_project_types'
    end

    # Garantir que a coluna seja jsonb
    if column_exists?(:companies, :project_types)
      # Usar SQL direto para garantir conversão correta
      execute 'ALTER TABLE companies ALTER COLUMN project_types TYPE jsonb USING project_types::jsonb'
    end

    # Criar índice GIN se não existir
    unless index_exists?(:companies, :project_types, name: 'index_companies_on_project_types_gin')
      add_index :companies, :project_types, using: :gin, name: 'index_companies_on_project_types_gin'
    end

    # 2. Corrigir services_offered
    if index_exists?(:companies, :services_offered, name: 'index_companies_on_services_offered')
      remove_index :companies, name: 'index_companies_on_services_offered'
    end

    if column_exists?(:companies, :services_offered)
      execute 'ALTER TABLE companies ALTER COLUMN services_offered TYPE jsonb USING services_offered::jsonb'
    end

    unless index_exists?(:companies, :services_offered, name: 'index_companies_on_services_offered_gin')
      add_index :companies, :services_offered, using: :gin, name: 'index_companies_on_services_offered_gin'
    end
  end

  def down
    # Reverter services_offered
    if index_exists?(:companies, :services_offered, name: 'index_companies_on_services_offered_gin')
      remove_index :companies, name: 'index_companies_on_services_offered_gin'
    end

    if column_exists?(:companies, :services_offered)
      change_column :companies, :services_offered, :json, using: 'services_offered::json'
    end

    unless index_exists?(:companies, :services_offered, name: 'index_companies_on_services_offered')
      add_index :companies, :services_offered, name: 'index_companies_on_services_offered'
    end

    # Reverter project_types
    if index_exists?(:companies, :project_types, name: 'index_companies_on_project_types_gin')
      remove_index :companies, name: 'index_companies_on_project_types_gin'
    end

    if column_exists?(:companies, :project_types)
      change_column :companies, :project_types, :json, using: 'project_types::json'
    end

    unless index_exists?(:companies, :project_types, name: 'index_companies_on_project_types')
      add_index :companies, :project_types, name: 'index_companies_on_project_types'
    end
  end
end
