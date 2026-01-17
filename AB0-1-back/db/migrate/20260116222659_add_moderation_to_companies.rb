class AddModerationToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :moderation_status, :string
    add_column :companies, :submitted_at, :datetime
    add_column :companies, :approved_at, :datetime
    add_column :companies, :approved_by_admin_user_id, :integer
    add_column :companies, :rejected_reason, :text
  end
end
