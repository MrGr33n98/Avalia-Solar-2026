class AddWhatsappUrlToCompanies < ActiveRecord::Migration[7.0]
  def change
    return unless table_exists?(:companies)
    unless column_exists?(:companies, :whatsapp_url)
      add_column :companies, :whatsapp_url, :string
    end
  end
end
