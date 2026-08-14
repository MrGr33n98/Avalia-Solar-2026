class CreateReviewerPublicationComments < ActiveRecord::Migration[7.0]
  def change
    create_table :reviewer_publication_comments do |t|
      t.references :reviewer_publication, null: false, foreign_key: true
      t.references :user, foreign_key: true
      t.string :name, null: false
      t.string :email, null: false
      t.text :body, null: false
      t.string :status, null: false, default: 'active'
      t.timestamps
    end
  end
end
