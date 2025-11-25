class AddCategoryIdAndSponsoredToBanners < ActiveRecord::Migration[7.0]
  def change
    add_reference :banners, :category, null: true, foreign_key: true
    add_column :banners, :sponsored, :boolean, default: false
  end
end
