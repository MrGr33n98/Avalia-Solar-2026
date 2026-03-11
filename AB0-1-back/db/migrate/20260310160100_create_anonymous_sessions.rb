class CreateAnonymousSessions < ActiveRecord::Migration[7.0]
  def change
    create_table :anonymous_sessions, id: :uuid do |t|
      t.string   :anonymous_id,     null: false
      t.bigint   :user_id
      t.bigint   :company_id
      t.string   :ip_hash
      t.string   :user_agent_hash
      t.string   :device_fingerprint
      t.string   :device_type

      # Dados de Enriquecimento (Firmographic)
      t.string   :utm_source
      t.string   :utm_medium
      t.string   :utm_campaign
      t.string   :utm_content
      t.string   :referrer_domain
      t.string   :landing_page
      t.string   :exit_page

      # Geolocalização
      t.string   :country_code
      t.string   :region
      t.string   :city
      t.string   :timezone

      # Comportamento
      t.jsonb    :visited_company_ids,    default: []
      t.jsonb    :visited_pages,          default: []
      t.integer  :pageviews_count,        default: 0
      t.integer  :session_duration_sec,   default: 0
      t.datetime :first_seen_at
      t.datetime :last_seen_at

      # Identity Stitching
      t.string   :status,                 default: 'anonymous'
      t.datetime :identified_at
      t.jsonb    :stitch_metadata,        default: {}

      t.timestamps
    end

    add_index :anonymous_sessions, :anonymous_id, unique: true
    add_index :anonymous_sessions, :user_id
    add_index :anonymous_sessions, :company_id
    add_index :anonymous_sessions, :status
    add_index :anonymous_sessions, :first_seen_at
    add_index :anonymous_sessions, :last_seen_at
    add_index :anonymous_sessions, :visited_company_ids, using: :gin
    add_index :anonymous_sessions, [:ip_hash, :user_agent_hash], name: 'idx_anon_sessions_fingerprint'

    add_foreign_key :anonymous_sessions, :users, column: :user_id
    add_foreign_key :anonymous_sessions, :companies, column: :company_id
  end
end
