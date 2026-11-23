# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::Canary::Guard do
  let(:context) do
    {
      subject: 'user:42', client_id: 'client-canary',
      scopes: ['mcp:public:read'], resource: Mcp::Canary::Configuration::CANONICAL_PRODUCTION_RESOURCE,
      token_format: 'opaque'
    }
  end

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:fetch).and_call_original
    {
      'MCP_CANARY_ENABLED' => 'true',
      'MCP_CANARY_ALLOWED_CLIENT_IDS' => 'client-canary',
      'MCP_CANARY_ALLOWED_SUBJECTS' => 'user:42',
      'MCP_REMOTE_TRANSPORT_ENABLED' => 'true',
      'MCP_REMOTE_AUTH_MODE' => 'oauth',
      'MCP_REMOTE_OAUTH_ENABLED' => 'true',
      'MCP_REMOTE_POLICY_ENABLED' => 'true',
      'MCP_PUBLIC_TOOLS_EXECUTION_ENABLED' => 'true',
      'MCP_OAUTH_TOKEN_FORMAT' => 'opaque',
      'MCP_OAUTH_RESOURCE' => Mcp::Canary::Configuration::CANONICAL_PRODUCTION_RESOURCE,
      'MCP_OAUTH_ISSUER' => Mcp::Canary::Configuration::CANONICAL_PRODUCTION_ISSUER,
      'MCP_REMOTE_ALLOWED_HOSTS' => Mcp::Canary::Configuration::CANONICAL_PRODUCTION_HOST,
      'MCP_STAGING_MODE' => nil
    }.each { |key, value| allow(ENV).to receive(:[]).with(key).and_return(value) }
    allow(ENV).to receive(:fetch).with('MCP_CANARY_PHASE', 'disabled').and_return('read_only')
    allow(ENV).to receive(:fetch).with('MCP_OAUTH_TOKEN_FORMAT', 'opaque').and_return('opaque')
  end

  it 'allows a canary client and internal subject to list tools' do
    expect(described_class.authorize!(method: 'tools/list', auth_context: context)).to be(true)
  end

  it 'rejects an unauthorized client' do
    context[:client_id] = 'client-other'
    expect { described_class.authorize!(method: 'tools/list', auth_context: context) }
      .to raise_error(described_class::Failure) { |error| expect(error.type).to eq(:forbidden) }
  end

  it 'rejects an unauthorized user' do
    context[:subject] = 'user:other'
    expect { described_class.authorize!(method: 'tools/list', auth_context: context) }
      .to raise_error(described_class::Failure) { |error| expect(error.type).to eq(:forbidden) }
  end

  it 'requires both allowlists to match' do
    context[:client_id] = 'client-other'
    context[:subject] = 'user:other'
    expect { described_class.authorize!(method: 'tools/list', auth_context: context) }
      .to raise_error(described_class::Failure, 'forbidden')
  end

  it 'blocks tools/call during discovery' do
    allow(ENV).to receive(:fetch).with('MCP_CANARY_PHASE', 'disabled').and_return('discovery')

    expect { described_class.authorize!(method: 'tools/call', tool_name: 'list_integrators', auth_context: context) }
      .to raise_error(described_class::Failure) { |error| expect(error.type).to eq(:execution_disabled) }
  end

  it 'allows only the five public tools in read-only phase' do
    expect(described_class.authorize!(method: 'tools/call', tool_name: 'compare_integrators', auth_context: context))
      .to be(true)
    expect { described_class.authorize!(method: 'tools/call', tool_name: 'bulk_lead_export', auth_context: context) }
      .to raise_error(described_class::Failure) { |error| expect(error.type).to eq(:tool_not_allowed) }
  end

  it 'rejects private tools on the public canary endpoint' do
    expect { described_class.authorize!(method: 'tools/call', tool_name: 'get_my_company_overview', auth_context: context) }
      .to raise_error(described_class::Failure) { |error| expect(error.type).to eq(:tool_not_allowed) }
  end

  it 'rejects token without required scope' do
    context[:scopes] = ['other:scope']
    expect { described_class.authorize!(method: 'tools/list', auth_context: context) }
      .to raise_error(described_class::Failure) { |error| expect(error.type).to eq(:forbidden) }
  end

  it 'rejects JWT contexts and wrong resources even when identity strings match' do
    context[:token_format] = 'jwt'
    expect { described_class.authorize!(method: 'tools/list', auth_context: context) }
      .to raise_error(described_class::Failure)

    context[:token_format] = 'opaque'
    context[:resource] = 'https://other.example/mcp'
    expect { described_class.authorize!(method: 'tools/list', auth_context: context) }
      .to raise_error(described_class::Failure)
  end

  it 'does not allow OAuth issuance with a non-S256 grant' do
    expect(described_class.oauth_request_allowed?(client_id: 'client-canary', subject: 'user:42',
                                                  code_challenge_method: 'plain')).to be(false)
    expect(described_class.oauth_request_allowed?(client_id: 'client-canary', subject: 'user:42',
                                                  code_challenge_method: 'S256')).to be(true)
  end

  it 'fails closed when the canary configuration is incomplete' do
    allow(ENV).to receive(:[]).with('MCP_CANARY_ALLOWED_SUBJECTS').and_return('')

    expect { described_class.authorize!(method: 'tools/list', auth_context: context) }
      .to raise_error(described_class::Failure) { |error| expect(error.type).to eq(:unavailable) }
  end

  it 'fails closed in production when transport rollout is active but canary is disabled' do
    allow(Rails.env).to receive(:production?).and_return(true)
    allow(ENV).to receive(:[]).with('MCP_CANARY_ENABLED').and_return('false')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_PRODUCTION_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_TRANSPORT_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_PUBLIC_TOOLS_EXECUTION_ENABLED').and_return('true')

    expect(Mcp::Canary::Configuration.required?).to be(true)
    expect(Mcp::Canary::Configuration.enforced?).to be(true)
    expect do
      described_class.authorize!(method: 'tools/call', tool_name: 'list_integrators', auth_context: context)
    end.to raise_error(described_class::Failure) { |error| expect(error.type).to eq(:unavailable) }
  end

  it 'preserves non-production compatibility when the canary is disabled' do
    allow(ENV).to receive(:[]).with('MCP_CANARY_ENABLED').and_return('false')

    expect(described_class.authorize!(method: 'tools/list', auth_context: nil)).to be(true)
  end

  describe 'Staging profile integration' do
    let(:staging_context) do
      {
        subject: 'user:3',
        client_id: 'staging-client',
        scopes: ['mcp:public:read'],
        resource: Mcp::Canary::Configuration::CANONICAL_STAGING_RESOURCE,
        token_format: 'opaque'
      }
    end

    before do
      {
        'MCP_STAGING_MODE' => 'true',
        'MCP_CANARY_ENABLED' => 'true',
        'MCP_CANARY_PHASE' => 'read_only',
        'MCP_CANARY_ALLOWED_CLIENT_IDS' => 'staging-client',
        'MCP_CANARY_ALLOWED_SUBJECTS' => 'user:3',
        'MCP_REMOTE_TRANSPORT_ENABLED' => 'true',
        'MCP_REMOTE_AUTH_MODE' => 'oauth',
        'MCP_REMOTE_OAUTH_ENABLED' => 'true',
        'MCP_REMOTE_POLICY_ENABLED' => 'true',
        'MCP_PUBLIC_TOOLS_EXECUTION_ENABLED' => 'true',
        'MCP_OAUTH_TOKEN_FORMAT' => 'opaque',
        'MCP_OAUTH_RESOURCE' => Mcp::Canary::Configuration::CANONICAL_STAGING_RESOURCE,
        'MCP_OAUTH_ISSUER' => Mcp::Canary::Configuration::CANONICAL_STAGING_ISSUER,
        'MCP_REMOTE_ALLOWED_HOSTS' => Mcp::Canary::Configuration::CANONICAL_STAGING_HOST
      }.each { |key, value| allow(ENV).to receive(:[]).with(key).and_return(value) }
      allow(ENV).to receive(:fetch).with('MCP_CANARY_PHASE', 'disabled').and_return('read_only')
      allow(ENV).to receive(:fetch).with('MCP_OAUTH_TOKEN_FORMAT', 'opaque').and_return('opaque')
    end

    it 'allows staging-authorized client and subject with staging canonical resource' do
      expect(described_class.authorize!(method: 'tools/list', auth_context: staging_context)).to be(true)
      expect(described_class.authorize!(method: 'tools/call', tool_name: 'list_integrators', auth_context: staging_context)).to be(true)
    end

    it 'rejects token presented to staging with production resource' do
      staging_context[:resource] = Mcp::Canary::Configuration::CANONICAL_PRODUCTION_RESOURCE
      expect { described_class.authorize!(method: 'tools/list', auth_context: staging_context) }
        .to raise_error(described_class::Failure) { |error| expect(error.type).to eq(:forbidden) }
    end

    it 'rejects unauthorized subject on staging' do
      staging_context[:subject] = 'user:999'
      expect { described_class.authorize!(method: 'tools/list', auth_context: staging_context) }
        .to raise_error(described_class::Failure) { |error| expect(error.type).to eq(:forbidden) }
    end
  end
end
