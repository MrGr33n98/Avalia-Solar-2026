# frozen_string_literal: true

class HardenMcpApprovalRequestsAndCredentials < ActiveRecord::Migration[7.0]
  def up
    # 1. Adiciona payload_digest em mcp_approval_requests com backfill seguro
    unless column_exists?(:mcp_approval_requests, :payload_digest)
      add_column :mcp_approval_requests, :payload_digest, :string
    end

    # Backfill para quaisquer registros existentes em ambiente de teste
    execute <<-SQL
      UPDATE mcp_approval_requests
      SET payload_digest = encode(sha256(concat(request_uuid, agent_id, tool_name)::bytea), 'hex')
      WHERE payload_digest IS NULL;
    SQL

    change_column_null :mcp_approval_requests, :payload_digest, false
    add_index :mcp_approval_requests, :payload_digest unless index_exists?(:mcp_approval_requests, :payload_digest)
    add_index :mcp_approval_requests, :expires_at unless index_exists?(:mcp_approval_requests, :expires_at)

    # 2. Check Constraints para integridade da State Machine e Níveis de Risco no PostgreSQL
    execute <<-SQL
      ALTER TABLE mcp_approval_requests
      DROP CONSTRAINT IF EXISTS chk_mcp_approval_requests_status;

      ALTER TABLE mcp_approval_requests
      ADD CONSTRAINT chk_mcp_approval_requests_status
      CHECK (status IN ('pending', 'approved', 'rejected', 'executed', 'expired'));

      ALTER TABLE mcp_approval_requests
      DROP CONSTRAINT IF EXISTS chk_mcp_approval_requests_risk_tier;

      ALTER TABLE mcp_approval_requests
      ADD CONSTRAINT chk_mcp_approval_requests_risk_tier
      CHECK (risk_tier IN ('r0', 'r1', 'r2', 'r3', 'r4'));
    SQL

    # 3. Foreign Keys canônicas com ON DELETE SET NULL para preservar histórico de auditoria
    unless foreign_key_exists?(:mcp_approval_requests, :users, column: :requested_by_user_id)
      add_foreign_key :mcp_approval_requests, :users, column: :requested_by_user_id, on_delete: :nullify
    end

    unless foreign_key_exists?(:mcp_approval_requests, :users, column: :approved_by_user_id)
      add_foreign_key :mcp_approval_requests, :users, column: :approved_by_user_id, on_delete: :nullify
    end

    unless foreign_key_exists?(:mcp_approval_requests, :companies, column: :tenant_id)
      add_foreign_key :mcp_approval_requests, :companies, column: :tenant_id, on_delete: :nullify
    end

    # 4. Tabela de Credenciais de Agente para Autenticação Server-Side Anti-Spoofing
    create_table :mcp_agent_credentials do |t|
      t.string :agent_identity_id, null: false
      t.string :key_id, null: false
      t.string :secret_digest, null: false
      t.string :status, null: false, default: 'active'
      t.datetime :last_used_at
      t.datetime :expires_at
      t.datetime :revoked_at
      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end unless table_exists?(:mcp_agent_credentials)

    add_index :mcp_agent_credentials, :key_id, unique: true unless index_exists?(:mcp_agent_credentials, :key_id)
    add_index :mcp_agent_credentials, :agent_identity_id unless index_exists?(:mcp_agent_credentials, :agent_identity_id)
    add_index :mcp_agent_credentials, [:agent_identity_id, :status] unless index_exists?(:mcp_agent_credentials, [:agent_identity_id, :status])

    execute <<-SQL
      ALTER TABLE mcp_agent_credentials
      DROP CONSTRAINT IF EXISTS chk_mcp_agent_credentials_status;

      ALTER TABLE mcp_agent_credentials
      ADD CONSTRAINT chk_mcp_agent_credentials_status
      CHECK (status IN ('active', 'revoked', 'expired'));
    SQL
  end

  def down
    if table_exists?(:mcp_agent_credentials)
      drop_table :mcp_agent_credentials
    end

    if foreign_key_exists?(:mcp_approval_requests, :companies, column: :tenant_id)
      remove_foreign_key :mcp_approval_requests, column: :tenant_id
    end

    if foreign_key_exists?(:mcp_approval_requests, :users, column: :approved_by_user_id)
      remove_foreign_key :mcp_approval_requests, column: :approved_by_user_id
    end

    if foreign_key_exists?(:mcp_approval_requests, :users, column: :requested_by_user_id)
      remove_foreign_key :mcp_approval_requests, column: :requested_by_user_id
    end

    execute <<-SQL
      ALTER TABLE mcp_approval_requests DROP CONSTRAINT IF EXISTS chk_mcp_approval_requests_risk_tier;
      ALTER TABLE mcp_approval_requests DROP CONSTRAINT IF EXISTS chk_mcp_approval_requests_status;
    SQL

    if column_exists?(:mcp_approval_requests, :payload_digest)
      remove_column :mcp_approval_requests, :payload_digest
    end
  end
end
