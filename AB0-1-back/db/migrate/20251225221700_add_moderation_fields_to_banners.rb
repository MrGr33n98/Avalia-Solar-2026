class AddModerationFieldsToBanners < ActiveRecord::Migration[7.0]
  def change
    return unless table_exists?(:banners)

    add_column :banners, :moderation_status, :string, default: 'draft' unless column_exists?(:banners, :moderation_status)
    add_column :banners, :priority, :integer, default: 100 unless column_exists?(:banners, :priority)
    add_column :banners, :slot_key, :string unless column_exists?(:banners, :slot_key)

    add_reference :banners, :approved_by_admin_user, foreign_key: { to_table: :admin_users }, null: true unless column_exists?(:banners, :approved_by_admin_user_id)
    add_column :banners, :approved_at, :datetime unless column_exists?(:banners, :approved_at)
    add_column :banners, :rejected_reason, :text unless column_exists?(:banners, :rejected_reason)

    add_index :banners, :moderation_status unless index_exists?(:banners, :moderation_status)
    add_index :banners, :priority unless index_exists?(:banners, :priority)
    add_index :banners, :slot_key unless index_exists?(:banners, :slot_key)
  end
end
