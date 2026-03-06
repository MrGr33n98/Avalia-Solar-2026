class AddMediaAuditIndexesToLeads < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    if postgresql?
      add_index :leads, :utm_source, algorithm: :concurrently, if_not_exists: true
      add_index :leads, :utm_campaign, algorithm: :concurrently, if_not_exists: true
      add_index :leads, [:company_id, :utm_campaign], algorithm: :concurrently, if_not_exists: true
    else
      add_index :leads, :utm_source, if_not_exists: true
      add_index :leads, :utm_campaign, if_not_exists: true
      add_index :leads, [:company_id, :utm_campaign], if_not_exists: true
    end
  end

  def down
    remove_index :leads, :utm_source if index_exists?(:leads, :utm_source)
    remove_index :leads, :utm_campaign if index_exists?(:leads, :utm_campaign)
    remove_index :leads, column: [:company_id, :utm_campaign] if index_exists?(:leads, [:company_id, :utm_campaign])
  end

  private

  def postgresql?
    connection.adapter_name.downcase.include?('postgre')
  end
end
