class CreateSalesRbac < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_roles do |t|
      t.references :company, foreign_key: true
      t.string :name, null: false
      t.string :slug, null: false
      t.boolean :system, null: false, default: false
      t.timestamps
    end
    add_index :sales_roles, %i[company_id slug], unique: true

    create_table :sales_permissions do |t|
      t.string :resource, null: false
      t.string :action, null: false
      t.string :description
      t.timestamps
    end
    add_index :sales_permissions, %i[resource action], unique: true

    create_table :sales_role_permissions do |t|
      t.references :role, null: false, foreign_key: { to_table: :sales_roles }
      t.references :permission, null: false, foreign_key: { to_table: :sales_permissions }
      t.timestamps
    end
    add_index :sales_role_permissions, %i[role_id permission_id], unique: true

    create_table :sales_user_roles do |t|
      t.references :user, null: false, foreign_key: true
      t.references :role, null: false, foreign_key: { to_table: :sales_roles }
      t.timestamps
    end
    add_index :sales_user_roles, %i[user_id role_id], unique: true
  end
end
