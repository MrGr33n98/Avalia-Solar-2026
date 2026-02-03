class CreateCompanyAccessRequests < ActiveRecord::Migration[7.0]
  def change
    create_table :company_access_requests do |t|
      t.references :user, null: false, foreign_key: true
      t.references :company, null: false, foreign_key: true
      t.string :status, null: false, default: 'pending'
      t.text :message
      t.text :admin_note
      t.datetime :requested_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.datetime :reviewed_at
      t.references :reviewed_by_admin_user, foreign_key: { to_table: :admin_users }

      t.timestamps
    end

    add_index :company_access_requests,
              [:user_id, :company_id],
              unique: true,
              where: "status IN ('pending','approved')",
              name: 'index_company_access_requests_on_user_company_active'
    add_index :company_access_requests, :status
  end
end
