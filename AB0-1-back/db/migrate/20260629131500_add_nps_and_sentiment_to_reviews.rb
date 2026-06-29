class AddNpsAndSentimentToReviews < ActiveRecord::Migration[7.0]
  def change
    add_column :reviews, :nps_score, :integer
    add_column :reviews, :sentiment, :string, default: 'unknown', null: false

    add_check_constraint :reviews, "nps_score >= 0 AND nps_score <= 10", name: "ck_reviews_nps_score_range"

    add_index :reviews, [:company_id, :status, :created_at], name: "idx_reviews_analytics_base"
    add_index :reviews, [:company_id, :nps_score], name: "idx_reviews_analytics_nps", where: "nps_score IS NOT NULL"
    add_index :reviews, [:company_id, :sentiment], name: "idx_reviews_analytics_sentiment"
  end
end
