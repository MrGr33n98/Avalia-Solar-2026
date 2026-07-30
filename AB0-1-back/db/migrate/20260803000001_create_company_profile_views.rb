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

    # Note: O índice único parcial com NOW() não é suportado pelo PostgreSQL 
    # porque a função NOW() não é IMMUTABLE. A validação de 24h deve ser
    # feita no nível da aplicação (model).
    add_index :company_profile_views, [:company_id, :session_fingerprint], name: 'idx_company_views_on_company_and_fingerprint'
  end
end
