class AddScheduleToBanners < ActiveRecord::Migration[7.0]
  def up
    add_column :banners, :start_date, :datetime unless column_exists?(:banners, :start_date)
    add_column :banners, :end_date, :datetime unless column_exists?(:banners, :end_date)
    add_index :banners, :start_date unless index_exists?(:banners, :start_date)
    add_index :banners, :end_date unless index_exists?(:banners, :end_date)
  end

  def down
    remove_index :banners, :start_date if index_exists?(:banners, :start_date)
    remove_index :banners, :end_date if index_exists?(:banners, :end_date)
    remove_column :banners, :start_date if column_exists?(:banners, :start_date)
    remove_column :banners, :end_date if column_exists?(:banners, :end_date)
  end
end