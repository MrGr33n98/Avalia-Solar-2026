class AddWhatsappEnabledToCompanies < ActiveRecord::Migration[7.0]
  def change
    return unless table_exists?(:companies)
    unless column_exists?(:companies, :whatsapp_enabled)
      add_column :companies, :whatsapp_enabled, :boolean
    end
  end
end
