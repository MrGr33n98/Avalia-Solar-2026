# frozen_string_literal: true

class ReconcileSalesContactImportUniqueness < ActiveRecord::Migration[7.0]
  INDEX_NAME = 'index_sales_contacts_on_account_and_normalized_email'

  disable_ddl_transaction!

  def up
    return if index_is_valid?

    execute "DROP INDEX CONCURRENTLY IF EXISTS #{INDEX_NAME}"
    reject_duplicate_contacts!

    execute <<~SQL
      CREATE UNIQUE INDEX CONCURRENTLY #{INDEX_NAME}
      ON sales_contacts (sales_account_id, LOWER(email))
      WHERE email IS NOT NULL AND BTRIM(email) <> ''
    SQL
  end

  def down
    execute "DROP INDEX CONCURRENTLY IF EXISTS #{INDEX_NAME}"
  end

  private

  def index_is_valid?
    select_value(<<~SQL).in?([true, 't'])
      SELECT index_data.indisvalid
      FROM pg_class AS index_class
      JOIN pg_index AS index_data ON index_data.indexrelid = index_class.oid
      WHERE index_class.relname = '#{INDEX_NAME}'
    SQL
  end

  def reject_duplicate_contacts!
    duplicate_groups = select_value(<<~SQL).to_i
      SELECT COUNT(*)
      FROM (
        SELECT sales_account_id, LOWER(email)
        FROM sales_contacts
        WHERE email IS NOT NULL AND BTRIM(email) <> ''
        GROUP BY sales_account_id, LOWER(email)
        HAVING COUNT(*) > 1
      ) AS duplicate_contacts
    SQL

    return if duplicate_groups.zero?

    raise ActiveRecord::MigrationError,
          "#{duplicate_groups} grupos duplicados impedem criar #{INDEX_NAME}; revisar antes da migration."
  end
end
