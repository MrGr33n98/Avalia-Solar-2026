class CreateReviewVotes < ActiveRecord::Migration[7.0]
  def change
    create_table :review_votes do |t|
      t.references :user, null: false, foreign_key: true
      t.references :review, null: false, foreign_key: true
      t.string :vote_type

      t.timestamps
    end

    add_index :review_votes, [:user_id, :review_id], unique: true
  end
end
