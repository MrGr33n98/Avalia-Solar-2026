class FixCompaniesProjectTypesIndex < ActiveRecord::Migration[7.0]
  def up
    # Verifica se o índice antigo existe antes de remover
    if index_exists?(:companies, :project_types, name: 'index_companies_on_project_types')
      remove_index :companies, name: 'index_companies_on_project_types'
    end

    # Altera o tipo da coluna se necessário (json para jsonb)
    if column_exists?(:companies, :project_types)
      # Postgres requires an explicit USING clause to convert json -> jsonb
      change_column :companies, :project_types, :jsonb, using: 'project_types::jsonb'
    end

    # Cria novo índice GIN
    unless index_exists?(:companies, :project_types, name: 'index_companies_on_project_types_gin')
      add_index :companies, :project_types, using: :gin, name: 'index_companies_on_project_types_gin'
    end
  end

  def down
    # Remove novo índice
    if index_exists?(:companies, :project_types, name: 'index_companies_on_project_types_gin')
      remove_index :companies, name: 'index_companies_on_project_types_gin'
    end

    # Reverte para o tipo original se necessário
    if column_exists?(:companies, :project_types)
      change_column :companies, :project_types, :json, using: 'project_types::json'
    end

    # Recria índice antigo (pode falhar se for B-tree em JSON, mas mantém simetria)
    unless index_exists?(:companies, :project_types, name: 'index_companies_on_project_types')
      add_index :companies, :project_types, name: 'index_companies_on_project_types'
    end
  end
end
