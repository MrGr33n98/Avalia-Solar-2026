class AllowNullCnpjOnCompanies < ActiveRecord::Migration[7.0]
  def up
    return unless column_exists?(:companies, :cnpj)

    change_column_null :companies, :cnpj, true
  end

  def down
    # Intentionally no-op: reintroducing NOT NULL would fail for rows
    # created without CNPJ after this migration.
  end
end
