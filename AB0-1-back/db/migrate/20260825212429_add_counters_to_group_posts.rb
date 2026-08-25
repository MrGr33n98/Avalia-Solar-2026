class AddCountersToGroupPosts < ActiveRecord::Migration[7.0]
  def change
    add_column :group_posts, :comments_count, :integer, default: 0, null: false
    add_column :group_posts, :reactions_count, :integer, default: 0, null: false
  end
end
