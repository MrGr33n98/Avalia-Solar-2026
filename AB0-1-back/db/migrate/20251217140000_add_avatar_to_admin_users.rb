class AddAvatarToAdminUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :admin_users, :avatar_uploaded_at, :datetime
  end
end
