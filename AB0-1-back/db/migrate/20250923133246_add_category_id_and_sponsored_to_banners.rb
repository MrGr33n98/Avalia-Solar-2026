class AddCategoryIdAndSponsoredToBanners < ActiveRecord::Migration[7.0]
  def change
    return unless table_exists?(:banners)
    if table_exists?(:categories)
      unless column_exists?(:banners, :category_id)
        add_reference :banners, :category, null: true, foreign_key: true
      end
    end
    unless column_exists?(:banners, :sponsored)
      add_column :banners, :sponsored, :boolean, default: false
    end
  end
end
