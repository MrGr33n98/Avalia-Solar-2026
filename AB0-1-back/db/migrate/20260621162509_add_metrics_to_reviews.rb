class AddMetricsToReviews < ActiveRecord::Migration[7.0]
  def change
    add_column :reviews, :helpful_count, :integer, default: 0, null: false
    add_column :reviews, :read_count, :integer, default: 0, null: false
  end
end
