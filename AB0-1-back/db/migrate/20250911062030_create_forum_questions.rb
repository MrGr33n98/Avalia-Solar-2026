class CreateForumQuestions < ActiveRecord::Migration[7.0]
  def change
    create_table :forum_questions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.references :category, null: false, foreign_key: true
      t.string :subject
      t.text :description
      t.string :status
      t.datetime :requested_at

      t.timestamps
    end
  end
end
