class AddSavedViewPinning < ActiveRecord::Migration[7.0]
  def change
    add_column :sales_saved_views, :is_pinned, :boolean, null: false, default: false
    add_column :sales_saved_views, :position, :integer, null: false, default: 0
    add_index :sales_saved_views, %i[user_id resource_type is_pinned position], name: 'idx_sales_saved_views_navigation'
  end
end
