class CreateCreatorTreeBlocks < ActiveRecord::Migration[7.0]
  def change
    create_table :creator_tree_blocks do |t|
      t.references :reviewer, null: false, foreign_key: { to_table: :reviewer_profiles }
      t.references :company, foreign_key: true
      t.references :publication, foreign_key: { to_table: :reviewer_publications }
      t.string :block_type, null: false
      t.string :title, null: false
      t.string :subtitle
      t.string :url
      t.integer :position, null: false, default: 0
      t.boolean :active, null: false, default: true
      t.jsonb :metadata, null: false, default: {}
      t.integer :clicks_count, null: false, default: 0
      t.timestamps
    end

    add_index :creator_tree_blocks, %i[reviewer_id position]
    add_index :creator_tree_blocks, %i[reviewer_id active]
    add_index :creator_tree_blocks, :block_type
  end
end