class CleanupDuplicateCompanies < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    is_pg = ActiveRecord::Base.connection.adapter_name =~ /postgre/i

    # Disable foreign key checks temporarily to clean orphaned data
    if is_pg
      execute "ALTER TABLE reviews DISABLE TRIGGER ALL" rescue nil
      execute "ALTER TABLE leads DISABLE TRIGGER ALL" rescue nil
      execute "ALTER TABLE categories_companies DISABLE TRIGGER ALL" rescue nil
    end

    # Remove orphaned records that would violate unique indexes
    begin
      # Delete reviews for duplicate companies
      execute <<-SQL
        DELETE FROM reviews
        WHERE company_id IN (
          SELECT id FROM companies
          WHERE cnpj IS NOT NULL AND id NOT IN (
            SELECT MIN(id) FROM companies GROUP BY cnpj HAVING cnpj IS NOT NULL
          )
        )
      SQL

      # Delete leads for duplicate companies
      execute <<-SQL
        DELETE FROM leads
        WHERE company_id IN (
          SELECT id FROM companies
          WHERE cnpj IS NOT NULL AND id NOT IN (
            SELECT MIN(id) FROM companies GROUP BY cnpj HAVING cnpj IS NOT NULL
          )
        )
      SQL

      # Delete categories_companies for duplicate companies
      execute <<-SQL
        DELETE FROM categories_companies
        WHERE company_id IN (
          SELECT id FROM companies
          WHERE cnpj IS NOT NULL AND id NOT IN (
            SELECT MIN(id) FROM companies GROUP BY cnpj HAVING cnpj IS NOT NULL
          )
        )
      SQL

      # Now delete duplicate companies by CNPJ
      execute <<-SQL
        DELETE FROM companies
        WHERE cnpj IS NOT NULL AND id NOT IN (
          SELECT MIN(id) FROM companies GROUP BY cnpj HAVING cnpj IS NOT NULL
        )
      SQL

      # Repeat for API keys
      execute <<-SQL
        DELETE FROM reviews
        WHERE company_id IN (
          SELECT id FROM companies
          WHERE api_key IS NOT NULL AND id NOT IN (
            SELECT MIN(id) FROM companies GROUP BY api_key HAVING api_key IS NOT NULL
          )
        )
      SQL

      execute <<-SQL
        DELETE FROM leads
        WHERE company_id IN (
          SELECT id FROM companies
          WHERE api_key IS NOT NULL AND id NOT IN (
            SELECT MIN(id) FROM companies GROUP BY api_key HAVING api_key IS NOT NULL
          )
        )
      SQL

      execute <<-SQL
        DELETE FROM categories_companies
        WHERE company_id IN (
          SELECT id FROM companies
          WHERE api_key IS NOT NULL AND id NOT IN (
            SELECT MIN(id) FROM companies GROUP BY api_key HAVING api_key IS NOT NULL
          )
        )
      SQL

      execute <<-SQL
        DELETE FROM companies
        WHERE api_key IS NOT NULL AND id NOT IN (
          SELECT MIN(id) FROM companies GROUP BY api_key HAVING api_key IS NOT NULL
        )
      SQL
    ensure
      # Re-enable triggers
      if is_pg
        execute "ALTER TABLE reviews ENABLE TRIGGER ALL" rescue nil
        execute "ALTER TABLE leads ENABLE TRIGGER ALL" rescue nil
        execute "ALTER TABLE categories_companies ENABLE TRIGGER ALL" rescue nil
      end
    end
  end
end
