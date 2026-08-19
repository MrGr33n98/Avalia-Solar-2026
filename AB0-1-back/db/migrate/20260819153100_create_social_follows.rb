class CreateSocialFollows < ActiveRecord::Migration[7.0]
  def change
    create_table :social_follows do |t|
      t.references :follower, null: false, foreign_key: { to_table: :users }
      t.references :followable, polymorphic: true, null: false

      t.timestamps
    end

    add_index :social_follows, [:follower_id, :followable_type, :followable_id], unique: true, name: 'idx_social_follows_unique'
  end
end
