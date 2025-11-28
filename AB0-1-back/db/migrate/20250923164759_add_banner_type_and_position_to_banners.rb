class AddBannerTypeAndPositionToBanners < ActiveRecord::Migration[7.0]
  def change
    return unless table_exists?(:banners)
    unless column_exists?(:banners, :banner_type)
      add_column :banners, :banner_type, :string
    end
    unless column_exists?(:banners, :position)
      add_column :banners, :position, :string
    end
  end
end
