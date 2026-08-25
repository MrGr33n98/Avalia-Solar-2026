class CreateGroups < ActiveRecord::Migration[7.0]
  def change
    create_table :groups do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.text :description
      t.string :short_description
      t.string :visibility, null: false, default: 'public'
      t.string :membership_mode, null: false, default: 'open'
      t.string :posting_mode, null: false, default: 'members'
      t.string :status, null: false, default: 'draft'
      t.references :owner, null: false, foreign_key: { to_table: :users }
      t.references :category, foreign_key: true
      t.boolean :official, null: false, default: false
      t.boolean :verified, null: false, default: false
      t.boolean :featured, null: false, default: false
      t.integer :members_count, null: false, default: 0
      t.integer :posts_count, null: false, default: 0
      t.timestamps
    end

    add_index :groups, :slug, unique: true
    add_index :groups, :status
    add_index :groups, :visibility
    add_index :groups, :featured
    add_index :groups, %i[status visibility]

    add_check_constraint :groups,
                         "visibility IN ('public', 'private_visible', 'private_hidden')",
                         name: 'groups_visibility_check'
    add_check_constraint :groups,
                         "membership_mode IN ('open', 'approval', 'invite_only')",
                         name: 'groups_membership_mode_check'
    add_check_constraint :groups,
                         "posting_mode IN ('members', 'moderated', 'admins_only')",
                         name: 'groups_posting_mode_check'
    add_check_constraint :groups,
                         "status IN ('draft', 'active', 'archived', 'suspended')",
                         name: 'groups_status_check'
  end
end