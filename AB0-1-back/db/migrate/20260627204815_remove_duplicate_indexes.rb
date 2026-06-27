class RemoveDuplicateIndexes < ActiveRecord::Migration[7.0]
  def change
    remove_index :banners_categories, name: 'idx_banners_categories_unique', if_exists: true
    remove_index :companies, name: 'index_companies_on_services_offered_gin', if_exists: true
  end
end
