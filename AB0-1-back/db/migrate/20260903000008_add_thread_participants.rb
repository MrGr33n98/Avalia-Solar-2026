class AddThreadParticipants < ActiveRecord::Migration[7.0]
  def change
    add_reference :sales_email_threads, :sales_account, foreign_key: { to_table: :sales_accounts }, unless: column_exists?(:sales_email_threads, :sales_account_id)
    add_reference :sales_email_threads, :sales_contact, foreign_key: { to_table: :sales_contacts }, unless: column_exists?(:sales_email_threads, :sales_contact_id)
    add_index :sales_email_threads, [:company_id, :sales_account_id, :sales_contact_id], name: 'idx_email_threads_tenant_account_contact', if_not_exists: true
  end
end
