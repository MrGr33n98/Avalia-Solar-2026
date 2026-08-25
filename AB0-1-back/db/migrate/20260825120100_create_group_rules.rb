class CreateGroupRules < ActiveRecord::Migration[7.0]
  def change
    create_table :group_rules do |t|
      t.references :group, null: false, foreign_key: true
      t.string :title, null: false
      t.text :description, null: false
      t.integer :position, null: false, default: 0
      t.boolean :active, null: false, default: true
      t.timestamps
    end

    add_index :group_rules, %i[group_id active position]
  end
end