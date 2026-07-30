# frozen_string_literal: true

class CreateCompanyProfileViews < ActiveRecord::Migration[7.0]
  def change
    create_table :company_profile_views do |t|
      t.bigint   :company_id,           null: false
      t.string   :session_fingerprint,  null: false, limit: 64
      t.string   :ip_hash,              null: false, limit: 64
      t.string   :user_agent_hash,      limit: 64
      t.datetime :viewed_at,            null: false, default: -> { 'CURRENT_TIMESTAMP' }

      t.timestamps
    end

    add_index :company_profile_views, :company_id
    add_index :company_profile_views, :viewed_at

    # Índice único parcial: impede duplicata do mesmo fingerprint nas últimas 24h
    # Suportado pelo PostgreSQL (usado neste projeto)
    execute <<~SQL
      CREATE UNIQUE INDEX idx_unique_view_per_fingerprint_24h
        ON company_profile_views (company_id, session_fingerprint)
        WHERE viewed_at >= NOW() - INTERVAL '24 hours';
    SQL
  end
end
