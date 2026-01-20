class AddProjectTypesAndServicesToCompanies < ActiveRecord::Migration[7.0]
  def up
    if table_exists?(:companies)
      unless column_exists?(:companies, :project_types)
        add_column :companies, :project_types, :jsonb, default: [], null: false
      end
      unless column_exists?(:companies, :services_offered)
        add_column :companies, :services_offered, :jsonb, default: [], null: false
      end
      unless index_exists?(:companies, :project_types, name: 'index_companies_on_project_types_gin')
        add_index :companies, :project_types, using: :gin, name: 'index_companies_on_project_types_gin'
      end
      unless index_exists?(:companies, :services_offered, name: 'index_companies_on_services_offered_gin')
        add_index :companies, :services_offered, using: :gin, name: 'index_companies_on_services_offered_gin'
      end
    end
  end

  def down
    if table_exists?(:companies)
      if index_exists?(:companies, :project_types)
        remove_index :companies, :project_types
      end
      if index_exists?(:companies, :services_offered)
        remove_index :companies, :services_offered
      end
      if column_exists?(:companies, :project_types)
        remove_column :companies, :project_types
      end
      if column_exists?(:companies, :services_offered)
        remove_column :companies, :services_offered
      end
    end
  end
end
