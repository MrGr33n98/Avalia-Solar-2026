class CompleteSolarReviewsV2 < ActiveRecord::Migration[7.0]
  def change
    # 1. Expand Reviews table with Phase 2 requirements
    change_table :reviews, bulk: true do |t|
      t.references :category, foreign_key: true, index: true
      t.text :pros
      t.text :cons
      t.text :buyer_tip
      t.jsonb :project_context, default: {}, null: false
      t.jsonb :granular_scores_snapshot, default: {}, null: false
    end

    add_index :reviews, :project_context, using: :gin
    add_index :reviews, :granular_scores_snapshot, using: :gin

    # 2. Add snapshots to review_criterion_scores for immutability
    change_table :review_criterion_scores, bulk: true do |t|
      t.string :title_snapshot
      t.decimal :weight_snapshot, precision: 3, scale: 2
    end

    # 3. Create review_aggregates read model
    create_table :review_aggregates do |t|
      t.references :company, null: false, foreign_key: true
      t.references :category, foreign_key: true # NULL means Global Score
      t.decimal :average_rating, precision: 3, scale: 2, default: 0.0, null: false
      t.integer :total_reviews, default: 0, null: false
      t.jsonb :scores_distribution, default: {}, null: false
      t.jsonb :criteria_breakdown, default: {}, null: false

      t.timestamps
    end

    add_index :review_aggregates, [:company_id, :category_id], unique: true, name: 'idx_rev_agg_company_category'
  end
end
