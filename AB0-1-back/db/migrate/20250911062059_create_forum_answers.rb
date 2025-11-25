class CreateForumAnswers < ActiveRecord::Migration[7.0]
  def change
    create_table :forum_answers do |t|
      t.references :user, null: false, foreign_key: true
      t.references :forum_question, null: false, foreign_key: true
      t.text :answer
      t.string :status
      t.datetime :requested_at

      t.timestamps
    end
  end
end
