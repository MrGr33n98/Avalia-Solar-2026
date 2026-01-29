class AddPermissionsConfigToCategories < ActiveRecord::Migration[7.0]
  def change
    add_column :categories, :permissions_config, :json
  end
end
