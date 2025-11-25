class CreateJoinTableCompaniesCategories < ActiveRecord::Migration[7.0]
  def change
    # Check if either join table name already exists
    unless table_exists?(:categories_companies) || table_exists?(:companies_categories)
      create_join_table :companies, :categories do |t|
        t.index [:company_id, :category_id]
        t.index [:category_id, :company_id]
      end
    end
  end
end