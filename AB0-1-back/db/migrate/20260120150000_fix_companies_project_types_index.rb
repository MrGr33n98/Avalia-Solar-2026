class FixCompaniesProjectTypesIndex < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    sqlite? ? up_sqlite : up_postgres
  end

  def down
    sqlite? ? down_sqlite : down_postgres
  end

  private

  def sqlite?
    adapter = connection.adapter_name.to_s.downcase
    adapter.include?("sqlite")
  end

  # -------------------------
  # SQLITE
  # -------------------------
  def up_sqlite
    # SQLite não suporta jsonb nem índice GIN.
    # Aqui o objetivo é evitar conflitos e deixar o schema consistente.
    remove_index_if_exists(:companies, name: "index_companies_on_project_types")
    remove_index_if_exists(:companies, name: "index_companies_on_services_offered")
  end

  def down_sqlite
    # Recria índices "simples" (o que existia antes)
    add_index_if_missing(:companies, :project_types, name: "index_companies_on_project_types")
    add_index_if_missing(:companies, :services_offered, name: "index_companies_on_services_offered")
  end

  # -------------------------
  # POSTGRES
  # -------------------------
  def up_postgres
    # 1) project_types
    remove_index_if_exists(:companies, name: "index_companies_on_project_types")

    if column_exists?(:companies, :project_types)
      # Converte para jsonb (se já for jsonb, o Postgres pode aceitar ou reclamar dependendo do tipo atual)
      execute <<~SQL
        ALTER TABLE companies
        ALTER COLUMN project_types
        TYPE jsonb
        USING project_types::jsonb
      SQL
    end

    add_gin_index_if_missing(:companies, :project_types, "index_companies_on_project_types_gin")

    # 2) services_offered
    remove_index_if_exists(:companies, name: "index_companies_on_services_offered")

    if column_exists?(:companies, :services_offered)
      execute <<~SQL
        ALTER TABLE companies
        ALTER COLUMN services_offered
        TYPE jsonb
        USING services_offered::jsonb
      SQL
    end

    add_gin_index_if_missing(:companies, :services_offered, "index_companies_on_services_offered_gin")
  end

  def down_postgres
    # Reverte services_offered
    remove_index_if_exists(:companies, name: "index_companies_on_services_offered_gin")

    if column_exists?(:companies, :services_offered)
      execute <<~SQL
        ALTER TABLE companies
        ALTER COLUMN services_offered
        TYPE json
        USING services_offered::json
      SQL
    end

    add_index_if_missing(:companies, :services_offered, name: "index_companies_on_services_offered")

    # Reverte project_types
    remove_index_if_exists(:companies, name: "index_companies_on_project_types_gin")

    if column_exists?(:companies, :project_types)
      execute <<~SQL
        ALTER TABLE companies
        ALTER COLUMN project_types
        TYPE json
        USING project_types::json
      SQL
    end

    add_index_if_missing(:companies, :project_types, name: "index_companies_on_project_types")
  end

  # -------------------------
  # HELPERS
  # -------------------------
  def remove_index_if_exists(table, name:)
    return unless index_exists?(table, nil, name: name)
    remove_index table, name: name
  end

  def add_index_if_missing(table, column, name:)
    return if index_exists?(table, column, name: name)
    add_index table, column, name: name
  end

  def add_gin_index_if_missing(table, column, name)
    return if index_exists?(table, column, name: name)
    add_index table, column, using: :gin, name: name, algorithm: :concurrently
  end
end
