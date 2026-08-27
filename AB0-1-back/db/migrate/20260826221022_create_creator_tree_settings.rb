class CreateCreatorTreeSettings < ActiveRecord::Migration[7.0]
  def change
    create_table :creator_tree_settings do |t|
      t.references :reviewer, null: false, index: { unique: true }, foreign_key: { to_table: :reviewer_profiles }
      t.string :theme_key, default: 'solar', null: false
      t.jsonb :appearance, default: {}, null: false

      t.timestamps
    end
  end
end
