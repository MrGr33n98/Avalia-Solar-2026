class AddWhatsappEnabledToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :whatsapp_enabled, :boolean
  end
end
