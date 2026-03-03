class CreateReviewCriterionScores < ActiveRecord::Migration[7.0]
  def change
    create_table :review_criterion_scores do |t|
      t.references :review, null: false, foreign_key: true
      t.references :rating_criterion, null: false, foreign_key: true
      t.decimal :score, precision: 2, scale: 1
      t.boolean :not_applicable, default: false

      t.timestamps
    end

    add_index :review_criterion_scores, [:review_id, :rating_criterion_id], unique: true, name: 'idx_review_criterion_unique'
    add_check_constraint :review_criterion_scores, "score >= 1 AND score <= 5", name: "ck_review_criterion_valid_score"
  end
end
