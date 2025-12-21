class AddWizardFieldsToLeads < ActiveRecord::Migration[7.0]
  def change
    add_column :leads, :product_vertical, :string
    add_column :leads, :project_profile, :string
    add_column :leads, :quote_type, :string
    add_column :leads, :system_size_band, :string
    add_column :leads, :bill_value, :decimal, precision: 15, scale: 2
    add_column :leads, :monthly_kwh, :decimal, precision: 15, scale: 2
    add_column :leads, :decision_timeline, :string
    add_column :leads, :address_full, :string
    add_column :leads, :city, :string
    add_column :leads, :state, :string
    add_column :leads, :zipcode, :string
    add_column :leads, :consent_at, :datetime
    add_column :leads, :consent_ip, :string
    add_column :leads, :otp_sent_at, :datetime
    add_column :leads, :otp_verified_at, :datetime
    add_column :leads, :otp_code_digest, :string
    add_column :leads, :otp_attempts, :integer, default: 0
    add_column :leads, :wizard_status, :string, default: 'draft'
  end
end
