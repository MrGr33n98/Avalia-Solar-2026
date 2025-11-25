class AddScheduleToBanners < ActiveRecord::Migration[7.0]
  def change
    add_column :banners, :start_date, :datetime
    add_column :banners, :end_date, :datetime
    add_index :banners, :start_date
    add_index :banners, :end_date
  end
end
