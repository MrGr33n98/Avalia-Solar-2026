# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::Canary::Configuration do
  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:fetch).and_call_original
    {
      'MCP_CANARY_ENABLED' => 'true',
      'MCP_CANARY_PHASE' => 'discovery',
      'MCP_CANARY_ALLOWED_CLIENT_IDS' => 'client-a, client-b',
      'MCP_CANARY_ALLOWED_SUBJECTS' => 'user:1,user:2',
      'MCP_REMOTE_TRANSPORT_ENABLED' => 'true',
      'MCP_REMOTE_AUTH_MODE' => 'oauth',
      'MCP_REMOTE_OAUTH_ENABLED' => 'true',
      'MCP_REMOTE_POLICY_ENABLED' => 'true',
      'MCP_PUBLIC_TOOLS_EXECUTION_ENABLED' => 'false',
      'MCP_OAUTH_TOKEN_FORMAT' => 'opaque',
      'MCP_OAUTH_RESOURCE' => described_class::CANONICAL_RESOURCE,
      'MCP_OAUTH_ISSUER' => described_class::CANONICAL_ISSUER
    }.each { |key, value| allow(ENV).to receive(:[]).with(key).and_return(value) }
    allow(ENV).to receive(:fetch).with('MCP_CANARY_PHASE', 'disabled').and_return('discovery')
    allow(ENV).to receive(:fetch).with('MCP_OAUTH_TOKEN_FORMAT', 'opaque').and_return('opaque')
  end

  it 'fails closed when the canary flag is absent or disabled' do
    allow(ENV).to receive(:[]).with('MCP_CANARY_ENABLED').and_return('false')

    expect(described_class.enabled?).to be(false)
    expect(described_class.configured?).to be(false)
  end

  it 'rejects an invalid phase and malformed empty allowlists' do
    allow(ENV).to receive(:fetch).with('MCP_CANARY_PHASE', 'disabled').and_return('write')
    allow(ENV).to receive(:[]).with('MCP_CANARY_ALLOWED_CLIENT_IDS').and_return('')

    expect(described_class.phase_valid?).to be(false)
    expect(described_class.configured?).to be(false)
  end

  it 'requires the canonical resource, issuer and opaque token format' do
    allow(ENV).to receive(:[]).with('MCP_OAUTH_RESOURCE').and_return('https://other.example/mcp')
    expect(described_class.configured?).to be(false)

    allow(ENV).to receive(:[]).with('MCP_OAUTH_RESOURCE').and_return(described_class::CANONICAL_RESOURCE)
    allow(ENV).to receive(:fetch).with('MCP_OAUTH_TOKEN_FORMAT', 'opaque').and_return('jwt')
    expect(described_class.configured?).to be(false)
  end

  it 'enables execution only in the read-only phase and with the existing tool flag' do
    allow(ENV).to receive(:fetch).with('MCP_CANARY_PHASE', 'disabled').and_return('read_only')
    allow(ENV).to receive(:[]).with('MCP_PUBLIC_TOOLS_EXECUTION_ENABLED').and_return('true')

    expect(described_class.execution_enabled?).to be(true)
    expect(described_class::PUBLIC_TOOLS).to contain_exactly(
      'list_integrators', 'show_integrator_profile', 'list_solar_categories',
      'get_integrator_reputation', 'compare_integrators'
    )
  end
end
