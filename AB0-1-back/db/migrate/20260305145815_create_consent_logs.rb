# frozen_string_literal: true

class CreateConsentLogs < ActiveRecord::Migration[7.0]
  def change
    create_table :consent_logs do |t|
      # Identificação
      t.references :user, foreign_key: true, index: true
      t.string :session_id, null: false
      
      # Consentimento
      t.string :consent_type, null: false
      t.boolean :consent_given, null: false
      
      # Contexto
      t.string :policy_version, null: false, default: 'v1.0'
      t.string :consent_method, null: false
      
      # Rastreabilidade
      t.inet :ip_address
      t.text :user_agent
      t.text :page_url
      t.text :referrer
      
      # Metadata
      t.jsonb :metadata, default: {}
      
      # Timestamps
      t.timestamp :consented_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.timestamp :expires_at
      
      t.timestamps
    end
    
    # Índices de performance
    add_index :consent_logs, [:user_id, :consented_at], order: { consented_at: :desc }
    add_index :consent_logs, [:session_id, :consented_at], order: { consented_at: :desc }
    add_index :consent_logs, :policy_version
    add_index :consent_logs, :expires_at, where: "expires_at IS NOT NULL"
    
    # Check constraint
    execute <<-SQL
      ALTER TABLE consent_logs
      ADD CONSTRAINT consent_logs_type_check
      CHECK (consent_type IN ('analytics', 'marketing', 'functional', 'all', 'none'));
    SQL
  end
end
