# frozen_string_literal: true

class AddSettingsToSalesEmailSignatures < ActiveRecord::Migration[7.0]
  def change
    unless column_exists?(:sales_email_signatures, :settings)
      add_column :sales_email_signatures, :settings, :jsonb, default: {}, null: false
    end
  end
end

