class CreateUserInterests < ActiveRecord::Migration[7.0]
  def change
    create_table :user_interests do |t|
      t.references :user, null: false, foreign_key: true
      t.string :entity_type, null: false
      t.bigint :entity_id, null: false
      t.decimal :score, null: false, default: 0, precision: 12, scale: 4
      t.datetime :last_interaction_at, null: false
      t.timestamps
    end

    add_index :user_interests, %i[user_id entity_type entity_id], unique: true
    add_index :user_interests, %i[entity_type entity_id]
  end
end
