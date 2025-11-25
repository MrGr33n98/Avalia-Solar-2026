class AddWhatsappCtaFieldsToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :cta_whatsapp_enabled, :boolean, default: false, null: false
    add_column :companies, :cta_whatsapp_url, :string
    add_index :companies, :cta_whatsapp_enabled
  end
end
