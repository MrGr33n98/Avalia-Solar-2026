class CreateCompaniesCategoriesManually < ActiveRecord::Migration[7.0]
  def up
    # Check if join table already exists
    unless table_exists?(:categories_companies) || table_exists?(:companies_categories)
      create_table :categories_companies, id: false do |t|
        t.belongs_to :category, null: false
        t.belongs_to :company, null: false
        t.index [:category_id, :company_id]
        t.index [:company_id, :category_id]
      end
    end
  end

  def down
    # Only drop table if it exists and has our specific name
    if table_exists?(:categories_companies)
      drop_table :categories_companies
    end
  end
end