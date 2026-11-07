class CreateVoiceReviewEngine < ActiveRecord::Migration[7.0]
  def change
    create_table :voice_review_invites, id: :string, limit: 36 do |t|
      t.references :company, null: false, foreign_key: true
      t.references :review_form, null: false, foreign_key: true
      t.references :issued_by_user, foreign_key: { to_table: :users }
      t.string :code_digest, null: false
      t.text :code_ciphertext, null: false
      t.string :idempotency_key, null: false
      t.string :kind, null: false, default: 'personal'
      t.string :source, null: false, default: 'dashboard'
      t.string :campaign_id, limit: 80
      t.integer :max_claims
      t.integer :claims_count, null: false, default: 0
      t.string :status, null: false, default: 'active'
      t.datetime :expires_at
      t.timestamps
    end
    add_index :voice_review_invites, :code_digest, unique: true
    add_index :voice_review_invites, %i[issued_by_user_id company_id idempotency_key], unique: true,
              name: 'idx_voice_invites_idempotency'
    add_index :voice_review_invites, %i[company_id created_at]

    create_table :voice_review_sessions, id: :string, limit: 36 do |t|
      t.references :voice_review_invite, null: false, foreign_key: true, type: :string
      t.references :company, null: false, foreign_key: true
      t.references :review_form, null: false, foreign_key: true
      t.string :provider, null: false, default: 'meta'
      t.string :provider_contact_hash, null: false
      t.text :provider_contact_ciphertext, null: false
      t.string :state, null: false, default: 'opened'
      t.string :session_token_digest, null: false
      t.datetime :last_inbound_at
      t.datetime :processing_consent_at
      t.datetime :confirmed_at
      t.references :published_review, foreign_key: { to_table: :reviews }
      t.integer :version, null: false, default: 1
      t.datetime :expires_at, null: false
      t.timestamps
    end
    add_index :voice_review_sessions, :session_token_digest, unique: true
    add_index :voice_review_sessions, %i[provider provider_contact_hash voice_review_invite_id], unique: true,
              name: 'idx_voice_sessions_contact_invite'
    add_index :voice_review_sessions, %i[company_id created_at]

    create_table :voice_review_messages, id: :string, limit: 36 do |t|
      t.references :voice_review_session, foreign_key: { to_table: :voice_review_sessions }, type: :string
      t.string :provider, null: false
      t.string :provider_message_id, null: false
      t.string :message_type, null: false
      t.string :delivery_status, null: false, default: 'received'
      t.string :payload_digest, null: false
      t.json :payload_minimal, null: false, default: {}
      t.datetime :received_at, null: false
      t.datetime :processed_at
      t.string :processing_error_code
      t.timestamps
    end
    add_index :voice_review_messages, %i[provider provider_message_id], unique: true, name: 'idx_voice_messages_provider_id'
    add_index :voice_review_messages, :received_at

    create_table :voice_review_assets, id: :string, limit: 36 do |t|
      t.references :voice_review_session, null: false, foreign_key: { to_table: :voice_review_sessions }, type: :string
      t.string :provider_media_id, null: false
      t.string :storage_key, null: false
      t.string :sha256, null: false
      t.string :mime_type, null: false
      t.bigint :byte_size, null: false, default: 0
      t.integer :duration_ms
      t.string :status, null: false, default: 'stored'
      t.datetime :purge_after_at
      t.timestamps
    end
    add_index :voice_review_assets, %i[voice_review_session_id provider_media_id], unique: true,
              name: 'idx_voice_assets_session_media'
    add_index :voice_review_assets, :purge_after_at

    create_table :voice_review_transcripts, id: :string, limit: 36 do |t|
      t.references :voice_review_session, null: false, foreign_key: { to_table: :voice_review_sessions }, type: :string
      t.references :voice_review_asset, null: false, foreign_key: { to_table: :voice_review_assets }, type: :string
      t.string :provider, null: false
      t.string :model_id, null: false
      t.string :language
      t.text :private_raw_text, null: false
      t.integer :version, null: false, default: 1
      t.boolean :failed_quality_check, null: false, default: false
      t.timestamps
    end
    add_index :voice_review_transcripts, %i[voice_review_session_id version], unique: true,
              name: 'idx_voice_transcripts_session_version'

    create_table :voice_review_consents, id: :string, limit: 36 do |t|
      t.references :voice_review_session, null: false, foreign_key: { to_table: :voice_review_sessions }, type: :string
      t.string :purpose, null: false
      t.string :policy_version, null: false
      t.boolean :granted, null: false
      t.references :voice_review_message, foreign_key: { to_table: :voice_review_messages }, type: :string
      t.datetime :granted_at, null: false
      t.datetime :revoked_at
      t.timestamps
    end
    add_index :voice_review_consents, %i[voice_review_session_id purpose granted_at],
              name: 'idx_voice_consents_session_purpose'

    create_table :voice_review_publications, id: :string, limit: 36 do |t|
      t.references :voice_review_session, null: false, foreign_key: { to_table: :voice_review_sessions }, type: :string
      t.references :review, null: false, foreign_key: true
      t.references :voice_review_transcript, null: false, foreign_key: { to_table: :voice_review_transcripts }, type: :string
      t.string :confirmed_text, null: false, limit: 500
      t.integer :rating, null: false
      t.string :name_mode, null: false, default: 'anonymous'
      t.datetime :confirmed_at, null: false
      t.timestamps
    end
    add_index :voice_review_publications, :voice_review_session_id, unique: true, name: 'idx_voice_publications_session'
    add_index :voice_review_publications, :review_id, unique: true, name: 'idx_voice_publications_review'
  end
end
