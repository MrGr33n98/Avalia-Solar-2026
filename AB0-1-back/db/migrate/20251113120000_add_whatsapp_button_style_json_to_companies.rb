class AddWhatsappButtonStyleJsonToCompanies < ActiveRecord::Migration[7.0]
  def change
    return unless table_exists?(:companies)
    unless column_exists?(:companies, :whatsapp_button_style_json)
      if ActiveRecord::Base.connection.adapter_name =~ /PostgreSQL/i
        add_column :companies, :whatsapp_button_style_json, :jsonb, default: {}, null: false
      else
        add_column :companies, :whatsapp_button_style_json, :json, default: {}, null: false
      end
    end
  end
end
