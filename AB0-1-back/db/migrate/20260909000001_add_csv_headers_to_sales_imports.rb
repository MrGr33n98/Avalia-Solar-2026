# frozen_string_literal: true

class AddCsvHeadersToSalesImports < ActiveRecord::Migration[7.0]
  def change
    add_column :sales_imports, :csv_headers, :jsonb, default: [], null: false
  end
end
