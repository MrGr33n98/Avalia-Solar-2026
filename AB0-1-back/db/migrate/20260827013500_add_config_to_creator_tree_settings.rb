class AddConfigToCreatorTreeSettings < ActiveRecord::Migration[7.0]
  def change
    add_column :creator_tree_settings, :config, :jsonb, default: {}, null: false
  end
end
