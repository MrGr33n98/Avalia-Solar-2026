class AddReviewsCompanyStatusTimeIndex < ActiveRecord::Migration[7.0]
  def change
    add_index :reviews,
      [:company_id, :status, :created_at],
      name: 'idx_reviews_company_status_time',
      order: { created_at: :desc },
      algorithm: :concurrently
  end
end
