# frozen_string_literal: true

class CreateCompanyInvitations < ActiveRecord::Migration[7.0]
  def change
    create_table :company_invitations do |t|
      t.references :company, null: false, foreign_key: { on_delete: :cascade }
      t.references :invited_by, null: false, foreign_key: { to_table: :users }
      t.string :email, null: false
      t.integer :role, null: false, default: 2 # editor
      t.string :token_digest, null: false
      t.string :status, null: false, default: 'pending' # pending, accepted, expired, revoked
      t.datetime :expires_at, null: false
      t.datetime :accepted_at

      t.timestamps
    end

    add_index :company_invitations, :token_digest, unique: true
    add_index :company_invitations, %i[company_id email status], name: 'idx_company_invitations_unique_pending'
  end
end
