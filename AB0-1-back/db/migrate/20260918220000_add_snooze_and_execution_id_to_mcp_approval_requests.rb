# frozen_string_literal: true

class AddSnoozeAndExecutionIdToMcpApprovalRequests < ActiveRecord::Migration[7.0]
  def change
    add_column :mcp_approval_requests, :snoozed_until, :datetime unless column_exists?(:mcp_approval_requests, :snoozed_until)
    add_column :mcp_approval_requests, :execution_id, :string unless column_exists?(:mcp_approval_requests, :execution_id)

    add_index :mcp_approval_requests, :snoozed_until unless index_exists?(:mcp_approval_requests, :snoozed_until)
    add_index :mcp_approval_requests, :execution_id unless index_exists?(:mcp_approval_requests, :execution_id)
    add_index :mcp_approval_requests, [:risk_tier, :status] unless index_exists?(:mcp_approval_requests, [:risk_tier, :status])
  end
end
