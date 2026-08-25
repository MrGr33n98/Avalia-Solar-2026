class CreateGroupTopics < ActiveRecord::Migration[7.0]
  def change
    create_table :group_topics do |t|
      t.references :group, null: false, foreign_key: true
      t.string :name, null: false
      t.string :slug, null: false
      t.text :description
      t.integer :position, null: false, default: 0
      t.boolean :active, null: false, default: true
      t.integer :posts_count, null: false, default: 0
      t.timestamps
    end

    add_index :group_topics, %i[group_id slug], unique: true
    add_index :group_topics, %i[group_id active position]
  end
end