class AddWhatsappButtonStyleJsonToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :whatsapp_button_style_json, :jsonb, default: {}, null: false
  end
end
