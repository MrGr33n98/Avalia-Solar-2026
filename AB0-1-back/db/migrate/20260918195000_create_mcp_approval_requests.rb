# frozen_string_literal: true

class CreateMcpApprovalRequests < ActiveRecord::Migration[7.0]
  def change
    create_table :mcp_approval_requests do |t|
      t.string :request_uuid, null: false
      t.string :agent_id, null: false
      t.bigint :tenant_id
      t.string :tool_name, null: false
      t.jsonb :parameters_payload, null: false, default: {}
      t.string :risk_tier, null: false
      t.string :status, null: false, default: 'pending'
      t.bigint :requested_by_user_id
      t.bigint :approved_by_user_id
      t.text :rejection_reason
      t.datetime :requested_at, null: false
      t.datetime :expires_at, null: false
      t.datetime :executed_at
      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :mcp_approval_requests, :request_uuid, unique: true
    add_index :mcp_approval_requests, :agent_id
    add_index :mcp_approval_requests, :tenant_id
    add_index :mcp_approval_requests, :status
    add_index :mcp_approval_requests, :requested_by_user_id
    add_index :mcp_approval_requests, :approved_by_user_id
    add_index :mcp_approval_requests, [:status, :expires_at]
  end
end
