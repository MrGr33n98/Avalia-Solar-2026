class ForceJsonbGinIndexes < ActiveRecord::Migration[7.0]
  def up
    # Normalize project_types to jsonb with GIN index
    if column_exists?(:companies, :project_types)
      change_column :companies, :project_types, :jsonb, using: 'project_types::jsonb'
    end

    execute 'DROP INDEX IF EXISTS index_companies_on_project_types'
    execute 'DROP INDEX IF EXISTS index_companies_on_project_types_gin'
    execute 'CREATE INDEX index_companies_on_project_types_gin ON companies USING gin (project_types)'

    # Normalize services_offered to jsonb with GIN index
    if column_exists?(:companies, :services_offered)
      change_column :companies, :services_offered, :jsonb, using: 'services_offered::jsonb'
    end

    execute 'DROP INDEX IF EXISTS index_companies_on_services_offered'
    execute 'DROP INDEX IF EXISTS index_companies_on_services_offered_gin'
    execute 'CREATE INDEX index_companies_on_services_offered_gin ON companies USING gin (services_offered)'
  end

  def down
    execute 'DROP INDEX IF EXISTS index_companies_on_project_types_gin'
    execute 'DROP INDEX IF EXISTS index_companies_on_services_offered_gin'
    add_index :companies, :project_types unless index_exists?(:companies, :project_types)
    add_index :companies, :services_offered unless index_exists?(:companies, :services_offered)
  end
end
