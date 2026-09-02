class AddSolarProjectToSalesQuotes < ActiveRecord::Migration[7.0]
  def change
    add_reference :sales_quotes, :solar_project, foreign_key: { to_table: :sales_solar_projects }
  end
end
