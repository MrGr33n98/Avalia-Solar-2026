# frozen_string_literal: true

class EnhanceSalesEmailTemplates < ActiveRecord::Migration[7.0]
  def change
    change_table :sales_email_templates, bulk: true do |t|
      t.string :preheader
      t.string :status, default: 'active', null: false
      t.integer :schema_version, default: 1, null: false
    end

    add_index :sales_email_templates, [:company_id, :updated_at]
    add_index :sales_email_templates, [:company_id, :status]
    add_index :sales_email_templates, [:company_id, :category]
  end
end
