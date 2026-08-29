class CreatePolls < ActiveRecord::Migration[7.0]
  def change
    create_table :polls do |t|
      t.string :question, null: false
      t.datetime :ends_at
      t.timestamps
    end
    create_table :poll_options do |t|
      t.references :poll, null: false, foreign_key: true
      t.string :label, null: false
      t.integer :votes_count, null: false, default: 0
      t.timestamps
    end
    create_table :poll_votes do |t|
      t.references :poll, null: false, foreign_key: true
      t.references :poll_option, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.timestamps
    end
    add_index :poll_votes, %i[poll_id user_id], unique: true
  end
end
