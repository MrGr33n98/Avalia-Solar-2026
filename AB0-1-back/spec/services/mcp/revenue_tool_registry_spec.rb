# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::RevenueToolRegistry do
  it 'declara contratos de negócio completos para as ferramentas de Revenue' do
    entries = described_class.entries

    expect(entries.size).to be_between(25, 40)
    expect(entries.fetch('revenue_register_prospect').dig(:contract, :idempotency_policy)).to eq('required_for_create')
    expect(entries.fetch('revenue_request_campaign_send')[:contract]).to include(
      name: 'revenue_request_campaign_send',
      risk_tier: :r3,
      approval_policy: 'required',
      tenant_context: 'required',
      audit_policy: 'structured_audit'
    )
    expect(Mcp::RiskClassifier.classify('revenue_get_pipeline_metrics')).to include(
      risk_tier: :r0,
      required_scopes: %w[mcp:read]
    )
  end
end
