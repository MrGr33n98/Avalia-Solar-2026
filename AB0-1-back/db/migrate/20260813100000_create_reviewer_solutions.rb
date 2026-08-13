class CreateReviewerSolutions < ActiveRecord::Migration[7.0]
  def change
    create_table :reviewer_solutions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :solution_type, null: false
      t.string :category, null: false
      t.boolean :verified, null: false, default: false
      t.string :company_id
      t.timestamps
    end
    add_index :reviewer_solutions, [:user_id, :name], unique: true
    add_index :reviewer_solutions, :solution_type
  end
end
