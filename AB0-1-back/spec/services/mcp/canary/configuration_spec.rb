# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::Canary::Configuration do
  let(:base_production_env) do
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
      'MCP_OAUTH_RESOURCE' => described_class::CANONICAL_PRODUCTION_RESOURCE,
      'MCP_OAUTH_ISSUER' => described_class::CANONICAL_PRODUCTION_ISSUER,
      'MCP_REMOTE_ALLOWED_HOSTS' => described_class::CANONICAL_PRODUCTION_HOST,
      'MCP_REMOTE_ALLOWED_ORIGINS' => 'https://avaliasolar.com.br,https://www.avaliasolar.com.br',
      'MCP_STAGING_MODE' => nil
    }
  end

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:fetch).and_call_original
    base_production_env.each { |key, value| allow(ENV).to receive(:[]).with(key).and_return(value) }
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

    allow(ENV).to receive(:[]).with('MCP_OAUTH_RESOURCE').and_return(described_class::CANONICAL_PRODUCTION_RESOURCE)
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

  describe 'Environment profile and canonical binding separation' do
    context 'when configured for staging' do
      let(:staging_env) do
        {
          'MCP_STAGING_MODE' => 'true',
          'MCP_CANARY_ENABLED' => 'true',
          'MCP_CANARY_PHASE' => 'read_only',
          'MCP_CANARY_ALLOWED_CLIENT_IDS' => 'OVJY8XT0x82_d8DuGF-Es4h-tbOWoHgsCRDYeGuvxpM',
          'MCP_CANARY_ALLOWED_SUBJECTS' => 'user:3',
          'MCP_REMOTE_TRANSPORT_ENABLED' => 'true',
          'MCP_REMOTE_AUTH_MODE' => 'oauth',
          'MCP_REMOTE_OAUTH_ENABLED' => 'true',
          'MCP_REMOTE_POLICY_ENABLED' => 'true',
          'MCP_PUBLIC_TOOLS_EXECUTION_ENABLED' => 'true',
          'MCP_OAUTH_TOKEN_FORMAT' => 'opaque',
          'MCP_OAUTH_RESOURCE' => described_class::CANONICAL_STAGING_RESOURCE,
          'MCP_OAUTH_ISSUER' => described_class::CANONICAL_STAGING_ISSUER,
          'MCP_REMOTE_ALLOWED_HOSTS' => described_class::CANONICAL_STAGING_HOST,
          'MCP_REMOTE_ALLOWED_ORIGINS' => 'https://mcp-staging.avaliasolar.com.br'
        }
      end

      before do
        staging_env.each { |key, value| allow(ENV).to receive(:[]).with(key).and_return(value) }
        allow(ENV).to receive(:fetch).with('MCP_CANARY_PHASE', 'disabled').and_return('read_only')
        allow(ENV).to receive(:fetch).with('MCP_OAUTH_TOKEN_FORMAT', 'opaque').and_return('opaque')
      end

      it 'recognizes staging profile and canonical bindings when consistent' do
        expect(described_class.profile).to eq(:staging)
        expect(described_class.canonical_resource).to eq(described_class::CANONICAL_STAGING_RESOURCE)
        expect(described_class.canonical_issuer).to eq(described_class::CANONICAL_STAGING_ISSUER)
        expect(described_class.canonical_host).to eq(described_class::CANONICAL_STAGING_HOST)
        expect(described_class.configured?).to be(true)
        expect(described_class.enforced?).to be(true)
        expect(described_class.execution_enabled?).to be(true)
      end

      it 'fails closed if staging has missing allowlists' do
        allow(ENV).to receive(:[]).with('MCP_CANARY_ALLOWED_CLIENT_IDS').and_return('')
        expect(described_class.configured?).to be(false)
      end

      it 'fails closed if staging has inconsistent resource (e.g. production resource)' do
        allow(ENV).to receive(:[]).with('MCP_OAUTH_RESOURCE').and_return(described_class::CANONICAL_PRODUCTION_RESOURCE)
        expect(described_class.profile).to eq(:invalid)
        expect(described_class.configured?).to be(false)
      end

      it 'fails closed if staging has inconsistent issuer' do
        allow(ENV).to receive(:[]).with('MCP_OAUTH_ISSUER').and_return('https://evil.example.com')
        expect(described_class.profile).to eq(:invalid)
        expect(described_class.configured?).to be(false)
      end

      it 'fails closed if staging host is not in allowed hosts' do
        allow(ENV).to receive(:[]).with('MCP_REMOTE_ALLOWED_HOSTS').and_return('other-host.example.com')
        expect(described_class.profile).to eq(:invalid)
        expect(described_class.configured?).to be(false)
      end
    end

    context 'when in production' do
      it 'recognizes production profile and bindings' do
        expect(described_class.profile).to eq(:production)
        expect(described_class.canonical_resource).to eq(described_class::CANONICAL_PRODUCTION_RESOURCE)
        expect(described_class.canonical_issuer).to eq(described_class::CANONICAL_PRODUCTION_ISSUER)
        expect(described_class.canonical_host).to eq(described_class::CANONICAL_PRODUCTION_HOST)
      end

      it 'fails closed if MCP_STAGING_MODE is set while resource is production (inconsistent config)' do
        allow(ENV).to receive(:[]).with('MCP_STAGING_MODE').and_return('true')
        # Here MCP_OAUTH_RESOURCE is production, which contradicts MCP_STAGING_MODE=true
        expect(described_class.profile).to eq(:invalid)
        expect(described_class.configured?).to be(false)
      end

      it 'fails closed in production environment when MCP_REMOTE_PRODUCTION_ENABLED is absent' do
        allow(Rails.env).to receive(:production?).and_return(true)
        allow(ENV).to receive(:[]).with('MCP_REMOTE_PRODUCTION_ENABLED').and_return('false')

        expect(described_class.production_approved?).to be(false)
        expect(described_class.configured?).to be(false)
      end
    end

    describe 'Host and origin validation' do
      it 'allows the canonical host and rejects unauthorized hosts' do
        expect(described_class.host_allowed?(described_class::CANONICAL_PRODUCTION_HOST)).to be(true)
        expect(described_class.host_allowed?('evil.com')).to be(false)
        expect(described_class.host_allowed?('mcp-staging.avaliasolar.com.br')).to be(false)
      end

      it 'allows authorized origins and blanks, but rejects unknown origins' do
        expect(described_class.origin_allowed?('')).to be(true)
        expect(described_class.origin_allowed?(nil)).to be(true)
        expect(described_class.origin_allowed?('https://avaliasolar.com.br')).to be(true)
        expect(described_class.origin_allowed?('https://attacker.example.com')).to be(false)
      end
    end
  end
end
