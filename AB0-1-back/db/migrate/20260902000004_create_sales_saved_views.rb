class CreateSalesSavedViews < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_saved_views do |t|
      t.references :user, foreign_key: true
      t.string :name, null: false
      t.string :resource_type, null: false, default: 'account'
      t.jsonb :filters, null: false, default: {}
      t.jsonb :sort, null: false, default: {}
      t.jsonb :columns, null: false, default: []
      t.boolean :is_default, null: false, default: false
      t.boolean :is_shared, null: false, default: false
      t.timestamps
    end

    add_index :sales_saved_views, %i[user_id resource_type], name: 'idx_sales_saved_views_user_resource'
  end
end
