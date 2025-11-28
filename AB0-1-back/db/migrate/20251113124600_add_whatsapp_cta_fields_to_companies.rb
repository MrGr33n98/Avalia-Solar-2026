class AddWhatsappCtaFieldsToCompanies < ActiveRecord::Migration[7.0]
  def change
    return unless table_exists?(:companies)
    unless column_exists?(:companies, :cta_whatsapp_enabled)
      add_column :companies, :cta_whatsapp_enabled, :boolean, default: false, null: false
    end
    unless column_exists?(:companies, :cta_whatsapp_url)
      add_column :companies, :cta_whatsapp_url, :string
    end
    unless index_exists?(:companies, :cta_whatsapp_enabled)
      add_index :companies, :cta_whatsapp_enabled
    end
  end
end
