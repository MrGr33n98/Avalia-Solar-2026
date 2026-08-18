class AddTreeViewsCountToReviewerProfiles < ActiveRecord::Migration[7.0]
  def change
    add_column :reviewer_profiles, :tree_views_count, :integer, null: false, default: 0 unless column_exists?(:reviewer_profiles, :tree_views_count)
  end
end
