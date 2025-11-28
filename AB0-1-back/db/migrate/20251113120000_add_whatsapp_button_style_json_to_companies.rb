class AddWhatsappButtonStyleJsonToCompanies < ActiveRecord::Migration[7.0]
  def change
    return unless table_exists?(:companies)
    unless column_exists?(:companies, :whatsapp_button_style_json)
      add_column :companies, :whatsapp_button_style_json, :jsonb, default: {}, null: false
    end
  end
end
