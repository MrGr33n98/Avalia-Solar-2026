class AddMarketplaceFieldsToLeads < ActiveRecord::Migration[7.0]
  def change
    add_column :leads, :idempotency_key, :string unless column_exists?(:leads, :idempotency_key)
    add_column :leads, :lead_wizard_version_id, :bigint unless column_exists?(:leads, :lead_wizard_version_id)

    add_index :leads, :idempotency_key, unique: true, where: 'idempotency_key IS NOT NULL',
              name: 'index_leads_on_idempotency_key' unless index_exists?(:leads, :idempotency_key, name: 'index_leads_on_idempotency_key')
    add_index :leads, :lead_wizard_version_id unless index_exists?(:leads, :lead_wizard_version_id)
    add_foreign_key :leads, :lead_wizard_versions if table_exists?(:lead_wizard_versions) && !foreign_key_exists?(:leads, :lead_wizard_versions)
  end
end
