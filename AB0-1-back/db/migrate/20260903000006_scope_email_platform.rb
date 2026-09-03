class ScopeEmailPlatform < ActiveRecord::Migration[7.0]
  def change
    add_reference :sales_email_messages, :company, foreign_key: true unless column_exists?(:sales_email_messages, :company_id)
    add_index :sales_email_messages, :company_id unless index_exists?(:sales_email_messages, :company_id)

    %i[sales_email_accounts sales_email_threads sales_email_templates sales_email_signatures sales_email_participants sales_email_attachments sales_email_events].each do |table|
      add_reference table, :company, foreign_key: true unless column_exists?(table, :company_id)
      add_index table, :company_id unless index_exists?(table, :company_id)
    end

    add_index :sales_email_accounts, %i[company_id provider email], unique: true, name: 'idx_email_accounts_company_provider_email' unless index_exists?(:sales_email_accounts, %i[company_id provider email], name: 'idx_email_accounts_company_provider_email')
    remove_index :sales_email_threads, :provider_thread_id if index_exists?(:sales_email_threads, :provider_thread_id)
    add_index :sales_email_threads, %i[company_id provider_thread_id], unique: true, name: 'idx_email_threads_company_provider_id' unless index_exists?(:sales_email_threads, %i[company_id provider_thread_id], name: 'idx_email_threads_company_provider_id')
  end
end
