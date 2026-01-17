class AddModerationToCompanies < ActiveRecord::Migration[7.0]
  def up
    add_column :companies, :moderation_status, :string unless column_exists?(:companies, :moderation_status)
    add_column :companies, :submitted_at, :datetime unless column_exists?(:companies, :submitted_at)
    add_column :companies, :approved_at, :datetime unless column_exists?(:companies, :approved_at)
    add_column :companies, :approved_by_admin_user_id, :integer unless column_exists?(:companies, :approved_by_admin_user_id)
    add_column :companies, :rejected_reason, :text unless column_exists?(:companies, :rejected_reason)
  end

  def down
    remove_column :companies, :moderation_status if column_exists?(:companies, :moderation_status)
    remove_column :companies, :submitted_at if column_exists?(:companies, :submitted_at)
    remove_column :companies, :approved_at if column_exists?(:companies, :approved_at)
    remove_column :companies, :approved_by_admin_user_id if column_exists?(:companies, :approved_by_admin_user_id)
    remove_column :companies, :rejected_reason if column_exists?(:companies, :rejected_reason)
  end
end
