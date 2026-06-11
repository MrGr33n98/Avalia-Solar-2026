class AddTargetLocationsToBanners < ActiveRecord::Migration[7.0]
  def change
    add_column :banners, :target_states, :string, array: true, default: []
    add_column :banners, :target_cities, :string, array: true, default: []
  end
end
