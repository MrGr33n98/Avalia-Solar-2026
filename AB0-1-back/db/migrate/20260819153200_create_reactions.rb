class CreateReactions < ActiveRecord::Migration[7.0]
  def change
    create_table :reactions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :reactable, polymorphic: true, null: false
      t.string :reaction_type, null: false, default: 'useful'

      t.timestamps
    end

    add_index :reactions, [:user_id, :reactable_type, :reactable_id], unique: true, name: 'idx_reactions_unique_user_reactable'
    add_index :reactions, :reaction_type
  end
end
