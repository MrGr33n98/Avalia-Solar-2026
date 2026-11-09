class CreateCompanyOnboardingSessions < ActiveRecord::Migration[7.0]
  def change
    create_table :company_onboarding_sessions, id: :string, limit: 36 do |t|
      t.references :company, foreign_key: true
      t.references :user, foreign_key: true
      t.string :provider, null: false, default: 'waha'
      t.string :provider_session
      t.string :provider_contact_hash, null: false
      t.text :provider_contact_ciphertext, null: false
      t.string :provider_chat_id
      t.string :cnpj, limit: 20
      t.string :state, null: false, default: 'opened'
      t.string :current_step, null: false, default: 'ask_cnpj'
      t.string :session_token_digest, null: false
      t.jsonb :draft_payload, null: false, default: {}
      t.datetime :expires_at, null: false
      t.timestamps
    end

    add_index :company_onboarding_sessions, :provider_contact_hash, name: 'idx_co_onboarding_contact_hash'
    add_index :company_onboarding_sessions, :state, name: 'idx_co_onboarding_state'
    add_index :company_onboarding_sessions, :cnpj, name: 'idx_co_onboarding_cnpj'
    add_index :company_onboarding_sessions, :session_token_digest, unique: true, name: 'idx_co_onboarding_token_digest'
  end
end
