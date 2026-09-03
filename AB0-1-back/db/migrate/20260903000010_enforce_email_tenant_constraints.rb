class EnforceEmailTenantConstraints < ActiveRecord::Migration[7.0]
  EMAIL_TABLES = %i[sales_email_accounts sales_email_threads sales_email_messages sales_email_templates sales_email_signatures sales_email_participants sales_email_attachments sales_email_events].freeze

  def up
    EMAIL_TABLES.each do |table|
      next unless table_exists?(table) && column_exists?(table, :company_id)

      change_column_null table, :company_id, false
      add_foreign_key table, :companies, column: :company_id unless foreign_key_exists?(table, :companies, column: :company_id)
    end
  end

  def down
    EMAIL_TABLES.each do |table|
      remove_foreign_key table, column: :company_id if foreign_key_exists?(table, :companies, column: :company_id)
      change_column_null table, :company_id, true if table_exists?(table) && column_exists?(table, :company_id)
    end
  end
end
