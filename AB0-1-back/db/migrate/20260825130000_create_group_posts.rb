class CreateGroupPosts < ActiveRecord::Migration[7.0]
  def change
    create_table :group_posts do |t|
      t.references :group, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :group_topic, foreign_key: true
      t.string :title, limit: 200
      t.text :body, null: false
      t.string :status, null: false, default: 'published'
      t.boolean :pinned, null: false, default: false
      t.boolean :comments_enabled, null: false, default: true
      t.timestamps
    end

    add_index :group_posts, %i[group_id status created_at]
    add_index :group_posts, %i[group_id pinned created_at]
    add_index :group_posts, %i[group_topic_id status]

    add_check_constraint :group_posts,
                         "status IN ('published', 'hidden', 'removed')",
                         name: 'group_posts_status_check'
  end
end