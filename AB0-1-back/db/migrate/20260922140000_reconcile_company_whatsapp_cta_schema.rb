# frozen_string_literal: true

# Reconciles a production schema drift where the original WhatsApp CTA
# migrations were marked as applied although their columns were absent.
class ReconcileCompanyWhatsappCtaSchema < ActiveRecord::Migration[7.0]
  def up
    return unless table_exists?(:companies)

    unless column_exists?(:companies, :cta_whatsapp_enabled)
      add_column :companies, :cta_whatsapp_enabled, :boolean, default: false, null: false
    end
    add_column :companies, :cta_whatsapp_url, :string unless column_exists?(:companies, :cta_whatsapp_url)

    unless column_exists?(:companies, :whatsapp_button_style_json)
      json_type = ActiveRecord::Base.connection.adapter_name =~ /postgre/i ? :jsonb : :json
      add_column :companies, :whatsapp_button_style_json, json_type, default: {}, null: false
    end

    add_index :companies, :cta_whatsapp_enabled unless index_exists?(:companies, :cta_whatsapp_enabled)
  end

  def down
    raise ActiveRecord::IrreversibleMigration,
          'A reconciliação de schema não deve remover colunas potencialmente usadas em produção.'
  end
end
