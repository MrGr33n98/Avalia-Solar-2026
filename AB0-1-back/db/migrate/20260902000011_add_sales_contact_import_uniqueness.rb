class AddSalesContactImportUniqueness < ActiveRecord::Migration[7.0]
  def up
    execute <<~SQL
      CREATE UNIQUE INDEX index_sales_contacts_on_account_and_normalized_email
      ON sales_contacts (sales_account_id, LOWER(email))
      WHERE email IS NOT NULL AND BTRIM(email) <> ''
    SQL
  end

  def down
    remove_index :sales_contacts, name: :index_sales_contacts_on_account_and_normalized_email
  end
end
