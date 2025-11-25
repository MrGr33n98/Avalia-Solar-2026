class AddBannerTypeAndPositionToBanners < ActiveRecord::Migration[7.0]
  def change
    add_column :banners, :banner_type, :string
    add_column :banners, :position, :string
  end
end
