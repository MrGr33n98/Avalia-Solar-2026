class CreateGroupMemberships < ActiveRecord::Migration[7.0]
  def change
    create_table :group_memberships do |t|
      t.references :group, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :role, null: false, default: 'member'
      t.string :status, null: false, default: 'pending'
      t.datetime :joined_at
      t.datetime :approved_at
      t.references :approved_by, foreign_key: { to_table: :users }
      t.string :notifications_level, null: false, default: 'highlights'
      t.datetime :muted_until
      t.timestamps
    end

    add_index :group_memberships, %i[group_id user_id], unique: true
    add_index :group_memberships, %i[group_id status]
    add_index :group_memberships, %i[group_id role]

    add_check_constraint :group_memberships,
                         "role IN ('member', 'moderator', 'admin', 'owner')",
                         name: 'group_memberships_role_check'
    add_check_constraint :group_memberships,
                         "status IN ('pending', 'active', 'rejected', 'left', 'banned')",
                         name: 'group_memberships_status_check'
    add_check_constraint :group_memberships,
                         "notifications_level IN ('all', 'highlights', 'mentions', 'off')",
                         name: 'group_memberships_notifications_level_check'
  end
end