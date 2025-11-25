class AddStatusConstraintsToCompaniesAndProducts < ActiveRecord::Migration[7.0]
  def up
    # Companies allowed statuses
    add_company_status_constraint unless constraint_exists?(:companies, 'companies_status_allowed')
    add_product_status_constraint unless constraint_exists?(:products, 'products_status_allowed')

    # Add indexes for status filtering if not present
    add_index :companies, :status unless index_exists?(:companies, :status)
    add_index :products, :status unless index_exists?(:products, :status)
  end

  def down
    if constraint_exists?(:companies, 'companies_status_allowed')
      execute "ALTER TABLE companies DROP CONSTRAINT companies_status_allowed"
    end
    if constraint_exists?(:products, 'products_status_allowed')
      execute "ALTER TABLE products DROP CONSTRAINT products_status_allowed"
    end
    remove_index :companies, :status if index_exists?(:companies, :status)
    remove_index :products, :status if index_exists?(:products, :status)
  end

  private

  def add_company_status_constraint
    execute <<~SQL
      ALTER TABLE companies
      ADD CONSTRAINT companies_status_allowed
      CHECK (status IN ('active','inactive','pending','blocked'))
    SQL
  end

  def add_product_status_constraint
    execute <<~SQL
      ALTER TABLE products
      ADD CONSTRAINT products_status_allowed
      CHECK (status IS NULL OR status IN ('draft','active','archived','disabled'))
    SQL
  end

  def constraint_exists?(table, name)
    query = <<~SQL
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name='#{table}' AND constraint_name='#{name}'
    SQL
    result = execute(query) rescue []
    result.any?
  end
end
