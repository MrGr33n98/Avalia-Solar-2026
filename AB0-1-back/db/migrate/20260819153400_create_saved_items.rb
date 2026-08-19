class CreateSavedItems < ActiveRecord::Migration[7.0]
  def change
    create_table :saved_items do |t|
      t.references :user, null: false, foreign_key: true
      t.references :saveable, polymorphic: true, null: false

      t.timestamps
    end

    add_index :saved_items, [:user_id, :saveable_type, :saveable_id], unique: true, name: 'idx_saved_items_unique_user_saveable'
  end
end
